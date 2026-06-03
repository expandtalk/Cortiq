import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useServerLogAnalytics } from '@/hooks/useServerLogAnalytics';
import { BarChart3, Globe, Monitor, TrendingUp, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ServerLogAnalyticsProps {
  siteId: string;
  dateRange: { from: Date; to: Date };
}

export function ServerLogAnalytics({ siteId, dateRange }: ServerLogAnalyticsProps) {
  const { data: analytics, isLoading } = useServerLogAnalytics(siteId, dateRange);

  if (isLoading) {
    return (
      <Card className="glass shadow-elegant">
        <CardHeader>
          <CardTitle>Server Log Analytics</CardTitle>
          <CardDescription>Cookie-free data from server logs</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!analytics || analytics.length === 0) {
    return (
      <Card className="glass shadow-elegant">
        <CardHeader>
          <CardTitle>Server Log Analytics</CardTitle>
          <CardDescription>Cookie-free data from server logs</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No data available. Import server logs to view statistics.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totalPageViews = analytics.reduce((sum, item) => sum + item.page_views, 0);
  const totalUniqueVisitors = analytics.reduce((sum, item) => sum + item.unique_visitors, 0);
  const avgLoadTime = Math.round(
    analytics.reduce((sum, item) => sum + (item.avg_load_time_ms || 0), 0) / analytics.length
  );

  // Device breakdown
  const deviceStats = analytics.reduce((acc, item) => {
    const device = item.device_type || 'unknown';
    acc[device] = (acc[device] || 0) + item.page_views;
    return acc;
  }, {} as Record<string, number>);

  // Browser breakdown
  const browserStats = analytics.reduce((acc, item) => {
    const browser = item.browser || 'unknown';
    acc[browser] = (acc[browser] || 0) + item.page_views;
    return acc;
  }, {} as Record<string, number>);

  // Country breakdown
  const countryStats = analytics.reduce((acc, item) => {
    const country = item.country_code || 'XX';
    acc[country] = (acc[country] || 0) + item.page_views;
    return acc;
  }, {} as Record<string, number>);

  // Top pages
  const pageStats = analytics.reduce((acc, item) => {
    acc[item.url] = (acc[item.url] || 0) + item.page_views;
    return acc;
  }, {} as Record<string, number>);

  const topPages = Object.entries(pageStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Status code breakdown
  const totalStatus2xx = analytics.reduce((sum, item) => sum + item.status_2xx, 0);
  const totalStatus4xx = analytics.reduce((sum, item) => sum + item.status_4xx, 0);
  const totalStatus5xx = analytics.reduce((sum, item) => sum + item.status_5xx, 0);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From server logs
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors (est.)</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUniqueVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Anonymized from IP
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Load Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgLoadTime}ms</div>
            <p className="text-xs text-muted-foreground">
              Performance data
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HTTP-status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-green-500">2xx:</span>
                <span className="font-bold">{totalStatus2xx}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-yellow-500">4xx:</span>
                <span className="font-bold">{totalStatus4xx}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-500">5xx:</span>
                <span className="font-bold">{totalStatus5xx}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device & Browser Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Monitor className="h-5 w-5" />
              <span>Device type</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(deviceStats).map(([device, count]) => (
                <div key={device} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{device}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${(count / totalPageViews) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Browsers</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(browserStats)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([browser, count]) => (
                  <div key={browser} className="flex justify-between items-center">
                    <span className="text-sm">{browser}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(count / totalPageViews) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages */}
      <Card className="glass shadow-elegant">
        <CardHeader>
          <CardTitle>Top Pages</CardTitle>
          <CardDescription>From server logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topPages.map(([url, count], index) => (
              <div key={url} className="flex justify-between items-center p-2 hover:bg-muted/50 rounded">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">{index + 1}</Badge>
                  <span className="text-sm font-mono">{url}</span>
                </div>
                <span className="text-sm font-semibold">{count} views</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Country Breakdown */}
      <Card className="glass shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Geographic Distribution</span>
          </CardTitle>
          <CardDescription>Anonymized from IP addresses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(countryStats)
              .sort(([, a], [, b]) => b - a)
              .map(([country, count]) => (
                <div key={country} className="text-center p-3 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold">{country}</div>
                  <div className="text-sm text-muted-foreground">{count} visits</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round((count / totalPageViews) * 100)}%
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
