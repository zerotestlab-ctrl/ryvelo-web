/**
 * Autonomous resolution engine (LangGraph).
 *
 * ZEROTEST: set RESOLUTION_SKIP_HUMAN=true to run detect→propose→human→execute→log
 * in one call without UI approval (QA / staging only).
 *
 * Human gate: first `runResolutionWorkflow(invoiceId)` stops after `human_review`
 * (phase: awaiting_human). Call again with `{ humanApproved: true }` after UI approval.
 */

import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { analyzeInvoice } from "@/lib/invoice/analyze";
import { sendResolutionEmail } from "@/lib/email/send-resolution-email";
import { createAttachablePaymentLinks } from "@/lib/payments/attach";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  Issue,
  ProposedResolution,
  ResolutionState,
  ResolutionStep,
  ResolutionWorkflowResult,
} from "@/lib/agents/types";
import { ProposedResolutionOutputSchema } from "@/lib/agents/types";

// ─────────────────────────────────────────────────────────────
// LLM — Anthropic first, then OpenAI (structured outputs)
// ─────────────────────────────────────────────────────────────

function getProposalModel() {
  if (process.env.ANTHROPIC_API_KEY) {
    return new ChatAnthropic({
      model:
        process.env.ANTHROPIC_RESOLUTION_MODEL ?? "claude-3-5-sonnet-20241022",
      temperature: 0.3,
    });
  }
  if (process.env.OPENAI_API_KEY) {
    return new ChatOpenAI({
      model: process.env.OPENAI_RESOLUTION_MODEL ?? "gpt-4o-mini",
      temperature: 0.3,
    });
  }
  return null;
}

const ResolutionSnapshot = Annotation.Root({
  snapshot: Annotation<ResolutionState>({
    reducer: (_previous, next) => next,
  }),
});

type GraphState = { snapshot: ResolutionState };

function step(
  name: string,
  aiOutput: unknown,
  status: ResolutionStep["status"]
): ResolutionStep {
  return {
    step: name,
    timestamp: new Date().toISOString(),
    aiOutput,
    status,
  };
}

/** Persist full ai_steps JSONB after each node (Supabase). */
async function persistAiSteps(
  resolutionId: string | undefined,
  aiSteps: ResolutionStep[]
): Promise<void> {
  if (!resolutionId) return;
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("resolutions")
    .update({ ai_steps: JSON.parse(JSON.stringify(aiSteps)) as unknown[] })
    .eq("id", resolutionId);
}

// ─────────────────────────────────────────────────────────────
// 1. detect_issues — reuse analyze-invoice pipeline
// ─────────────────────────────────────────────────────────────

