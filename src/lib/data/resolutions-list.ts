import {
  createSupabaseAdminClient,
  isSupabaseEnvConfigured,
} from "@/lib/supabase/admin";
import { ensureProfileForClerkUser } from "@/lib/profile/ensure-profile";
import type { ResolutionStep } from "@/lib/agents/types";

export type ResolutionListRow = {
  id: string;
  invoiceId: string;
  invoiceRef: string;
  clientName: string;
  issueBadges: string[];
  confidence: number;
  amountAtStake: number;
  currency: string;
  statusLabel: string;
  outcomeStatus: string;
  /** From `resolutions.human_reviewed` — true after approve/reject/execute path. */
  humanReviewed: boolean;
  /** From `resolutions.payment_link` — Paystack collect URL after execute. */
  paymentLink: string | null;
  aiSteps: ResolutionStep[];
  issuesDetected: unknown;
};

function formatInvoiceRef(
  invoiceId: string,
  rawData: unknown
): string {
  if (rawData && typeof rawData === "object" && !Array.isArray(rawData)) {
    const n = (rawData as Record<string, unknown>).invoice_number;
    if (typeof n === "string" && n.trim()) return n;
  }
  return `INV-${invoiceId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function badgesFromIssues(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  const labels: string[] = [];
  for (const item of json) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (typeof o.type === "string") {
      labels.push(
        o.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      );
    } else if (typeof o.category === "string") {
      labels.push(
        String(o.category)
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      );
    }
  }
  return [...new Set(labels)].slice(0, 6);
}

function confidenceFromIssues(json: unknown): number {
  if (!Array.isArray(json) || json.length === 0) return 0;
  let sum = 0;
  let n = 0;
  for (const item of json) {
    if (!item || typeof item !== "object") continue;
    const c = (item as Record<string, unknown>).confidence;
    if (typeof c === "number") {
      sum += c;
      n += 1;
    } else {
      const sev = (item as Record<string, unknown>).severity;
      sum +=
        sev === "high" ? 0.88 : sev === "medium" ? 0.62 : 0.38;
      n += 1;
    }
  }
  return n > 0 ? sum / n : 0;
}

function statusLabel(outcome: string | null): string {
  switch (outcome) {
    case "resolved":
      return "Resolved";
    case "approved":
      return "Approved";
    case "approved_with_error":
      return "Approved (error)";
    case "partial":
      return "Partial";
    case "failed":
      return "Failed";
    case "pending":
    default:
      return "Pending review";
  }
}

/** Resolutions joined to invoices — Supabase only, scoped by `profiles.id` → `invoices.user_id`. */
export async function getResolutionListForClerkUser(
  clerkUserId: string | null
): Promise<{ rows: ResolutionListRow[]; error: string | null }> {
  if (!clerkUserId) {
    return { rows: [], error: null };
  }

  if (!isSupabaseEnvConfigured()) {
    return {
      rows: [],
      error:
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  try {
    const ensured = await ensureProfileForClerkUser(clerkUserId);
    if (!ensured.ok) {
      return { rows: [], error: null };
    }
    const profileId = ensured.profileId;

    const supabase = createSupabaseAdminClient();

    const { data: invRows, error: invErr } = await supabase
      .from("invoices")
      .select("id")
      .eq("user_id", profileId);

    if (invErr) {
      return { rows: [], error: invErr.message };
    }

    const invoiceIds = (invRows ?? []).map((r) => r.id as string);
    if (invoiceIds.length === 0) {
      return { rows: [], error: null };
    }

    const { data, error } = await supabase
      .from("resolutions")
      .select(
        `
        id,
        outcome_status,
        issues_detected,
        ai_steps,
        invoice_id,
        human_reviewed,
        payment_link,
        invoices (
          id,
          client_name,
          amount,
          currency,
          raw_data
        )
      `
      )
      .in("invoice_id", invoiceIds)
      .order("created_at", { ascending: false, nullsFirst: false });

    if (error) {
      return { rows: [], error: error.message };
    }

    const rows = (data ?? [])
      .map((row: Record<string, unknown>): ResolutionListRow | null => {
      const invRaw = row.invoices;
      const inv = (
        Array.isArray(invRaw) ? invRaw[0] : invRaw
      ) as Record<string, unknown> | null;
      const invoiceId = String(
        inv?.id ?? row.invoice_id ?? ""
      );
      if (!invoiceId) return null;
      const rawData = inv?.raw_data;
      const clientName =
        typeof inv?.client_name === "string" && inv.client_name
          ? inv.client_name
          : "Unknown";
      const amount = inv?.amount != null ? Number(inv.amount) : 0;
      const currency =
        typeof inv?.currency === "string" ? inv.currency : "USD";
      const issuesRaw = row.issues_detected;
      const issues = Array.isArray(issuesRaw) ? issuesRaw : [];
      const rawSteps = row.ai_steps;
      const steps: ResolutionStep[] = Array.isArray(rawSteps)
        ? (rawSteps as ResolutionStep[])
        : [];
      const outcome = typeof row.outcome_status === "string" ? row.outcome_status : "pending";
      const humanReviewed = Boolean(row.human_reviewed);
      const paymentLink =
        typeof row.payment_link === "string" && row.payment_link.trim()
          ? row.payment_link.trim()
          : null;

      return {
        id: String(row.id),
        invoiceId,
        invoiceRef: formatInvoiceRef(invoiceId, rawData),
        clientName,
        issueBadges: badgesFromIssues(issuesRaw),
        confidence: confidenceFromIssues(issuesRaw),
        amountAtStake: amount,
        currency,
        statusLabel: statusLabel(outcome),
        outcomeStatus: outcome,
        humanReviewed,
        paymentLink,
        aiSteps: steps,
        issuesDetected: issues,
      };
    })
      .filter((r): r is ResolutionListRow => r !== null);

    return { rows, error: null };
  } catch (e) {
    console.error("[getResolutionListForClerkUser]", e);
    return {
      rows: [],
      error:
        "We couldn’t load resolutions. Check your connection and refresh the page.",
    };
  }
}
