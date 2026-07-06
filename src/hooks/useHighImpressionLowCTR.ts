import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LowCTRPage {
  url: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export function useHighImpressionLowCTR(
  siteId: string | null,
  minImpressions = 500,
  maxCtr = 0.005,        // 0.5% — catches both 0.05% and realistic low-CTR pages
) {
  return useQuery({
    queryKey: ['high-impression-low-ctr', siteId, minImpressions, maxCtr],
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<LowCTRPage[]> => {
      const { data, error } = await supabase
        .from('gsc_data')
        .select('value, impressions, clicks, ctr, position')
        .eq('site_id', siteId!)
        .eq('dimension', 'page')
        .gte('impressions', minImpressions)
        .lte('ctr', maxCtr)
        .order('impressions', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data ?? []).map(row => ({
        url: row.value,
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: Number(row.ctr),
        position: Number(row.position),
      }));
    },
  });
}
