-- P0: move companies.anthropic_api_key out of browser reach.
-- The key was SELECTable by any authenticated tenant (AnthropicKeySettings.tsx read it
-- into the browser). RLS is row-level and cannot hide a single column, so the fix is a
-- dedicated service-role-only table. Edge functions (service role) bypass RLS and can
-- read/write it; browsers get NO policy and therefore no access.

CREATE TABLE IF NOT EXISTS public.company_secrets (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  anthropic_api_key text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_secrets ENABLE ROW LEVEL SECURITY;

-- Intentionally no anon/authenticated policies: only the service role (which bypasses
-- RLS) may touch this table, via the anthropic-key / ai-assistant / geo-analyze functions.
DROP POLICY IF EXISTS "Service role manages company secrets" ON public.company_secrets;
CREATE POLICY "Service role manages company secrets"
ON public.company_secrets FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Migrate any existing keys, then remove the browser-readable column.
INSERT INTO public.company_secrets (company_id, anthropic_api_key)
SELECT id, anthropic_api_key
FROM public.companies
WHERE anthropic_api_key IS NOT NULL
ON CONFLICT (company_id) DO UPDATE SET anthropic_api_key = EXCLUDED.anthropic_api_key;

ALTER TABLE public.companies DROP COLUMN IF EXISTS anthropic_api_key;
