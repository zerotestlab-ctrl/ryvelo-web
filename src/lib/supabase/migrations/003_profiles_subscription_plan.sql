-- Subscription plan (Paystack checkout is configured in Paystack Dashboard; use test keys while developing.)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';

COMMENT ON COLUMN profiles.subscription_plan IS 'free | starter | pro (manual or webhook sync from Paystack)';
