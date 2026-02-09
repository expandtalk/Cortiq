import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RegisteredAgent {
  id: string;
  site_id: string;
  agent_name: string;
  agent_type: 'custom_bot' | 'outbound_agent' | 'third_party';
  description: string | null;
  user_agent_pattern: string | null;
  ip_range: string | null;
  endpoint_url: string | null;
  api_key_hint: string | null;
  total_requests: number;
  last_seen_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AgentActivity {
  id: string;
  agent_id: string | null;
  activity_type: string;
  url: string | null;
  request_method: string | null;
  response_status: number | null;
  response_time_ms: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreateAgentInput {
  site_id: string;
  agent_name: string;
  agent_type: 'custom_bot' | 'outbound_agent' | 'third_party';
  description?: string;
  user_agent_pattern?: string;
  ip_range?: string;
  endpoint_url?: string;
}

export function useAgentRegistry(siteId: string | null) {
  return useQuery({
    queryKey: ['agent-registry', siteId],
    queryFn: async () => {
      if (!siteId) return [];
      
      const { data, error } = await supabase
        .from('agent_registry')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as RegisteredAgent[];
    },
    enabled: !!siteId,
  });
}

export function useAgentActivity(siteId: string | null, agentId?: string, days: number = 7) {
  return useQuery({
    queryKey: ['agent-activity', siteId, agentId, days],
    queryFn: async () => {
      if (!siteId) return [];
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      let query = supabase
        .from('agent_activity_log')
        .select('*')
        .eq('site_id', siteId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (agentId) {
        query = query.eq('agent_id', agentId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as AgentActivity[];
    },
    enabled: !!siteId,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateAgentInput) => {
      const { data, error } = await supabase
        .from('agent_registry')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agent-registry', variables.site_id] });
      toast.success('Agent registrerad');
    },
    onError: (error) => {
      toast.error('Kunde inte registrera agent: ' + error.message);
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RegisteredAgent> & { id: string }) => {
      const { data, error } = await supabase
        .from('agent_registry')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agent-registry', data.site_id] });
      toast.success('Agent uppdaterad');
    },
    onError: (error) => {
      toast.error('Kunde inte uppdatera agent: ' + error.message);
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, siteId }: { id: string; siteId: string }) => {
      const { error } = await supabase
        .from('agent_registry')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, siteId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agent-registry', data.siteId] });
      toast.success('Agent borttagen');
    },
    onError: (error) => {
      toast.error('Kunde inte ta bort agent: ' + error.message);
    },
  });
}
