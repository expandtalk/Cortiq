import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AttributionBySource {
  source: string;
  cortiq: number;
  quality: number;
}

export interface AttributionGapData {
  cortiqConversions: number;
  hubspotMQLs: number;
  gapPercent: number;
  pendingUpload: number;
  uploaded: number;
  bySource: AttributionBySource[];
  periodDays: number;
}

export function useAttributionGap(siteId: string, days = 30) {
  return useQuery({
    queryKey: ['attribution-gap', siteId, days],
    queryFn: async (): Promise<AttributionGapData> => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data: convEvents, error } = await supabase
        .from('conversion_events')
        .select('id, lead_quality, upload_status, created_at')
        .eq('site_id', siteId)
        .gte('created_at', since);

      if (error) throw error;

      const events = convEvents || [];
      const cortiqConversions = events.length;
      const hubspotMQLs = events.filter(e =>
        e.lead_quality === 'Priority' || e.lead_quality === 'Qualified'
      ).length;

      const gapPercent = cortiqConversions > 0
        ? Math.round(((cortiqConversions - hubspotMQLs) / cortiqConversions) * 100)
        : 0;

      // Group by UTM source via tracking_sessions join
      // Simplified: group by whether lead_quality is set
      const bySource: AttributionBySource[] = [
        {
          source: 'Classified (HubSpot)',
          cortiq: events.filter(e => e.lead_quality).length,
          quality: events.filter(e => e.lead_quality === 'Priority' || e.lead_quality === 'Qualified').length,
        },
        {
          source: 'Unclassified',
          cortiq: events.filter(e => !e.lead_quality).length,
          quality: 0,
        },
      ];

      return {
        cortiqConversions,
        hubspotMQLs,
        gapPercent,
        pendingUpload: events.filter(e => e.upload_status === 'pending').length,
        uploaded: events.filter(e => e.upload_status === 'uploaded').length,
        bySource,
        periodDays: days,
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!siteId,
  });
}
