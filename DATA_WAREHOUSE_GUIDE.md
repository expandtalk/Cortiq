# Data Warehouse Connector - Implementation Guide

## Overview

Task #23 implements data warehouse connectors that allow exporting and syncing CortIQ analytics data to external data warehouses. Support includes BigQuery, Snowflake, Redshift, PostgreSQL, MySQL, and Databricks.

**Status**: ✅ Completed

## Features

### 1. **Multiple Warehouse Support**
- Google BigQuery
- Snowflake
- Amazon Redshift
- PostgreSQL
- MySQL
- Databricks

### 2. **Flexible Sync Options**
- Full sync: Complete data reload
- Incremental sync: Only new/changed data
- Schema updates: Automatic table creation
- Scheduled syncs: Hourly, daily, weekly

### 3. **Data Management**
- Configurable schema names and table prefixes
- Partitioning strategies (date-based)
- Automatic index creation
- Data quality monitoring
- Incremental sync tracking

### 4. **Job Monitoring**
- Real-time progress tracking
- Sync job history
- Error tracking and reporting
- Success rate metrics
- Performance statistics (rows, bytes, duration)

### 5. **Security**
- Encrypted credential storage
- Audit logging of all changes
- Role-based access control
- Connection testing before sync

### 6. **Data Quality**
- Duplicate detection
- Null record tracking
- Invalid record identification
- Data freshness metrics
- Quality scoring (0-100)

## Architecture

### Database Schema

#### `warehouse_connectors`
```sql
- Connector configuration and credentials
- Warehouse type, connection settings
- Sync schedule and status
- One per site + warehouse combination
```

#### `warehouse_sync_jobs`
```sql
- Sync job history and status
- Progress tracking
- Row counts and byte transfer
- Error information
```

#### `warehouse_table_schemas`
```sql
- Table definitions for data warehouse
- Column types and constraints
- Partitioning configuration
- Auto-sync settings
```

#### `warehouse_data_quality`
```sql
- Daily data quality metrics
- Record counts, duplicates, nulls
- Data freshness tracking
- Sync success rates
```

#### `warehouse_audit_log`
```sql
- Audit trail of connector changes
- Who made changes and when
- What was changed (JSON)
```

### Edge Function

**Location**: `/supabase/functions/warehouse-connector/index.ts`

#### Endpoints

**GET /warehouse-connector/connectors**
```
Query Parameters:
- site_id: UUID (required)

Response: Array of WarehouseConnector objects
```

**GET /warehouse-connector/:id**
```
Response: Single WarehouseConnector object
```

**POST /warehouse-connector/test**
```json
Request:
{
  "connector_id": "uuid"
}

Response:
{
  "success": true,
  "message": "Connection successful"
}
```

**POST /warehouse-connector/sync**
```json
Request:
{
  "connector_id": "uuid",
  "job_type": "incremental_sync",
  "sync_from": "2025-02-01",
  "sync_to": "2025-02-09"
}

Response:
{
  "data": {
    "job_id": "uuid"
  }
}
```

**GET /warehouse-connector/:id/jobs**
```
Response: Array of SyncJob objects
```

**GET /warehouse-connector/:id/quality**
```
Response: Array of DataQualityMetrics objects
```

### React Components

#### `WarehouseConnectorManager`
**Props**:
```typescript
{
  siteId: string;
}
```

**Features**:
- Create, manage, and delete connectors
- Test connections
- View sync job history
- Monitor data quality
- Manual sync triggers

## Implementation Guide

### 1. Create a Warehouse Connector

```typescript
// Via database directly
const { data, error } = await supabase
  .from('warehouse_connectors')
  .insert({
    site_id: 'site-uuid',
    company_id: 'company-uuid',
    name: 'My BigQuery',
    warehouse_type: 'bigquery',
    schema_name: 'analytics',
    table_prefix: 'cortiq_',
    sync_frequency: 'daily',
    credentials: {
      project_id: 'my-gcp-project',
      client_email: 'service@project.iam.gserviceaccount.com',
      private_key: '...'
    },
    sync_enabled: true,
    status: 'testing'
  });
```

