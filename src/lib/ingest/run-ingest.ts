import {
  getProfileIdForClerkUser,
  createSupabaseAdminClient,
} from "@/lib/supabase/admin";
import { analyzeInvoicePayload } from "@/lib/ingest/analyze-invoice";
import type {
  IngestErrorResponse,
  IngestInvoicePayload,
  IngestSuccessResponse,
} from "@/lib/ingest/types";

function validatePayload(body: unknown): IngestInvoicePayload | IngestErrorResponse {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Invalid JSON body", code: "VALIDATION" };
  }
  const b = body as Record<string, unknown>;
  const source = b.source;
  const raw_data = b.raw_data;
  if (typeof source !== "string" || !source.trim()) {
    return { ok: false, error: "source is required", code: "VALIDATION" };
  }
  if (!raw_data || typeof raw_data !== "object" || Array.isArray(raw_data)) {
    return { ok: false, error: "raw_data must be an object", code: "VALIDATION" };
  }

  return {
    source: source.trim().slice(0, 64),
    raw_data: raw_data as Record<string, unknown>,
    client_name:
      typeof b.client_name === "string" ? b.client_name.slice(0, 500) : undefined,
    client_email:
      typeof b.client_email === "string" ? b.client_email.slice(0, 320) : undefined,
    amount: typeof b.amount === "number" && Number.isFinite(b.amount) ? b.amount : undefined,
    currency:
      typeof b.currency === "string" ? b.currency.slice(0, 12).toUpperCase() : undefined,
    invoice_date:
      typeof b.invoice_date === "string" || b.invoice_date === null
        ? (b.invoice_date as string | null)
        : undefined,
    due_date:
      typeof b.due_date === "string" || b.due_date === null
        ? (b.due_date as string | null)
        : undefined,
  };
}

export async function runIngestInvoice(opts: {
  clerkUserId: string | null;
  body: unknown;
}): Promise<IngestSuccessResponse | IngestErrorResponse> {
  const { clerkUserId, body } = opts;

  if (!clerkUserId) {
    return { ok: false, error: "Not signed in", code: "UNAUTHORIZED" };
  }

  const validated = validatePayload(body);
  if ("ok" in validated && validated.ok === false) {
    return validated;
  }
  const payload = validated as IngestInvoicePayload;

  let profileId: string;
  try {
    const id = await getProfileIdForClerkUser(clerkUserId);
    if (!id) {
      return {
        ok: false,
        error:
          "No Supabase profile for this account. Add a row in profiles with your clerk_id.",
        code: "NO_PROFILE",
      };
    }
    profileId = id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Profile lookup failed";
    return { ok: false, error: msg, code: "DATABASE" };
  }

  let analysisResult: Awaited<ReturnType<typeof analyzeInvoicePayload>>;
  try {
    analysisResult = await analyzeInvoicePayload(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Analysis failed";
    return { ok: false, error: msg, code: "LLM" };
  }

  const { analysis, source } = analysisResult;

  const invoiceStatus =
    analysis.issues.length > 0 ? "issues_detected" : "ingested";

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Supabase configuration error";
    return { ok: false, error: msg, code: "CONFIG" };
  }

  const mergedRaw = {
    ...payload.raw_data,
    _ingest: {
      source: payload.source,
      analyzed_at: new Date().toISOString(),
      analysis_source: source,
      overall_risk: analysis.overall_risk,
    },
  };

  const { data: invoiceRow, error: invError } = await supabase
    .from("invoices")
    .insert({
      user_id: profileId,
      source: payload.source,
      raw_data: mergedRaw,
      client_name: payload.client_name ?? null,
      client_email: payload.client_email ?? null,
      amount: payload.amount ?? null,
      currency: payload.currency ?? "USD",
      invoice_date: payload.invoice_date ?? null,
      due_date: payload.due_date ?? null,
      status: invoiceStatus,
    })
    .select("id")
    .single();

  if (invError || !invoiceRow) {
    return {
      ok: false,
      error: invError?.message ?? "Failed to insert invoice",
      code: "DATABASE",
    };
  }

  const invoiceId = invoiceRow.id as string;

  const { data: resRow, error: resError } = await supabase
    .from("resolutions")
    .insert({
      invoice_id: invoiceId,
      issues_detected: analysis.issues,
      ai_steps: {
        provider: source,
        model:
          source === "openai"
            ? process.env.OPENAI_INGEST_MODEL ?? "gpt-4o-mini"
            : source === "anthropic"
              ? process.env.ANTHROPIC_INGEST_MODEL ?? "claude-3-5-haiku-20241022"
              : "heuristic",
        overall_risk: analysis.overall_risk,
      },
      outcome_status: "pending",
      human_reviewed: false,
    })
    .select("id")
    .single();

  if (resError || !resRow) {
    await supabase.from("invoices").delete().eq("id", invoiceId);
    return {
      ok: false,
      error: resError?.message ?? "Failed to create resolution",
      code: "DATABASE",
    };
  }

  return {
    ok: true,
    invoice_id: invoiceId,
    resolution_id: resRow.id as string,
    status: invoiceStatus,
    analysis,
    analysis_source: source,
  };
}
