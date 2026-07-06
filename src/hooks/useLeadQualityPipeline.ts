import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeadQualityStats {
  totalClassified: number;
  pending: number;
  uploaded: number;
  skippedNoConsent: number;
  skippedNoGclid: number;
  failed: number;
  lastUploadAt: string | null;
  priorityCount: number;
  qualifiedCount: number;
  challengeCount: number;
}

export function useLeadQualityPipeline(siteId: string) {
  return useQuery({
    queryKey: ['lead-quality-pipeline', siteId],
    queryFn: async (): Promise<LeadQualityStats> => {
      // Aggregated server-side (get_lead_quality_pipeline RPC) instead of pulling raw rows.
      const { data, error } = await supabase.rpc('get_lead_quality_pipeline', { p_site_id: siteId, p_days: 30 });
      if (error) throw error;

      const r = (Array.isArray(data) ? data[0] : data) ?? {};
      return {
        totalClassified: Number(r.total_classified ?? 0),
        pending: Number(r.pending ?? 0),
        uploaded: Number(r.uploaded ?? 0),
        skippedNoConsent: Number(r.skipped_no_consent ?? 0),
        skippedNoGclid: Number(r.skipped_no_gclid ?? 0),
        failed: Number(r.failed ?? 0),
        lastUploadAt: r.last_upload_at ?? null,
        priorityCount: Number(r.priority_count ?? 0),
        qualifiedCount: Number(r.qualified_count ?? 0),
        challengeCount: Number(r.challenge_count ?? 0),
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!siteId,
  });
}
