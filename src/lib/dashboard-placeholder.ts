/** Placeholder dashboard data until Server Actions + Supabase wire-up. */

export type InvoiceRow = {
  id: string;
  client: string;
  amount: number;
  currency: string;
  dueDate: string;
  status:
    | "Resolved"
    | "In collections"
    | "Due"
    | "Partially paid"
    | "Disputed"
    | "Issues detected"
    | "In review"
    | "Failed";
  lastAction: string;
};

export const PLACEHOLDER_INVOICES: InvoiceRow[] = [
  {
    id: "inv-1",
    client: "Harbor Freight Partners",
    amount: 8420,
    currency: "USD",
    dueDate: "Apr 8, 2026",
    status: "In collections",
    lastAction: "Reminder sent",
  },
  {
    id: "inv-2",
    client: "Meridian Clinical Supply",
    amount: 19650,
    currency: "USD",
    dueDate: "Apr 2, 2026",
    status: "Due",
    lastAction: "Scheduled call",
  },
  {
    id: "inv-3",
    client: "Northwind Industrial",
    amount: 4120.5,
    currency: "EUR",
    dueDate: "Mar 28, 2026",
    status: "Disputed",
    lastAction: "Evidence requested",
  },
  {
    id: "inv-4",
    client: "Cedarline Logistics",
    amount: 22800,
    currency: "USD",
    dueDate: "Mar 15, 2026",
    status: "Resolved",
    lastAction: "Cash recovered",
  },
  {
    id: "inv-5",
    client: "Summit Outpatient Group",
    amount: 9750,
    currency: "USD",
    dueDate: "Apr 12, 2026",
    status: "Partially paid",
    lastAction: "Partial payment posted",
  },
];

export const PLACEHOLDER_RESOLUTIONS = [
  {
    id: "res-1",
    invoiceLabel: "INV-10492 · Harbor Freight Partners",
    outcome: "Resolved",
    outcomeVariant: "success" as const,
    issues: [
      "FX mismatch vs. Payoneer settlement",
      "Tax line cleared after revision",
    ],
    timestamp: "Today · 9:14 AM",
  },
  {
    id: "res-2",
    invoiceLabel: "INV-10477 · Northwind Industrial",
    outcome: "Cash recovered",
    outcomeVariant: "success" as const,
    issues: [
      "Dispute opened by payer",
      "Settlement matched to invoice total",
    ],
    timestamp: "Yesterday · 4:02 PM",
  },
  {
    id: "res-3",
    invoiceLabel: "INV-10461 · Summit Outpatient Group",
    outcome: "Partial",
    outcomeVariant: "warning" as const,
    issues: [
      "Short pay posted; balance in review",
    ],
    timestamp: "Mar 30 · 11:20 AM",
  },
] as const;

export const PLACEHOLDER_CASH_VELOCITY = [
  { day: "Mar 27", amount: 42000 },
  { day: "Mar 28", amount: 51200 },
  { day: "Mar 29", amount: 47800 },
  { day: "Mar 30", amount: 60100 },
  { day: "Mar 31", amount: 55300 },
  { day: "Apr 1", amount: 68400 },
  { day: "Apr 2", amount: 72100 },
];
