-- Agent Telemetry — OpenTelemetry GenAI Semantic Conventions
-- Schema follows https://opentelemetry.io/docs/specs/semconv/gen-ai/
-- gen_ai.* attribute names are preserved as column names for OTel interoperability.
--
-- Signal flow:
--   Claude Code / AgentFlow / custom agent
--     → OTLP/HTTP JSON (gen_ai.* attributes)
--     → agent-telemetry Edge Function
--     → agent_spans (detail) + agent_hourly_stats (aggregates)
--
-- Conversion attribution:
--   gen_ai.conversation_id = web session_id from CortIQ tracking script
--   → join against tracking_events WHERE event_type='conversion'
--   → agent-assisted conversion rate without GA4

-- ── Model pricing lookup ──────────────────────────────────────────────────────
-- Costs in USD per 1 000 000 tokens. Update when providers change prices.
CREATE TABLE IF NOT EXISTS public.agent_model_pricing (
  model_id              TEXT        PRIMARY KEY,
  provider              TEXT        NOT NULL,
  input_cost_per_1m     NUMERIC(10,4) NOT NULL DEFAULT 0,
  output_cost_per_1m    NUMERIC(10,4) NOT NULL DEFAULT 0,
  effective_from        TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes                 TEXT
);

COMMENT ON TABLE public.agent_model_pricing IS
  'Provider model pricing in USD per 1M tokens. '
  'Used to compute estimated_cost_usd in agent_spans and aggregate stats.';

-- No RLS — read-only lookup, no company data
ALTER TABLE public.agent_model_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_model_pricing_read" ON public.agent_model_pricing FOR SELECT USING (true);

-- ── Agent definitions ─────────────────────────────────────────────────────────
-- Registry of agents a company operates. Auto-created on first span ingestion
-- or manually configured.
CREATE TABLE IF NOT EXISTS public.agent_definitions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_name   TEXT        NOT NULL,  -- gen_ai.agent.name
  description  TEXT,
  default_model TEXT,
  tags         TEXT[]      NOT NULL DEFAULT '{}',
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, agent_name)
);

ALTER TABLE public.agent_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_definitions_company"
  ON public.agent_definitions FOR ALL
  USING (company_id IN (SELECT company_id FROM public.organization_members WHERE user_id = auth.uid()));

-- ── OTel spans (primary signal) ───────────────────────────────────────────────
-- One row per OTel span. Root spans (parent_span_id IS NULL) represent full tasks/conversations.
-- Child spans represent individual steps: LLM calls, tool calls, RAG retrievals.
CREATE TABLE IF NOT EXISTS public.agent_spans (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- W3C TraceContext
  trace_id        TEXT        NOT NULL,
  span_id         TEXT        NOT NULL,
  parent_span_id  TEXT,                -- NULL = root span (task boundary)

  -- OTel span fields
  span_name       TEXT        NOT NULL,  -- 'chat', 'tool_call', 'invoke_agent', 'rag_retrieval'
  span_kind       TEXT,                  -- CLIENT, SERVER, INTERNAL, PRODUCER, CONSUMER
  status_code     TEXT        NOT NULL DEFAULT 'UNSET'
    CONSTRAINT agent_spans_status_check CHECK (status_code IN ('OK', 'ERROR', 'UNSET')),
  status_message  TEXT,

  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ,
  duration_ms     INT GENERATED ALWAYS AS (
    CASE WHEN end_time IS NOT NULL
    THEN EXTRACT(EPOCH FROM (end_time - start_time))::INT * 1000
    ELSE NULL END
  ) STORED,

  -- gen_ai.* semantic conventions (OTel GenAI SemConv)
  gen_ai_provider_name      TEXT,   -- anthropic, openai, aws.bedrock, google, mistral
  gen_ai_request_model      TEXT,   -- claude-sonnet-4-6, gpt-4o, etc.
  gen_ai_operation_name     TEXT,   -- chat, embeddings, tool_call, invoke_agent, create_agent
  gen_ai_conversation_id    TEXT,   -- session/thread ID; maps to web session for conversion attribution
  gen_ai_agent_name         TEXT,   -- gen_ai.agent.name
  gen_ai_agent_id           TEXT,   -- gen_ai.agent.id
  gen_ai_agent_version      TEXT,   -- gen_ai.agent.version
  gen_ai_usage_input_tokens  INT,
  gen_ai_usage_output_tokens INT,
  gen_ai_usage_total_tokens  INT GENERATED ALWAYS AS (
    COALESCE(gen_ai_usage_input_tokens, 0) + COALESCE(gen_ai_usage_output_tokens, 0)
  ) STORED,

  -- Cost estimation (populated by ingest trigger from agent_model_pricing)
  estimated_cost_usd        NUMERIC(12,6),

  -- Tool call fields (when gen_ai_operation_name = 'tool_call')
  tool_name                 TEXT,   -- gen_ai.tool.name
  tool_call_id              TEXT,   -- gen_ai.tool.call.id
  mcp_server                TEXT,   -- which MCP server the tool belongs to

  -- RAG retrieval (when operation = 'rag_retrieval')
  data_source_id            TEXT,   -- gen_ai.data_source.id
  retrieval_score           NUMERIC(5,4), -- cosine similarity or relevance score (0–1)

  -- Quality / eval signals
  eval_score                NUMERIC(5,2),  -- gen_ai.evaluation.score
  had_retry                 BOOLEAN  NOT NULL DEFAULT false,
  escalated                 BOOLEAN  NOT NULL DEFAULT false,
  has_hallucination_flag    BOOLEAN  NOT NULL DEFAULT false,

  -- Web session bridge for conversion attribution (from gen_ai.conversation_id or custom attribute)
  web_session_id            TEXT,

  -- Raw OTel attributes (everything not mapped above)
  attributes                JSONB    NOT NULL DEFAULT '{}',
  resource_attributes       JSONB    NOT NULL DEFAULT '{}',

  UNIQUE (company_id, trace_id, span_id)
);

