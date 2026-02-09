/**
 * Content Tracking Types
 * Task #24: Content Tracking Advanced
 */

export type InteractionType = 'view' | 'click' | 'hover' | 'focus' | 'scroll_into_view' | 'form_interaction';
export type ElementType = 'button' | 'link' | 'form' | 'image' | 'video' | 'text' | 'cta' | 'social';
export type ContentType = 'call-to-action' | 'social-proof' | 'testimonial' | 'featured-product' | 'form';
export type FormSubmissionStatus = 'success' | 'error' | 'abandoned';

export interface ContentElement {
  id: string;
  site_id: string;
  element_id: string;
  element_type: ElementType;
  element_selector: string;
  element_text?: string;
  page_url: string;
  page_title?: string;
  section_name?: string;
  content_type?: ContentType;
  priority: number;
  is_tracked: boolean;
  tracking_started_at: string;
  created_at: string;
  updated_at: string;
}

export interface ContentInteraction {
  id: string;
  site_id: string;
  session_id?: string;
  element_id: string;
  page_url: string;
  interaction_type: InteractionType;
  interaction_timestamp: string;
  mouse_x?: number;
  mouse_y?: number;
  view_duration?: number;
  hover_duration?: number;
  click_count?: number;
  form_field_name?: string;
  form_field_type?: string;
  form_field_value?: string;
  form_submission_status?: FormSubmissionStatus;
  device_type?: string;
  browser?: string;
  os?: string;
  viewport_width?: number;
  viewport_height?: number;
  visitor_hash?: string;
  referrer?: string;
  created_at: string;
}

export interface ContentPerformance {
  id: string;
  site_id: string;
  element_id: string;
  page_url: string;
  date: string;
  views: number;
  impressions: number;
  clicks: number;
  hover_count: number;
  focus_count: number;
  form_submissions: number;
  form_successes: number;
  form_errors: number;
  ctr: number;
  hover_rate: number;
  form_success_rate: number;
  avg_view_duration: number;
  avg_hover_duration: number;
  engagement_score: number;
  updated_at: string;
}

export interface FormFieldAnalytics {
  id: string;
  site_id: string;
  form_name: string;
  field_name: string;
  field_type?: string;
  field_order?: number;
  page_url?: string;
  date: string;
  impressions: number;
  interactions: number;
  focus_count: number;
  blur_count: number;
  value_changes: number;
  validation_errors: number;
  completed: number;
  abandoned: number;
  avg_time_to_fill: number;
  avg_time_to_error?: number;
  common_error_messages?: string[];
  updated_at: string;
}

export interface ContentHeatmapPoint {
  id: string;
  site_id: string;
  page_url: string;
  interaction_type: InteractionType;
  date: string;
  x_coordinate: number;
  y_coordinate: number;
  intensity: number;
  count: number;
  updated_at: string;
}

export interface ScrollDepth {
  id: string;
  site_id: string;
  session_id?: string;
  page_url: string;
  visitor_hash?: string;
  max_scroll_depth: number;
  scroll_events: number;
  total_scroll_distance: number;
  session_date: string;
  time_on_page: number;
  created_at: string;
}

export interface ContentRecommendation {
  id: string;
  site_id: string;
  recommendation_id?: string;
  recommendation_type: string;
  source_page: string;
  target_page: string;
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  updated_at: string;
}

export interface ContentTrackingConfig {
  siteId: string;
  sessionId?: string;
  visitorHash?: string;
  trackingEndpoint?: string;
}

export interface TrackedElement {
  elementId: string;
  elementType: ElementType;
  selector: string;
  text?: string;
  pageUrl: string;
  pageTitle?: string;
  sectionName?: string;
  contentType?: ContentType;
}

export interface EngagementMetrics {
  totalViews: number;
  totalClicks: number;
  ctr: number;
  hoverRate: number;
  avgViewDuration: number;
  engagementScore: number;
}

export interface FormMetrics {
  formName: string;
  totalFields: number;
  completedForms: number;
  abandonedForms: number;
  completionRate: number;
  averageTimeToComplete: number;
  errorRate: number;
  topErrorFields: Array<{ field: string; errorCount: number }>;
}
