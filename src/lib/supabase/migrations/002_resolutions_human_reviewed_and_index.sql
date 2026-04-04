-- Ensure human_reviewed exists on resolutions (legacy databases)
ALTER TABLE resolutions
ADD COLUMN IF NOT EXISTS human_reviewed BOOLEAN DEFAULT FALSE;

-- Fix index: 001 mistakenly used resolution_id; column name is invoice_id
DROP INDEX IF EXISTS idx_resolutions_invoice_id;
CREATE INDEX IF NOT EXISTS idx_resolutions_invoice_id ON resolutions(invoice_id);
