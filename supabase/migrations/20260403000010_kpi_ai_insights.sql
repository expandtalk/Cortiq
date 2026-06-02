-- KPI Dashboard: cached AI insights per site/year.
-- Generated on demand via the generate-kpi-insights edge function.
-- Stored so the same insights can be re-displayed without re-calling Claude.

CREATE TABLE IF NOT EXISTS kpi_ai_insights (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id       uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    year          integer NOT NULL CHECK (year BETWEEN 2000 AND 2100),
    insights_json jsonb NOT NULL DEFAULT '[]'::jsonb,
    generated_at  timestamptz NOT NULL DEFAULT now()
);

-- Only one insights row per site per year (upsert target)
CREATE UNIQUE INDEX IF NOT EXISTS kpi_ai_insights_site_year_uq
    ON kpi_ai_insights (site_id, year);

ALTER TABLE kpi_ai_insights ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'kpi_ai_insights' AND policyname = 'kpi_ai_insights_owner_access'
    ) THEN
        CREATE POLICY kpi_ai_insights_owner_access ON kpi_ai_insights
            USING (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));
    END IF;
END $$;
