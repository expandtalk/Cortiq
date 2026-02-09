/**
 * Geolocation Types
 * Task #17: Avancerad Geolokalisering med Karta
 */

export interface GeolocationData {
  country_code: string;
  country_name: string;
  region_code?: string;
  region_name?: string;
  city_name?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  accuracy_radius?: number;
}

export interface LocationMetrics extends GeolocationData {
  sessions: number;
  pageviews: number;
  unique_visitors: number;
  bounce_rate: number;
  avg_session_duration: number;
  conversions: number;
  conversion_rate: number;
}

export interface GeolocationAggregate {
  id: string;
  site_id: string;
  country_code: string;
  country_name: string;
  region_code?: string;
  region_name?: string;
  city_name?: string;
  latitude?: number;
  longitude?: number;
  date: string;
  sessions: number;
  pageviews: number;
  unique_visitors: number;
  bounce_rate: number;
  avg_session_duration: number;
  conversions: number;
  conversion_rate: number;
  updated_at: string;
}

export interface GeolocationCluster {
  id: string;
  site_id: string;
  zoom_level: number;
  latitude: number;
  longitude: number;
  sessions: number;
  unique_visitors: number;
  conversions: number;
  date: string;
  updated_at: string;
}

export interface GeoheatmapDensity {
  id: string;
  site_id: string;
  latitude: number;
  longitude: number;
  intensity: number;
  date: string;
  hour?: number;
  updated_at: string;
}

export interface GeolocationHierarchy {
  id: string;
  country_code: string;
  country_name: string;
  region_code?: string;
  region_name?: string;
  city_name?: string;
  latitude?: number;
  longitude?: number;
  level: 'country' | 'region' | 'city';
  parent_id?: string;
  created_at: string;
  updated_at: string;
}
