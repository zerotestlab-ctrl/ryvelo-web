-- Ryvelo initial schema (Postgres + pgvector)
-- Run in Supabase Dashboard → SQL Editor, or: supabase db push / psql with service role.
--
-- Prerequisites:
-- - Supabase Auth: profiles.id = auth.users.id. Sync or create auth users when onboarding.
-- - RLS uses auth.uid(): use Supabase session JWT, or configure Clerk JWT with Supabase third-party auth.
-- - Enable pgvector under Database → Extensions if CREATE EXTENSION fails on your plan.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------------
-- Users (linked to Clerk via clerk_id; id matches Supabase auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clerk_id TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Invoices
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'upwork', 'payoneer', 'stripe', 'gmail', etc.
  raw_data JSONB NOT NULL,
  client_name TEXT,
  client_email TEXT,
  amount DECIMAL(15, 2),
  currency TEXT DEFAULT 'USD',
  invoice_date DATE,
  due_date DATE,
  status TEXT DEFAULT 'ingested', -- ingested, issues_detected, resolving, resolved, failed
  ingested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Resolutions (hybrid agent + human)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  issues_detected JSONB, -- array of detected problems (tax error, dispute, fx mismatch, etc.)
  ai_steps JSONB, -- what the agent tried
  human_reviewed BOOLEAN DEFAULT FALSE,
  outcome_status TEXT DEFAULT 'pending', -- pending, resolved, partial, failed
  amount_recovered DECIMAL(15, 2) DEFAULT 0,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Embeddings (data moat)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resolution_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resolution_id UUID REFERENCES resolutions(id) ON DELETE CASCADE,
  embedding vector(1536), -- OpenAI text-embedding-3-small/large
  metadata JSONB
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_resolutions_invoice_id ON resolutions(resolution_id);
CREATE INDEX IF NOT EXISTS idx_resolution_embeddings_resolution_id ON resolution_embeddings(resolution_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolution_embeddings ENABLE ROW LEVEL SECURITY;

-- Profiles: own row only
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Invoices: CRUD only for owner (split policies so INSERT/UPDATE have WITH CHECK)
DROP POLICY IF EXISTS "Users can select own invoices" ON invoices;
CREATE POLICY "Users can select own invoices" ON invoices FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own invoices" ON invoices;
CREATE POLICY "Users can insert own invoices" ON invoices FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own invoices" ON invoices;
CREATE POLICY "Users can update own invoices" ON invoices FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own invoices" ON invoices;
CREATE POLICY "Users can delete own invoices" ON invoices FOR DELETE USING (user_id = auth.uid());

-- Resolutions: via owning invoice
DROP POLICY IF EXISTS "Users can select own resolutions" ON resolutions;
CREATE POLICY "Users can select own resolutions" ON resolutions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = resolutions.invoice_id AND i.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert own resolutions" ON resolutions;
CREATE POLICY "Users can insert own resolutions" ON resolutions FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_id AND i.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own resolutions" ON resolutions;
CREATE POLICY "Users can update own resolutions" ON resolutions FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = resolutions.invoice_id AND i.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_id AND i.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete own resolutions" ON resolutions;
CREATE POLICY "Users can delete own resolutions" ON resolutions FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = resolutions.invoice_id AND i.user_id = auth.uid()
  )
);

-- Resolution embeddings: via resolution → invoice → user
DROP POLICY IF EXISTS "Users can select own resolution_embeddings" ON resolution_embeddings;
CREATE POLICY "Users can select own resolution_embeddings" ON resolution_embeddings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM resolutions r
    JOIN invoices i ON i.id = r.invoice_id
    WHERE r.id = resolution_embeddings.resolution_id AND i.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert own resolution_embeddings" ON resolution_embeddings;
CREATE POLICY "Users can insert own resolution_embeddings" ON resolution_embeddings FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM resolutions r
    JOIN invoices i ON i.id = r.invoice_id
    WHERE r.id = resolution_id AND i.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own resolution_embeddings" ON resolution_embeddings;
CREATE POLICY "Users can update own resolution_embeddings" ON resolution_embeddings FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM resolutions r
    JOIN invoices i ON i.id = r.invoice_id
    WHERE r.id = resolution_embeddings.resolution_id AND i.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM resolutions r
    JOIN invoices i ON i.id = r.invoice_id
    WHERE r.id = resolution_id AND i.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete own resolution_embeddings" ON resolution_embeddings;
CREATE POLICY "Users can delete own resolution_embeddings" ON resolution_embeddings FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM resolutions r
    JOIN invoices i ON i.id = r.invoice_id
    WHERE r.id = resolution_embeddings.resolution_id AND i.user_id = auth.uid()
  )
);
