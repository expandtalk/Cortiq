-- Add viewport and grid columns to heatmap_data for coordinate normalization
ALTER TABLE public.heatmap_data
  ADD COLUMN IF NOT EXISTS viewport_width  integer,
  ADD COLUMN IF NOT EXISTS viewport_height integer,
  ADD COLUMN IF NOT EXISTS grid_x          integer,
  ADD COLUMN IF NOT EXISTS grid_y          integer;

-- Composite index for the most common dashboard query pattern
CREATE INDEX IF NOT EXISTS idx_heatmap_data_site_url_device
  ON public.heatmap_data (site_id, url, device_type, created_at DESC);
