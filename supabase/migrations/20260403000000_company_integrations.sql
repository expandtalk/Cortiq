-- Company-level integration credentials vault
-- Stores BYOK (Bring Your Own Key) credentials for external services.
-- Scoped per company so credentials work across all of a company's sites.
--
-- NOTE: For production hardening, migrate credentials column to Supabase Vault
-- (pgsodium) or pgp_sym_encrypt. Current approach relies on RLS as the
-- security boundary — only members of the company can read their own credentials.

CREATE TABLE public.company_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant isolation: one row per company per integration type
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,     -- matches ontology id: 'google_ads_api' | 'anthropic' | etc.

  -- Credentials storage (use Supabase Vault in production for at-rest encryption)
  credentials JSONB NOT NULL DEFAULT '{}',
  -- Examples per auth type:
  --   api_key:            {"api_key": "sk-..."}
  --   oauth2:             {"client_id": "...", "client_secret": "..."}
  --   username_password:  {"username": "...", "password": "..."}
  --   service_account:    {"json_key": "{...}"}

  -- OAuth token storage (separate from credentials for clarity)
  oauth_access_token  TEXT,
  oauth_refresh_token TEXT,
  token_expires_at    TIMESTAMPTZ,
  oauth_scopes        TEXT[],

  -- Non-sensitive metadata about the connected account (safe to show in UI)
  account_metadata JSONB NOT NULL DEFAULT '{}',
  -- Examples:
  --   {"display_name": "My Google Ads Account", "customer_id": "123-456-7890"}
  --   {"display_name": "My Page", "ad_account_id": "act_123456789"}

  -- Health tracking
  status TEXT NOT NULL DEFAULT 'disconnected'
    CONSTRAINT company_integrations_status_check
    CHECK (status IN ('connected', 'disconnected', 'error', 'expired')),
  error_message TEXT,
  last_synced_at TIMESTAMPTZ,

  -- Audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT company_integrations_unique UNIQUE (company_id, integration_type)
);

-- Fast lookups by company and by type
CREATE INDEX idx_company_integrations_company ON public.company_integrations (company_id);
CREATE INDEX idx_company_integrations_type    ON public.company_integrations (company_id, integration_type);
CREATE INDEX idx_company_integrations_status  ON public.company_integrations (company_id, status);

-- Auto-update updated_at
CREATE TRIGGER update_company_integrations_updated_at
  BEFORE UPDATE ON public.company_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.company_integrations ENABLE ROW LEVEL SECURITY;

-- SELECT: members of the company can read their own integrations
CREATE POLICY "company_integrations_select"
  ON public.company_integrations FOR SELECT
  USING (
    company_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: members can add integrations for their company
CREATE POLICY "company_integrations_insert"
  ON public.company_integrations FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE: members can update their company's integrations
CREATE POLICY "company_integrations_update"
  ON public.company_integrations FOR UPDATE
  USING (
    company_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- DELETE: members can remove their company's integrations
CREATE POLICY "company_integrations_delete"
  ON public.company_integrations FOR DELETE
  USING (
    company_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_integrations TO authenticated;

COMMENT ON TABLE public.company_integrations IS
  'BYOK credential vault — one row per external integration per company. '
  'Drives the Integrations Hub UI and is read by Edge Functions to import data.';
