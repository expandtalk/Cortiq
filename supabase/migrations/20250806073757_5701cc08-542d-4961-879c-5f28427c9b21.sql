-- Create dashboard_insights table for AI-generated insights
CREATE TABLE public.dashboard_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('opportunity', 'warning', 'trend', 'optimization')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  action_items JSONB DEFAULT '[]'::jsonb,
  confidence_score NUMERIC(3,2) DEFAULT 0.75 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  data_points JSONB DEFAULT '{}'::jsonb,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE public.dashboard_insights ENABLE ROW LEVEL SECURITY;

-- Create policies for dashboard insights
CREATE POLICY "Site owners can view dashboard insights" 
ON public.dashboard_insights 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM sites 
  WHERE sites.id = dashboard_insights.site_id 
  AND sites.user_id = auth.uid()
));

CREATE POLICY "Anyone can create dashboard insights" 
ON public.dashboard_insights 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Site owners can update dashboard insights" 
ON public.dashboard_insights 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM sites 
  WHERE sites.id = dashboard_insights.site_id 
  AND sites.user_id = auth.uid()
));

-- Create user_preferences table for navigation favorites
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  favorite_tabs JSONB DEFAULT '[]'::jsonb,
  dashboard_layout JSONB DEFAULT '{}'::jsonb,
  notification_settings JSONB DEFAULT '{"insights": true, "alerts": true, "reports": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS for user preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user preferences
CREATE POLICY "Users can manage their own preferences" 
ON public.user_preferences 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_dashboard_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for dashboard_insights
CREATE TRIGGER update_dashboard_insights_updated_at
  BEFORE UPDATE ON public.dashboard_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dashboard_insights_updated_at();

-- Create trigger for user_preferences  
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_dashboard_insights_site_id ON public.dashboard_insights(site_id);
CREATE INDEX idx_dashboard_insights_created_at ON public.dashboard_insights(created_at DESC);
CREATE INDEX idx_dashboard_insights_priority ON public.dashboard_insights(priority);
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);