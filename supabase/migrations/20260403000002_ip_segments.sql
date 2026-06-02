-- IP Segments — named network ranges for per-segment analytics
-- Allows companies to label known IP ranges (own offices, competitors, partners)
-- and see their traffic statistics separately.
--
-- Legal design decisions:
--   • ip_ranges stored as TEXT[] — cast to CIDR at query time
--   • Raw IP addresses are NEVER stored in individual event rows in eu_strict mode;
--     only the segment LABEL (name) is written into tracking_events.metadata
--   • The intranet_mode flag switches the tracking pipeline to aggregate-only
--     (no session IDs, no individual click coordinates)

CREATE TABLE public.ip_segments (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID      NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name          TEXT      NOT NULL,
  description   TEXT,
  category      TEXT      NOT NULL DEFAULT 'custom'
    CONSTRAINT ip_segments_category_check
    CHECK (category IN ('own_company', 'competitor', 'partner', 'exclude', 'custom')),
  -- CIDR ranges stored as text; validated client-side and cast on query
  -- Examples: '192.168.1.0/24', '10.0.0.0/8', '2001:db8::/32'
  ip_ranges     TEXT[]    NOT NULL,
  color         TEXT      NOT NULL DEFAULT '#6366f1',
  -- Intranet mode: aggregate page views only — no session IDs or click coords
  intranet_mode BOOLEAN   NOT NULL DEFAULT false,
  is_active     BOOLEAN   NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ip_segments_company_id_idx ON public.ip_segments(company_id) WHERE is_active = true;

COMMENT ON TABLE public.ip_segments IS
  'Named IP/CIDR ranges for per-segment traffic analytics. '
  'Raw IPs are never stored in eu_strict mode — only the segment label is written to event metadata.';

COMMENT ON COLUMN public.ip_segments.intranet_mode IS
  'When true: event pipeline stores only aggregate page view counts (no session ID, no coordinates). '
  'Required for internal network analytics under EU employee-monitoring rules.';

COMMENT ON COLUMN public.ip_segments.category IS
  'own_company: employer monitoring — GDPR Art. 13/14 notification required. '
  'competitor: competitive intelligence on own website — generally permitted. '
  'exclude: drop or tag-out bot/noise traffic. '
  'partner: known third-party ranges for context.';

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.touch_ip_segment_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER ip_segments_updated_at
  BEFORE UPDATE ON public.ip_segments
  FOR EACH ROW EXECUTE FUNCTION public.touch_ip_segment_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.ip_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ip_segments_select"
  ON public.ip_segments FOR SELECT
  USING (
    company_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "ip_segments_insert"
  ON public.ip_segments FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "ip_segments_update"
  ON public.ip_segments FOR UPDATE
  USING (
    company_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "ip_segments_delete"
  ON public.ip_segments FOR DELETE
  USING (
    company_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ── Match function (used by Edge Functions) ──────────────────────────────────
-- Returns the first active segment whose ranges contain the given IP.
-- Safe-to-call: returns empty on invalid IPs, catches all CIDR parse errors.
CREATE OR REPLACE FUNCTION public.match_ip_segment(
  p_company_id UUID,
  p_ip         TEXT
)
RETURNS TABLE(
  segment_id       UUID,
  segment_name     TEXT,
  segment_category TEXT,
  segment_color    TEXT,
  intranet_mode    BOOLEAN
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ip inet;
BEGIN
  -- Silently reject invalid or empty IPs
  IF p_ip IS NULL OR trim(p_ip) = '' THEN RETURN; END IF;

  BEGIN
    -- Strip X-Forwarded-For prefix if present
    v_ip := split_part(trim(p_ip), ',', 1)::inet;
  EXCEPTION WHEN OTHERS THEN
    RETURN;
  END;

  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.category,
    s.color,
    s.intranet_mode
  FROM public.ip_segments s
  WHERE s.company_id = p_company_id
    AND s.is_active = true
    AND EXISTS (
      SELECT 1
      FROM unnest(s.ip_ranges) AS raw_range
      WHERE v_ip <<= raw_range::cidr
    )
  ORDER BY s.created_at
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.match_ip_segment IS
  'Returns the first active ip_segment whose CIDR ranges contain the given IP. '
  'Called by Edge Functions before writing event metadata. Returns empty if no match or invalid IP.';

-- ── Aggregated stats function (used by dashboard) ────────────────────────────
-- Returns event/session counts per segment for a company over a date range.
-- Reads from metadata->>'ip_segment_name' — no raw IPs needed.
CREATE OR REPLACE FUNCTION public.get_ip_segment_stats(
  p_company_id UUID,
  p_from       TIMESTAMPTZ DEFAULT now() - interval '30 days',
  p_to         TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE(
  segment_name     TEXT,
  segment_category TEXT,
  segment_color    TEXT,
  total_events     BIGINT,
  unique_sessions  BIGINT,
  page_views       BIGINT,
  conversions      BIGINT,
  top_pages        JSONB
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT
      te.metadata->>'ip_segment_name'     AS seg_name,
      te.metadata->>'ip_segment_category' AS seg_category,
      te.metadata->>'ip_segment_color'    AS seg_color,
      te.session_id,
      te.event_type,
      te.metadata->>'url'                 AS page_url
    FROM public.tracking_events te
    WHERE te.company_id = p_company_id
      AND te.created_at BETWEEN p_from AND p_to
      AND te.metadata->>'ip_segment_name' IS NOT NULL
  ),
  top AS (
    SELECT
      seg_name,
      jsonb_agg(
        jsonb_build_object('url', page_url, 'views', cnt)
        ORDER BY cnt DESC
      ) AS top_pages
    FROM (
      SELECT seg_name, page_url, COUNT(*) AS cnt
      FROM base
      WHERE event_type = 'view' AND page_url IS NOT NULL
      GROUP BY seg_name, page_url
      ORDER BY cnt DESC
    ) ranked
    GROUP BY seg_name
  )
  SELECT
    b.seg_name,
    MAX(b.seg_category),
    MAX(b.seg_color),
    COUNT(*)::BIGINT                                            AS total_events,
    COUNT(DISTINCT b.session_id)::BIGINT                       AS unique_sessions,
    COUNT(*) FILTER (WHERE b.event_type = 'view')::BIGINT      AS page_views,
    COUNT(*) FILTER (WHERE b.event_type = 'conversion')::BIGINT AS conversions,
    COALESCE(t.top_pages, '[]'::jsonb)
  FROM base b
  LEFT JOIN top t ON t.seg_name = b.seg_name
  GROUP BY b.seg_name, t.top_pages;
END;
$$;

COMMENT ON FUNCTION public.get_ip_segment_stats IS
  'Aggregate analytics per named IP segment. Reads segment labels from event metadata — '
  'no raw IP addresses are accessed. Safe to expose to dashboard users.';