CREATE INDEX agent_spans_company_time_idx
  ON public.agent_spans(company_id, start_time DESC);

CREATE INDEX agent_spans_company_agent_idx
  ON public.agent_spans(company_id, gen_ai_agent_name, start_time DESC);

CREATE INDEX agent_spans_trace_idx
  ON public.agent_spans(company_id, trace_id);

CREATE INDEX agent_spans_conversation_idx
  ON public.agent_spans(company_id, gen_ai_conversation_id)
  WHERE gen_ai_conversation_id IS NOT NULL;

CREATE INDEX agent_spans_web_session_idx
  ON public.agent_spans(company_id, web_session_id)
  WHERE web_session_id IS NOT NULL;

CREATE INDEX agent_spans_operation_idx
  ON public.agent_spans(company_id, gen_ai_operation_name, start_time DESC)
  WHERE gen_ai_operation_name IS NOT NULL;

COMMENT ON TABLE public.agent_spans IS
  'OTel spans following GenAI Semantic Conventions. Root spans (parent_span_id IS NULL) '
  'represent full agent tasks. Child spans are LLM calls, tool calls, RAG retrievals. '
  'gen_ai_conversation_id maps to web session_id for conversion attribution.';

COMMENT ON COLUMN public.agent_spans.gen_ai_conversation_id IS
  'OTel gen_ai.conversation_id — thread/session identifier. '
  'Set this to the CortIQ web session_id to enable agent-assisted conversion attribution.';

COMMENT ON COLUMN public.agent_spans.web_session_id IS
  'Denormalized CortIQ web session ID. Populated from gen_ai.conversation_id during ingestion '
  'if it looks like a CortIQ session ID, or from a custom cortiq.web_session_id attribute.';

ALTER TABLE public.agent_spans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_spans_select"
  ON public.agent_spans FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE POLICY "agent_spans_service_insert"
  ON public.agent_spans FOR INSERT WITH CHECK (true);

-- ── Hourly pre-aggregates ─────────────────────────────────────────────────────
-- No PII — safe for fast dashboard queries.
-- Recomputed by upsert_agent_hourly_stats() after each span batch.
CREATE TABLE IF NOT EXISTS public.agent_hourly_stats (
  company_id        UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  hour              TIMESTAMPTZ NOT NULL,  -- truncated to hour
  agent_name        TEXT        NOT NULL,
  model             TEXT        NOT NULL DEFAULT '',
  -- Volume
  total_tasks       INT         NOT NULL DEFAULT 0,  -- root spans
  total_spans       INT         NOT NULL DEFAULT 0,  -- all spans
  -- Tokens
  input_tokens      BIGINT      NOT NULL DEFAULT 0,
  output_tokens     BIGINT      NOT NULL DEFAULT 0,
  -- Cost
  estimated_cost_usd NUMERIC(12,4) NOT NULL DEFAULT 0,
  -- Latency (ms) — root spans only
  p50_duration_ms   INT,
  p95_duration_ms   INT,
  p99_duration_ms   INT,
  -- Quality
  tool_calls_total  INT         NOT NULL DEFAULT 0,
  tool_calls_ok     INT         NOT NULL DEFAULT 0,
  escalations       INT         NOT NULL DEFAULT 0,
  hallucination_flags INT       NOT NULL DEFAULT 0,
  tasks_with_retry  INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (company_id, hour, agent_name, model)
);

