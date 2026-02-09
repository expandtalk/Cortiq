/**
 * Geolocation Utility Functions
 * Task #17: Avancerad Geolokalisering med Karta
 */

import { GeolocationData, LocationMetrics } from '@/types/geolocation';

/**
 * Get the flag emoji for a country code
 */
export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';

  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';

  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Get color for intensity on a scale
 */
export function getIntensityColor(intensity: number, maxIntensity: number = 100): string {
  const percentage = Math.min(intensity / maxIntensity, 1);

  if (percentage < 0.33) {
    return '#84cc16'; // Green
  } else if (percentage < 0.66) {
    return '#eab308'; // Yellow
  } else {
    return '#ef4444'; // Red
  }
}

/**
 * Group metrics by geographic region
 */
export function groupMetricsByRegion(
  metrics: LocationMetrics[],
  groupLevel: 'country' | 'region' | 'continent'
): Record<string, LocationMetrics[]> {
  const grouped: Record<string, LocationMetrics[]> = {};

  metrics.forEach((metric) => {
    let key: string;

    if (groupLevel === 'country') {
      key = metric.country_code;
    } else if (groupLevel === 'region') {
      key = metric.region_code || metric.country_code;
    } else {
      // Continent grouping (simplified)
      key = getContinent(metric.country_code);
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }

    grouped[key].push(metric);
  });

  return grouped;
}

/**
 * Get continent from country code
 */
function getContinent(countryCode: string): string {
  const continents: Record<string, string> = {
    // North America
    US: 'North America',
    CA: 'North America',
    MX: 'North America',

    // South America
    BR: 'South America',
    AR: 'South America',
    CL: 'South America',
    CO: 'South America',
    PE: 'South America',

    // Europe
    GB: 'Europe',
    DE: 'Europe',
    FR: 'Europe',
    ES: 'Europe',
    IT: 'Europe',
    SE: 'Europe',
    NO: 'Europe',
    DK: 'Europe',
    NL: 'Europe',
    BE: 'Europe',
    CH: 'Europe',
    AT: 'Europe',
    PL: 'Europe',
    RU: 'Europe',
    UA: 'Europe',

    // Asia
    CN: 'Asia',
    JP: 'Asia',
    IN: 'Asia',
    SG: 'Asia',
    TH: 'Asia',
    MY: 'Asia',
    ID: 'Asia',
    PH: 'Asia',
    VN: 'Asia',
    KR: 'Asia',
    TW: 'Asia',

    // Africa
    ZA: 'Africa',
    EG: 'Africa',
    NG: 'Africa',
    KE: 'Africa',

    // Oceania
    AU: 'Oceania',
    NZ: 'Oceania',

    // Middle East
    AE: 'Middle East',
    SA: 'Middle East',
    IL: 'Middle East',
    TR: 'Middle East',
  };

  return continents[countryCode] || 'Other';
}

/**
 * Calculate metrics for a location
 */
export function calculateLocationMetrics(data: any[]): LocationMetrics | null {
  if (data.length === 0) return null;

  const firstItem = data[0];

  return {
    country_code: firstItem.country_code,
    country_name: firstItem.country_name,
    region_code: firstItem.region_code,
    region_name: firstItem.region_name,
    city_name: firstItem.city_name,
    latitude: firstItem.latitude,
    longitude: firstItem.longitude,
    sessions: data.reduce((sum: number, d: any) => sum + (d.sessions || 0), 0),
    pageviews: data.reduce((sum: number, d: any) => sum + (d.pageviews || 0), 0),
    unique_visitors: data.reduce((sum: number, d: any) => sum + (d.unique_visitors || 0), 0),
    bounce_rate: data.length > 0
      ? data.reduce((sum: number, d: any) => sum + (d.bounce_rate || 0), 0) / data.length
      : 0,
    avg_session_duration: data.length > 0
      ? data.reduce((sum: number, d: any) => sum + (d.avg_session_duration || 0), 0) / data.length
      : 0,
    conversions: data.reduce((sum: number, d: any) => sum + (d.conversions || 0), 0),
    conversion_rate: 0, // Will be calculated
  };
}

/**
 * Get location display name
 */
export function getLocationDisplayName(metric: LocationMetrics, level: 'country' | 'region' | 'city'): string {
  if (level === 'country') {
    return `${metric.country_name} ${getCountryFlag(metric.country_code)}`;
  } else if (level === 'region') {
    return metric.region_name || 'Unknown Region';
  } else {
    return metric.city_name || 'Unknown City';
  }
}
