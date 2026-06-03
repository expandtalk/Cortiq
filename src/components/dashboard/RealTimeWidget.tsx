import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';
import { Activity, Eye, Smartphone, Monitor, Tablet, RefreshCw } from 'lucide-react';

interface RealTimeWidgetProps {
  siteId: string;
}

export function RealTimeWidget({ siteId }: RealTimeWidgetProps) {
  const { stats, loading, error, refresh } = useRealTimeAnalytics(siteId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <CardTitle>Real-time</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <CardTitle>Real-time</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Could not load real-time data</p>
        </CardContent>
      </Card>
    );
  }

  const totalSessions = stats.deviceBreakdown.desktop + stats.deviceBreakdown.mobile + stats.deviceBreakdown.tablet;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <CardTitle>Real-time</CardTitle>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
          </div>
        </div>
        <CardDescription>
          Last updated: {stats.lastUpdated.toLocaleTimeString('sv-SE')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Visitors */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Active visitors</span>
          </div>
          <Badge variant={stats.activeVisitors > 0 ? "default" : "secondary"}>
            {stats.activeVisitors}
          </Badge>
        </div>

        {/* Page Views Today */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Page views today</span>
          <span className="font-semibold">{stats.pageViewsToday.toLocaleString('sv-SE')}</span>
        </div>

        {/* Top Page */}
        {stats.topPage && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Top page today</p>
            <div className="text-xs bg-muted p-2 rounded">
              <p className="font-medium truncate">{stats.topPage.url}</p>
              <p className="text-muted-foreground">{stats.topPage.views} views</p>
            </div>
          </div>
        )}

        {/* Device Breakdown */}
        {totalSessions > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Device breakdown today</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1">
                  <Monitor className="h-3 w-3" />
                  <span>Desktop</span>
                </div>
                <span>{Math.round((stats.deviceBreakdown.desktop / totalSessions) * 100)}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1">
                  <Smartphone className="h-3 w-3" />
                  <span>Mobile</span>
                </div>
                <span>{Math.round((stats.deviceBreakdown.mobile / totalSessions) * 100)}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1">
                  <Tablet className="h-3 w-3" />
                  <span>Tablet</span>
                </div>
                <span>{Math.round((stats.deviceBreakdown.tablet / totalSessions) * 100)}%</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}