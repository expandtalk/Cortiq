import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AgentMacro {
  id: string;
  site_id: string;
  name: string;
  description: string | null;
  macro_type: 'browser_profile' | 'detection_rule' | 'tracking_config';
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useAgentMacros = (siteId: string | null) => {
  const queryClient = useQueryClient();

  const { data: macros, isLoading } = useQuery({
    queryKey: ['agent-macros', siteId],
    queryFn: async () => {
      if (!siteId) return [];
      
      const { data, error } = await supabase
        .from('agent_macros')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AgentMacro[];
    },
    enabled: !!siteId,
  });

  const createMacro = useMutation({
    mutationFn: async (macro: Omit<AgentMacro, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('agent_macros')
        .insert(macro)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-macros', siteId] });
      toast.success('Makro skapat');
    },
    onError: (error: any) => {
      toast.error(`Misslyckades skapa makro: ${error.message}`);
    },
  });

  const updateMacro = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AgentMacro> & { id: string }) => {
      const { data, error } = await supabase
        .from('agent_macros')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-macros', siteId] });
      toast.success('Makro uppdaterat');
    },
    onError: (error: any) => {
      toast.error(`Misslyckades uppdatera makro: ${error.message}`);
    },
  });

  const deleteMacro = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agent_macros')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-macros', siteId] });
      toast.success('Makro borttaget');
    },
    onError: (error: any) => {
      toast.error(`Misslyckades ta bort makro: ${error.message}`);
    },
  });

  const toggleMacro = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('agent_macros')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-macros', siteId] });
    },
    onError: (error: any) => {
      toast.error(`Misslyckades ändra status: ${error.message}`);
    },
  });

  return {
    macros: macros || [],
    isLoading,
    createMacro: createMacro.mutate,
    updateMacro: updateMacro.mutate,
    deleteMacro: deleteMacro.mutate,
    toggleMacro: toggleMacro.mutate,
  };
};