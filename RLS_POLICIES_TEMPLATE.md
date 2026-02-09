# Row Level Security (RLS) Policies Template

This document provides templates for creating Row Level Security (RLS) policies in Supabase. RLS is critical for ensuring that users can only access data they're authorized to see.

## Overview

Row Level Security allows you to write policies that control which rows can be viewed, modified, or deleted based on the current user's identity and roles. All new tables should have RLS policies defined.

## Template Patterns

### 1. Organization-Based Access

Use this template for tables where access is determined by organization membership.

```sql
-- Enable RLS on the table
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view rows for their organization
CREATE POLICY "view_organization_data"
  ON your_table
  FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE id = auth.uid() OR
            id IN (
              SELECT organization_id FROM organization_members
              WHERE user_id = auth.uid()
            )
    )
  );

-- Policy: Allow organization admins to insert
CREATE POLICY "insert_organization_data"
  ON your_table
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Allow organization admins to update
CREATE POLICY "update_organization_data"
  ON your_table
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Allow organization admins to delete
CREATE POLICY "delete_organization_data"
  ON your_table
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

### 2. Site-Based Access

Use this template for tables related to specific sites, where users should only access sites they manage.

```sql
-- Enable RLS on the table
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view data for their sites
CREATE POLICY "view_site_data"
  ON your_table
  FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Allow users to insert data for their sites
CREATE POLICY "insert_site_data"
  ON your_table
  FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT id FROM sites
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
      )
    )
  );

-- Policy: Allow users to update their site data
CREATE POLICY "update_site_data"
  ON your_table
  FOR UPDATE
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
      )
    )
  )
  WITH CHECK (
    site_id IN (
      SELECT id FROM sites
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
      )
    )
  );

-- Policy: Allow users to delete their site data
CREATE POLICY "delete_site_data"
  ON your_table
  FOR DELETE
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
      )
    )
  );
```

### 3. User-Owned Data

Use this template for tables where each row belongs to a specific user.

```sql
-- Enable RLS on the table
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view their own data
CREATE POLICY "view_own_data"
  ON your_table
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Allow users to insert their own data
CREATE POLICY "insert_own_data"
  ON your_table
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Allow users to update their own data
CREATE POLICY "update_own_data"
  ON your_table
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Allow users to delete their own data
CREATE POLICY "delete_own_data"
  ON your_table
  FOR DELETE
  USING (user_id = auth.uid());
```

### 4. Public Read-Only Data

Use this template for tables that should be readable by everyone but only modified by specific users.

```sql
-- Enable RLS on the table
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to view
CREATE POLICY "view_public_data"
  ON your_table
  FOR SELECT
  USING (public = true);

-- Policy: Allow administrators only to modify
CREATE POLICY "modify_admin_only"
  ON your_table
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "modify_admin_only"
  ON your_table
  FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "modify_admin_only"
  ON your_table
  FOR DELETE
  USING (is_admin(auth.uid()));
```

### 5. Company/Account-Based Access

Use this template for multi-tenant applications where data is partitioned by company/account.

```sql
-- Enable RLS on the table
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to access their company's data
CREATE POLICY "view_company_data"
  ON your_table
  FOR SELECT
  USING (
    company_id = (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Allow users to insert company data
CREATE POLICY "insert_company_data"
  ON your_table
  FOR INSERT
  WITH CHECK (
    company_id = (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Allow users to update company data
CREATE POLICY "update_company_data"
  ON your_table
  FOR UPDATE
  USING (
    company_id = (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id = (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Allow admins to delete company data
CREATE POLICY "delete_company_data"
  ON your_table
  FOR DELETE
  USING (
    is_company_admin(auth.uid(), company_id)
  );
```

## CortIQ-Specific Policies

### Tracking Data Access

```sql
-- tracking_events table
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;

-- Users can view events from sites in their organization
CREATE POLICY "view_tracking_events"
  ON tracking_events
  FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Events are inserted by the tracking system (service role)
-- No direct INSERT policy needed for user access
```

### Analytics Settings

```sql
-- analytics_settings table
ALTER TABLE analytics_settings ENABLE ROW LEVEL SECURITY;

-- Users can view settings for their sites
CREATE POLICY "view_analytics_settings"
  ON analytics_settings
  FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can update settings for their sites
CREATE POLICY "update_analytics_settings"
  ON analytics_settings
  FOR UPDATE
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  )
  WITH CHECK (
    site_id IN (
      SELECT id FROM sites
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );
```

### Heatmap Data

```sql
-- heatmap_data table
ALTER TABLE heatmap_data ENABLE ROW LEVEL SECURITY;

-- Users can view heatmaps from their sites
CREATE POLICY "view_heatmap_data"
  ON heatmap_data
  FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );
```

## Best Practices

1. **Always Enable RLS**
   - Every table should have RLS enabled
   - At minimum, have a policy that denies all access and then add specific allow policies

2. **Use Named Policies**
   - Give policies descriptive names that indicate their purpose
   - Examples: "view_organization_data", "insert_own_data", etc.

3. **Test Policies Thoroughly**
   - Test each policy with different user roles
   - Test with different organizations/accounts
   - Ensure users cannot access data they shouldn't

4. **Document Policy Intent**
   - Add comments explaining the security model
   - Document which operations each policy applies to

5. **Use Functions for Complex Logic**
   - Create custom PostgreSQL functions for complex authorization logic
   - Use helpers like `is_admin()` or `get_user_org()`

6. **Avoid SELECT *  Queries**
   - Specify exact columns needed
   - This helps prevent accidental exposure of sensitive fields

7. **Plan for Service Role**
   - Service role bypasses RLS (for admin operations)
   - Only use service role for backend operations
   - Never expose service role to client code

## Testing RLS Policies

### Test with Different Users

```sql
-- Test as authenticated user
SET request.jwt.claims = '{"sub": "user-id", "role": "authenticated"}';
SELECT * FROM your_table; -- Should only see their data

-- Test as different user
SET request.jwt.claims = '{"sub": "other-user-id", "role": "authenticated"}';
SELECT * FROM your_table; -- Should see different data
```

### Test with Different Roles

```sql
-- Test with admin role
SET request.jwt.claims = '{"sub": "admin-id", "role": "authenticated"}';
SELECT * FROM your_table; -- Should see admin data

-- Test insert with insufficient permissions
SET request.jwt.claims = '{"sub": "user-id", "role": "authenticated"}';
INSERT INTO your_table (organization_id, ...)
VALUES ('other-org', ...); -- Should be denied
```

## Common Mistakes

1. **Forgetting to Enable RLS**
   - Always run `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`

2. **Using Permissive AND Policies**
   - Mix of PERMISSIVE and RESTRICTIVE can be confusing
   - Stick to one model consistently

3. **Policies That Are Too Strict**
   - Users can't access their own data
   - Regularly test with real user scenarios

4. **Missing Error Messages**
   - Supabase returns 406 Not Acceptable when RLS denies access
   - Implement client-side handling of this error

5. **Performance Issues**
   - Complex policies with many joins can slow queries
   - Consider denormalization or caching for performance

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Best Practices](https://supabase.com/docs/guides/platform/best-practices)

---

**Template Version**: 1.0
**Last Updated**: 2025-12-16
