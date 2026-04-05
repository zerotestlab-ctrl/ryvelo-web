-- Atomic ingest: one invoice row then one resolution row in a single transaction.
-- Run in Supabase SQL Editor if migrations are not auto-applied.

CREATE OR REPLACE FUNCTION public.ingest_create_invoice_and_resolution(
  p_user_id uuid,
  p_source text,
  p_raw_data jsonb,
  p_client_name text,
  p_client_email text,
  p_amount numeric,
  p_currency text,
  p_invoice_date date,
  p_due_date date,
  p_status text,
  p_issues_detected jsonb,
  p_ai_steps jsonb
) RETURNS TABLE (invoice_id uuid, resolution_id uuid)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_invoice_id uuid;
  v_resolution_id uuid;
  v_currency text;
BEGIN
  v_currency := COALESCE(NULLIF(trim(COALESCE(p_currency, '')), ''), 'USD');

  INSERT INTO invoices (
    user_id,
    source,
    raw_data,
    client_name,
    client_email,
    amount,
    currency,
    invoice_date,
    due_date,
    status,
    ingested_at
  ) VALUES (
    p_user_id,
    p_source,
    p_raw_data,
    p_client_name,
    p_client_email,
    p_amount,
    v_currency,
    p_invoice_date,
    p_due_date,
    p_status,
    NOW()
  )
  RETURNING id INTO v_invoice_id;

  INSERT INTO resolutions (
    invoice_id,
    issues_detected,
    ai_steps,
    outcome_status,
    human_reviewed
  ) VALUES (
    v_invoice_id,
    COALESCE(p_issues_detected, '[]'::jsonb),
    COALESCE(p_ai_steps, '{}'::jsonb),
    'pending',
    false
  )
  RETURNING id INTO v_resolution_id;

  RETURN QUERY SELECT v_invoice_id, v_resolution_id;
END;
$$;

COMMENT ON FUNCTION public.ingest_create_invoice_and_resolution IS
  'Creates invoice then resolution with FK in one transaction (Ryvelo ingest).';

GRANT EXECUTE ON FUNCTION public.ingest_create_invoice_and_resolution(
  uuid, text, jsonb, text, text, numeric, text, date, date, text, jsonb, jsonb
) TO service_role;
