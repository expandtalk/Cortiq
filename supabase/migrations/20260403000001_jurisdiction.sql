-- Jurisdiction & compliance mode per company
-- Controls what the tracking pipeline is allowed to store for each tenant.
--
-- Modes:
--   eu_strict        GDPR/LGPD/PIPL — no raw IP, no PII, consent required, aggregated only
--   global_standard  CCPA/PIPEDA    — raw data OK with opt-out, auto-override to eu_strict for EU visitors
--   permissive       No regulation  — full granular logging (still requires a legal basis in practice)

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS jurisdiction TEXT NOT NULL DEFAULT 'eu_strict'
    CONSTRAINT companies_jurisdiction_check
    CHECK (jurisdiction IN ('eu_strict', 'global_standard', 'permissive')),

  ADD COLUMN IF NOT EXISTS auto_eu_geo_override BOOLEAN NOT NULL DEFAULT true;
  -- When true AND jurisdiction = 'global_standard': any request from an EU/EEA IP
  -- automatically falls back to eu_strict pipeline for that request.

COMMENT ON COLUMN public.companies.jurisdiction IS
  'Compliance mode: eu_strict (GDPR), global_standard (CCPA/opt-out), permissive (no specific law). '
  'Controls what the tracking pipeline may store.';

COMMENT ON COLUMN public.companies.auto_eu_geo_override IS
  'For global_standard companies: automatically apply eu_strict pipeline for requests '
  'originating from EU/EEA IP addresses. Should be true unless customer explicitly opts out.';

-- Helper DB function: returns the effective pipeline mode for a given company_id and
-- visitor country code (ISO 3166-1 alpha-2, e.g. "SE", "US", "BR").
-- Called by Edge Functions to avoid duplicating jurisdiction logic.
CREATE OR REPLACE FUNCTION public.effective_pipeline_mode(
  p_company_id UUID,
  p_visitor_country TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jurisdiction        TEXT;
  v_auto_eu_override    BOOLEAN;
  v_is_eu_visitor       BOOLEAN;
  -- EU + EEA + UK + Switzerland — all subject to GDPR-equivalent laws
  eu_countries CONSTANT TEXT[] := ARRAY[
    'AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR',
    'HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK',
    'IS','LI','NO',   -- EEA
    'GB',             -- UK GDPR
    'CH'              -- Swiss Federal Act on Data Protection
  ];
BEGIN
  SELECT jurisdiction, auto_eu_geo_override
  INTO v_jurisdiction, v_auto_eu_override
  FROM public.companies
  WHERE id = p_company_id;

  IF NOT FOUND THEN
    RETURN 'eu_strict'; -- safe default
  END IF;

  -- Already strictest mode — nothing to override
  IF v_jurisdiction = 'eu_strict' THEN
    RETURN 'eu_strict';
  END IF;

  -- Check if visitor is from an EU/EEA jurisdiction
  v_is_eu_visitor := (
    p_visitor_country IS NOT NULL
    AND upper(p_visitor_country) = ANY(eu_countries)
  );

  -- Auto-upgrade to eu_strict for EU visitors when flag is set
  IF v_is_eu_visitor AND v_auto_eu_override THEN
    RETURN 'eu_strict';
  END IF;

  RETURN v_jurisdiction;
END;
$$;

COMMENT ON FUNCTION public.effective_pipeline_mode IS
  'Returns the effective compliance mode for a company + visitor country pair. '
  'Use this in Edge Functions instead of reading jurisdiction directly — '
  'it handles the EU geo-override logic automatically.';
