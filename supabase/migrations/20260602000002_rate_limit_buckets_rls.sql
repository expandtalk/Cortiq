-- rate_limit_buckets: enable RLS
-- The table is only written via the check_rate_limit() SECURITY DEFINER function
-- (called by Edge Functions with service_role). No direct client access is needed.
ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;
