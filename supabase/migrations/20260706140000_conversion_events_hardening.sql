-- conversion_events integrity hardening (audit P2-4, P2-5, P2-13).
--
-- NOTE: contains DELETEs of orphaned/duplicate rows so the new constraints can be
-- added. On a dev-stage project this is safe; review before running against a DB with
-- real conversion history.

-- ── P2-13: foreign key + created_at NOT NULL ────────────────────────────────
-- Remove rows whose site no longer exists (they can never be attributed anyway),
-- otherwise the FK creation fails.
DELETE FROM public.conversion_events
WHERE site_id IS NOT NULL AND site_id NOT IN (SELECT id FROM public.sites);

UPDATE public.conversion_events SET created_at = now() WHERE created_at IS NULL;
ALTER TABLE public.conversion_events ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.conversion_events ALTER COLUMN created_at SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversion_events_site_id_fkey'
  ) THEN
    ALTER TABLE public.conversion_events
      ADD CONSTRAINT conversion_events_site_id_fkey
      FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ── P2-5: claim timestamp so stuck 'uploading' rows can be reclaimed ─────────
ALTER TABLE public.conversion_events
  ADD COLUMN IF NOT EXISTS upload_claimed_at timestamptz;

-- ── P2-4: idempotency — a double form-submit in the same tracking session must
-- not create two identical conversions. Collapse existing dupes first, then a
-- partial unique index enforces it going forward (session_id may be NULL).
DELETE FROM public.conversion_events a
USING public.conversion_events b
WHERE a.session_id IS NOT NULL
  AND a.site_id    = b.site_id
  AND a.session_id = b.session_id
  AND a.event_name = b.event_name
  AND a.ctid > b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS uq_conversion_events_dedup
  ON public.conversion_events (site_id, session_id, event_name)
  WHERE session_id IS NOT NULL;
