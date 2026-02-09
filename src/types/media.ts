/**
 * Media Analytics Types
 * Task #22: Media Analytics
 */

export type MediaType = 'video' | 'audio' | 'document' | 'image';
export type MediaEventType = 'play' | 'pause' | 'resume' | 'seek' | 'complete' | 'progress' | 'error' | 'quality_change' | 'fullscreen';

export interface MediaEvent {
  media_id: string;
  media_type: MediaType;
  event_type: MediaEventType;
  current_time?: number;
  target_time?: number;
  duration?: number;
  playback_rate?: number;
  volume?: number;
  is_fullscreen?: boolean;
  is_muted?: boolean;
  quality?: string;
  buffering_duration?: number;
  dropped_frames?: number;
  device_type?: string;
  browser?: string;
  os?: string;
  error_code?: string;
  error_message?: string;
}

export interface MediaMetadata {
  media_id: string;
  media_type: MediaType;
  media_url: string;
  media_title?: string;
  media_duration?: number;
  file_size?: number;
  format?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  bitrate?: number;
}

export interface MediaEngagement {
  id: string;
  site_id: string;
  media_id: string;
  media_type: MediaType;
  media_title?: string;
  date: string;
  total_plays: number;
  total_sessions: number;
  unique_viewers: number;
  average_watch_time: number;
  total_watch_time: number;
  completion_rate: number;
  average_completion_time?: number;
  drop_off_rate?: number;
  average_playback_rate?: number;
  pause_count: number;
  seek_count: number;
  error_count: number;
  average_quality?: string;
  quality_switches?: number;
  buffering_events?: number;
  average_buffering_duration?: number;
  updated_at: string;
}

export interface MediaPerformanceTimeline {
  id: string;
  site_id: string;
  media_id: string;
  date: string;
  hour: number;
  plays: number;
  sessions: number;
  viewers: number;
  total_watch_time: number;
  average_watch_time: number;
  updated_at: string;
}

export interface MediaProgressPoint {
  id: string;
  site_id: string;
  session_id?: string;
  media_id: string;
  visitor_hash: string;
  progress_percentage: number;
  actual_time: number;
  duration: number;
  reached_at: string;
}

export interface MediaQualityDistribution {
  id: string;
  site_id: string;
  media_id: string;
  quality: string;
  date: string;
  views: number;
  total_watch_time: number;
  average_watch_time: number;
  completion_rate: number;
  updated_at: string;
}

export interface MediaMetadataRecord {
  id: string;
  site_id: string;
  media_id: string;
  media_type: MediaType;
  media_url: string;
  media_title?: string;
  media_duration?: number;
  file_size?: number;
  format?: string;
  dimensions?: string;
  bitrate?: number;
  created_at: string;
  updated_at: string;
}

export interface MediaEventRecord {
  id: string;
  site_id: string;
  session_id?: string;
  media_id: string;
  media_type: MediaType;
  event_type: MediaEventType;
  event_timestamp: string;
  current_time?: number;
  target_time?: number;
  duration?: number;
  playback_rate?: number;
  volume?: number;
  is_fullscreen?: boolean;
  is_muted?: boolean;
  quality?: string;
  buffering_duration?: number;
  dropped_frames?: number;
  device_type?: string;
  browser?: string;
  os?: string;
  error_code?: string;
  error_message?: string;
  created_at: string;
}
