-- Companies table (external companies using Trafikboost)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64'),
  consent_settings JSONB DEFAULT '{
    "consent_mode": "opt-out",
    "data_retention_days": 730,
    "anonymize_ip": true,
    "allowed_event_types": ["view", "click", "conversion"],
    "gdpr_settings": {
      "store_user_agent": false,
      "store_referrer": true,
      "geographic_restrictions": ["EU"]
    }
  }'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tracking events (cookieless serverside tracking)
CREATE TABLE IF NOT EXISTS public.tracking_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'image' | 'form' | 'event' | 'survey' | 'chatbot'
  content_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'view' | 'click' | 'conversion' | 'submission'
  platform TEXT, -- 'instagram' | 'youtube' | 'tiktok' | 'linkedin' | etc
  session_id TEXT NOT NULL, -- Browser fingerprint (cookieless)
  metadata JSONB DEFAULT '{}'::jsonb, -- user_agent, referrer, country, device_type, etc
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_tracking_events_company_content_time 
  ON public.tracking_events(company_id, content_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_events_company_time 
  ON public.tracking_events(company_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_events_session 
  ON public.tracking_events(session_id, timestamp DESC);

-- Analytics summary (aggregated for faster queries)
CREATE TABLE IF NOT EXISTS public.analytics_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  platform TEXT,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  submissions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, content_id, platform, date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_summary_company_date 
  ON public.analytics_summary(company_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_content 
  ON public.analytics_summary(content_id, date DESC);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Service role can manage companies"
  ON public.companies FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for tracking_events (insert via API with company API key)
CREATE POLICY "Anyone can insert tracking events"
  ON public.tracking_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can view all tracking events"
  ON public.tracking_events FOR SELECT
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for analytics_summary
CREATE POLICY "Anyone can insert analytics summary"
  ON public.analytics_summary FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can view all analytics summary"
  ON public.analytics_summary FOR SELECT
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can update analytics summary"
  ON public.analytics_summary FOR UPDATE
  USING (auth.jwt()->>'role' = 'service_role');

-- Trigger for updated_at on companies
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on analytics_summary
CREATE TRIGGER update_analytics_summary_updated_at
  BEFORE UPDATE ON public.analytics_summary
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to aggregate tracking events into analytics_summary
CREATE OR REPLACE FUNCTION public.aggregate_tracking_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Aggregate yesterday's events
  INSERT INTO public.analytics_summary (
    company_id, content_id, content_type, platform, date,
    views, clicks, conversions, submissions
  )
  SELECT 
    company_id,
    content_id,
    content_type,
    COALESCE(platform, 'unknown') as platform,
    DATE(timestamp) as date,
    COUNT(*) FILTER (WHERE event_type = 'view') as views,
    COUNT(*) FILTER (WHERE event_type = 'click') as clicks,
    COUNT(*) FILTER (WHERE event_type = 'conversion') as conversions,
    COUNT(*) FILTER (WHERE event_type = 'submission') as submissions
  FROM public.tracking_events
  WHERE DATE(timestamp) = CURRENT_DATE - INTERVAL '1 day'
  GROUP BY company_id, content_id, content_type, platform, DATE(timestamp)
  ON CONFLICT (company_id, content_id, platform, date)
  DO UPDATE SET
    views = analytics_summary.views + EXCLUDED.views,
    clicks = analytics_summary.clicks + EXCLUDED.clicks,
    conversions = analytics_summary.conversions + EXCLUDED.conversions,
    submissions = analytics_summary.submissions + EXCLUDED.submissions,
    updated_at = now();
END;
$$;