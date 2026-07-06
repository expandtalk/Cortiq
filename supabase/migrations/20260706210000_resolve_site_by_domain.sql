-- Resolve a site by the host of a page URL (reuses _norm_host from the pageview bridge).
-- Lets store-consent attribute a consent record to the right site by domain, matching
-- how page views are routed — robust regardless of how site_id/tracking_id are configured.
CREATE OR REPLACE FUNCTION public.resolve_site_by_domain(p_url text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM sites WHERE public._norm_host(domain) = public._norm_host(p_url) LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_site_by_domain(text) TO anon, authenticated, service_role;
