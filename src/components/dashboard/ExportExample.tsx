/**
 * Example: How to use ExportButton in dashboard components
 * Task #6: Dataexport (CSV/Excel/JSON)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExportButton } from '@/components/dashboard/ExportButton';
import { supabase } from '@/integrations/supabase/client';

interface VisitData {
  id: string;
  started_at: string;
  duration_seconds: number;
  page_views: number;
  device_type: string;
  browser: string;
  referrer_domain: string;
}

export default function VisitsReport({ siteId }: { siteId: string }) {
  const [visits, setVisits] = useState<VisitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    to: new Date().toISOString()
  });

  useEffect(() => {
    loadVisits();
  }, [siteId]);

  async function loadVisits() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('site_id', siteId)
        .gte('started_at', dateRange.from)
        .lte('started_at', dateRange.to)
        .order('started_at', { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (error) {
      console.error('Error loading visits:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Visits Report</CardTitle>
          <ExportButton
            config={{
              reportType: 'visits',
              data: visits,
              siteId: siteId,
              dateRange: dateRange,
              filename: `visits-${siteId}-${new Date().toISOString().split('T')[0]}`
            }}
            size="sm"
            variant="outline"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              {visits.length.toLocaleString()} visits
            </p>
            {/* Your table/chart here */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * More examples for different report types:
 */

// Page Views Export
export function PageViewsReportWithExport({ siteId }: { siteId: string }) {
  const [pageViews, setPageViews] = useState<any[]>([]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Page Views</CardTitle>
          <ExportButton
            config={{
              reportType: 'page-views',
              data: pageViews,
              siteId,
              filename: 'page-views'
            }}
          />
        </div>
      </CardHeader>
      {/* ... */}
    </Card>
  );
}

// Referrers Export
export function ReferrersReportWithExport({ siteId }: { siteId: string }) {
  const [referrers, setReferrers] = useState<any[]>([]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Traffic Sources</CardTitle>
          <ExportButton
            config={{
              reportType: 'referrers',
              data: referrers,
              siteId,
              filename: 'traffic-sources'
            }}
          />
        </div>
      </CardHeader>
      {/* ... */}
    </Card>
  );
}

// AI Agents Export (Unique to CortIQ!)
export function AIAgentsReportWithExport({ siteId }: { siteId: string }) {
  const [agents, setAgents] = useState<any[]>([]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>AI Agent Traffic 🤖</CardTitle>
          <ExportButton
            config={{
              reportType: 'ai-agents',
              data: agents,
              siteId,
              filename: 'ai-agent-traffic'
            }}
          />
        </div>
      </CardHeader>
      {/* ... */}
    </Card>
  );
}

// Conversions Export
export function ConversionsReportWithExport({ siteId }: { siteId: string }) {
  const [conversions, setConversions] = useState<any[]>([]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Conversions</CardTitle>
          <ExportButton
            config={{
              reportType: 'conversions',
              data: conversions,
              siteId,
              filename: 'conversions'
            }}
          />
        </div>
      </CardHeader>
      {/* ... */}
    </Card>
  );
}

// Heatmaps Export
export function HeatmapsReportWithExport({ siteId, pageUrl }: { siteId: string; pageUrl?: string }) {
  const [heatmapData, setHeatmapData] = useState<any[]>([]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Heatmap Data</CardTitle>
          <ExportButton
            config={{
              reportType: 'heatmaps',
              data: heatmapData,
              siteId,
              filters: { pageUrl },
              filename: 'heatmap-clicks'
            }}
          />
        </div>
      </CardHeader>
      {/* ... */}
    </Card>
  );
}
