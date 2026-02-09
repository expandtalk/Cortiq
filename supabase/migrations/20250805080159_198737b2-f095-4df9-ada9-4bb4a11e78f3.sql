-- Create table for navigation menu structure
CREATE TABLE public.navigation_menus (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id uuid NOT NULL,
  menu_item_id integer NOT NULL,
  menu_title text NOT NULL,
  menu_url text NOT NULL,
  menu_order integer DEFAULT 0,
  parent_id integer DEFAULT 0,
  css_classes text[],
  menu_location text DEFAULT 'primary',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.navigation_menus ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Site owners can manage navigation menus" 
ON public.navigation_menus 
FOR ALL 
USING (EXISTS ( 
  SELECT 1 FROM sites 
  WHERE sites.id = navigation_menus.site_id 
  AND sites.user_id = auth.uid()
));

-- Create table for navigation analytics
CREATE TABLE public.navigation_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id uuid NOT NULL,
  menu_item_id integer NOT NULL,
  menu_title text NOT NULL,
  menu_url text NOT NULL,
  click_count integer DEFAULT 0,
  device_type text DEFAULT 'desktop',
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.navigation_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can create navigation analytics" 
ON public.navigation_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Site owners can view navigation analytics" 
ON public.navigation_analytics 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1 FROM sites 
  WHERE sites.id = navigation_analytics.site_id 
  AND sites.user_id = auth.uid()
));

-- Create function to increment navigation clicks
CREATE OR REPLACE FUNCTION public.increment_navigation_clicks(
  p_site_id uuid, 
  p_menu_item_id integer, 
  p_menu_title text, 
  p_menu_url text, 
  p_device_type text, 
  p_date date
) 
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO '' 
AS $function$
BEGIN
  UPDATE public.navigation_analytics 
  SET click_count = click_count + 1,
      updated_at = now()
  WHERE site_id = p_site_id 
    AND menu_item_id = p_menu_item_id 
    AND device_type = p_device_type 
    AND date = p_date;
    
  -- If no row was updated, insert a new one
  IF NOT FOUND THEN
    INSERT INTO public.navigation_analytics (
      site_id, menu_item_id, menu_title, menu_url, 
      click_count, device_type, date
    ) VALUES (
      p_site_id, p_menu_item_id, p_menu_title, p_menu_url, 
      1, p_device_type, p_date
    ) ON CONFLICT DO NOTHING;
  END IF;
END;
$function$;

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_navigation_menus_updated_at
  BEFORE UPDATE ON public.navigation_menus
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_navigation_analytics_updated_at
  BEFORE UPDATE ON public.navigation_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();