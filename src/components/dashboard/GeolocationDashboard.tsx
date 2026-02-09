/**
 * Geolocation Dashboard
 * Task #17: Avancerad Geolokalisering med Karta
 *
 * Interactive map with geolocation analytics
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ExportButton } from './ExportButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, MapPin, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import GeolocationMap from './GeolocationMap';

interface LocationMetrics {
  country_code: string;
  country_name: string;
  region_code?: string;
  region_name?: string;
  city_name?: string;
  latitude?: number;
  longitude?: number;
  sessions: number;
  pageviews: number;
  unique_visitors: number;
  bounce_rate: number;
  avg_session_duration: number;
  conversions: number;
  conversion_rate: number;
}

interface GeolocationDashboardProps {
  siteId: string;
  dateRange: { from: string; to: string };
}

export function GeolocationDashboard({
  siteId,
  dateRange,
}: GeolocationDashboardProps) {
  const [locations, setLocations] = useState<LocationMetrics[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<'country' | 'region' | 'city'>('country');
  const [selectedCountry, setSelectedCountry] = useState<string>();
  const [selectedRegion, setSelectedRegion] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);

  useEffect(() => {
    loadGeolocationData();
    loadMapData();
    loadHeatmapData();
  }, [siteId, dateRange, selectedLevel, selectedCountry, selectedRegion]);

  async function loadGeolocationData() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('geolocation_aggregates')
        .select('*')
        .eq('site_id', siteId)
        .gte('date', dateRange.from.split('T')[0])
        .lte('date', dateRange.to.split('T')[0]);

      if (error) throw error;

      // Filter and aggregate based on selected level
      let aggregated: LocationMetrics[] = [];

      if (selectedLevel === 'country') {
        const byCountry: Record<string, LocationMetrics> = {};

        (data || []).forEach((row: any) => {
          const key = row.country_code;
          if (byCountry[key]) {
            byCountry[key].sessions += row.sessions || 0;
            byCountry[key].pageviews += row.pageviews || 0;
            byCountry[key].unique_visitors += row.unique_visitors || 0;
            byCountry[key].conversions += row.conversions || 0;
          } else {
            byCountry[key] = {
              country_code: row.country_code,
              country_name: row.country_name,
              sessions: row.sessions || 0,
              pageviews: row.pageviews || 0,
              unique_visitors: row.unique_visitors || 0,
              bounce_rate: row.bounce_rate || 0,
              avg_session_duration: row.avg_session_duration || 0,
              conversions: row.conversions || 0,
              conversion_rate: row.conversion_rate || 0,
            };
          }
        });

        aggregated = Object.values(byCountry);
      } else if (selectedLevel === 'region' && selectedCountry) {
        const byRegion: Record<string, LocationMetrics> = {};

        (data || [])
          .filter((row: any) => row.country_code === selectedCountry)
          .forEach((row: any) => {
            const key = row.region_code || 'unknown';
            if (byRegion[key]) {
              byRegion[key].sessions += row.sessions || 0;
              byRegion[key].pageviews += row.pageviews || 0;
              byRegion[key].unique_visitors += row.unique_visitors || 0;
              byRegion[key].conversions += row.conversions || 0;
            } else {
              byRegion[key] = {
                country_code: row.country_code,
                country_name: row.country_name,
                region_code: row.region_code,
                region_name: row.region_name,
                sessions: row.sessions || 0,
                pageviews: row.pageviews || 0,
                unique_visitors: row.unique_visitors || 0,
                bounce_rate: row.bounce_rate || 0,
                avg_session_duration: row.avg_session_duration || 0,
                conversions: row.conversions || 0,
                conversion_rate: row.conversion_rate || 0,
              };
            }
          });

        aggregated = Object.values(byRegion);
      } else if (selectedLevel === 'city' && selectedCountry && selectedRegion) {
        const filtered = (data || []).filter(
          (row: any) =>
            row.country_code === selectedCountry && row.region_code === selectedRegion
        );

        aggregated = filtered.map((row: any) => ({
          country_code: row.country_code,
          country_name: row.country_name,
          region_code: row.region_code,
          region_name: row.region_name,
          city_name: row.city_name,
          latitude: row.latitude,
          longitude: row.longitude,
          sessions: row.sessions || 0,
          pageviews: row.pageviews || 0,
          unique_visitors: row.unique_visitors || 0,
          bounce_rate: row.bounce_rate || 0,
          avg_session_duration: row.avg_session_duration || 0,
          conversions: row.conversions || 0,
          conversion_rate: row.conversion_rate || 0,
        }));
      }

      // Calculate conversion rates and sort
      aggregated.forEach((loc: LocationMetrics) => {
        loc.conversion_rate = loc.sessions > 0
          ? (loc.conversions / loc.sessions) * 100
          : 0;
      });

      setLocations(aggregated.sort((a, b) => b.sessions - a.sessions));
    } catch (error) {
      console.error('Error loading geolocation data:', error);
      toast.error('Failed to load geolocation data');
    } finally {
      setLoading(false);
    }
  }

  async function loadMapData() {
    try {
      const date = dateRange.to.split('T')[0];

      // Get clusters for map visualization
      const response = await fetch(
        `/api/geolocation-lookup/clusters?site_id=${siteId}&date=${date}&zoom_level=3`
      );

      if (response.ok) {
        const { data } = await response.json();
        setMapData(data || []);
      }
    } catch (error) {
      console.error('Error loading map data:', error);
    }
  }

  async function loadHeatmapData() {
    try {
      const date = dateRange.to.split('T')[0];

      // Get heatmap density data
      const response = await fetch(
        `/api/geolocation-lookup/heatmap?site_id=${siteId}&date=${date}`
      );

      if (response.ok) {
        const { data } = await response.json();
        setHeatmapData(data || []);
      }
    } catch (error) {
      console.error('Error loading heatmap data:', error);
    }
  }

  const totalSessions = locations.reduce((sum, loc) => sum + loc.sessions, 0);
  const totalVisitors = locations.reduce((sum, loc) => sum + loc.unique_visitors, 0);
  const avgBounceRate = locations.length > 0
    ? locations.reduce((sum, loc) => sum + loc.bounce_rate, 0) / locations.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Set(locations.map((l) => l.country_code)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Unique Visitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalVisitors.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSessions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Bounce Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgBounceRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="map">
        <TabsList>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>

        {/* Map View Tab */}
        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                World Map
              </CardTitle>
              <CardDescription>
                Geographic distribution of your visitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-96 rounded-lg border bg-gray-50">
                <GeolocationMap
                  data={mapData}
                  heatmapData={heatmapData}
                  onLocationSelect={(location) => {
                    if (selectedLevel === 'country') {
                      setSelectedCountry(location.country_code);
                      setSelectedLevel('region');
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Heatmap Tab */}
        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visitor Density Heatmap</CardTitle>
              <CardDescription>
                Geographic intensity of visitor traffic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-96 rounded-lg border bg-gray-50 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Heatmap visualization loading...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Table Tab */}
        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {selectedLevel === 'country'
                      ? 'Countries'
                      : selectedLevel === 'region'
                        ? 'Regions'
                        : 'Cities'}
                  </CardTitle>
                  {selectedCountry && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCountry(undefined);
                          setSelectedLevel('country');
                        }}
                      >
                        Back to Countries
                      </Button>
                      {selectedRegion && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRegion(undefined)}
                        >
                          Back to Regions
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <ExportButton
                  config={{
                    reportType: 'geolocation',
                    data: locations,
                    siteId,
                    dateRange,
                    filename: `geolocation-${selectedLevel}`
                  }}
                  size="sm"
                  variant="outline"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading geolocation data...
                </div>
              ) : locations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No geolocation data available</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Visitors</TableHead>
                      <TableHead className="text-right">Bounce Rate</TableHead>
                      <TableHead className="text-right">Conv. Rate</TableHead>
                      {selectedLevel !== 'country' && (
                        <TableHead className="text-right">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.map((location, idx) => (
                      <TableRow
                        key={idx}
                        className={
                          selectedLevel !== 'country' ? 'cursor-pointer hover:bg-gray-50' : ''
                        }
                        onClick={() => {
                          if (selectedLevel === 'country') {
                            setSelectedCountry(location.country_code);
                            setSelectedLevel('region');
                          } else if (selectedLevel === 'region') {
                            setSelectedRegion(location.region_code);
                            setSelectedLevel('city');
                          }
                        }}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {selectedLevel === 'country'
                                ? `${location.country_name} (${location.country_code})`
                                : selectedLevel === 'region'
                                  ? `${location.region_name} (${location.region_code})`
                                  : location.city_name}
                            </div>
                            {selectedLevel === 'country' && (
                              <Badge variant="secondary" className="mt-1">
                                {location.country_code}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {location.sessions.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {location.unique_visitors.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {location.bounce_rate.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span
                            className={
                              location.conversion_rate >= 5 ? 'text-green-600' : ''
                            }
                          >
                            {location.conversion_rate.toFixed(2)}%
                          </span>
                        </TableCell>
                        {selectedLevel !== 'country' && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              Details
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
