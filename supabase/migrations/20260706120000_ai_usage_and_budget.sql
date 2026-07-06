-- AI provider future-proofing + per-company usage tracking and monthly cost cap
-- (audit follow-up: geo-analyze BYOK-only + P2-8 cost controls).
--
-- Context:
--  * ai-assistant + geo-analyze both call Anthropic directly with a per-company
--    BYOK key from company_secrets. geo-analyze no longer falls back to the platform
--    ANTHROPIC_API_KEY — every company brings its own key.
--  * These columns let a company later pick a different model, or (reserved) route
--    through a non-Anthropic provider such as OpenRouter without a schema change.
--  * ai_usage + the two RPCs give a single source of truth for spend and a monthly
--    cap enforced before each paid call. Pricing lives in SQL so it is not duplicated
--    across the two edge functions.

-- 1. Provider/model selection on the per-company secret row.
ALTER TABLE public.company_secrets
  ADD COLUMN IF NOT EXISTS ai_provider text NOT NULL DEFAULT 'anthropic',
  ADD COLUMN IF NOT EXISTS ai_model    text;
-- ai_provider: 'anthropic' today. 'openrouter' etc. reserved for a future path.
-- ai_model: optional override of the default model id (else the function's default).

-- 2. Optional monthly USD cap per company. NULL = uncapped.
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS ai_monthly_cost_cap numeric;

-- 3. Per-call usage ledger.
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  site_id        uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  function_name  text NOT NULL,
  model          text,
  input_tokens   integer NOT NULL DEFAULT 0,
  output_tokens  integer NOT NULL DEFAULT 0,
  est_cost_usd   numeric NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_company_created
  ON public.ai_usage (company_id, created_at DESC);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Service role (edge functions) writes usage rows.
DROP POLICY IF EXISTS "Service role manages ai_usage" ON public.ai_usage;
CREATE POLICY "Service role manages ai_usage"
ON public.ai_usage FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Owners may read their own company's usage (for a future spend widget).
DROP POLICY IF EXISTS "Owners read own company ai_usage" ON public.ai_usage;
CREATE POLICY "Owners read own company ai_usage"
ON public.ai_usage FOR SELECT
USING (company_id IN (
  SELECT company_id FROM public.sites WHERE user_id = (select auth.uid())
));

-- 4. Model price table (USD per 1,000,000 tokens). ESTIMATES — verify against
-- current Anthropic pricing and update as needed.
CREATE OR REPLACE FUNCTION public._ai_price_per_mtok(p_model text)
RETURNS TABLE (input_price numeric, output_price numeric)
LANGUAGE sql IMMUTABLE
AS $$
  SELECT
    CASE
      WHEN p_model ILIKE 'claude-opus%'   THEN 15.0
      WHEN p_model ILIKE 'claude-sonnet%' THEN 3.0
      WHEN p_model ILIKE 'claude-haiku%'  THEN 1.0
      ELSE 3.0                                    -- sensible default
    END,
    CASE
      WHEN p_model ILIKE 'claude-opus%'   THEN 75.0
      WHEN p_model ILIKE 'claude-sonnet%' THEN 15.0
      WHEN p_model ILIKE 'claude-haiku%'  THEN 5.0
      ELSE 15.0
    END;
$$;

-- 5. Budget gate: true if the company is under its monthly cap (or uncapped).
CREATE OR REPLACE FUNCTION public.check_ai_budget(p_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cap    numeric;
  spent  numeric;
BEGIN
  SELECT ai_monthly_cost_cap INTO cap FROM companies WHERE id = p_company_id;
  IF cap IS NULL THEN
    RETURN true;  -- no cap configured
  END IF;
  SELECT coalesce(sum(est_cost_usd), 0) INTO spent
  FROM ai_usage
  WHERE company_id = p_company_id
    AND created_at >= date_trunc('month', now());
  RETURN spent < cap;
END;
$$;

-- 6. Record a call. If p_est_cost_usd is supplied (e.g. OpenRouter returns real
-- cost) it is used verbatim; otherwise cost is derived from the model price table.
CREATE OR REPLACE FUNCTION public.record_ai_usage(
  p_company_id    uuid,
  p_site_id       uuid,
  p_function      text,
  p_model         text,
  p_input_tokens  integer,
  p_output_tokens integer,
  p_est_cost_usd  numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  in_price   numeric;
  out_price  numeric;
  cost       numeric;
BEGIN
  IF p_est_cost_usd IS NOT NULL THEN
    cost := p_est_cost_usd;
  ELSE
    SELECT input_price, output_price INTO in_price, out_price
    FROM _ai_price_per_mtok(p_model);
    cost := (coalesce(p_input_tokens, 0)  / 1000000.0) * in_price
          + (coalesce(p_output_tokens, 0) / 1000000.0) * out_price;
  END IF;

  INSERT INTO ai_usage (company_id, site_id, function_name, model, input_tokens, output_tokens, est_cost_usd)
  VALUES (p_company_id, p_site_id, p_function, p_model,
          coalesce(p_input_tokens, 0), coalesce(p_output_tokens, 0), cost);
END;
$$;

-- These are called only by the edge functions (service role). Do not let anon/
-- authenticated invoke them directly — record_ai_usage could otherwise be abused to
-- inflate another company's spend against its cap.
REVOKE EXECUTE ON FUNCTION public.check_ai_budget(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_ai_usage(uuid, uuid, text, text, integer, integer, numeric) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.check_ai_budget(uuid) TO service_role;
GRANT  EXECUTE ON FUNCTION public.record_ai_usage(uuid, uuid, text, text, integer, integer, numeric) TO service_role;
