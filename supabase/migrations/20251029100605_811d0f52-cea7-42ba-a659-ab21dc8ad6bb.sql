-- Create table for AI search traffic (users coming from AI tools)
CREATE TABLE IF NOT EXISTS public.ai_search_traffic (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  
  -- Traffic identification
  session_id text NOT NULL,
  user_hash text, -- Cookiefree fingerprint
  
  -- AI source detection
  ai_platform text NOT NULL, -- 'chatgpt', 'perplexity', 'claude', 'gemini', 'copilot', 'other'
  referrer text,
  user_agent text,
  
  -- Page info
  url text NOT NULL,
  page_title text,
  
  -- Session metrics
  session_duration integer, -- in seconds
  pages_viewed integer DEFAULT 1,
  conversions integer DEFAULT 0,
  revenue numeric DEFAULT 0,
  
  -- Device info
  device_type text, -- 'desktop', 'mobile', 'tablet'
  browser text,
  operating_system text,
  
  -- Location (anonymized)
  country text,
  city text,
  
  -- Timestamps
  landed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Engagement metrics
  bounce boolean DEFAULT false,
  engaged boolean DEFAULT false -- stayed >10s or viewed >1 page
);

-- Enable RLS
ALTER TABLE public.ai_search_traffic ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert AI search traffic"
  ON public.ai_search_traffic
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Site owners can view AI search traffic"
  ON public.ai_search_traffic
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = ai_search_traffic.site_id
      AND sites.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_ai_search_traffic_site_id ON public.ai_search_traffic(site_id);
CREATE INDEX idx_ai_search_traffic_landed_at ON public.ai_search_traffic(landed_at);
CREATE INDEX idx_ai_search_traffic_ai_platform ON public.ai_search_traffic(ai_platform);
CREATE INDEX idx_ai_search_traffic_session_id ON public.ai_search_traffic(session_id);

-- Function to aggregate daily AI search traffic
CREATE OR REPLACE FUNCTION public.get_ai_search_summary(
  p_site_id uuid,
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone
)
RETURNS TABLE (
  ai_platform text,
  total_sessions bigint,
  total_pageviews bigint,
  total_conversions bigint,
  avg_session_duration numeric,
  bounce_rate numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ai_platform,
    COUNT(DISTINCT session_id) as total_sessions,
    SUM(pages_viewed) as total_pageviews,
    SUM(conversions) as total_conversions,
    ROUND(AVG(session_duration), 2) as avg_session_duration,
    ROUND(
      (COUNT(*) FILTER (WHERE bounce = true)::numeric / NULLIF(COUNT(*), 0)) * 100, 
      2
    ) as bounce_rate
  FROM public.ai_search_traffic
  WHERE site_id = p_site_id
    AND landed_at >= p_start_date
    AND landed_at <= p_end_date
  GROUP BY ai_platform
  ORDER BY total_sessions DESC;
$$;