/**
 * Tag Manager Types
 * Task #31: Tag Manager
 */

export type TagType = 'event' | 'custom_event' | 'pixel' | 'script' | 'html';
export type FiringRuleType = 'page_view' | 'event' | 'click' | 'form_submit' | 'custom';
export type TagCategory = 'analytics' | 'advertising' | 'cdp' | 'optimization' | 'marketing';
export type DataLayerScope = 'page' | 'session' | 'visitor';
export type PublicationStatus = 'active' | 'archived' | 'rollback';
export type DataLayerVariableType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export interface Tag {
  id: string;
  site_id: string;
  name: string;
  type: TagType;
  description?: string;
  config: Record<string, any>;
  is_enabled: boolean;
  is_paused: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  last_published_at?: string;
}

export interface TagFiringRule {
  id: string;
  tag_id: string;
  rule_name: string;
  rule_type: FiringRuleType;
  rule_order: number;
  trigger_conditions?: Record<string, any>;
  require_all_conditions: boolean;
  exception_conditions?: Record<string, any>;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface TagDataLayer {
  id: string;
  site_id: string;
  variable_name: string;
  variable_type?: DataLayerVariableType;
  default_value?: any;
  description?: string;
  scope: DataLayerScope;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface TagTemplate {
  id: string;
  name: string;
  provider_name: string;
  description?: string;
  icon_url?: string;
  required_fields: string[];
  optional_fields: string[];
  default_config: Record<string, any>;
  category: TagCategory;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface TagVersion {
  id: string;
  tag_id: string;
  version: number;
  config: Record<string, any>;
  change_description?: string;
  created_by?: string;
  created_at: string;
}

export interface TagPublication {
  id: string;
  tag_id: string;
  version: number;
  published_at: string;
  published_by?: string;
  status: PublicationStatus;
  published_to_production: boolean;
  published_to_staging: boolean;
  notes?: string;
}

export interface TagAuditLog {
  id: string;
  tag_id: string;
  action: string;
  performed_by?: string;
  changes?: Record<string, any>;
  notes?: string;
  created_at: string;
}

export interface TagTestResult {
  id: string;
  tag_id: string;
  test_type: 'preview' | 'qa' | 'production';
  test_timestamp: string;
  fired: boolean;
  fire_time_ms?: number;
  payload?: Record<string, any>;
  errors?: Record<string, any>;
  tested_on_url?: string;
  tested_by?: string;
}
