-- TrafikBoost Integration Migration for CortIQ (tidigare Web Focus Analyzer)
-- Run this in your TrafikBoost Supabase project

-- ============================================================================
-- 1. CortIQ Sites Table (huvudtabell för integration, behåller wfa_sites för bakåtkompatibilitet)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wfa_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  site_name TEXT NOT NULL,
  domain TEXT NOT NULL,
  tracking_id TEXT NOT NULL UNIQUE DEFAULT ('wfa_' || replace(gen_random_uuid()::text, '-', '')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- CortIQ konfiguration per site
  wfa_config JSONB DEFAULT '{
    "anonymize_ip": true,
    "cookie_consent_enabled": true,
    "cookie_consent_mode": "opt-in",
    "heatmap_enabled": true,
    "form_tracking_enabled": true,
    "ai_bot_tracking_enabled": true,
    "navigation_tracking_enabled": true,
    "ecommerce_tracking_enabled": false,
    "data_retention_days": 365
  }'::jsonb,
  
  -- Metadata
  plugin_installed BOOLEAN DEFAULT false,
  plugin_version TEXT,
  last_data_received_at TIMESTAMPTZ,
  
  CONSTRAINT unique_company_domain UNIQUE(company_id, domain)
);

COMMENT ON TABLE public.wfa_sites IS 'CortIQ sites connected to TrafikBoost companies (behåller wfa_sites för bakåtkompatibilitet)';
COMMENT ON COLUMN public.wfa_sites.tracking_id IS 'Unique tracking ID used in WordPress plugin and tracking scripts';
COMMENT ON COLUMN public.wfa_sites.wfa_config IS 'Site-specific configuration for CortIQ features';

-- ============================================================================
-- 2. RLS Policies för wfa_sites
-- ============================================================================

ALTER TABLE public.wfa_sites ENABLE ROW LEVEL SECURITY;

-- Users can view WFA sites for their companies
CREATE POLICY "Users can view their company WFA sites"
ON public.wfa_sites FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.company_users 
    WHERE user_id = auth.uid()
  )
);

-- Admins can insert WFA sites for their companies
CREATE POLICY "Admins can create WFA sites for their company"
ON public.wfa_sites FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT cu.company_id FROM public.company_users cu
    WHERE cu.user_id = auth.uid() AND cu.role = 'admin'
  )
);

-- Admins can update WFA sites for their companies
CREATE POLICY "Admins can update their company WFA sites"
ON public.wfa_sites FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT cu.company_id FROM public.company_users cu
    WHERE cu.user_id = auth.uid() AND cu.role = 'admin'
  )
)
WITH CHECK (
  company_id IN (
    SELECT cu.company_id FROM public.company_users cu
    WHERE cu.user_id = auth.uid() AND cu.role = 'admin'
  )
);

-- Admins can delete WFA sites for their companies
CREATE POLICY "Admins can delete their company WFA sites"
ON public.wfa_sites FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT cu.company_id FROM public.company_users cu
    WHERE cu.user_id = auth.uid() AND cu.role = 'admin'
  )
);

-- ============================================================================
-- 3. Indexes för performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wfa_sites_company 
ON public.wfa_sites(company_id);

CREATE INDEX IF NOT EXISTS idx_wfa_sites_tracking_id 
ON public.wfa_sites(tracking_id);

CREATE INDEX IF NOT EXISTS idx_wfa_sites_active 
ON public.wfa_sites(company_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_wfa_sites_domain 
ON public.wfa_sites(domain);

-- ============================================================================
-- 4. Trigger för updated_at
-- ============================================================================

-- Förutsätter att du har denna funktion i TrafikBoost
-- Om inte, skapa den först:
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wfa_sites_updated_at
  BEFORE UPDATE ON public.wfa_sites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. Helper Functions
-- ============================================================================

-- Funktion för att generera tracking script för en site
CREATE OR REPLACE FUNCTION public.get_wfa_tracking_script(p_site_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tracking_id TEXT;
  v_config JSONB;
  v_script TEXT;
BEGIN
  -- Hämta tracking_id och config
  SELECT tracking_id, wfa_config 
  INTO v_tracking_id, v_config
  FROM public.wfa_sites
  WHERE id = p_site_id;
  
  IF v_tracking_id IS NULL THEN
    RAISE EXCEPTION 'Site not found';
  END IF;
  
  -- Bygg tracking script
  v_script := format(
    E'<!-- Web Focus Analyzer -->\n' ||
    '<script>\n' ||
    '  window.wfaConfig = {\n' ||
    '    trackingId: "%s",\n' ||
    '    apiUrl: "https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1",\n' ||
    '    features: %s\n' ||
    '  };\n' ||
    '</script>\n' ||
    '<script src="https://webfocusanalyzer.se/tracking-script.js" async></script>',
    v_tracking_id,
    v_config::text
  );
  
  RETURN v_script;
END;
$$;

COMMENT ON FUNCTION public.get_wfa_tracking_script IS 'Generate WFA tracking script for a site';

-- Funktion för att uppdatera last_data_received_at
CREATE OR REPLACE FUNCTION public.update_wfa_last_data_received(p_tracking_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.wfa_sites
  SET last_data_received_at = now()
  WHERE tracking_id = p_tracking_id;
END;
$$;

COMMENT ON FUNCTION public.update_wfa_last_data_received IS 'Update last data received timestamp when WFA receives data';

-- ============================================================================
-- 6. Example Data (Optional - för testing)
-- ============================================================================

-- Om du vill testa med sample data:
/*
INSERT INTO public.wfa_sites (company_id, site_name, domain) 
VALUES (
  'your-test-company-id', 
  'Test Site', 
  'test.example.com'
);
*/

-- ============================================================================
-- 7. Audit Logging (Optional men rekommenderat)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wfa_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wfa_site_id UUID REFERENCES public.wfa_sites(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'plugin_installed'
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_wfa_audit_log_site ON public.wfa_audit_log(wfa_site_id);
CREATE INDEX idx_wfa_audit_log_company ON public.wfa_audit_log(company_id);
CREATE INDEX idx_wfa_audit_log_date ON public.wfa_audit_log(created_at DESC);

-- RLS för audit log
ALTER TABLE public.wfa_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their company WFA audit logs"
ON public.wfa_audit_log FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT cu.company_id FROM public.company_users cu
    WHERE cu.user_id = auth.uid() AND cu.role = 'admin'
  )
);

-- ============================================================================
-- Migration Complete!
-- ============================================================================

-- Verify installation:
SELECT 
  'wfa_sites table created' as step,
  COUNT(*) as row_count 
FROM public.wfa_sites;
