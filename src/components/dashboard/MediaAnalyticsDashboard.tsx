/**
 * Media Analytics Dashboard
 * Task #22: Media Analytics (Video, Audio, Documents)
 *
 * Comprehensive analytics for media content engagement
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
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, Pause, Video, Music, FileText, Image, TrendingUp, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface MediaEngagement {
  media_id: string;
  media_type: string;
  media_title: string;
  date: string;
  total_plays: number;
  total_sessions: number;
  unique_viewers: number;
  average_watch_time: number;
  total_watch_time: number;
  completion_rate: number;
  pause_count: number;
  seek_count: number;
  error_count: number;
}

interface MediaPerformance {
  hour: number;
  plays: number;
  viewers: number;
  total_watch_time: number;
  average_watch_time: number;
}

interface QualityDistribution {
  quality: string;
  views: number;
  average_watch_time: number;
  completion_rate: number;
}

interface MediaAnalyticsDashboardProps {
  siteId: string;
  dateRange: { from: string; to: string };
}

const MEDIA_TYPE_ICONS: Record<string, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
};

export function MediaAnalyticsDashboard({
  siteId,
  dateRange,
}: MediaAnalyticsDashboardProps) {
  const [mediaEngagement, setMediaEngagement] = useState<MediaEngagement[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string>();
  const [timeline, setTimeline] = useState<MediaPerformance[]>([]);
  const [qualityData, setQualityData] = useState<QualityDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMediaData();
  }, [siteId, dateRange, selectedMedia]);

  async function loadMediaData() {
    try {
      setLoading(true);

      // Load engagement data
      const engagementResponse = await fetch(
        `/api/media-analytics/engagement?site_id=${siteId}&from=${dateRange.from.split('T')[0]}&to=${dateRange.to.split('T')[0]}`
      );

      if (engagementResponse.ok) {
        const { data } = await engagementResponse.json();
        setMediaEngagement(data || []);
      }

      // Load timeline for selected media
      if (selectedMedia) {
        const timelineResponse = await fetch(
          `/api/media-analytics/timeline?site_id=${siteId}&media_id=${selectedMedia}&date=${dateRange.to.split('T')[0]}`
        );

        if (timelineResponse.ok) {
          const { data } = await timelineResponse.json();
          setTimeline(data || []);
        }

        // Load quality distribution
        const qualityResponse = await fetch(
          `/api/media-analytics/quality?site_id=${siteId}&media_id=${selectedMedia}&from=${dateRange.from.split('T')[0]}&to=${dateRange.to.split('T')[0]}`
        );

        if (qualityResponse.ok) {
          const { data } = await qualityResponse.json();
          setQualityData(data || []);
        }
      }
    } catch (error) {
      console.error('Error loading media data:', error);
      toast.error('Failed to load media analytics');
    } finally {
      setLoading(false);
    }
  }

  const totalPlays = mediaEngagement.reduce((sum, m) => sum + m.total_plays, 0);
  const totalViewers = mediaEngagement.reduce((sum, m) => sum + m.unique_viewers, 0);
  const avgCompletion = mediaEngagement.length > 0
    ? mediaEngagement.reduce((sum, m) => sum + m.completion_rate, 0) / mediaEngagement.length
    : 0;
  const avgWatchTime = mediaEngagement.length > 0
    ? Math.round(mediaEngagement.reduce((sum, m) => sum + m.average_watch_time, 0) / mediaEngagement.length)
    : 0;

  const selectedMediaData = selectedMedia
    ? mediaEngagement.find((m) => m.media_id === selectedMedia)
    : undefined;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Play className="h-4 w-4" />
              Total Plays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPlays.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Unique Viewers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalViewers.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg. Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgCompletion.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg. Watch Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgWatchTime}s</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Media Overview</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedMedia}>Media Details</TabsTrigger>
          <TabsTrigger value="quality" disabled={!selectedMedia}>Quality Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Media Performance</CardTitle>
                  <CardDescription>
                    All media content engagement metrics
                  </CardDescription>
                </div>
                <ExportButton
                  config={{
                    reportType: 'media',
                    data: mediaEngagement,
                    siteId,
                    dateRange,
                    filename: 'media-analytics'
                  }}
                  size="sm"
                  variant="outline"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading media data...
                </div>
              ) : mediaEngagement.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No media tracked yet</p>
                  <p className="text-sm">Media analytics will appear here</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Media</TableHead>
                      <TableHead className="text-right">Plays</TableHead>
                      <TableHead className="text-right">Viewers</TableHead>
                      <TableHead className="text-right">Avg. Watch</TableHead>
                      <TableHead className="text-right">Completion</TableHead>
                      <TableHead className="text-right">Engagement</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mediaEngagement.map((media) => {
                      const engagementScore =
                        (media.completion_rate * 0.5 +
                          (Math.min(media.average_watch_time / 60, 100) * 0.3) +
                          (Math.min(media.total_sessions / 10, 100) * 0.2)) /
                        100;

                      return (
                        <TableRow
                          key={media.media_id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => setSelectedMedia(media.media_id)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {MEDIA_TYPE_ICONS[media.media_type] || <Video className="h-4 w-4" />}
                              <div>
                                <div className="font-medium">{media.media_title || media.media_id}</div>
                                <Badge variant="secondary" className="text-xs">
                                  {media.media_type}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {media.total_plays.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {media.unique_viewers.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {media.average_watch_time}s
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <span className={media.completion_rate >= 50 ? 'text-green-600' : ''}>
                              {media.completion_rate.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="text-sm">
                              <span className={engagementScore >= 0.7 ? 'text-green-600' : 'text-orange-600'}>
                                {(engagementScore * 100).toFixed(0)}/100
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMedia(media.media_id);
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          {selectedMediaData && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Performance Timeline</CardTitle>
                  <CardDescription>
                    Hourly engagement for {selectedMediaData.media_title || selectedMediaData.media_id}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {timeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={timeline}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" label={{ value: 'Hour', position: 'insideBottom', offset: -5 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="plays"
                          stroke="#8884d8"
                          name="Plays"
                        />
                        <Line
                          type="monotone"
                          dataKey="average_watch_time"
                          stroke="#82ca9d"
                          name="Avg Watch (s)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No timeline data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{selectedMediaData.total_plays}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{selectedMediaData.completion_rate.toFixed(1)}%</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{selectedMediaData.total_sessions}</div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          {selectedMediaData && (
            <Card>
              <CardHeader>
                <CardTitle>Quality Distribution</CardTitle>
                <CardDescription>
                  Performance by video quality/bitrate
                </CardDescription>
              </CardHeader>
              <CardContent>
                {qualityData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={qualityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="quality" />
                        <YAxis yAxisId="left" label={{ value: 'Views', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: 'Completion %', angle: 90, position: 'insideRight' }} />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="views" fill="#8884d8" name="Views" />
                        <Bar yAxisId="right" dataKey="completion_rate" fill="#82ca9d" name="Completion %" />
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="mt-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Quality</TableHead>
                            <TableHead className="text-right">Views</TableHead>
                            <TableHead className="text-right">Avg. Watch</TableHead>
                            <TableHead className="text-right">Completion</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {qualityData.map((quality) => (
                            <TableRow key={quality.quality}>
                              <TableCell className="font-medium">{quality.quality}</TableCell>
                              <TableCell className="text-right">{quality.views}</TableCell>
                              <TableCell className="text-right">{quality.average_watch_time}s</TableCell>
                              <TableCell className="text-right">
                                <span className={quality.completion_rate >= 50 ? 'text-green-600' : ''}>
                                  {quality.completion_rate.toFixed(1)}%
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No quality data available
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
