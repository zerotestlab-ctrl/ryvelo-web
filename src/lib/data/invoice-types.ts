/** Live invoice row shape — populated only from Supabase `invoices`. */

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
