import type { IngestInvoicePayload } from "@/lib/ingest/types";

/** Prefilled JSON for dashboard “Upload test invoice”. */
export const DEFAULT_TEST_INVOICE_PAYLOAD: IngestInvoicePayload = {
  source: "stripe",
  raw_data: {
    invoice_number: "INV-TEST-1001",
    line_items: [
      { description: "Professional services", amount: 12500, currency: "USD" },
    ],
    payer: {
      name: "Northwind Industrial",
      country: "DE",
    },
    notes:
      "FX: EUR wire settled vs USD invoice — 2.1% spread vs ECB ref. VAT: DE USt-IdNr format mismatch on e-invoice; reverse charge may apply.",
    dispute_hint: "none",
  },
  client_name: "Northwind Industrial",
  client_email: "ap@northwind.example",
  amount: 12500,
  currency: "USD",
  invoice_date: "2026-03-01",
  due_date: "2026-03-28",
};
