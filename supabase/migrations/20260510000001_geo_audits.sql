-- GEO Audits: stores AI-visibility audit results per site and URL.
-- Tracks citability scores across Content, Technical, Schema, and Crawler dimensions.

CREATE TABLE public.geo_audits (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id             uuid        NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  url                 text        NOT NULL,

  -- Composite score and dimension scores (0-100)
  overall_score       integer     NOT NULL DEFAULT 0 CHECK (overall_score BETWEEN 0 AND 100),
  content_score       integer     NOT NULL DEFAULT 0 CHECK (content_score BETWEEN 0 AND 100),
  technical_score     integer     NOT NULL DEFAULT 0 CHECK (technical_score BETWEEN 0 AND 100),
  schema_score        integer     NOT NULL DEFAULT 0 CHECK (schema_score BETWEEN 0 AND 100),
  crawler_score       integer     NOT NULL DEFAULT 0 CHECK (crawler_score BETWEEN 0 AND 100),

  -- Raw findings from HTML / robots.txt / llms.txt analysis
  findings            jsonb       NOT NULL DEFAULT '{}',

  -- Prioritised recommendation list: [{priority, category, issue, fix}]
  recommendations     jsonb       NOT NULL DEFAULT '[]',

  -- Detected schema.org types e.g. ["Article","Organization"]
  schema_types        jsonb       NOT NULL DEFAULT '[]',

  -- AI crawler access map: {GPTBot: "allowed"|"blocked"|"unknown", ...}
  crawler_access      jsonb       NOT NULL DEFAULT '{}',

  has_llms_txt        boolean     NOT NULL DEFAULT false,

  -- Claude's citability narrative (free text)
  citability_analysis text,

  audit_duration_ms   integer,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_geo_audits_site_id    ON public.geo_audits(site_id);
CREATE INDEX idx_geo_audits_created_at ON public.geo_audits(created_at DESC);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.geo_audits ENABLE ROW LEVEL SECURITY;

-- Authenticated users see audits for their own sites only
CREATE POLICY "geo_audits_select_own"
  ON public.geo_audits FOR SELECT
  TO authenticated
  USING (site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid()));

-- Edge Function inserts via service_role (bypasses RLS) — no insert policy needed for authenticated users.

-- ── Latest-audit view ─────────────────────────────────────────────────────────
-- Returns the single most-recent audit per site. Used by the AI Visibility tab.
CREATE OR REPLACE VIEW public.geo_latest_audits AS
SELECT DISTINCT ON (site_id) *
FROM public.geo_audits
ORDER BY site_id, created_at DESC;

COMMENT ON TABLE  public.geo_audits IS 'AI-visibility (GEO) audit results: citability scores and recommendations per site URL.';
COMMENT ON COLUMN public.geo_audits.overall_score IS 'Weighted average of content, technical, schema, and crawler scores.';
COMMENT ON COLUMN public.geo_audits.findings IS 'Raw structured findings: meta tags, headings, word count, llms.txt status, etc.';
COMMENT ON COLUMN public.geo_audits.crawler_access IS 'Per-crawler robots.txt verdict: allowed | blocked | unknown.';
COMMENT ON COLUMN public.geo_audits.citability_analysis IS 'Claude''s free-text assessment of how citable this page is for LLMs.';
