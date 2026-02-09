-- Add cookiefree mode columns to gdpr_settings
ALTER TABLE public.gdpr_settings
ADD COLUMN IF NOT EXISTS cookiefree_mode boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cookiefree_method text DEFAULT 'fingerprint';

COMMENT ON COLUMN public.gdpr_settings.cookiefree_mode IS 'When enabled, cookie banner is hidden and tracking uses cookiefree methods';
COMMENT ON COLUMN public.gdpr_settings.cookiefree_method IS 'Method for cookiefree tracking: fingerprint, ip_hash, or session_id';