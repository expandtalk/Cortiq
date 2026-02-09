-- Create API Keys table for Public REST API
-- Task #5: Publikt REST API med dokumentation

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g., "ck_live_")
  name TEXT NOT NULL,
  permissions TEXT[] DEFAULT '{read}',
  rate_limit INT DEFAULT 1000, -- requests per hour
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,

  -- Constraints
  CONSTRAINT api_keys_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
  CONSTRAINT api_keys_rate_limit_positive CHECK (rate_limit > 0)
);

-- Create index for fast lookups
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_company_id ON api_keys(company_id);
CREATE INDEX idx_api_keys_site_id ON api_keys(site_id);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = TRUE;

-- Create API key usage tracking table
CREATE TABLE IF NOT EXISTS api_key_usage (
  id BIGSERIAL PRIMARY KEY,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INT,
  response_time_ms INT,
  request_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition by month for better performance
-- We'll add partitioning later when needed

-- Create index for usage analytics
CREATE INDEX idx_api_key_usage_key_id_created ON api_key_usage(api_key_id, created_at DESC);
CREATE INDEX idx_api_key_usage_created ON api_key_usage(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see API keys for their companies
CREATE POLICY "view_own_company_api_keys"
  ON api_keys
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert API keys for their companies
CREATE POLICY "insert_own_company_api_keys"
  ON api_keys
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update API keys for their companies
CREATE POLICY "update_own_company_api_keys"
  ON api_keys
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete API keys for their companies
CREATE POLICY "delete_own_company_api_keys"
  ON api_keys
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can see usage for their API keys
CREATE POLICY "view_own_api_key_usage"
  ON api_key_usage
  FOR SELECT
  USING (
    api_key_id IN (
      SELECT id FROM api_keys
      WHERE company_id IN (
        SELECT company_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Create function to validate API key
CREATE OR REPLACE FUNCTION validate_api_key(p_key_hash TEXT)
RETURNS TABLE (
  api_key_id UUID,
  company_id UUID,
  site_id UUID,
  permissions TEXT[],
  rate_limit INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id,
    k.company_id,
    k.site_id,
    k.permissions,
    k.rate_limit
  FROM api_keys k
  WHERE
    k.key_hash = p_key_hash
    AND k.is_active = TRUE
    AND (k.expires_at IS NULL OR k.expires_at > NOW());

  -- Update last_used_at
  UPDATE api_keys
  SET last_used_at = NOW()
  WHERE key_hash = p_key_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(p_api_key_id UUID, p_rate_limit INT)
RETURNS BOOLEAN AS $$
DECLARE
  v_request_count INT;
BEGIN
  -- Count requests in the last hour
  SELECT COUNT(*)
  INTO v_request_count
  FROM api_key_usage
  WHERE
    api_key_id = p_api_key_id
    AND created_at > NOW() - INTERVAL '1 hour';

  RETURN v_request_count < p_rate_limit;
END;
$$ LANGUAGE plpgsql;

-- Create function to log API usage
CREATE OR REPLACE FUNCTION log_api_usage(
  p_api_key_id UUID,
  p_endpoint TEXT,
  p_method TEXT,
  p_status_code INT,
  p_response_time_ms INT,
  p_request_ip TEXT,
  p_user_agent TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO api_key_usage (
    api_key_id,
    endpoint,
    method,
    status_code,
    response_time_ms,
    request_ip,
    user_agent
  ) VALUES (
    p_api_key_id,
    p_endpoint,
    p_method,
    p_status_code,
    p_response_time_ms,
    p_request_ip,
    p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO authenticated;
GRANT SELECT ON api_key_usage TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE api_key_usage_id_seq TO authenticated;

-- Add comment
COMMENT ON TABLE api_keys IS 'API keys for Public REST API access';
COMMENT ON TABLE api_key_usage IS 'API key usage tracking and rate limiting';