### 2. Test Connection

```typescript
const response = await fetch('/api/warehouse-connector/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    connector_id: 'connector-uuid'
  })
});

const { success, message } = await response.json();
```

### 3. Trigger Sync

```typescript
const response = await fetch('/api/warehouse-connector/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    connector_id: 'connector-uuid',
    job_type: 'incremental_sync',
    sync_from: '2025-02-01',
    sync_to: '2025-02-09'
  })
});

const { data } = await response.json();
console.log('Sync job ID:', data.job_id);
```

### 4. Monitor Sync Jobs

```typescript
const response = await fetch('/api/warehouse-connector/connector-uuid/jobs');
const { data: jobs } = await response.json();

jobs.forEach(job => {
  console.log(`Job ${job.id}: ${job.status} (${job.progress_percentage}%)`);
});
```

### 5. Integrate Dashboard

```typescript
import { WarehouseConnectorManager } from '@/components/dashboard/WarehouseConnectorManager';

export function DataWarehousingPage() {
  return <WarehouseConnectorManager siteId="your-site-uuid" />;
}
```

## Warehouse-Specific Setup

### Google BigQuery

**Prerequisites**:
1. GCP Project created
2. BigQuery API enabled
3. Service account with BigQuery Editor role

**Credentials**:
```json
{
  "project_id": "my-project-id",
  "client_email": "cortiq@my-project.iam.gserviceaccount.com",
  "client_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
}
```

**Schema Setup**:
```sql
-- Create dataset
CREATE SCHEMA IF NOT EXISTS analytics;

-- Tables created automatically with format:
-- cortiq_tracking_events
-- cortiq_sessions
-- cortiq_pageviews
-- etc.
```

### Snowflake

**Prerequisites**:
1. Snowflake account created
2. Database and warehouse provisioned
3. User with SYSADMIN or equivalent

**Credentials**:
```json
{
  "account": "xy12345.us-east-1",
  "username": "cortiq_user",
  "password": "secure_password",
  "warehouse": "COMPUTE_WH",
  "database": "ANALYTICS",
  "schema": "PUBLIC"
}
```

**Schema Setup**:
```sql
-- Tables created with format:
-- CORTIQ_TRACKING_EVENTS
-- CORTIQ_SESSIONS
-- CORTIQ_PAGEVIEWS
```

### Amazon Redshift

**Prerequisites**:
1. Redshift cluster running
2. Database created
3. IAM role for data loading

**Credentials**:
```json
{
  "host": "redshift-cluster.abc123.us-east-1.redshift.amazonaws.com",
  "port": "5439",
  "username": "awsuser",
  "password": "password",
  "database": "analytics",
  "cluster_identifier": "my-cluster",
  "iam_role": "arn:aws:iam::123456789012:role/RedshiftRole"
}
```

### PostgreSQL / MySQL

**Credentials**:
```json
{
  "host": "db.example.com",
  "port": "5432",
  "username": "cortiq",
  "password": "password",
  "database": "analytics"
}
```

**Supported Versions**:
- PostgreSQL: 9.6+
- MySQL: 5.7+

## Sync Job Types

### Full Sync
- Exports all historical data
- Recreates tables from scratch
- Used for initial setup
- Time: Varies based on data volume

### Incremental Sync
- Exports only new/changed data since last sync
- Appends to existing tables
- Default sync type
- Much faster than full sync

### Schema Update
- Updates table structures
- Adds new columns from new features
- Modifies existing column types if needed
- No data loss

## Data Quality Metrics

Each sync generates quality scores:

```typescript
interface DataQualityScore {
  completeness: number;    // Non-null fields %
  uniqueness: number;      // Unique records %
  timeliness: number;      // Data freshness score
  accuracy: number;        // Estimated accuracy
  consistency: number;     // Cross-table consistency
  overall_score: number;   // Weighted average (0-100)
}
```

