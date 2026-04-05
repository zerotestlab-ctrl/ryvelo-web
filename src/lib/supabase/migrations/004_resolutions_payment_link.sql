-- Store Paystack (or other) collect URL after execute_resolution.
ALTER TABLE public.resolutions
  ADD COLUMN IF NOT EXISTS payment_link TEXT;

COMMENT ON COLUMN public.resolutions.payment_link IS
  'Checkout URL for collect step (e.g. Paystack hosted Pro/Starter).';
