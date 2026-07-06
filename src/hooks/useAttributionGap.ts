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
      // Aggregated server-side (get_attribution_gap RPC) instead of pulling raw rows.
      const { data, error } = await supabase.rpc('get_attribution_gap', { p_site_id: siteId, p_days: days });
      if (error) throw error;

      const r = (Array.isArray(data) ? data[0] : data) ?? {};
      const cortiqConversions = Number(r.cortiq_conversions ?? 0);
      const hubspotMQLs = Number(r.hubspot_mqls ?? 0);
      const classified = Number(r.classified_count ?? 0);
      const unclassified = Number(r.unclassified_count ?? 0);

      const gapPercent = cortiqConversions > 0
        ? Math.round(((cortiqConversions - hubspotMQLs) / cortiqConversions) * 100)
        : 0;

      const bySource: AttributionBySource[] = [
        { source: 'Classified (HubSpot)', cortiq: classified, quality: hubspotMQLs },
        { source: 'Unclassified', cortiq: unclassified, quality: 0 },
      ];

      return {
        cortiqConversions,
        hubspotMQLs,
        gapPercent,
        pendingUpload: Number(r.pending_upload ?? 0),
        uploaded: Number(r.uploaded ?? 0),
        bySource,
        periodDays: days,
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!siteId,
  });
}
