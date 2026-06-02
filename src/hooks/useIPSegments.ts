import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface IPSegment {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  category: 'own_company' | 'competitor' | 'partner' | 'exclude' | 'custom';
  ip_ranges: string[];
  color: string;
  intranet_mode: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IPSegmentStats {
  segment_name: string;
  segment_category: string;
  segment_color: string;
  total_events: number;
  unique_sessions: number;
  page_views: number;
  conversions: number;
  top_pages: Array<{ url: string; views: number }>;
}

export function useIPSegments(companyId: string) {
  return useQuery<IPSegment[]>({
    queryKey: ['ip-segments', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ip_segments')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!companyId,
  });
}

export function useIPSegmentStats(companyId: string, from?: Date, to?: Date) {
  return useQuery<IPSegmentStats[]>({
    queryKey: ['ip-segment-stats', companyId, from?.toISOString(), to?.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_ip_segment_stats', {
        p_company_id: companyId,
        p_from: (from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).toISOString(),
        p_to:   (to   ?? new Date()).toISOString(),
      });
      if (error) throw error;
      return (data ?? []) as IPSegmentStats[];
    },
    enabled: !!companyId,
  });
}

export function useSaveIPSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (seg: Omit<IPSegment, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
      if (seg.id) {
        const { error } = await supabase
          .from('ip_segments')
          .update({
            name:          seg.name,
            description:   seg.description,
            category:      seg.category,
            ip_ranges:     seg.ip_ranges,
            color:         seg.color,
            intranet_mode: seg.intranet_mode,
            is_active:     seg.is_active,
          })
          .eq('id', seg.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ip_segments').insert({
          company_id:    seg.company_id,
          name:          seg.name,
          description:   seg.description,
          category:      seg.category,
          ip_ranges:     seg.ip_ranges,
          color:         seg.color,
          intranet_mode: seg.intranet_mode,
          is_active:     seg.is_active,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['ip-segments', vars.company_id] }),
  });
}

export function useDeleteIPSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, companyId }: { id: string; companyId: string }) => {
      const { error } = await supabase.from('ip_segments').delete().eq('id', id);
      if (error) throw error;
      return companyId;
    },
    onSuccess: (companyId) => qc.invalidateQueries({ queryKey: ['ip-segments', companyId] }),
  });
}
