-- GSC Generative AI Performance data
-- Stores impressions from AI Overviews, AI Mode and Discover AI
-- Mirrors the new Search Console "Generative AI performance" reports (launched 2026-06-03)
-- API searchType values expected: AI_OVERVIEWS, AI_MODE, DISCOVER_AI (to be confirmed by Google)

CREATE TABLE IF NOT EXISTS public.gsc_ai_data (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id      UUID        NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  period_start DATE        NOT NULL,
  period_end   DATE        NOT NULL,
  search_type  TEXT        NOT NULL, -- 'AI_OVERVIEWS' | 'AI_MODE' | 'DISCOVER_AI'
  dimension    TEXT        NOT NULL, -- 'page' | 'country' | 'device' | 'date'
  value        TEXT        NOT NULL, -- dimension value (URL, country code, device type, date)
  impressions  INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(site_id, period_start, period_end, search_type, dimension, value)
);

CREATE INDEX IF NOT EXISTS gsc_ai_data_site_type_idx ON public.gsc_ai_data (site_id, search_type, period_end DESC);
CREATE INDEX IF NOT EXISTS gsc_ai_data_site_dim_idx  ON public.gsc_ai_data (site_id, dimension, period_end DESC);

ALTER TABLE public.gsc_ai_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners can read AI data"
  ON public.gsc_ai_data FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.sites
    WHERE sites.id = gsc_ai_data.site_id
      AND sites.user_id = auth.uid()
  ));
