-- Utöka sites tabellen med integration-fält för Analytics och Marketing
-- Analytics integrations
ALTER TABLE public.sites ADD COLUMN hotjar_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.sites ADD COLUMN hotjar_site_id TEXT;
ALTER TABLE public.sites ADD COLUMN microsoft_clarity_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.sites ADD COLUMN microsoft_clarity_project_id TEXT;
ALTER TABLE public.sites ADD COLUMN mixpanel_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.sites ADD COLUMN mixpanel_token TEXT;

-- Marketing integrations  
ALTER TABLE public.sites ADD COLUMN google_ads_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.sites ADD COLUMN google_ads_conversion_id TEXT;
ALTER TABLE public.sites ADD COLUMN facebook_pixel_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.sites ADD COLUMN facebook_pixel_id TEXT;
ALTER TABLE public.sites ADD COLUMN tiktok_pixel_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.sites ADD COLUMN tiktok_pixel_id TEXT;
ALTER TABLE public.sites ADD COLUMN linkedin_insight_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.sites ADD COLUMN linkedin_partner_id TEXT;
ALTER TABLE public.sites ADD COLUMN hubspot_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.sites ADD COLUMN hubspot_hub_id TEXT;

-- Tag Managers
ALTER TABLE public.sites ADD COLUMN gtm_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.sites ADD COLUMN gtm_container_id TEXT;
ALTER TABLE public.sites ADD COLUMN adobe_tag_manager_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.sites ADD COLUMN adobe_container_id TEXT;

-- Marketing Automation
ALTER TABLE public.sites ADD COLUMN salesforce_pardot_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.sites ADD COLUMN salesforce_account_id TEXT;
ALTER TABLE public.sites ADD COLUMN oracle_eloqua_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.sites ADD COLUMN oracle_site_id TEXT;
ALTER TABLE public.sites ADD COLUMN activecampaign_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.sites ADD COLUMN activecampaign_account TEXT;
ALTER TABLE public.sites ADD COLUMN marketo_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.sites ADD COLUMN marketo_munchkin_id TEXT;