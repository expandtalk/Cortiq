-- Update heatmap_data table to use grid system instead of exact coordinates
-- This improves GDPR compliance by reducing identification risk

-- Add new grid columns
ALTER TABLE public.heatmap_data 
ADD COLUMN grid_x integer,
ADD COLUMN grid_y integer,
ADD COLUMN viewport_width integer,
ADD COLUMN viewport_height integer;

-- Create index for better performance on grid queries
CREATE INDEX idx_heatmap_grid ON public.heatmap_data(site_id, url, grid_x, grid_y, interaction_type, device_type);

-- Update the increment function to work with grid coordinates
CREATE OR REPLACE FUNCTION public.increment_heatmap_grid_intensity(
  p_site_id uuid, 
  p_url text, 
  p_device_type text, 
  p_grid_x integer, 
  p_grid_y integer, 
  p_type text, 
  p_date date,
  p_viewport_width integer DEFAULT NULL,
  p_viewport_height integer DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.heatmap_data 
  SET intensity = intensity + 1
  WHERE site_id = p_site_id 
    AND url = p_url 
    AND device_type = p_device_type 
    AND grid_x = p_grid_x 
    AND grid_y = p_grid_y 
    AND interaction_type = p_type 
    AND date = p_date;
    
  -- If no row was updated, insert a new one
  IF NOT FOUND THEN
    INSERT INTO public.heatmap_data (
      site_id, url, device_type, grid_x, grid_y, 
      interaction_type, intensity, date, viewport_width, viewport_height
    ) VALUES (
      p_site_id, p_url, p_device_type, p_grid_x, p_grid_y, 
      p_type, 1, p_date, p_viewport_width, p_viewport_height
    ) ON CONFLICT DO NOTHING;
  END IF;
END;
$function$;

-- Add session rotation columns to tracking_sessions
ALTER TABLE public.tracking_sessions 
ADD COLUMN session_rotation_count integer DEFAULT 0,
ADD COLUMN last_rotation timestamp with time zone DEFAULT now();

-- Function to check if session needs rotation (30 minutes)
CREATE OR REPLACE FUNCTION public.should_rotate_session(p_session_id text, p_site_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  last_rotation_time timestamp with time zone;
BEGIN
  SELECT last_rotation INTO last_rotation_time
  FROM public.tracking_sessions 
  WHERE session_id = p_session_id AND site_id = p_site_id;
  
  -- If no session found or more than 30 minutes since last rotation
  IF last_rotation_time IS NULL OR 
     last_rotation_time < (now() - interval '30 minutes') THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;