async function detectIssuesNode(state: GraphState): Promise<GraphState> {
  const s = state.snapshot;
  try {
    const { issues, analysis, analysisSource } = await analyzeInvoice(
      s.rawInvoice
    );
    const nextStep = step(
      "detect_issues",
      { analysis, analysisSource },
      "success"
    );
    const aiSteps = [...s.aiSteps, nextStep];
    await persistAiSteps(s.resolutionId, aiSteps);

    return {
      snapshot: {
        ...s,
        issues,
        status: "proposing",
        aiSteps,
      },
    };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    const aiSteps = [...s.aiSteps, step("detect_issues", { error: err }, "failed")];
    await persistAiSteps(s.resolutionId, aiSteps);
    return {
      snapshot: {
        ...s,
        status: "failed",
        aiSteps,
      },
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Helpers for propose_resolution
// ─────────────────────────────────────────────────────────────

function heuristicProposal(s: ResolutionState): ProposedResolution {
  const client =
    typeof s.rawInvoice.client_name === "string"
      ? s.rawInvoice.client_name
      : "there";
  const amount =
    typeof s.rawInvoice.amount === "number"
      ? s.rawInvoice.amount
      : s.amountAtStake;
  return {
    correctedInvoice: {
      ...s.rawInvoice,
      reviewed: true,
      review_note: "Heuristic proposal — configure ANTHROPIC_API_KEY / OPENAI_API_KEY.",
    },
    chaseEmailDraft: `Subject: Invoice follow-up\n\nHi ${client},\n\nWe are reconciling open invoice totals (amount ${amount}). Please confirm remittance details or dispute within 5 business days.\n\nThanks,`,
    paymentLink: "",
  };
}

// ─────────────────────────────────────────────────────────────
// 2. propose_resolution — structured outputs (invoice draft, email, link)
// ─────────────────────────────────────────────────────────────

async function proposeResolutionNode(state: GraphState): Promise<GraphState> {
  const s = state.snapshot;
  if (s.status === "failed") {
    return { snapshot: s };
  }

  const model = getProposalModel();
  if (!model) {
    const proposed = heuristicProposal(s);
    const nextStep = step(
      "propose_resolution",
      { mode: "heuristic", proposal: proposed },
      "success"
    );
    const aiSteps = [...s.aiSteps, nextStep];
    await persistAiSteps(s.resolutionId, aiSteps);
    return {
      snapshot: {
        ...s,
        proposedResolution: proposed,
        status: "review",
        aiSteps,
      },
    };
  }

  try {
    // Anthropic + OpenAI expose different overloads; runtime is fine for both.
    const structured = (
      model as {
        withStructuredOutput: (
          schema: typeof ProposedResolutionOutputSchema
        ) => {
          invoke: (msgs: unknown[]) => Promise<{
            correctedInvoice: Record<string, unknown>;
            chaseEmailDraft: string;
            paymentLink?: string;
            rationale?: string;
          }>;
        };
      }
    ).withStructuredOutput(ProposedResolutionOutputSchema);
    const sys = `You propose concrete AR resolutions. Given invoice JSON and detected issues, output structured fields only.
Use outcome language only. paymentLink may be empty string if unknown.`;

    const user = JSON.stringify(
      {
        issues: s.issues,
        rawInvoice: s.rawInvoice,
        amountAtStake: s.amountAtStake,
      },
      null,
      2
    );

    const out = await structured.invoke([
      new SystemMessage(sys),
      new HumanMessage(user),
    ]);

    const proposed: ProposedResolution = {
      correctedInvoice: out.correctedInvoice,
      chaseEmailDraft: out.chaseEmailDraft,
      paymentLink: out.paymentLink || undefined,
    };

    const nextStep = step(
      "propose_resolution",
      { proposal: proposed, rationale: out.rationale },
      "success"
    );
    const aiSteps = [...s.aiSteps, nextStep];
    await persistAiSteps(s.resolutionId, aiSteps);

    return {
      snapshot: {
        ...s,
        proposedResolution: proposed,
        status: "review",
        aiSteps,
      },
    };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    const proposed = heuristicProposal(s);
    const nextStep = step(
      "propose_resolution",
      { error: err, fallback: proposed },
      "success"
    );
    const aiSteps = [...s.aiSteps, nextStep];
    await persistAiSteps(s.resolutionId, aiSteps);
    return {
      snapshot: {
        ...s,
        proposedResolution: proposed,
        status: "review",
        aiSteps,
      },
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 3. human_review — persist issues + pause for UI (graph ends here on phase 1)
// ─────────────────────────────────────────────────────────────

async function humanReviewNode(state: GraphState): Promise<GraphState> {
  const s = state.snapshot;
  if (s.status === "failed") {
    return { snapshot: s };
  }

  const supabase = createSupabaseAdminClient();
  const issuesJson = s.issues.map((i) => ({
    type: i.type,
    description: i.description,
    confidence: i.confidence,
    suggestedFix: i.suggestedFix,
  }));

  const patch = {
    issues_detected: issuesJson,
    ai_steps: s.aiSteps,
    outcome_status: "pending" as const,
  };

  if (s.resolutionId) {
    const { error } = await supabase
      .from("resolutions")
      .update(patch)
      .eq("id", s.resolutionId);
    if (error) {
      const aiSteps = [
        ...s.aiSteps,
        step("human_review", { error: error.message }, "failed"),
      ];
      await persistAiSteps(s.resolutionId, aiSteps);
      return {
        snapshot: {
          ...s,
          status: "failed",
          aiSteps,
        },
      };
    }
  }

  const nextStep = step(
    "human_review",
    {
      persisted: true,
      resolutionId: s.resolutionId,
      /** ZEROTEST: UI should poll resolutions + show approve CTA */
      awaiting_human_approval: true,
    },
    "pending"
  );
  const aiSteps = [...s.aiSteps, nextStep];
  await persistAiSteps(s.resolutionId, aiSteps);

  return {
    snapshot: {
      ...s,
      status: "review",
      aiSteps,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// 4. execute_resolution — Resend email + payment link in body
// ─────────────────────────────────────────────────────────────

async function executeResolutionNode(state: GraphState): Promise<GraphState> {
  const s = state.snapshot;
  if (!s.humanApproved && !s.skipHumanGate) {
    const aiSteps = [
      ...s.aiSteps,
      step("execute_resolution", { error: "Not approved" }, "failed"),
    ];
    await persistAiSteps(s.resolutionId, aiSteps);
    return {
      snapshot: {
        ...s,
        status: "failed",
        aiSteps,
      },
    };
  }

  const to =
    typeof s.rawInvoice.client_email === "string"
      ? s.rawInvoice.client_email
      : "";
  const draft = s.proposedResolution.chaseEmailDraft ?? "";
  const currency =
    typeof s.rawInvoice.currency === "string"
      ? s.rawInvoice.currency
      : "USD";
  const recoveredAmount = s.amountAtStake;
  const resolutionId = s.resolutionId ?? s.invoiceId;

  const attach = await createAttachablePaymentLinks({
    recoveredAmount,
    currency,
    invoiceId: s.invoiceId,
    resolutionId,
  });

  const aiDraftLink =
    typeof s.proposedResolution.paymentLink === "string" &&
    s.proposedResolution.paymentLink.length > 0
      ? s.proposedResolution.paymentLink
      : undefined;

  const paymentLinks: { label: string; url: string }[] = [];
  if (attach.stripeFeeCheckoutUrl) {
    paymentLinks.push({
      label: `Pay success fee (Stripe, ${attach.feePercent}% of recovered)`,
      url: attach.stripeFeeCheckoutUrl,
    });
  }
  if (attach.wisePayUrl) {
    paymentLinks.push({
      label: "Remit / collect (Wise)",
      url: attach.wisePayUrl,
    });
  }
  if (aiDraftLink) {
    paymentLinks.push({
      label: "Reference payment link (from draft)",
      url: aiDraftLink,
    });
  }

  const intro =
    `We are following up on the outstanding balance (${currency} ${recoveredAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}). ` +
    `Our success-based fee is ${attach.feePercent}% of recovered cash (approximately ${currency} ${attach.feeAmount.toFixed(2)}). ` +
    `Please use the links below to remit payment or complete the success fee.\n\n`;

  let emailResult: unknown = { note: "No recipient email on invoice" };
  if (to) {
    emailResult = await sendResolutionEmail({
      to,
      subject: "Invoice resolution — payment and remittance",
      textBody: intro + draft,
      paymentLinks,
    });
  }

  const nextStep = step(
    "execute_resolution",
    { email: emailResult, attach: attach },
    "success"
  );
  const aiSteps = [...s.aiSteps, nextStep];
  await persistAiSteps(s.resolutionId, aiSteps);

  return {
    snapshot: {
      ...s,
      status: "executing",
      amountRecovered: s.amountRecovered ?? s.amountAtStake,
      aiSteps,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// 5. log_outcome — resolutions row: amount_recovered, resolved_at, ai_steps
// ─────────────────────────────────────────────────────────────

async function logOutcomeNode(state: GraphState): Promise<GraphState> {
  const s = state.snapshot;
  const supabase = createSupabaseAdminClient();
  const resolvedAt = new Date().toISOString();
  const amountRecovered = s.amountRecovered ?? s.amountAtStake;

  const update = {
    ai_steps: s.aiSteps,
    outcome_status: "resolved" as const,
    amount_recovered: amountRecovered,
    resolved_at: resolvedAt,
    human_reviewed: true,
  };

  if (s.resolutionId) {
    const { error } = await supabase
      .from("resolutions")
      .update(update)
      .eq("id", s.resolutionId);

    if (error) {
      const aiSteps = [
        ...s.aiSteps,
        step("log_outcome", { error: error.message }, "failed"),
      ];
      await persistAiSteps(s.resolutionId, aiSteps);
      return {
        snapshot: {
          ...s,
          status: "failed",
          aiSteps,
        },
      };
    }

    await supabase
      .from("invoices")
      .update({ status: "resolved" })
      .eq("id", s.invoiceId);
  }

  const nextStep = step(
    "log_outcome",
    { resolved_at: resolvedAt, amount_recovered: amountRecovered },
    "success"
  );
  const aiSteps = [...s.aiSteps, nextStep];
  await persistAiSteps(s.resolutionId, aiSteps);

  return {
    snapshot: {
      ...s,
      status: "completed",
      amountRecovered,
      aiSteps,
    },
  };
}

function buildPhaseOneGraph() {
  return new StateGraph(ResolutionSnapshot)
    .addNode("detect_issues", detectIssuesNode)
    .addNode("propose_resolution", proposeResolutionNode)
    .addNode("human_review", humanReviewNode)
    .addEdge(START, "detect_issues")
    .addEdge("detect_issues", "propose_resolution")
    .addEdge("propose_resolution", "human_review")
    .addEdge("human_review", END)
    .compile();
}

function buildPhaseTwoGraph() {
  return new StateGraph(ResolutionSnapshot)
    .addNode("execute_resolution", executeResolutionNode)
    .addNode("log_outcome", logOutcomeNode)
    .addEdge(START, "execute_resolution")
    .addEdge("execute_resolution", "log_outcome")
    .addEdge("log_outcome", END)
    .compile();
}

const phaseOneGraph = buildPhaseOneGraph();
const phaseTwoGraph = buildPhaseTwoGraph();

export const resolutionPhaseOneGraph = phaseOneGraph;
export const resolutionPhaseTwoGraph = phaseTwoGraph;
/** @deprecated use resolutionPhaseOneGraph */
export const resolutionGraph = phaseOneGraph;

// ─────────────────────────────────────────────────────────────
// Data loading
// ─────────────────────────────────────────────────────────────

function rowToRawInvoice(row: {
  raw_data: unknown;
  client_name: string | null;
  client_email: string | null;
  amount: string | number | null;
  currency: string | null;
  invoice_date: string | null;
  due_date: string | null;
  source: string | null;
}): Record<string, unknown> {
  const raw =
    row.raw_data && typeof row.raw_data === "object" && !Array.isArray(row.raw_data)
      ? { ...(row.raw_data as Record<string, unknown>) }
      : {};
  return {
    ...raw,
    client_name: row.client_name ?? raw.client_name,
    client_email: row.client_email ?? raw.client_email,
    amount:
      row.amount != null ? Number(row.amount) : raw.amount,
    currency: row.currency ?? raw.currency,
    invoice_date: row.invoice_date ?? raw.invoice_date,
    due_date: row.due_date ?? raw.due_date,
    source: row.source ?? raw.source ?? "unknown",
  };
}

function mapIngestCategoryToType(
  cat: string
): Issue["type"] {
  const m: Record<string, Issue["type"]> = {
    late_payment_risk: "payment_terms",
    dispute_flags: "client_dispute",
    vat_tax_einvoicing: "tax_discrepancy",
    fx_mismatch: "fx_rate_error",
    missing_compliance: "missing_po",
  };
  return m[cat] ?? "payment_terms";
}

function issuesFromDb(json: unknown): Issue[] {
  if (!Array.isArray(json)) return [];
  return json
    .map((x) => {
      if (!x || typeof x !== "object") return null;
      const o = x as Record<string, unknown>;
      if (typeof o.type === "string" && typeof o.description === "string") {
        return {
          type: o.type as Issue["type"],
          description: o.description,
          confidence: typeof o.confidence === "number" ? o.confidence : 0.5,
          suggestedFix:
            typeof o.suggestedFix === "string" ? o.suggestedFix : undefined,
        };
      }
      if (typeof o.category === "string") {
        const summary = typeof o.summary === "string" ? o.summary : "";
        const detail = typeof o.detail === "string" ? o.detail : "";
        const sev = o.severity === "high" ? 0.88 : o.severity === "medium" ? 0.62 : 0.38;
        return {
          type: mapIngestCategoryToType(o.category),
          description: [summary, detail].filter(Boolean).join(": ") || o.category,
          confidence: sev,
        };
      }
      return null;
    })
    .filter((x): x is Issue => x !== null);
}

function proposedFromSteps(steps: ResolutionStep[]): ProposedResolution {
  const rev = [...steps].reverse();
  const p = rev.find((s) => s.step === "propose_resolution");
  const out = p?.aiOutput as
    | {
        proposal?: ProposedResolution;
        fallback?: ProposedResolution;
        mode?: string;
      }
    | undefined;
  if (out?.proposal) return out.proposal;
  if (out?.fallback) return out.fallback;
  return {};
}

async function loadContextForInvoice(
  invoiceId: string,
  mode: "fresh" | "resume_execute",
  opts?: { runUnattended?: boolean }
): Promise<ResolutionState> {
  const supabase = createSupabaseAdminClient();
  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .select(
      "id, user_id, raw_data, client_name, client_email, amount, currency, invoice_date, due_date, source"
    )
    .eq("id", invoiceId)
    .single();

  if (invErr || !inv) {
    throw new Error(invErr?.message ?? "Invoice not found");
  }

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("id, clerk_id")
    .eq("id", inv.user_id)
    .single();

  if (pErr || !profile) {
    throw new Error(pErr?.message ?? "Profile not found for invoice");
  }

  const { data: res } = await supabase
    .from("resolutions")
    .select("id, ai_steps, issues_detected")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const rawInvoice = rowToRawInvoice(inv);

  if (mode === "fresh") {
    const skipHuman =
      process.env.RESOLUTION_SKIP_HUMAN === "true" ||
      opts?.runUnattended === true;
    return {
      invoiceId: inv.id,
      resolutionId: res?.id,
      profileId: profile.id,
      clerkId: profile.clerk_id,
      rawInvoice,
      issues: [],
      proposedResolution: {},
      aiSteps: [],
      status: "detecting",
      amountAtStake: Number(inv.amount ?? 0) || 0,
      skipHumanGate: skipHuman,
    };
  }

  const existingSteps = (res?.ai_steps as ResolutionStep[] | null) ?? [];
  const issues = issuesFromDb(res?.issues_detected);

  return {
    invoiceId: inv.id,
    resolutionId: res?.id,
    profileId: profile.id,
    clerkId: profile.clerk_id,
    rawInvoice,
    issues,
    proposedResolution: proposedFromSteps(existingSteps),
    aiSteps: existingSteps,
    status: "review",
    amountAtStake: Number(inv.amount ?? 0) || 0,
    skipHumanGate: false,
  };
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Run the autonomous resolution workflow for an invoice.
 *
 * - First call (no options): runs **detect_issues → propose_resolution → human_review**,
 *   persists `ai_steps` after each node, returns **`awaiting_human`** (UI approves).
 * - Second call `{ humanApproved: true }`: runs **execute_resolution → log_outcome**
 *   (Resend + final DB update).
 *
 * ZEROTEST: `RESOLUTION_SKIP_HUMAN=true` runs both phases in one invocation.
 *
 * **`runUnattended: true`** (dashboard “Resolve now”): runs detect→propose→execute→log
 * without stopping at human review (same as skip-human for this run only).
 */
export async function runResolutionWorkflow(
  invoiceId: string,
  options?: { humanApproved?: boolean; runUnattended?: boolean }
): Promise<ResolutionWorkflowResult> {
  if (options?.humanApproved === true) {
    let state = await loadContextForInvoice(invoiceId, "resume_execute");
    state = {
      ...state,
      humanApproved: true,
      skipHumanGate: false,
    };

    /** Ingest-only rows have issues in DB but no LangGraph proposal yet — generate before execute. */
    const hasProposal = state.aiSteps.some(
      (st) => st.step === "propose_resolution" && st.status === "success"
    );
    if (!hasProposal) {
      const afterDetect = await detectIssuesNode({ snapshot: state });
      if (afterDetect.snapshot.status === "failed") {
        return {
          phase: "failed",
          invoiceId,
          resolutionId: afterDetect.snapshot.resolutionId,
          state: afterDetect.snapshot,
        };
      }
      const afterPropose = await proposeResolutionNode({
        snapshot: { ...afterDetect.snapshot, status: "proposing" },
      });
      state = {
        ...afterPropose.snapshot,
        humanApproved: true,
        skipHumanGate: false,
      };
    }

    const out = await phaseTwoGraph.invoke({ snapshot: state });
    const final = out.snapshot;
    if (final.status === "failed") {
      return {
        phase: "failed",
        invoiceId,
        resolutionId: final.resolutionId,
        state: final,
        error: "Execution or logging failed — see ai_steps",
      };
    }
    return {
      phase: "completed",
      invoiceId,
      resolutionId: final.resolutionId,
      state: final,
    };
  }

  let state = await loadContextForInvoice(invoiceId, "fresh", {
    runUnattended: options?.runUnattended === true,
  });

  const skip =
    state.skipHumanGate === true ||
    process.env.RESOLUTION_SKIP_HUMAN === "true" ||
    options?.runUnattended === true;
  state = { ...state, skipHumanGate: skip, humanApproved: skip };

  const afterOne = await phaseOneGraph.invoke({ snapshot: state });
  let s1 = afterOne.snapshot;

  if (s1.status === "failed") {
    return {
      phase: "failed",
      invoiceId,
      resolutionId: s1.resolutionId,
      state: s1,
    };
  }

  if (!skip) {
    return {
      phase: "awaiting_human",
      invoiceId,
      resolutionId: s1.resolutionId,
      state: s1,
    };
  }

  /** ZEROTEST / RESOLUTION_SKIP_HUMAN: continue to phase 2 in same request */
  s1 = { ...s1, humanApproved: true, skipHumanGate: true };
  const afterTwo = await phaseTwoGraph.invoke({ snapshot: s1 });
  const s2 = afterTwo.snapshot;

  if (s2.status === "failed") {
    return {
      phase: "failed",
      invoiceId,
      resolutionId: s2.resolutionId,
      state: s2,
    };
  }

  return {
    phase: "completed",
    invoiceId,
    resolutionId: s2.resolutionId,
    state: s2,
  };
}

/** @deprecated use runResolutionWorkflow */
export async function runResolutionPipeline(
  initial: ResolutionState
): Promise<ResolutionState> {
  const out = await phaseOneGraph.invoke({ snapshot: initial });
  return out.snapshot;
}

export async function runResolutionExecution(
  state: ResolutionState
): Promise<ResolutionState> {
  const out = await phaseTwoGraph.invoke({ snapshot: state });
  return out.snapshot;
}

export async function continueResolutionAfterApproval(
  state: ResolutionState
): Promise<ResolutionState> {
  return runResolutionExecution({ ...state, humanApproved: true });
}
