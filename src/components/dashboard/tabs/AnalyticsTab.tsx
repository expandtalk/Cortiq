import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeviceBreakdown } from '@/components/dashboard/DeviceBreakdown';
import { PageFunnelAnalyzer } from '@/components/dashboard/PageFunnelAnalyzer';
import { TrafficSourcesAnalysis } from '@/components/dashboard/TrafficSourcesAnalysis';
import { TopPagesData } from '@/components/dashboard/TopPagesData';
import { useSites } from '@/hooks/useSites';
import type { Analytics } from '@/types/dashboard';
import type { DateRange } from 'react-day-picker';

interface AnalyticsTabProps {
  analytics: Analytics | null;
  dateRange?: DateRange;
}

export function AnalyticsTab({ analytics, dateRange }: AnalyticsTabProps) {
  const { selectedSite } = useSites();

  const startDate = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : '';
  const endDateRaw = dateRange?.to ? dateRange.to : undefined;
  const today = new Date();
  const endDate = endDateRaw ? new Date(Math.min(endDateRaw.getTime(), today.getTime())).toISOString().split('T')[0] : '';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Traffic Sources from Google Analytics */}
      {selectedSite && (
        <TrafficSourcesAnalysis 
          siteId={selectedSite.id} 
          startDate={startDate} 
          endDate={endDate} 
          selectedSite={selectedSite}
        />
      )}

      {/* Funnel Analysis */}
      {selectedSite && (
        <PageFunnelAnalyzer siteId={selectedSite.id} />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {analytics && <DeviceBreakdown deviceBreakdown={analytics.deviceBreakdown} />}

        <Card>
          <CardHeader>
            <CardTitle>Prestanda-metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• Trafikkällor: ✅ Implementerat (Google Analytics)</p>
              <p>• Konverteringsrate: ✅ Implementerat (Funnel Analyzer)</p>
              <p>• Formulär-analys: ✅ Implementerat (Funnel Analyzer)</p>
              <p>• Laddningstid: Kommer implementeras</p>
              <p>• Core Web Vitals: Kommer implementeras</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}