-- Feature 3: Form Registry
-- Stores auto-discovered forms with their provider GUIDs (HubSpot, CF7, Gravity Forms, etc.)
-- Solves the "9 forms, 7 unidentified" problem by giving users a named view of all forms

CREATE TABLE IF NOT EXISTS form_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  form_guid text NOT NULL,
  form_type text NOT NULL DEFAULT 'custom', -- hubspot | gravity | contact7 | custom
  form_label text,                           -- user-assigned friendly name
  detected_url text,
  conversion_goal_id text,                   -- references sites.conversion_goals JSONB entry id
  is_primary_conversion boolean DEFAULT false,
  detected_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(site_id, form_guid)
);

ALTER TABLE form_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners can manage their form registry"
  ON form_registry
  FOR ALL
  TO authenticated
  USING (
    site_id IN (
      SELECT id FROM public.sites WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS form_registry_site_id_idx ON form_registry(site_id);
CREATE INDEX IF NOT EXISTS form_registry_form_type_idx ON form_registry(form_type);