**Score Interpretation**:
- 90-100: Excellent
- 80-89: Good
- 70-79: Fair (review needed)
- <70: Poor (investigate errors)

## Troubleshooting

### Connection Testing Fails
**Check**:
1. Credentials are correct
2. Firewall rules allow connection
3. Database/warehouse is accessible
4. Service account has proper permissions

**Solution**:
```typescript
// Verify credentials structure
console.log('Checking credentials...');
const { warehouse_type, credentials } = connector;

// Review error message from test
const result = await testConnection(connector);
console.error(result.message);
```

### Sync Jobs Failing
**Common Causes**:
1. Table schema mismatch
2. Permission issues
3. Network timeout
4. Quota exceeded

**Solution**:
- Check error_message in sync_jobs table
- Review warehouse-specific logs
- Increase timeout/retry settings
- Add proper indexes for large tables

### Missing Data After Sync
**Check**:
1. Sync job completed successfully
2. Row counts match expectations
3. Date filters are correct
4. Incremental column is properly set

### Slow Syncs
**Optimize**:
1. Reduce batch size for better throughput
2. Create appropriate indexes
3. Use partitioned tables for large datasets
4. Run syncs during off-peak hours
5. Use incremental syncs instead of full

## Performance Tuning

### Table Partitioning
For tables with >100M rows, use partitioning:

```json
{
  "partition_column": "date",
  "partition_interval": "monthly"
}
```

### Batch Size
Adjust for throughput vs. memory:
```typescript
sync_config: {
  batch_size: 10000  // rows per batch
}
```

### Index Strategy
Optimize for query performance:
```sql
-- Add indexes after initial sync
CREATE INDEX idx_session_date ON analytics.cortiq_sessions(date);
CREATE INDEX idx_event_type ON analytics.cortiq_events(event_type);
```

## Cost Optimization

### BigQuery
- Use incremental syncs to reduce data scanned
- Partition tables by date
- Archive old data to Cloud Storage
- Estimate costs before syncing

### Snowflake
- Use Standard Edition if possible
- Schedule syncs during off-peak times
- Implement clustering for common queries
- Monitor credit usage

### Redshift
- Use compression for fact tables
- Design star schema for analytics
- Run VACUUM after large loads
- Monitor reserved capacity

## Audit & Compliance

All changes logged in `warehouse_audit_log`:
```sql
SELECT * FROM warehouse_audit_log
WHERE connector_id = 'connector-uuid'
ORDER BY created_at DESC;
```

**Logged Actions**:
- Connector created/updated/deleted
- Connection tested
- Sync jobs initiated
- Credential changes
- Status changes

## Integration Checklist

- [x] Database migrations created
- [x] Edge Function deployed
- [x] React component built
- [x] TypeScript types defined
- [x] RLS policies configured
- [x] Documentation completed
- [ ] Test with real warehouse
- [ ] Verify sync performance
- [ ] Set up automated syncs
- [ ] Configure alerts

## Files Created

```
supabase/migrations/
  └── 20260209150000_data_warehouse_connectors.sql

supabase/functions/
  └── warehouse-connector/
      └── index.ts

src/components/dashboard/
  └── WarehouseConnectorManager.tsx

src/types/
  └── warehouse.ts
```

## Next Steps

1. **Initial Setup**
   - Create connector in dashboard
   - Test connection
   - Verify credentials

2. **First Sync**
   - Perform full sync to populate warehouse
   - Monitor job progress
   - Verify data quality

3. **Schedule Regular Syncs**
   - Set sync frequency (daily recommended)
   - Monitor sync health
   - Check data quality scores

4. **Optimize Warehouse Schema**
   - Add indexes based on queries
   - Partition large tables
   - Archive old data

---

**Task #23 Status**: ✅ Complete - Data Warehouse Connector Implemented

