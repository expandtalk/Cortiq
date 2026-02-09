-- Create consent validation and server-side blocking system

-- Add consent validation log table
CREATE TABLE IF NOT EXISTS public.consent_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  validation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  consent_status JSONB NOT NULL,
  blocked_calls JSONB DEFAULT '[]'::jsonb,
  allowed_calls JSONB DEFAULT '[]'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consent_validations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Site owners can view consent validations" 
ON public.consent_validations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM sites 
  WHERE sites.id = consent_validations.site_id 
  AND sites.user_id = auth.uid()
));

CREATE POLICY "Anyone can create consent validations" 
ON public.consent_validations 
FOR INSERT 
WITH CHECK (true);

-- Add server-side tracking configuration to sites table
ALTER TABLE public.sites 
ADD COLUMN IF NOT EXISTS server_side_tracking_config JSONB DEFAULT '{
  "block_analytics_without_consent": true,
  "block_marketing_without_consent": true,
  "require_explicit_consent": true,
  "third_party_integrations": []
}'::jsonb;

-- Create function to validate consent for server-side tracking
CREATE OR REPLACE FUNCTION public.validate_consent_for_tracking(
  p_site_id UUID,
  p_session_id TEXT,
  p_consent_type TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  latest_consent RECORD;
  site_config JSONB;
BEGIN
  -- Get site configuration
  SELECT server_side_tracking_config INTO site_config
  FROM public.sites 
  WHERE id = p_site_id;
  
  -- If blocking is disabled, allow all
  IF NOT (site_config->>'block_analytics_without_consent')::boolean AND p_consent_type = 'analytics' THEN
    RETURN true;
  END IF;
  
  IF NOT (site_config->>'block_marketing_without_consent')::boolean AND p_consent_type = 'marketing' THEN
    RETURN true;
  END IF;
  
  -- Get latest consent for this session and site
  SELECT * INTO latest_consent
  FROM public.cookie_consents
  WHERE site_id = p_site_id 
    AND session_id = p_session_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no consent found, block
  IF latest_consent IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check specific consent type
  CASE p_consent_type
    WHEN 'analytics' THEN
      RETURN (latest_consent.consent_types->>'analytics')::boolean;
    WHEN 'marketing' THEN
      RETURN (latest_consent.consent_types->>'marketing')::boolean;
    WHEN 'preferences' THEN
      RETURN (latest_consent.consent_types->>'preferences')::boolean;
    WHEN 'necessary' THEN
      RETURN true; -- Always allow necessary
    ELSE
      RETURN false;
  END CASE;
END;
$$;