export type IssueCategory =
  | "late_payment_risk"
  | "dispute_flags"
  | "vat_tax_einvoicing"
  | "fx_mismatch"
  | "missing_compliance";

export type IssueSeverity = "low" | "medium" | "high";

export type DetectedIssue = {
  category: IssueCategory;
  severity: IssueSeverity;
  summary: string;
  detail: string;
};

export type InvoiceAnalysis = {
  issues: DetectedIssue[];
  overall_risk: IssueSeverity;
};

/** POST /api/ingest JSON body */
export type IngestInvoicePayload = {
  source: string;
  raw_data: Record<string, unknown>;
  client_name?: string;
  client_email?: string;
  amount?: number;
  currency?: string;
  invoice_date?: string | null;
  due_date?: string | null;
};

export type IngestSuccessResponse = {
  ok: true;
  invoice_id: string;
  resolution_id: string;
  status: string;
  analysis: InvoiceAnalysis;
  analysis_source: "openai" | "anthropic" | "heuristic";
};

export type IngestErrorResponse = {
  ok: false;
  error: string;
  code?: "UNAUTHORIZED" | "NO_PROFILE" | "VALIDATION" | "CONFIG" | "DATABASE" | "LLM";
};
