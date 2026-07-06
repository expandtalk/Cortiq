-- Measurement bridge: the live tracking script posts page views to track-event
-- (tracking_events), but the dashboard analytics read page_views / tracking_sessions,
-- which stopped being written when the site migrated off the old pixel script. This
-- reconnects them.
--
-- The tracking identifier sent by the client is a company id, not a sites.id, so we
-- resolve the real site by matching the page URL's host against sites.domain — robust
-- regardless of how each site's SITE_ID is configured. All sites belong to one user,
-- so domain-matching is a sound ownership proxy here.

-- Normalise a URL or a stored domain down to a bare host: lowercase, no scheme, no
-- path, no port, no leading www.
CREATE OR REPLACE FUNCTION public._norm_host(u text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = ''
AS $$
  SELECT regexp_replace(
           split_part(
             split_part(regexp_replace(lower(coalesce(u, '')), '^https?://', ''), '/', 1),
             ':', 1),
           '^www\.', '')
$$;

CREATE OR REPLACE FUNCTION public.ingest_pageview(
  p_url       text,
  p_session   text,
  p_device    text,
  p_referrer  text,
  p_viewed_at timestamptz
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_host    text;
  v_site    uuid;
  v_sess    uuid;
  v_ts      timestamptz := coalesce(p_viewed_at, now());
BEGIN
  IF p_url IS NULL OR p_session IS NULL THEN RETURN; END IF;

  v_host := public._norm_host(p_url);
  IF v_host = '' THEN RETURN; END IF;

  -- Resolve the real site by domain; skip silently if no site matches.
  SELECT id INTO v_site FROM sites WHERE public._norm_host(domain) = v_host LIMIT 1;
  IF v_site IS NULL THEN RETURN; END IF;

  -- Find-or-create the session (session_id is the client's text token; page_views keys
  -- on the tracking_sessions UUID). No unique constraint exists, so this is best-effort.
  SELECT id INTO v_sess FROM tracking_sessions
    WHERE site_id = v_site AND session_id = p_session
    ORDER BY started_at DESC LIMIT 1;

  IF v_sess IS NULL THEN
    INSERT INTO tracking_sessions (site_id, session_id, device_type, referrer, started_at, last_activity, page_views)
    VALUES (v_site, p_session, p_device, p_referrer, v_ts, v_ts, 1)
    RETURNING id INTO v_sess;
  ELSE
    UPDATE tracking_sessions
      SET page_views    = coalesce(page_views, 0) + 1,
          last_activity = greatest(last_activity, v_ts),
          duration_seconds = greatest(0, extract(epoch FROM (greatest(last_activity, v_ts) - started_at))::int)
    WHERE id = v_sess;
  END IF;

  INSERT INTO page_views (site_id, session_id, url, viewed_at, referrer)
  VALUES (v_site, v_sess, p_url, v_ts, p_referrer);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ingest_pageview(text, text, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.ingest_pageview(text, text, text, text, timestamptz) TO service_role;
