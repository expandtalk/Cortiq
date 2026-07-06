-- Fix data retention (audit P0-4 / P1-9).
--
-- The previous run_data_retention() deleted from user_interactions using a
-- `site_id` column that does not exist on that table, which raised and rolled back
-- the ENTIRE function on every run — so NO data was ever purged and the advertised
-- 730-day GDPR retention silently did nothing.
--
-- This version:
--   1. Removes the invalid user_interactions.site_id filter; user_interactions is
--      scoped via its parent tracking_sessions (session_id -> tracking_sessions.id).
--   2. Wraps each table delete in its own exception block so one failure (e.g. a
--      future schema change) can never abort the whole retention run.
--   3. Extends coverage to the most sensitive stores previously left to grow forever:
--      conversion_events (hashed_email + gclid), unified_visitors (persistent
--      fingerprint profiles + click IDs), and form_analytics.

create or replace function run_data_retention()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  site_rec   record;
  retention  int;
  cutoff     timestamptz;
  results    jsonb := '{}';
  del_count  bigint;
begin
  for site_rec in
    select s.id as site_id,
           coalesce(g.data_retention_days, 730) as retention_days
    from   sites s
    left join gdpr_settings g on g.site_id = s.id
  loop
    retention := site_rec.retention_days;
    cutoff    := now() - (retention || ' days')::interval;

    begin
      delete from heatmap_data where site_id = site_rec.site_id and created_at < cutoff;
      get diagnostics del_count = row_count;
      results := results || jsonb_build_object('heatmap_data',
        coalesce((results->>'heatmap_data')::int, 0) + del_count);
    exception when others then
      raise warning 'retention heatmap_data failed for %: %', site_rec.site_id, sqlerrm;
    end;

    begin
      -- user_interactions has no site_id; scope via its parent tracking_sessions.
      delete from user_interactions
      where session_id in (
        select id from tracking_sessions
        where site_id = site_rec.site_id and started_at < cutoff
      );
      get diagnostics del_count = row_count;
      results := results || jsonb_build_object('user_interactions',
        coalesce((results->>'user_interactions')::int, 0) + del_count);
    exception when others then
      raise warning 'retention user_interactions failed for %: %', site_rec.site_id, sqlerrm;
    end;

    begin
      delete from page_views where site_id = site_rec.site_id and viewed_at < cutoff;
      get diagnostics del_count = row_count;
      results := results || jsonb_build_object('page_views',
        coalesce((results->>'page_views')::int, 0) + del_count);
    exception when others then
      raise warning 'retention page_views failed for %: %', site_rec.site_id, sqlerrm;
    end;

    begin
      -- Deleting tracking_sessions cascades to any remaining page_views / interactions.
      delete from tracking_sessions where site_id = site_rec.site_id and started_at < cutoff;
      get diagnostics del_count = row_count;
      results := results || jsonb_build_object('tracking_sessions',
        coalesce((results->>'tracking_sessions')::int, 0) + del_count);
    exception when others then
      raise warning 'retention tracking_sessions failed for %: %', site_rec.site_id, sqlerrm;
    end;

    begin
      delete from ai_bot_traffic where site_id = site_rec.site_id and created_at < cutoff;
      get diagnostics del_count = row_count;
      results := results || jsonb_build_object('ai_bot_traffic',
        coalesce((results->>'ai_bot_traffic')::int, 0) + del_count);
    exception when others then
      raise warning 'retention ai_bot_traffic failed for %: %', site_rec.site_id, sqlerrm;
    end;

    begin
      -- Sensitive: holds hashed_email + gclid (personal data under GDPR).
      delete from conversion_events where site_id = site_rec.site_id and created_at < cutoff;
      get diagnostics del_count = row_count;
      results := results || jsonb_build_object('conversion_events',
        coalesce((results->>'conversion_events')::int, 0) + del_count);
    exception when others then
      raise warning 'retention conversion_events failed for %: %', site_rec.site_id, sqlerrm;
    end;

    begin
      -- Sensitive: persistent cross-visit fingerprint profiles + click IDs.
      delete from unified_visitors where site_id = site_rec.site_id and last_seen_at < cutoff;
      get diagnostics del_count = row_count;
      results := results || jsonb_build_object('unified_visitors',
        coalesce((results->>'unified_visitors')::int, 0) + del_count);
    exception when others then
      raise warning 'retention unified_visitors failed for %: %', site_rec.site_id, sqlerrm;
    end;

    begin
      delete from form_analytics where site_id = site_rec.site_id and created_at < cutoff;
      get diagnostics del_count = row_count;
      results := results || jsonb_build_object('form_analytics',
        coalesce((results->>'form_analytics')::int, 0) + del_count);
    exception when others then
      raise warning 'retention form_analytics failed for %: %', site_rec.site_id, sqlerrm;
    end;

  end loop;

  return results;
end;
$$;
