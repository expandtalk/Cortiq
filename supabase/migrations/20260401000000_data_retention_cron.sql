-- Data retention enforcement: runs daily and deletes data older than each site's configured retention period.
-- Default: 730 days (2 years) per GDPR guidelines.

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

    delete from heatmap_data      where site_id = site_rec.site_id and created_at < cutoff;
    get diagnostics del_count = row_count;
    results := results || jsonb_build_object('heatmap_data',
      coalesce((results->>'heatmap_data')::int, 0) + del_count);

    delete from user_interactions where site_id = site_rec.site_id and created_at < cutoff;
    get diagnostics del_count = row_count;
    results := results || jsonb_build_object('user_interactions',
      coalesce((results->>'user_interactions')::int, 0) + del_count);

    delete from page_views        where site_id = site_rec.site_id and viewed_at  < cutoff;
    get diagnostics del_count = row_count;
    results := results || jsonb_build_object('page_views',
      coalesce((results->>'page_views')::int, 0) + del_count);

    delete from tracking_sessions where site_id = site_rec.site_id and started_at < cutoff;
    get diagnostics del_count = row_count;
    results := results || jsonb_build_object('tracking_sessions',
      coalesce((results->>'tracking_sessions')::int, 0) + del_count);

    delete from ai_bot_traffic    where site_id = site_rec.site_id and created_at < cutoff;
    get diagnostics del_count = row_count;
    results := results || jsonb_build_object('ai_bot_traffic',
      coalesce((results->>'ai_bot_traffic')::int, 0) + del_count);

  end loop;

  return results;
end;
$$;

-- Schedule daily at 03:00 UTC using pg_cron (must be enabled in Supabase dashboard under Database → Extensions)
select cron.schedule(
  'daily-data-retention',
  '0 3 * * *',
  'select run_data_retention()'
);
