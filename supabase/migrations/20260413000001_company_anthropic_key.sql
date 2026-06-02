-- BYOK: each company can supply their own Anthropic API key.
-- Falls back to the shared platform key (Supabase secret) if not set.
-- Only the company's own users can read/write this column (enforced by existing RLS on companies).

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS anthropic_api_key text;

COMMENT ON COLUMN companies.anthropic_api_key IS
  'Tenant-supplied Anthropic API key (BYOK). Stored at rest with Supabase encryption. '
  'Falls back to the platform ANTHROPIC_API_KEY secret when null.';
