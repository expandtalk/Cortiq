-- Follow-up to 20260706120000: close the grant gap flagged by the security advisor.
--
-- Postgres grants EXECUTE to PUBLIC by default, and anon/authenticated inherit PUBLIC.
-- The previous migration only revoked from anon/authenticated explicitly, which does
-- NOT remove the PUBLIC grant — so both SECURITY DEFINER functions were still callable
-- unauthenticated. Revoke from PUBLIC (the real fix) and re-grant only service_role.

REVOKE EXECUTE ON FUNCTION public.check_ai_budget(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_ai_usage(uuid, uuid, text, text, integer, integer, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._ai_price_per_mtok(text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.check_ai_budget(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_ai_usage(uuid, uuid, text, text, integer, integer, numeric) TO service_role;
-- _ai_price_per_mtok is an internal helper called only from record_ai_usage (a
-- SECURITY DEFINER function running as owner), so it needs no direct role grant.

-- Silence the "function_search_path_mutable" advisory on the pricing helper. It touches
-- no tables, so an empty search_path is safe and removes the mutable-path risk.
ALTER FUNCTION public._ai_price_per_mtok(text) SET search_path = '';
