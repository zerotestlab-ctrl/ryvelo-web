/**
 * Fields on `public.resolutions` used in app queries (Supabase).
 * Keep in sync with migrations under `src/lib/supabase/migrations/`.
 */
export type ResolutionRowFields = {
  id: string;
  invoice_id: string;
  issues_detected: unknown;
  ai_steps: unknown;
  human_reviewed: boolean;
  outcome_status: string;
  amount_recovered: string | number | null;
  resolved_at: string | null;
  created_at: string | null;
  payment_link: string | null;
};
