/**
 * Campaign Dashboard
 * Task #14: UTM Campaign Tracking
 *
 * Track and analyze UTM parameters for marketing campaigns
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExportButton } from './ExportButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Target } from 'lucide-react';
import { toast } from 'sonner';

interface CampaignMetrics {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  sessions: number;
  pageviews: number;
  conversions: number;
  conversion_rate: number;
}

interface CampaignDashboardProps {
  siteId: string;
  dateRange: { from: string; to: string };
}

export function CampaignDashboard({ siteId, dateRange }: CampaignDashboardProps) {
  const [campaigns, setCampaigns] = useState<CampaignMetrics[]>([]);
  const [topSources, setTopSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaignData();
  }, [siteId, dateRange]);

  async function loadCampaignData() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('campaign_performance')
        .select('*')
        .eq('site_id', siteId)
        .gte('date', dateRange.from.split('T')[0])
        .lte('date', dateRange.to.split('T')[0]);

      if (error) throw error;

      // Aggregate by campaign
      const aggregated = (data || []).reduce((acc: any[], item: any) => {
        const key = `${item.utm_source}|${item.utm_medium}|${item.utm_campaign}`;
        const existing = acc.find((c) => c.key === key);

        if (existing) {
          existing.sessions += item.sessions;
          existing.pageviews += item.pageviews;
          existing.conversions += item.conversions;
        } else {
          acc.push({
            key,
            utm_source: item.utm_source,
            utm_medium: item.utm_medium,
            utm_campaign: item.utm_campaign,
            sessions: item.sessions,
            pageviews: item.pageviews,
            conversions: item.conversions,
            conversion_rate: 0
          });
        }
        return acc;
      }, []);

      // Calculate conversion rates
      aggregated.forEach((campaign: any) => {
        campaign.conversion_rate = campaign.sessions > 0
          ? (campaign.conversions / campaign.sessions) * 100
          : 0;
      });

      setCampaigns(aggregated.sort((a, b) => b.sessions - a.sessions));

      // Get top sources
      const sources = (data || []).reduce((acc: any[], item: any) => {
        const existing = acc.find((s) => s.source === item.utm_source);
        if (existing) {
          existing.sessions += item.sessions;
          existing.conversions += item.conversions;
        } else {
          acc.push({
            source: item.utm_source,
            sessions: item.sessions,
            conversions: item.conversions
          });
        }
        return acc;
      }, []);

      setTopSources(sources.sort((a, b) => b.sessions - a.sessions).slice(0, 5));
    } catch (error) {
      console.error('Error loading campaign data:', error);
      toast.error('Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  }

  const totalSessions = campaigns.reduce((sum, c) => sum + c.sessions, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const avgConversionRate = totalSessions > 0 ? (totalConversions / totalSessions) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Active Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{new Set((campaigns ?? []).map(c => c.utm_campaign)).size}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Campaign Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSessions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgConversionRate.toFixed(2)}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="sources">Traffic Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Campaign Performance</CardTitle>
                <ExportButton
                  config={{
                    reportType: 'campaigns',
                    data: campaigns,
                    siteId,
                    dateRange,
                    filename: 'campaign-performance'
                  }}
                  size="sm"
                  variant="outline"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading campaigns...
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No campaigns tracked yet</p>
                  <p className="text-sm">UTM parameters will appear here</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Source / Medium</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Pageviews</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right">Conv. Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Badge variant="outline">{campaign.utm_campaign}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{campaign.utm_source}</div>
                            <div className="text-muted-foreground">{campaign.utm_medium}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{campaign.sessions.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{campaign.pageviews.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium">{campaign.conversions}</TableCell>
                        <TableCell className="text-right">
                          <span className={campaign.conversion_rate >= 5 ? 'text-green-600' : ''}>
                            {campaign.conversion_rate.toFixed(2)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">Conv. Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSources.map((source, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{source.source || 'Direct'}</TableCell>
                      <TableCell className="text-right">{source.sessions.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{source.conversions}</TableCell>
                      <TableCell className="text-right">
                        {((source.conversions / source.sessions) * 100).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
