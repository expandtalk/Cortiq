-- Create table for server log imports (metadata about uploaded log files)
CREATE TABLE IF NOT EXISTS public.server_log_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  log_format TEXT NOT NULL CHECK (log_format IN ('combined', 'json', 'csv')),
  total_lines INTEGER DEFAULT 0,
  processed_lines INTEGER DEFAULT 0,
  failed_lines INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create table for aggregated server log analytics (cookiefree data)
CREATE TABLE IF NOT EXISTS public.server_log_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  url TEXT NOT NULL,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0, -- Estimated from IP anonymization
  device_type TEXT, -- mobile, desktop, tablet
  browser TEXT,
  country_code TEXT, -- SE, NO, DK, etc.
  referrer_domain TEXT,
  avg_load_time_ms INTEGER,
  status_2xx INTEGER DEFAULT 0,
  status_3xx INTEGER DEFAULT 0,
  status_4xx INTEGER DEFAULT 0,
  status_5xx INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(site_id, date, url, device_type, browser, country_code, referrer_domain)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_server_log_analytics_site_date ON public.server_log_analytics(site_id, date);
CREATE INDEX IF NOT EXISTS idx_server_log_analytics_url ON public.server_log_analytics(site_id, url);
CREATE INDEX IF NOT EXISTS idx_server_log_imports_site ON public.server_log_imports(site_id);

-- Enable RLS
ALTER TABLE public.server_log_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_log_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for server_log_imports
CREATE POLICY "Users can view their site's log imports"
  ON public.server_log_imports
  FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM public.sites WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create log imports for their sites"
  ON public.server_log_imports
  FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT id FROM public.sites WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for server_log_analytics
CREATE POLICY "Users can view their site's analytics"
  ON public.server_log_analytics
  FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM public.sites WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_server_log_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_server_log_analytics_updated_at
  BEFORE UPDATE ON public.server_log_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_server_log_analytics_updated_at();

-- Function to increment analytics data (upsert)
CREATE OR REPLACE FUNCTION increment_server_log_analytics(
  p_site_id UUID,
  p_date DATE,
  p_url TEXT,
  p_device_type TEXT,
  p_browser TEXT,
  p_country_code TEXT,
  p_referrer_domain TEXT,
  p_load_time_ms INTEGER,
  p_status_code INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.server_log_analytics (
    site_id, date, url, device_type, browser, country_code, 
    referrer_domain, page_views, unique_visitors, avg_load_time_ms,
    status_2xx, status_3xx, status_4xx, status_5xx
  ) VALUES (
    p_site_id, p_date, p_url, p_device_type, p_browser, p_country_code,
    p_referrer_domain, 1, 1, p_load_time_ms,
    CASE WHEN p_status_code BETWEEN 200 AND 299 THEN 1 ELSE 0 END,
    CASE WHEN p_status_code BETWEEN 300 AND 399 THEN 1 ELSE 0 END,
    CASE WHEN p_status_code BETWEEN 400 AND 499 THEN 1 ELSE 0 END,
    CASE WHEN p_status_code >= 500 THEN 1 ELSE 0 END
  )
  ON CONFLICT (site_id, date, url, device_type, browser, country_code, referrer_domain)
  DO UPDATE SET
    page_views = server_log_analytics.page_views + 1,
    unique_visitors = server_log_analytics.unique_visitors + 1,
    avg_load_time_ms = (server_log_analytics.avg_load_time_ms * server_log_analytics.page_views + p_load_time_ms) / (server_log_analytics.page_views + 1),
    status_2xx = server_log_analytics.status_2xx + CASE WHEN p_status_code BETWEEN 200 AND 299 THEN 1 ELSE 0 END,
    status_3xx = server_log_analytics.status_3xx + CASE WHEN p_status_code BETWEEN 300 AND 399 THEN 1 ELSE 0 END,
    status_4xx = server_log_analytics.status_4xx + CASE WHEN p_status_code BETWEEN 400 AND 499 THEN 1 ELSE 0 END,
    status_5xx = server_log_analytics.status_5xx + CASE WHEN p_status_code >= 500 THEN 1 ELSE 0 END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;