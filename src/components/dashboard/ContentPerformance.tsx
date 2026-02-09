/**
 * Content Performance Dashboard
 * Task #10: Content Tracking
 *
 * Track impressions, clicks, and CTR for specific content elements
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
import { Eye, MousePointer, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface ContentMetrics {
  content_id: string;
  content_name: string;
  content_type: string;
  impressions: number;
  clicks: number;
  hovers: number;
  ctr: number;
}

interface ContentPerformanceProps {
  siteId: string;
  dateRange: { from: string; to: string };
}

export function ContentPerformance({ siteId, dateRange }: ContentPerformanceProps) {
  const [content, setContent] = useState<ContentMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContentPerformance();
  }, [siteId, dateRange]);

  async function loadContentPerformance() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('content_performance')
        .select('*')
        .eq('site_id', siteId)
        .gte('date', dateRange.from.split('T')[0])
        .lte('date', dateRange.to.split('T')[0]);

      if (error) throw error;

      // Aggregate by content_id
      const aggregated = (data || []).reduce((acc, item) => {
        const existing = acc.find((c: any) => c.content_id === item.content_id);
        if (existing) {
          existing.impressions += item.impressions;
          existing.clicks += item.clicks;
          existing.hovers += item.hovers;
        } else {
          acc.push({
            content_id: item.content_id,
            content_name: item.content_name,
            content_type: item.content_type,
            impressions: item.impressions,
            clicks: item.clicks,
            hovers: item.hovers,
            ctr: 0
          });
        }
        return acc;
      }, [] as ContentMetrics[]);

      // Calculate CTR
      aggregated.forEach((item: ContentMetrics) => {
        item.ctr = item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0;
      });

      // Sort by impressions
      aggregated.sort((a: ContentMetrics, b: ContentMetrics) => b.impressions - a.impressions);

      setContent(aggregated);
    } catch (error) {
      console.error('Error loading content performance:', error);
      toast.error('Failed to load content performance');
    } finally {
      setLoading(false);
    }
  }

  const totalImpressions = content.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = content.reduce((sum, c) => sum + c.clicks, 0);
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Total Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalImpressions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              Total Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalClicks.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Average CTR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgCTR.toFixed(2)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Content Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Content Performance</CardTitle>
            <ExportButton
              config={{
                reportType: 'content-performance',
                data: content,
                siteId,
                dateRange,
                filename: 'content-performance'
              }}
              size="sm"
              variant="outline"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading content performance...
            </div>
          ) : content.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No content tracked yet</p>
              <p className="text-sm mt-2">
                Add <code className="bg-muted px-2 py-1 rounded">data-cortiq-content="id"</code> to elements
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Hovers</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.map((item) => (
                  <TableRow key={item.content_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.content_name || item.content_id}</p>
                        <code className="text-xs text-muted-foreground">{item.content_id}</code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.content_type || 'unknown'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{item.impressions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{item.clicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{item.hovers.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={item.ctr >= 5 ? 'text-green-600 font-medium' : ''}>
                        {item.ctr.toFixed(2)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Implementation Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Track Content Elements</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Add the <code className="bg-muted px-2 py-1 rounded">data-cortiq-content</code> attribute:
            </p>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`<!-- Banner tracking -->
<div data-cortiq-content="hero-banner"
     data-cortiq-content-name="Hero CTA Banner"
     data-cortiq-content-type="banner">
  <button>Get Started</button>
</div>

<!-- CTA button tracking -->
<button data-cortiq-content="signup-cta"
        data-cortiq-content-name="Sign Up Button"
        data-cortiq-content-type="cta">
  Sign Up Now
</button>

<!-- Video tracking -->
<video data-cortiq-content="product-demo"
       data-cortiq-content-name="Product Demo Video"
       data-cortiq-content-type="video">
  <source src="demo.mp4">
</video>`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Tracked Events</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Impression:</strong> Element enters viewport</li>
              <li>• <strong>Click:</strong> Element is clicked</li>
              <li>• <strong>Hover:</strong> Mouse hovers over element (>1 second)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
