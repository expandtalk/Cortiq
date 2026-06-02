-- Credential audit: tracks when external API keys were last rotated.
-- Per AITLP T10 / Section 13.6: credentials must be short-lived with rotation tracking.
-- This table is platform-level (not per-site); only service_role may write.

CREATE TABLE IF NOT EXISTS credential_audit (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name      text        NOT NULL UNIQUE,     -- 'ANTHROPIC_API_KEY', 'GA4_CLIENT_SECRET', etc.
  rotated_at    timestamptz NOT NULL DEFAULT now(),
  max_age_days  int         NOT NULL DEFAULT 90, -- AITLP CONFIDENTIAL = 90 days recommended
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Pre-seed known API keys with their rotation entries
INSERT INTO credential_audit (key_name, max_age_days, notes)
VALUES
  ('ANTHROPIC_API_KEY',    90,  'Used in generate-kpi-insights. AITLP clearance_level: CONFIDENTIAL.'),
  ('GA4_CLIENT_SECRET',    180, 'Used in GA4 integration. Rotate via Google Cloud Console.'),
  ('SUPABASE_SERVICE_ROLE_KEY', 365, 'Supabase service role. Rotate via Supabase dashboard.')
ON CONFLICT (key_name) DO NOTHING;

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION update_credential_audit_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_credential_audit_updated_at ON credential_audit;
CREATE TRIGGER trg_credential_audit_updated_at
  BEFORE UPDATE ON credential_audit
  FOR EACH ROW EXECUTE FUNCTION update_credential_audit_updated_at();

-- RLS: authenticated users can SELECT (to show health in UI), only service_role can INSERT/UPDATE
ALTER TABLE credential_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY credential_audit_read ON credential_audit
  FOR SELECT USING (true);  -- All authenticated users can read key health status

-- Only service_role (Edge Functions) may update rotation timestamps
REVOKE INSERT, UPDATE, DELETE ON credential_audit FROM authenticated, anon;
GRANT SELECT ON credential_audit TO authenticated;
GRANT ALL ON credential_audit TO service_role;
