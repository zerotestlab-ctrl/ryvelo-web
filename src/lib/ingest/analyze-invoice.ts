import type { DetectedIssue, IngestInvoicePayload, InvoiceAnalysis } from "@/lib/ingest/types";

const SYSTEM = `You are a senior AR and compliance analyst. Given invoice JSON, identify operational and financial risks.
Return ONLY valid JSON (no markdown) with this exact shape:
{
  "issues": [
    {
      "category": "late_payment_risk" | "dispute_flags" | "vat_tax_einvoicing" | "fx_mismatch" | "missing_compliance",
      "severity": "low" | "medium" | "high",
      "summary": "short label",
      "detail": "one sentence, factual"
    }
  ],
  "overall_risk": "low" | "medium" | "high"
}
Cover these dimensions when relevant: late payment risk; dispute / chargeback flags; VAT / tax / e-invoicing errors; FX mismatch vs settlement; missing compliance artifacts (PO, W-9, registration).
If nothing material is found, return empty issues array and overall_risk "low".`;

function clampAnalysis(parsed: unknown): InvoiceAnalysis {
  if (!parsed || typeof parsed !== "object") {
    return { issues: [], overall_risk: "low" };
  }
  const obj = parsed as Record<string, unknown>;
  const overall =
    obj.overall_risk === "high" || obj.overall_risk === "medium"
      ? obj.overall_risk
      : "low";
  const rawIssues = Array.isArray(obj.issues) ? obj.issues : [];
  const issues: DetectedIssue[] = [];
  const categories = new Set<string>([
    "late_payment_risk",
    "dispute_flags",
    "vat_tax_einvoicing",
    "fx_mismatch",
    "missing_compliance",
  ]);
  for (const item of rawIssues) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const cat = String(row.category ?? "");
    if (!categories.has(cat)) continue;
    const sev =
      row.severity === "high" || row.severity === "medium" || row.severity === "low"
        ? row.severity
        : "low";
    issues.push({
      category: cat as DetectedIssue["category"],
      severity: sev,
      summary: String(row.summary ?? "").slice(0, 200),
      detail: String(row.detail ?? "").slice(0, 500),
    });
  }
  return { issues, overall_risk: overall };
}

async function analyzeOpenAI(
  payload: IngestInvoicePayload
): Promise<InvoiceAnalysis | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_INGEST_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: JSON.stringify(payload),
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty content");
  const parsed = JSON.parse(content) as unknown;
  return clampAnalysis(parsed);
}

async function analyzeAnthropic(
  payload: IngestInvoicePayload
): Promise<InvoiceAnalysis | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_INGEST_MODEL ?? "claude-3-5-haiku-20241022",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `${SYSTEM}\n\nInvoice JSON:\n${JSON.stringify(payload)}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Anthropic error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = data.content?.find((b) => b.type === "text")?.text ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Anthropic response had no JSON object");
  const parsed = JSON.parse(jsonMatch[0]) as unknown;
  return clampAnalysis(parsed);
}

function heuristicAnalysis(payload: IngestInvoicePayload): InvoiceAnalysis {
  const issues: DetectedIssue[] = [];
  const raw = JSON.stringify(payload.raw_data).toLowerCase();
  const due = payload.due_date ? new Date(payload.due_date) : null;
  const now = new Date();
  if (due && !Number.isNaN(due.getTime()) && due < now) {
    issues.push({
      category: "late_payment_risk",
      severity: "high",
      summary: "Past due date",
      detail: "Due date is before today; elevate collections priority.",
    });
  }
  if (/dispute|chargeback|clawback/.test(raw)) {
    issues.push({
      category: "dispute_flags",
      severity: "medium",
      summary: "Dispute language detected",
      detail: "Source payload references dispute or chargeback risk.",
    });
  }
  if (/vat|gst|e-invoice|einvoicing|tax id|tin/.test(raw)) {
    issues.push({
      category: "vat_tax_einvoicing",
      severity: "low",
      summary: "Tax / e-invoicing signals",
      detail: "Verify tax IDs and jurisdiction rules on settlement.",
    });
  }
  if (/fx|forex|conversion|spread/.test(raw)) {
    issues.push({
      category: "fx_mismatch",
      severity: "medium",
      summary: "FX references present",
      detail: "Confirm payer settlement currency vs invoice currency.",
    });
  }
  if (!payload.client_email && !payload.raw_data?.["buyer_email"]) {
    issues.push({
      category: "missing_compliance",
      severity: "low",
      summary: "Contact details incomplete",
      detail: "No buyer email on record; confirm for notices and receipts.",
    });
  }

  const overall: InvoiceAnalysis["overall_risk"] =
    issues.some((i) => i.severity === "high")
      ? "high"
      : issues.some((i) => i.severity === "medium")
        ? "medium"
        : "low";

  return { issues, overall_risk: overall };
}

export async function analyzeInvoicePayload(
  payload: IngestInvoicePayload
): Promise<{ analysis: InvoiceAnalysis; source: "openai" | "anthropic" | "heuristic" }> {
  try {
    const oa = await analyzeOpenAI(payload);
    if (oa) return { analysis: oa, source: "openai" };
  } catch {
    /* fall through */
  }

  try {
    const an = await analyzeAnthropic(payload);
    if (an) return { analysis: an, source: "anthropic" };
  } catch {
    /* fall through */
  }

  return {
    analysis: heuristicAnalysis(payload),
    source: "heuristic",
  };
}
