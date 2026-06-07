-- agent_runs: full execution log for AI agent jobs ("show your work")
-- Linked from dashboard_insights and kpi_ai_insights via run_id FK

CREATE TABLE IF NOT EXISTS public.agent_runs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id        UUID        NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  function_name  TEXT        NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'running', -- running | completed | failed
  model          TEXT,
  prompt         TEXT,
  queries_run    JSONB,   -- [{table, filter, row_count, time_range_days}]
  data_snapshot  JSONB,   -- summary of data fetched (counts, ranges)
  output         JSONB,   -- AI response summary
  input_tokens   INTEGER,
  output_tokens  INTEGER,
  duration_ms    INTEGER,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at   TIMESTAMPTZ,
  error_message  TEXT
);

CREATE INDEX IF NOT EXISTS agent_runs_site_idx
  ON public.agent_runs (site_id, started_at DESC);

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners can read agent runs"
  ON public.agent_runs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.sites
    WHERE sites.id = agent_runs.site_id
      AND sites.user_id = auth.uid()
  ));

-- Link existing insight tables to runs (nullable — old rows have no run)
ALTER TABLE public.dashboard_insights
  ADD COLUMN IF NOT EXISTS run_id UUID REFERENCES public.agent_runs(id);

ALTER TABLE public.kpi_ai_insights
  ADD COLUMN IF NOT EXISTS run_id UUID REFERENCES public.agent_runs(id);
