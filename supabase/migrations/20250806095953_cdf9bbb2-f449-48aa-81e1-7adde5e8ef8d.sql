-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule GDPR data cleanup to run daily at 2 AM
SELECT cron.schedule(
  'gdpr-data-cleanup',
  '0 2 * * *', -- Every day at 2 AM
  $$
  SELECT
    net.http_post(
        url:='https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/gdpr-data-cleanup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SUPABASE_ANON_KEY"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Add policy versioning and GPC support to cookie_consents
ALTER TABLE public.cookie_consents 
ADD COLUMN IF NOT EXISTS policy_version TEXT DEFAULT '2025-08-01',
ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'sv-SE',
ADD COLUMN IF NOT EXISTS gpc_signal BOOLEAN DEFAULT false;

-- Add index for better performance on cleanup queries
CREATE INDEX IF NOT EXISTS idx_cookie_consents_created_at ON public.cookie_consents(created_at);
CREATE INDEX IF NOT EXISTS idx_data_requests_created_at ON public.data_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_consent_validations_created_at ON public.consent_validations(created_at);

-- Add Google Consent Mode settings to sites table
ALTER TABLE public.sites 
ADD COLUMN IF NOT EXISTS gcm_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gcm_measurement_id TEXT,
ADD COLUMN IF NOT EXISTS gcm_container_id TEXT;

-- Update GDPR settings to include more policy options
ALTER TABLE public.gdpr_settings
ADD COLUMN IF NOT EXISTS policy_version TEXT DEFAULT '2025-08-01',
ADD COLUMN IF NOT EXISTS support_gpc BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS click_to_load_enabled BOOLEAN DEFAULT true;