-- Create storage bucket for exports
-- Task #6: Dataexport (CSV/Excel/JSON)

-- Create bucket for exports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exports',
  'exports',
  false,
  104857600, -- 100MB limit
  ARRAY['text/csv', 'application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for exports bucket
CREATE POLICY "Users can upload their own exports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'exports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read their own exports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'exports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own exports"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'exports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create table to track export jobs
CREATE TABLE IF NOT EXISTS export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('csv', 'json', 'xlsx')),
  row_count INT NOT NULL,
  file_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  download_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create index for faster lookups
CREATE INDEX idx_export_jobs_user_id ON export_jobs(user_id, created_at DESC);
CREATE INDEX idx_export_jobs_status ON export_jobs(status) WHERE status IN ('pending', 'processing');

-- RLS for export_jobs
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own export jobs"
  ON export_jobs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own export jobs"
  ON export_jobs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON export_jobs TO authenticated;

-- Add comment
COMMENT ON TABLE export_jobs IS 'Tracks export jobs for large datasets';
