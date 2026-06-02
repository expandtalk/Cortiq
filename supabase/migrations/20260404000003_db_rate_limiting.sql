-- DB-level rate limiting for tracking endpoints.
-- Replaces in-memory Map in Edge Functions (which resets on cold start).

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  key         text        NOT NULL,          -- 'track:{site_id}' or 'api:{key_hash}'
  window_start timestamptz NOT NULL DEFAULT now(),
  count        int         NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);

-- Expire old buckets automatically (keep only last 2 hours)
CREATE INDEX IF NOT EXISTS rate_limit_buckets_window_idx ON rate_limit_buckets (window_start);

-- Function: check and increment rate limit, returns TRUE if allowed
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key        text,
  p_max_count  int,
  p_window_sec int   DEFAULT 3600    -- default: 1 hour window
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_count        int;
BEGIN
  -- Truncate to window boundary
  v_window_start := date_trunc('hour', now());
  IF p_window_sec < 3600 THEN
    v_window_start := now() - (now() - date_trunc('hour', now()))
                      + (EXTRACT(EPOCH FROM (now() - date_trunc('hour', now())))::int
                         / p_window_sec * p_window_sec || ' seconds')::interval;
  END IF;

  INSERT INTO rate_limit_buckets (key, window_start, count)
  VALUES (p_key, v_window_start, 1)
  ON CONFLICT (key, window_start)
  DO UPDATE SET count = rate_limit_buckets.count + 1
  RETURNING count INTO v_count;

  RETURN v_count <= p_max_count;
END;
$$;

-- Cleanup function: delete buckets older than 2 hours
CREATE OR REPLACE FUNCTION cleanup_rate_limit_buckets()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM rate_limit_buckets WHERE window_start < now() - interval '2 hours';
$$;

-- No RLS needed — this table is service-role only (Edge Functions use service role)
-- Authenticated users should never access this table directly
REVOKE ALL ON rate_limit_buckets FROM authenticated, anon;
GRANT ALL ON rate_limit_buckets TO service_role;
GRANT EXECUTE ON FUNCTION check_rate_limit(text, int, int) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_rate_limit_buckets() TO service_role;
