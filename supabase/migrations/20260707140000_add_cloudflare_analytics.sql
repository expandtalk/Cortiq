-- Cloudflare edge web analytics (pull model), the third coverage-gap layer:
-- edge (all traffic) -> CortIQ cookieless (all human sessions) -> GA4 (consented only).
-- Zone ID is not sensitive; the API token is a project-level Supabase secret
-- (CLOUDFLARE_API_TOKEN) for now. Per-site encrypted tokens wait until the
-- company_secrets encryption gap is closed.

ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS cloudflare_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cloudflare_zone_id text;

CREATE TABLE IF NOT EXISTS public.cloudflare_analytics (
  id               uuid primary key default gen_random_uuid(),
  site_id          uuid not null references public.sites(id) on delete cascade,
  day              date not null,
  requests         bigint not null default 0,
  page_views       bigint not null default 0,
  unique_visitors  bigint not null default 0,
  cached_requests  bigint not null default 0,
  bytes            bigint not null default 0,
  top_countries    jsonb  not null default '{}'::jsonb,
  updated_at       timestamptz not null default now(),
  unique (site_id, day)
);
CREATE INDEX IF NOT EXISTS idx_cloudflare_analytics_site_day ON public.cloudflare_analytics (site_id, day desc);

ALTER TABLE public.cloudflare_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cloudflare_analytics_owner_read ON public.cloudflare_analytics;
CREATE POLICY cloudflare_analytics_owner_read ON public.cloudflare_analytics
  FOR SELECT USING (site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid()));
-- Writes happen only via the edge function under the service role (bypasses RLS).
