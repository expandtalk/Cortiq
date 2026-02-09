-- Create remarketing settings table
CREATE TABLE IF NOT EXISTS public.remarketing_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  
  -- Meta/Facebook settings
  meta_pixel_id TEXT,
  meta_access_token TEXT,
  meta_enabled BOOLEAN DEFAULT false,
  
  -- Google Ads settings
  google_ads_customer_id TEXT,
  google_ads_conversion_action_id TEXT,
  google_ads_enabled BOOLEAN DEFAULT false,
  
  -- General settings
  require_marketing_consent BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(site_id)
);

-- Enable RLS
ALTER TABLE public.remarketing_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view remarketing settings for their sites"
  ON public.remarketing_settings
  FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM public.sites WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update remarketing settings for their sites"
  ON public.remarketing_settings
  FOR UPDATE
  USING (
    site_id IN (
      SELECT id FROM public.sites WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert remarketing settings for their sites"
  ON public.remarketing_settings
  FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT id FROM public.sites WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_remarketing_settings_updated_at
  BEFORE UPDATE ON public.remarketing_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();