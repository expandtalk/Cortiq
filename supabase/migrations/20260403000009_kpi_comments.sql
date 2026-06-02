-- KPI Dashboard: comments per section/month stored by site managers.
-- Enables leadership reports with contextual annotations.

CREATE TABLE IF NOT EXISTS kpi_comments (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id     uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    year        integer NOT NULL CHECK (year BETWEEN 2000 AND 2100),
    month       integer NOT NULL CHECK (month BETWEEN 1 AND 12),
    section     text    NOT NULL CHECK (section IN ('overgripande', 'kanaler', 'konverteringar')),
    comment     text    NOT NULL,
    author      text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kpi_comments_site_year_month_idx
    ON kpi_comments (site_id, year, month);

ALTER TABLE kpi_comments ENABLE ROW LEVEL SECURITY;

-- Users can read/write comments for sites that belong to their company
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'kpi_comments' AND policyname = 'kpi_comments_owner_access'
    ) THEN
        CREATE POLICY kpi_comments_owner_access ON kpi_comments
            USING  (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()))
            WITH CHECK (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));
    END IF;
END $$;
