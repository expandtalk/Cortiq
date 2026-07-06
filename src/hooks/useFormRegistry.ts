import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FormRegistryEntry {
  id: string;
  site_id: string;
  form_guid: string;
  form_type: string;
  form_label: string | null;
  detected_url: string | null;
  conversion_goal_id: string | null;
  is_primary_conversion: boolean;
  detected_at: string;
  last_seen_at: string;
}

export function useFormRegistry(siteId: string) {
  return useQuery({
    queryKey: ['form-registry', siteId],
    queryFn: async (): Promise<FormRegistryEntry[]> => {
      const { data, error } = await supabase
        .from('form_registry')
        .select('*')
        .eq('site_id', siteId)
        .order('last_seen_at', { ascending: false });
      if (error) throw error;
      return (data || []) as FormRegistryEntry[];
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!siteId,
  });
}

export function useUpdateFormRegistry(siteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FormRegistryEntry> }) => {
      const { error } = await supabase
        .from('form_registry')
        .update(updates)
        .eq('id', id)
        .eq('site_id', siteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-registry', siteId] });
    },
  });
}
