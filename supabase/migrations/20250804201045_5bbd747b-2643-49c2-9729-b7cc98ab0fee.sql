-- Add ga_property_id column to sites table
ALTER TABLE public.sites 
ADD COLUMN ga_property_id TEXT;

-- Add comment to clarify the difference
COMMENT ON COLUMN public.sites.ga_measurement_id IS 'GA4 Measurement ID (G-XXXXXXXXXX) for tracking';
COMMENT ON COLUMN public.sites.ga_property_id IS 'GA4 Property ID (numeric) for Analytics Data API';