CREATE INDEX agent_hourly_stats_company_hour_idx
  ON public.agent_hourly_stats(company_id, hour DESC);

ALTER TABLE public.agent_hourly_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_hourly_stats_select"
  ON public.agent_hourly_stats FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE POLICY "agent_hourly_stats_service_upsert"
  ON public.agent_hourly_stats FOR ALL USING (true);

-- ── Functions ─────────────────────────────────────────────────────────────────

-- Compute estimated cost for a span from the pricing table.
CREATE OR REPLACE FUNCTION public.compute_span_cost(
  p_model        TEXT,
  p_input_tokens INT,
  p_output_tokens INT
)
RETURNS NUMERIC
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ROUND(
    COALESCE(p_input_tokens,  0)::NUMERIC / 1000000.0 * mp.input_cost_per_1m +
    COALESCE(p_output_tokens, 0)::NUMERIC / 1000000.0 * mp.output_cost_per_1m,
    6
  )
  FROM public.agent_model_pricing mp
  WHERE mp.model_id = p_model
  LIMIT 1;
$$;

-- Rebuild hourly stats for a company+hour window from raw spans.
-- Called by Edge Function after each ingest batch.
CREATE OR REPLACE FUNCTION public.refresh_agent_hourly_stats(
  p_company_id UUID,
  p_hour       TIMESTAMPTZ  -- must be date_trunc('hour', ...)
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Delete existing rows for this hour so we can recompute cleanly
  DELETE FROM public.agent_hourly_stats
  WHERE company_id = p_company_id AND hour = p_hour;

  INSERT INTO public.agent_hourly_stats (
    company_id, hour, agent_name, model,
    total_tasks, total_spans,
    input_tokens, output_tokens, estimated_cost_usd,
    p50_duration_ms, p95_duration_ms, p99_duration_ms,
    tool_calls_total, tool_calls_ok,
    escalations, hallucination_flags, tasks_with_retry
  )
  SELECT
    p_company_id,
    p_hour,
    COALESCE(gen_ai_agent_name, 'unknown')    AS agent_name,
    COALESCE(gen_ai_request_model, '')         AS model,
    COUNT(*) FILTER (WHERE parent_span_id IS NULL)             AS total_tasks,
    COUNT(*)                                                    AS total_spans,
    COALESCE(SUM(gen_ai_usage_input_tokens),  0)::BIGINT       AS input_tokens,
    COALESCE(SUM(gen_ai_usage_output_tokens), 0)::BIGINT       AS output_tokens,
    COALESCE(SUM(estimated_cost_usd), 0)                       AS estimated_cost_usd,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY duration_ms)
      FILTER (WHERE parent_span_id IS NULL AND duration_ms IS NOT NULL)::INT AS p50_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)
      FILTER (WHERE parent_span_id IS NULL AND duration_ms IS NOT NULL)::INT AS p95_duration_ms,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms)
      FILTER (WHERE parent_span_id IS NULL AND duration_ms IS NOT NULL)::INT AS p99_duration_ms,
    COUNT(*) FILTER (WHERE gen_ai_operation_name = 'tool_call')::INT         AS tool_calls_total,
    COUNT(*) FILTER (WHERE gen_ai_operation_name = 'tool_call'
                           AND status_code = 'OK')::INT                      AS tool_calls_ok,
    COUNT(*) FILTER (WHERE escalated = true)::INT                            AS escalations,
    COUNT(*) FILTER (WHERE has_hallucination_flag = true)::INT               AS hallucination_flags,
    COUNT(*) FILTER (WHERE had_retry = true
                           AND parent_span_id IS NULL)::INT                  AS tasks_with_retry
  FROM public.agent_spans
  WHERE company_id  = p_company_id
    AND date_trunc('hour', start_time) = p_hour
  GROUP BY gen_ai_agent_name, gen_ai_request_model;
END;
$$;

