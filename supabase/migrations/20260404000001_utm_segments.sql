-- UTM Segment System: reusable named filters per site.
-- Each segment holds a JSONB array of filter conditions applied
-- as WHERE clauses on tracking_sessions UTM columns.

CREATE TABLE IF NOT EXISTS utm_segments (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id     uuid        NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name        text        NOT NULL,
    template_id text,
    filters     jsonb       NOT NULL DEFAULT '[]'::jsonb,
    color       text        NOT NULL DEFAULT '#0D9488',
    is_pinned   boolean     NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS utm_segments_site_id_idx ON utm_segments (site_id);

ALTER TABLE utm_segments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'utm_segments' AND policyname = 'utm_segments_owner_access'
    ) THEN
        CREATE POLICY utm_segments_owner_access ON utm_segments
            USING  (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()))
            WITH CHECK (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));
    END IF;
END $$;

-- Auto-update updated_at on change
CREATE OR REPLACE FUNCTION update_utm_segments_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_utm_segments_updated_at ON utm_segments;
CREATE TRIGGER trg_utm_segments_updated_at
    BEFORE UPDATE ON utm_segments
    FOR EACH ROW EXECUTE FUNCTION update_utm_segments_updated_at();
