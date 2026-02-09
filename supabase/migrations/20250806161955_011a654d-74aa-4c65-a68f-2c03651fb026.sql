-- Create behavioral alerts table
CREATE TABLE public.behavioral_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  alert_name TEXT NOT NULL,
  alert_description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  threshold_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  notification_settings JSONB DEFAULT '{"email": true, "dashboard": true, "webhook": false}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create behavioral incidents table
CREATE TABLE public.behavioral_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL,
  alert_id UUID NOT NULL,
  incident_type TEXT NOT NULL,
  incident_data JSONB NOT NULL DEFAULT '{}',
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.behavioral_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_incidents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for behavioral_alerts
CREATE POLICY "Anyone can create behavioral alerts" 
ON public.behavioral_alerts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Site owners can view behavioral alerts" 
ON public.behavioral_alerts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.sites 
  WHERE sites.id = behavioral_alerts.site_id 
  AND sites.user_id = auth.uid()
));

CREATE POLICY "Site owners can update behavioral alerts" 
ON public.behavioral_alerts 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.sites 
  WHERE sites.id = behavioral_alerts.site_id 
  AND sites.user_id = auth.uid()
));

-- Create RLS policies for behavioral_incidents  
CREATE POLICY "Anyone can create behavioral incidents" 
ON public.behavioral_incidents 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Site owners can view behavioral incidents" 
ON public.behavioral_incidents 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.sites 
  WHERE sites.id = behavioral_incidents.site_id 
  AND sites.user_id = auth.uid()
));

CREATE POLICY "Site owners can update behavioral incidents" 
ON public.behavioral_incidents 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.sites 
  WHERE sites.id = behavioral_incidents.site_id 
  AND sites.user_id = auth.uid()
));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_behavioral_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_behavioral_alerts_updated_at
  BEFORE UPDATE ON public.behavioral_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_behavioral_updated_at();

CREATE TRIGGER update_behavioral_incidents_updated_at
  BEFORE UPDATE ON public.behavioral_incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_behavioral_updated_at();

-- Insert default alert rules
INSERT INTO public.behavioral_alerts (site_id, alert_type, alert_name, alert_description, severity, threshold_config) VALUES
('00000000-0000-0000-0000-000000000000', 'rage_clicks', 'Rage Clicks Detection', 'Detects when users rapidly click the same element multiple times', 'high', '{"clicks_threshold": 5, "time_window_seconds": 3}'),
('00000000-0000-0000-0000-000000000000', 'high_bounce_rate', 'High Bounce Rate Alert', 'Alerts when bounce rate exceeds normal thresholds', 'medium', '{"bounce_rate_threshold": 80, "page_views_minimum": 10}'),
('00000000-0000-0000-0000-000000000000', 'form_abandonment', 'Form Abandonment Spike', 'Detects unusually high form abandonment rates', 'medium', '{"abandonment_rate_threshold": 70, "minimum_form_starts": 5}'),
('00000000-0000-0000-0000-000000000000', 'session_timeout', 'Abnormal Session Duration', 'Alerts on extremely short or long sessions', 'low', '{"min_duration_seconds": 5, "max_duration_seconds": 3600}'),
('00000000-0000-0000-0000-000000000000', 'mobile_conversion_drop', 'Mobile Conversion Drop', 'Detects significant drops in mobile conversion rates', 'high', '{"conversion_drop_percentage": 30, "desktop_mobile_ratio_threshold": 2.0}');