-- Per-agent KPI overview for a date range.
CREATE OR REPLACE FUNCTION public.get_agent_overview(
  p_company_id UUID,
  p_from       TIMESTAMPTZ DEFAULT now() - interval '30 days',
  p_to         TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE(
  agent_name          TEXT,
  total_tasks         BIGINT,
  task_completion_rate NUMERIC,  -- % root spans with status OK
  first_pass_rate     NUMERIC,   -- % tasks without retry
  tool_success_rate   NUMERIC,   -- % tool calls with status OK
  p50_latency_ms      NUMERIC,
  p95_latency_ms      NUMERIC,
  escalation_rate     NUMERIC,
  total_input_tokens  BIGINT,
  total_output_tokens BIGINT,
  estimated_cost_usd  NUMERIC,
  hallucination_flags BIGINT,
  last_active         TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COALESCE(gen_ai_agent_name, 'unknown')                              AS agent_name,
    COUNT(*) FILTER (WHERE parent_span_id IS NULL)                      AS total_tasks,
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE parent_span_id IS NULL AND status_code = 'OK') /
      NULLIF(COUNT(*) FILTER (WHERE parent_span_id IS NULL), 0), 1)     AS task_completion_rate,
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE parent_span_id IS NULL AND NOT had_retry) /
      NULLIF(COUNT(*) FILTER (WHERE parent_span_id IS NULL), 0), 1)     AS first_pass_rate,
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE gen_ai_operation_name = 'tool_call' AND status_code = 'OK') /
      NULLIF(COUNT(*) FILTER (WHERE gen_ai_operation_name = 'tool_call'), 0), 1) AS tool_success_rate,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY duration_ms)
      FILTER (WHERE parent_span_id IS NULL AND duration_ms IS NOT NULL) AS p50_latency_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)
      FILTER (WHERE parent_span_id IS NULL AND duration_ms IS NOT NULL) AS p95_latency_ms,
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE escalated AND parent_span_id IS NULL) /
      NULLIF(COUNT(*) FILTER (WHERE parent_span_id IS NULL), 0), 1)     AS escalation_rate,
    COALESCE(SUM(gen_ai_usage_input_tokens),  0)::BIGINT                AS total_input_tokens,
    COALESCE(SUM(gen_ai_usage_output_tokens), 0)::BIGINT                AS total_output_tokens,
    COALESCE(SUM(estimated_cost_usd), 0)                                AS estimated_cost_usd,
    COUNT(*) FILTER (WHERE has_hallucination_flag)::BIGINT              AS hallucination_flags,
    MAX(start_time)                                                     AS last_active
  FROM public.agent_spans
  WHERE company_id   = p_company_id
    AND start_time  BETWEEN p_from AND p_to
  GROUP BY gen_ai_agent_name
  ORDER BY total_tasks DESC;
$$;

