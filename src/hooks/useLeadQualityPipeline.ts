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
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('conversion_events')
        .select('upload_status, lead_quality, uploaded_to_ads_at')
        .eq('site_id', siteId)
        .gte('created_at', thirtyDaysAgo);

      if (error) throw error;

      const events = data || [];
      const classified = events.filter(e => e.lead_quality !== null);
      const uploaded = events.filter(e => e.upload_status === 'uploaded');
      const lastUpload = uploaded
        .sort((a, b) => (b.uploaded_to_ads_at || '').localeCompare(a.uploaded_to_ads_at || ''))
        .find(e => e.uploaded_to_ads_at);

      return {
        totalClassified: classified.length,
        pending: events.filter(e => e.upload_status === 'pending').length,
        uploaded: uploaded.length,
        skippedNoConsent: events.filter(e => e.upload_status === 'skipped_no_consent').length,
        skippedNoGclid: events.filter(e => e.upload_status === 'skipped_no_gclid').length,
        failed: events.filter(e => e.upload_status === 'failed').length,
        lastUploadAt: lastUpload?.uploaded_to_ads_at ?? null,
        priorityCount: classified.filter(e => e.lead_quality === 'Priority').length,
        qualifiedCount: classified.filter(e => e.lead_quality === 'Qualified').length,
        challengeCount: classified.filter(e => e.lead_quality === 'Challenge').length,
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!siteId,
  });
}
