-- event_queue.site_id referenced sites(id) with no ON DELETE action, which blocks
-- deleting a site that has queued events. Align it with the other site FKs
-- (ON DELETE CASCADE) so deleting a site cleanly removes its queue rows.
ALTER TABLE public.event_queue
  DROP CONSTRAINT IF EXISTS event_queue_site_id_fkey;

ALTER TABLE public.event_queue
  ADD CONSTRAINT event_queue_site_id_fkey
  FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;