-- Span tree for a single trace (for trace viewer).
CREATE OR REPLACE FUNCTION public.get_agent_trace(
  p_company_id UUID,
  p_trace_id   TEXT
)
RETURNS TABLE(
  span_id         TEXT,
  parent_span_id  TEXT,
  span_name       TEXT,
  gen_ai_operation_name TEXT,
  gen_ai_agent_name TEXT,
  gen_ai_request_model TEXT,
  tool_name       TEXT,
  mcp_server      TEXT,
  status_code     TEXT,
  start_time      TIMESTAMPTZ,
  duration_ms     INT,
  gen_ai_usage_input_tokens  INT,
  gen_ai_usage_output_tokens INT,
  estimated_cost_usd NUMERIC,
  had_retry       BOOLEAN,
  escalated       BOOLEAN,
  eval_score      NUMERIC,
  attributes      JSONB
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    span_id, parent_span_id, span_name, gen_ai_operation_name,
    gen_ai_agent_name, gen_ai_request_model,
    tool_name, mcp_server, status_code,
    start_time, duration_ms,
    gen_ai_usage_input_tokens, gen_ai_usage_output_tokens,
    estimated_cost_usd, had_retry, escalated, eval_score, attributes
  FROM public.agent_spans
  WHERE company_id = p_company_id
    AND trace_id   = p_trace_id
  ORDER BY start_time;
$$;

-- Agent-assisted conversion attribution (join against CortIQ tracking events).
CREATE OR REPLACE FUNCTION public.get_agent_conversions(
  p_company_id UUID,
  p_from       TIMESTAMPTZ DEFAULT now() - interval '30 days',
  p_to         TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE(
  agent_name            TEXT,
  sessions_with_agent   BIGINT,
  conversions           BIGINT,
  conversion_rate       NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH agent_sessions AS (
    SELECT DISTINCT
      COALESCE(gen_ai_agent_name, 'unknown') AS agent_name,
      web_session_id
    FROM public.agent_spans
    WHERE company_id   = p_company_id
      AND web_session_id IS NOT NULL
      AND start_time BETWEEN p_from AND p_to
  ),
  converted AS (
    SELECT DISTINCT session_id
    FROM public.tracking_events
    WHERE company_id  = p_company_id
      AND event_type  = 'conversion'
      AND created_at  BETWEEN p_from AND p_to
  )
  SELECT
    a.agent_name,
    COUNT(DISTINCT a.web_session_id)::BIGINT                        AS sessions_with_agent,
    COUNT(DISTINCT a.web_session_id) FILTER (
      WHERE a.web_session_id IN (SELECT session_id FROM converted)
    )::BIGINT                                                       AS conversions,
    ROUND(
      100.0 * COUNT(DISTINCT a.web_session_id) FILTER (
        WHERE a.web_session_id IN (SELECT session_id FROM converted)
      ) / NULLIF(COUNT(DISTINCT a.web_session_id), 0), 1)          AS conversion_rate
  FROM agent_sessions a
  GROUP BY a.agent_name
  ORDER BY conversions DESC;
$$;

COMMENT ON FUNCTION public.get_agent_conversions IS
  'Computes agent-assisted conversion rate by joining web_session_id on agent_spans '
  'with conversion events in tracking_events. Set gen_ai.conversation_id = web session ID '
  'in your agent instrumentation to enable this. No GA4 required.';

-- Data retention: 365 days for spans, 730 days for hourly stats
CREATE OR REPLACE FUNCTION public.run_agent_telemetry_retention()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  d_spans BIGINT;
  d_stats BIGINT;
BEGIN
  DELETE FROM public.agent_spans WHERE received_at < now() - interval '365 days';
  GET DIAGNOSTICS d_spans = ROW_COUNT;

  DELETE FROM public.agent_hourly_stats WHERE hour < now() - interval '730 days';
  GET DIAGNOSTICS d_stats = ROW_COUNT;

  RETURN jsonb_build_object('spans_deleted', d_spans, 'stats_deleted', d_stats);
END;
$$;

SELECT cron.unschedule('daily-agent-telemetry-retention')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-agent-telemetry-retention');

SELECT cron.schedule('daily-agent-telemetry-retention', '45 3 * * *',
  'SELECT run_agent_telemetry_retention()');

-- ── Seed: model pricing ───────────────────────────────────────────────────────
INSERT INTO public.agent_model_pricing (model_id, provider, input_cost_per_1m, output_cost_per_1m, notes)
VALUES
  -- Anthropic (2026 pricing)
  ('claude-opus-4-6',                 'anthropic',  15.00,  75.00, 'Claude Opus 4.6'),
  ('claude-sonnet-4-6',               'anthropic',   3.00,  15.00, 'Claude Sonnet 4.6'),
  ('claude-haiku-4-5-20251001',       'anthropic',   0.80,   4.00, 'Claude Haiku 4.5'),
  ('claude-opus-4-5',                 'anthropic',  15.00,  75.00, 'Claude Opus 4.5'),
  ('claude-sonnet-4-5',               'anthropic',   3.00,  15.00, 'Claude Sonnet 4.5'),
  -- OpenAI
  ('gpt-4o',                          'openai',      2.50,  10.00, 'GPT-4o'),
  ('gpt-4o-mini',                     'openai',      0.15,   0.60, 'GPT-4o mini'),
  ('gpt-4-turbo',                     'openai',     10.00,  30.00, 'GPT-4 Turbo'),
  ('o1',                              'openai',     15.00,  60.00, 'OpenAI o1'),
  ('o3-mini',                         'openai',      1.10,   4.40, 'OpenAI o3-mini'),
  -- Google
  ('gemini-2.0-flash',                'google',      0.075,  0.30, 'Gemini 2.0 Flash'),
  ('gemini-1.5-pro',                  'google',      1.25,   5.00, 'Gemini 1.5 Pro'),
  -- Mistral
  ('mistral-large-latest',            'mistral',     2.00,   6.00, 'Mistral Large'),
  ('mistral-small-latest',            'mistral',     0.10,   0.30, 'Mistral Small')
ON CONFLICT (model_id) DO UPDATE SET
  input_cost_per_1m  = EXCLUDED.input_cost_per_1m,
  output_cost_per_1m = EXCLUDED.output_cost_per_1m;
