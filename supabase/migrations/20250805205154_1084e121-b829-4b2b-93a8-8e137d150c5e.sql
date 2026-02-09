-- Lägg till heatmap_tracking_enabled fält till sites tabellen
ALTER TABLE public.sites 
ADD COLUMN heatmap_tracking_enabled boolean DEFAULT true;

-- Lägg till heatmap_tracking_enabled fält till gdpr_settings tabellen också
ALTER TABLE public.gdpr_settings 
ADD COLUMN heatmap_tracking_enabled boolean DEFAULT true;