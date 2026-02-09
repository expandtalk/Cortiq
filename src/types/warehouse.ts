/**
 * Data Warehouse Types
 * Task #23: Data Warehouse Connector
 */

export type WarehouseType = 'bigquery' | 'snowflake' | 'redshift' | 'postgres' | 'mysql' | 'databricks';
export type SyncFrequency = 'hourly' | 'daily' | 'weekly';
export type ConnectorStatus = 'active' | 'paused' | 'error' | 'testing';
export type SyncJobStatus = 'pending' | 'running' | 'completed' | 'failed';
export type JobType = 'full_sync' | 'incremental_sync' | 'schema_update';

export interface BigQueryCredentials {
  project_id: string;
  client_email?: string;
  private_key?: string;
  client_id?: string;
}

export interface SnowflakeCredentials {
  account: string;
  username: string;
  password: string;
  warehouse?: string;
  database?: string;
  schema?: string;
}

export interface PostgresCredentials {
  host: string;
  port: string;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
}

export interface RedshiftCredentials extends PostgresCredentials {
  cluster_identifier?: string;
  iam_role?: string;
}

export interface MySQLCredentials {
  host: string;
  port: string;
  username: string;
  password: string;
  database: string;
}

export interface DatabricksCredentials {
  workspace_url: string;
  personal_access_token: string;
  cluster_id?: string;
  catalog?: string;
  schema?: string;
}

export type WarehouseCredentials =
  | BigQueryCredentials
  | SnowflakeCredentials
  | PostgresCredentials
  | RedshiftCredentials
  | MySQLCredentials
  | DatabricksCredentials;

export interface WarehouseConnector {
  id: string;
  site_id: string;
  company_id: string;
  name: string;
  warehouse_type: WarehouseType;
  description?: string;
  credentials: WarehouseCredentials;
  settings?: Record<string, any>;
  schema_name: string;
  table_prefix: string;
  sync_enabled: boolean;
  sync_frequency: SyncFrequency;
  last_sync_at?: string;
  next_sync_at?: string;
  status: ConnectorStatus;
  error_message?: string;
  connection_tested_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WarehouseSyncJob {
  id: string;
  connector_id: string;
  job_type: JobType;
  status: SyncJobStatus;
  progress_percentage: number;
  sync_from?: string;
  sync_to?: string;
  total_rows: number;
  rows_synced: number;
  rows_failed: number;
  bytes_transferred: number;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  error_message?: string;
  error_details?: Record<string, any>;
  created_at: string;
}

export interface WarehouseTableSchema {
  id: string;
  connector_id: string;
  table_name: string;
  display_name?: string;
  description?: string;
  columns: WarehouseColumn[];
  primary_keys: string[];
  indexes?: WarehouseIndex[];
  auto_sync: boolean;
  partition_column?: string;
  partition_interval?: string;
  created_at: string;
  updated_at: string;
}

export interface WarehouseColumn {
  name: string;
  type: string;
  description?: string;
  nullable: boolean;
  default?: string;
}

export interface WarehouseIndex {
  name: string;
  columns: string[];
  type?: string;
  unique?: boolean;
}

export interface WarehouseDataQuality {
  id: string;
  connector_id: string;
  date: string;
  total_records: number;
  duplicate_records: number;
  null_records: number;
  invalid_records: number;
  latest_data_timestamp?: string;
  staleness_hours?: number;
  sync_success_rate: number;
  created_at: string;
}

export interface WarehouseAuditLog {
  id: string;
  connector_id: string;
  action: string;
  action_by?: string;
  description?: string;
  changes?: Record<string, any>;
  created_at: string;
}

export interface SyncConfig {
  connector_id: string;
  tables: string[];
  full_sync: boolean;
  incremental_column?: string;
  batch_size?: number;
  retry_on_failure?: boolean;
  max_retries?: number;
}

export interface DataQualityMetrics {
  completeness: number;
  uniqueness: number;
  timeliness: number;
  accuracy: number;
  consistency: number;
  overall_score: number;
}
