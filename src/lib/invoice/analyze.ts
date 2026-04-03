import { analyzeInvoicePayload } from "@/lib/ingest/analyze-invoice";
import type {
  IngestInvoicePayload,
  IssueCategory,
  IssueSeverity,
} from "@/lib/ingest/types";
import type { Issue, IssueType } from "@/lib/agents/types";

function severityToConfidence(sev: IssueSeverity): number {
  switch (sev) {
    case "high":
      return 0.88;
    case "medium":
      return 0.62;
    default:
      return 0.38;
  }
}

function mapCategoryToIssueType(cat: IssueCategory): IssueType {
  const map: Record<IssueCategory, IssueType> = {
    late_payment_risk: "payment_terms",
    dispute_flags: "client_dispute",
    vat_tax_einvoicing: "tax_discrepancy",
    fx_mismatch: "fx_rate_error",
    missing_compliance: "missing_po",
  };
  return map[cat] ?? "payment_terms";
}

function rawToPayload(raw: Record<string, unknown>): IngestInvoicePayload {
  const nested =
    raw.raw_data && typeof raw.raw_data === "object" && !Array.isArray(raw.raw_data)
      ? (raw.raw_data as Record<string, unknown>)
      : raw;

  return {
    source: typeof raw.source === "string" ? raw.source : "ingest",
    raw_data: nested,
    client_name:
      typeof raw.client_name === "string" ? raw.client_name : undefined,
    client_email:
      typeof raw.client_email === "string" ? raw.client_email : undefined,
    amount: typeof raw.amount === "number" ? raw.amount : undefined,
    currency: typeof raw.currency === "string" ? raw.currency : undefined,
    invoice_date:
      typeof raw.invoice_date === "string" || raw.invoice_date === null
        ? (raw.invoice_date as string | null)
        : undefined,
    due_date:
      typeof raw.due_date === "string" || raw.due_date === null
        ? (raw.due_date as string | null)
        : undefined,
  };
}

/**
 * Maps ingest pipeline analysis into agent `Issue` types (reused by LangGraph).
 */
export async function analyzeInvoice(rawInvoice: Record<string, unknown>): Promise<{
  issues: Issue[];
  analysis: Awaited<ReturnType<typeof analyzeInvoicePayload>>["analysis"];
  analysisSource: Awaited<ReturnType<typeof analyzeInvoicePayload>>["source"];
}> {
  const payload = rawToPayload(rawInvoice);
  const { analysis, source } = await analyzeInvoicePayload(payload);

  const issues: Issue[] = analysis.issues.map((d) => ({
    type: mapCategoryToIssueType(d.category),
    description: `${d.summary}: ${d.detail}`,
    confidence: severityToConfidence(d.severity),
    suggestedFix:
      d.severity === "high"
        ? "Escalate collections and validate payer records."
        : undefined,
  }));

  return { issues, analysis, analysisSource: source };
}
