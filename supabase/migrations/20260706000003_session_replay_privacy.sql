-- Session-replay privacy hardening (audit P1-11).
--
-- 1. mask_all_text defaulted to FALSE, so on-screen text (names, addresses, order
--    details) was captured in the DOM snapshot. Default it ON (privacy by default,
--    GDPR Art. 25) and enable it on existing configs.
-- 2. cleanup_expired_recordings() only deleted rows WHERE processed = TRUE, so any
--    recording that never finished processing was retained forever. Purge by expiry
--    regardless of processed state (GDPR Art. 5(1)(e) storage limitation).

ALTER TABLE public.session_recording_settings
  ALTER COLUMN mask_all_text SET DEFAULT TRUE;

UPDATE public.session_recording_settings
  SET mask_all_text = TRUE
  WHERE mask_all_text IS NOT TRUE;

CREATE OR REPLACE FUNCTION cleanup_expired_recordings()
RETURNS void AS $$
BEGIN
  -- Delete expired recordings regardless of processing state.
  DELETE FROM session_recordings
  WHERE expires_at < NOW();

  -- Delete orphaned events (belt and suspenders alongside the CASCADE).
  DELETE FROM session_recording_events
  WHERE recording_id NOT IN (SELECT id FROM session_recordings);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the cleanup actually runs daily (the original migration left it commented out).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('cleanup-recordings', '0 2 * * *', 'SELECT cleanup_expired_recordings()');
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not schedule cleanup-recordings: %', SQLERRM;
END $$;
