/**
 * Final Fas 3 Features Types
 * Tasks #25, #26, #27, #29, #32
 */

// Task #25: White Label
export interface WhiteLabelSettings {
  id: string;
  company_id: string;
  primary_color: string;
  secondary_color: string;
  logo_url?: string;
  favicon_url?: string;
  company_name: string;
  custom_domain?: string;
  custom_domain_verified: boolean;
  show_cortiq_branding: boolean;
  custom_footer_text?: string;
  updated_at: string;
}

// Task #26: Cohort Analysis
export interface Cohort {
  id: string;
  site_id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  definition?: Record<string, any>;
  user_count: number;
  created_at: string;
}

export interface CohortMember {
  id: string;
  cohort_id: string;
  visitor_hash: string;
  session_count: number;
  first_seen: string;
  last_seen: string;
}

export interface CohortRetention {
  id: string;
  cohort_id: string;
  week: number;
  retention_rate: number;
  returning_users: number;
  total_users: number;
}

// Task #27: SEO Web Vitals
export interface WebVital {
  id: string;
  site_id: string;
  session_id?: string;
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
  page_url: string;
  device_type: string;
  measured_at: string;
}

export interface WebVitalsAggregate {
  id: string;
  site_id: string;
  date: string;
  avg_lcp: number;
  avg_fid: number;
  avg_cls: number;
  avg_fcp: number;
  avg_ttfb: number;
  performance_score: number;
  seo_score?: number;
  updated_at: string;
}

// Task #29: SAML SSO
export interface SAMLConfiguration {
  id: string;
  company_id: string;
  entity_id: string;
  sso_url: string;
  certificate: string;
  attribute_mappings?: Record<string, string>;
  is_enabled: boolean;
  created_at: string;
}

export interface SAMLSession {
  id: string;
  user_id: string;
  company_id: string;
  saml_name_id: string;
  session_index: string;
  created_at: string;
  expires_at: string;
}

// Task #32: Advanced Segmentation
export interface Segment {
  id: string;
  site_id: string;
  name: string;
  description?: string;
  rules: Record<string, any>;
  combine_with: 'AND' | 'OR';
  user_count: number;
  last_calculated_at?: string;
  created_at: string;
}

export interface SegmentMember {
  id: string;
  segment_id: string;
  visitor_hash: string;
  created_at: string;
}

export interface SegmentPerformance {
  id: string;
  segment_id: string;
  date: string;
  sessions: number;
  pageviews: number;
  conversions: number;
  conversion_rate: number;
  avg_session_duration: number;
  updated_at: string;
}
