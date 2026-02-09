-- Fix security warnings: Set search_path for functions (with CASCADE)

-- Drop trigger first
DROP TRIGGER IF EXISTS update_server_log_analytics_updated_at ON public.server_log_analytics;

-- Update update_server_log_analytics_updated_at function
DROP FUNCTION IF EXISTS update_server_log_analytics_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION update_server_log_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Recreate trigger
CREATE TRIGGER update_server_log_analytics_updated_at
  BEFORE UPDATE ON public.server_log_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_server_log_analytics_updated_at();

-- Update increment_server_log_analytics function
DROP FUNCTION IF EXISTS increment_server_log_analytics(UUID, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER) CASCADE;
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';