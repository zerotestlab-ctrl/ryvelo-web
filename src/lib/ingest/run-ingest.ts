import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureProfileForClerkUser } from "@/lib/profile/ensure-profile";
import { analyzeInvoicePayload } from "@/lib/ingest/analyze-invoice";
import type {
  IngestErrorResponse,
  IngestInvoicePayload,
  IngestSuccessResponse,
} from "@/lib/ingest/types";

const LOG = "[ingest]";

/** Wrapped plain invoices use this `source` when the client sends a flat JSON object. */
const PLAIN_INVOICE_SOURCE = "invoice_json";

/**
 * Accepts either the full ingest shape `{ source, raw_data, ... }` or a flat invoice
 * object with `invoice_number` and/or `client_name` — the latter is wrapped for validation.
 */
function normalizeIngestBody(body: unknown): unknown {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return body;
  }
  const b = body as Record<string, unknown>;

  const hasFullShape =
    typeof b.source === "string" &&
    b.source.trim().length > 0 &&
    b.raw_data &&
    typeof b.raw_data === "object" &&
    !Array.isArray(b.raw_data);

  if (hasFullShape) {
    return body;
  }

  const looksLikePlainInvoice = "invoice_number" in b || "client_name" in b;

  if (!looksLikePlainInvoice) {
    return body;
  }

  return {
    source: PLAIN_INVOICE_SOURCE,
    raw_data: { ...b },
    client_name:
      typeof b.client_name === "string" ? b.client_name.slice(0, 500) : undefined,
    client_email:
      typeof b.client_email === "string" ? b.client_email.slice(0, 320) : undefined,
    amount:
      typeof b.amount === "number" && Number.isFinite(b.amount) ? b.amount : undefined,
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

/** User-visible string + full object logged server-side. */
function formatSupabaseWriteError(
  err: { message: string; details?: string | null; hint?: string | null; code?: string } | null,
  fallback: string
): string {
  if (!err?.message) return fallback;
  const parts = [err.message.trim()];
  if (err.hint?.trim()) parts.push(`Hint: ${err.hint.trim()}`);
  if (err.details?.trim() && err.details.trim() !== err.message.trim()) {
    parts.push(err.details.trim());
  }
  return parts.join(" · ");
}

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

  console.log(`${LOG} start`);

  if (!clerkUserId) {
    console.warn(`${LOG} aborted: not signed in`);
    return { ok: false, error: "Not signed in", code: "UNAUTHORIZED" };
  }

  const normalized = normalizeIngestBody(body);
  const validated = validatePayload(normalized);
  if ("ok" in validated && validated.ok === false) {
    console.warn(`${LOG} validation failed`, validated.error, validated.code);
    return validated;
  }
  const payload = validated as IngestInvoicePayload;
  console.log(`${LOG} payload ok`, {
    source: payload.source,
    hasRawData: !!payload.raw_data,
  });

  console.log(`${LOG} ensure profile…`);
  const ensured = await ensureProfileForClerkUser(clerkUserId);
  if (!ensured.ok) {
    console.warn(`${LOG} profile ensure failed`, ensured.reason);
    return {
      ok: false,
      error:
        ensured.reason === "Not signed in"
          ? "Sign in to upload invoices."
          : `Account setup failed: ${ensured.reason}`,
      code: "NO_PROFILE",
    };
  }
  const profileId = ensured.profileId;
  console.log(`${LOG} profile ok`, { profileId, created: ensured.created });

  let analysisResult: Awaited<ReturnType<typeof analyzeInvoicePayload>>;
  try {
    console.log(`${LOG} analyze invoice…`);
    analysisResult = await analyzeInvoicePayload(payload);
    console.log(`${LOG} analyze ok`, {
      source: analysisResult.source,
      issues: analysisResult.analysis.issues.length,
      risk: analysisResult.analysis.overall_risk,
    });
  } catch (e) {
    console.error(`${LOG} analyze failed`, e);
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
    console.error(`${LOG} Supabase client`, e);
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

  console.log(`${LOG} insert invoice…`);
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
    console.error(`${LOG} insert invoice failed`, invError);
    return {
      ok: false,
      error: formatSupabaseWriteError(
        invError,
        "Could not save the invoice to the database."
      ),
      code: "DATABASE",
    };
  }

  const invoiceId = invoiceRow.id as string;
  console.log(`${LOG} invoice row created`, { invoiceId });

  console.log(`${LOG} insert resolution…`);
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
    console.error(`${LOG} insert resolution failed`, resError);
    const { error: delErr } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceId);
    if (delErr) {
      console.error(`${LOG} rollback invoice delete failed`, delErr);
    }
    return {
      ok: false,
      error: formatSupabaseWriteError(
        resError,
        "Invoice was saved but creating the resolution failed. The invoice row was removed."
      ),
      code: "DATABASE",
    };
  }

  console.log(`${LOG} success`, {
    invoiceId,
    resolutionId: resRow.id,
    status: invoiceStatus,
  });

  return {
    ok: true,
    invoice_id: invoiceId,
    resolution_id: resRow.id as string,
    status: invoiceStatus,
    analysis,
    analysis_source: source,
  };
}
