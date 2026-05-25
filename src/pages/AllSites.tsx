/**
 * All Sites Dashboard - Multi-site Overview
 * Task #9: Multi-site Dashboard (All Websites)
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PublicNavigation from '@/components/PublicNavigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ExternalLink, Minus } from 'lucide-react';
import { toast } from 'sonner';

interface SiteSummary {
  id: string;
  name: string;
  domain: string;
  is_active: boolean;
  visits: number;
  pageviews: number;
  bounce_rate: number;
  avg_session_duration: number;
  conversions: number;
  prev_visits: number;
}

export default function AllSites() {
  const [sites, setSites] = useState<SiteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [dateRange] = useState({
    from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    to: now.toISOString(),
    prevFrom: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    prevTo:   new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  useEffect(() => {
    loadAllSites();
  }, []);

  async function loadAllSites() {
    try {
      setLoading(true);

      // Fetch all sites for the user's company
      const { data: sitesData, error: sitesError } = await supabase
        .from('sites')
        .select('id, name, domain, is_active')
        .order('name');

      if (sitesError) throw sitesError;

      // Fetch analytics for each site
      const summaries = await Promise.all(
        (sitesData || []).map(async (site) => {
          const { data: sessions } = await supabase
            .from('tracking_sessions')
            .select('duration_seconds, page_views')
            .eq('site_id', site.id)
            .gte('started_at', dateRange.from)
            .lte('started_at', dateRange.to);

          const { data: pageViews } = await supabase
            .from('page_views')
            .select('id')
            .eq('site_id', site.id)
            .gte('viewed_at', dateRange.from)
            .lte('viewed_at', dateRange.to);

          const { data: conversions } = await supabase
            .from('conversion_events')
            .select('id')
            .eq('site_id', site.id)
            .gte('created_at', dateRange.from)
            .lte('created_at', dateRange.to);

          const { data: prevSessions } = await supabase
            .from('tracking_sessions')
            .select('id')
            .eq('site_id', site.id)
            .gte('started_at', dateRange.prevFrom)
            .lte('started_at', dateRange.prevTo);

          const visits = sessions?.length || 0;
          const totalPageviews = pageViews?.length || 0;
          const bounces = sessions?.filter(s => s.page_views === 1).length || 0;
          const avgDuration = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / (visits || 1);
          const prevVisits = prevSessions?.length || 0;

          return {
            ...site,
            visits,
            pageviews: totalPageviews,
            bounce_rate: visits > 0 ? (bounces / visits) * 100 : 0,
            avg_session_duration: avgDuration,
            conversions: conversions?.length || 0,
            prev_visits: prevVisits,
          };
        })
      );

      setSites(summaries);
    } catch (error) {
      console.error('Error loading sites:', error);
      toast.error('Failed to load sites');
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  }

  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }

  const totalVisits = sites.reduce((sum, s) => sum + s.visits, 0);
  const totalPageviews = sites.reduce((sum, s) => sum + s.pageviews, 0);
  const totalConversions = sites.reduce((sum, s) => sum + s.conversions, 0);
  const avgBounceRate = sites.length > 0
    ? sites.reduce((sum, s) => sum + s.bounce_rate, 0) / sites.length
    : 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-subtle">
        <PublicNavigation />

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gradient-primary mb-2">
                All Websites
              </h1>
              <p className="text-muted-foreground">
                Overview of all your sites in one place
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Sites
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{sites.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sites.filter(s => s.is_active).length} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Visits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatNumber(totalVisits)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last 30 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Pageviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatNumber(totalPageviews)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalVisits > 0 ? (totalPageviews / totalVisits).toFixed(1) : 0} per visit
                  </p>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all sites
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sites Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Sites</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading sites...
                  </div>
                ) : sites.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No sites found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Site</TableHead>
                        <TableHead className="text-right">Visits</TableHead>
                        <TableHead className="text-right">Pageviews</TableHead>
                        <TableHead className="text-right">Bounce Rate</TableHead>
                        <TableHead className="text-right">Avg. Duration</TableHead>
                        <TableHead className="text-right">Conversions</TableHead>
                        <TableHead className="text-right">Trend</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sites.map((site) => (
                        <TableRow key={site.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{site.name}</p>
                              <p className="text-sm text-muted-foreground">{site.domain}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatNumber(site.visits)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(site.pageviews)}
                          </TableCell>
                          <TableCell className="text-right">
                            {site.bounce_rate.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right">
                            {formatDuration(site.avg_session_duration)}
                          </TableCell>
                          <TableCell className="text-right">
                            {site.conversions}
                          </TableCell>
                          <TableCell className="text-right">
                            {(() => {
                              if (site.prev_visits === 0 && site.visits === 0) {
                                return <span className="text-muted-foreground"><Minus className="h-4 w-4 inline" /></span>;
                              }
                              if (site.prev_visits === 0) {
                                return <span className="text-green-500 flex items-center justify-end gap-1"><TrendingUp className="h-4 w-4" />New</span>;
                              }
                              const pct = ((site.visits - site.prev_visits) / site.prev_visits) * 100;
                              return pct >= 0 ? (
                                <span className="text-green-500 flex items-center justify-end gap-1"><TrendingUp className="h-4 w-4" />+{pct.toFixed(1)}%</span>
                              ) : (
                                <span className="text-red-500 flex items-center justify-end gap-1"><TrendingDown className="h-4 w-4" />{pct.toFixed(1)}%</span>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to={`/dashboard?site=${site.id}`}>
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
