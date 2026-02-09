-- Add mobile-specific columns to heatmap_data table for enhanced mobile tracking
ALTER TABLE public.heatmap_data 
ADD COLUMN IF NOT EXISTS mobile_device_brand text,
ADD COLUMN IF NOT EXISTS mobile_device_model text,
ADD COLUMN IF NOT EXISTS operating_system text,
ADD COLUMN IF NOT EXISTS operating_system_version text,
ADD COLUMN IF NOT EXISTS browser text,
ADD COLUMN IF NOT EXISTS touch_force numeric,
ADD COLUMN IF NOT EXISTS touch_radius integer,
ADD COLUMN IF NOT EXISTS is_touch_device boolean DEFAULT false;

-- Create index for better mobile analytics performance
CREATE INDEX IF NOT EXISTS idx_heatmap_mobile_analytics 
ON public.heatmap_data (site_id, device_type, mobile_device_brand, operating_system) 
WHERE device_type = 'mobile';

-- Create index for touch device filtering
CREATE INDEX IF NOT EXISTS idx_heatmap_touch_device 
ON public.heatmap_data (site_id, is_touch_device, interaction_type) 
WHERE is_touch_device = true;