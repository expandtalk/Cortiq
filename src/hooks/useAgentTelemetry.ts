import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgentOverviewRow {
  agent_name: string;
  total_tasks: number;
  task_completion_rate: number | null;
  first_pass_rate: number | null;
  tool_success_rate: number | null;
  p50_latency_ms: number | null;
  p95_latency_ms: number | null;
  escalation_rate: number | null;
  total_input_tokens: number;
  total_output_tokens: number;
  estimated_cost_usd: number;
  hallucination_flags: number;
  last_active: string | null;
}

export interface AgentConversionRow {
  agent_name: string;
  sessions_with_agent: number;
  conversions: number;
  conversion_rate: number | null;
}

export interface AgentTraceRow {
  span_id: string;
  parent_span_id: string | null;
  span_name: string;
  gen_ai_operation_name: string | null;
  gen_ai_agent_name: string | null;
  gen_ai_request_model: string | null;
  tool_name: string | null;
  mcp_server: string | null;
  status_code: string;
  start_time: string;
  duration_ms: number | null;
  gen_ai_usage_input_tokens: number | null;
  gen_ai_usage_output_tokens: number | null;
  estimated_cost_usd: number | null;
  had_retry: boolean;
  escalated: boolean;
  eval_score: number | null;
  attributes: Record<string, unknown>;
}

export interface AgentHourlyPoint {
  hour: string;
  agent_name: string;
  model: string;
  total_tasks: number;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number;
  p50_duration_ms: number | null;
  p95_duration_ms: number | null;
  tool_calls_total: number;
  tool_calls_ok: number;
}

export interface RecentTrace {
  trace_id: string;
  agent_name: string | null;
  span_name: string;
  status_code: string;
  start_time: string;
  duration_ms: number | null;
  estimated_cost_usd: number | null;
  total_tokens: number | null;
}

export function useAgentOverview(companyId: string | null, from?: Date, to?: Date) {
  return useQuery<AgentOverviewRow[]>({
    queryKey: ['agent-overview', companyId, from?.toISOString(), to?.toISOString()],
    enabled: !!companyId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_agent_overview', {
        p_company_id: companyId!,
        p_from: from?.toISOString() ?? new Date(Date.now() - 30 * 86400000).toISOString(),
        p_to:   to?.toISOString()   ?? new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
      return (data ?? []) as AgentOverviewRow[];
    },
  });
}

export function useAgentConversions(companyId: string | null, from?: Date, to?: Date) {
  return useQuery<AgentConversionRow[]>({
    queryKey: ['agent-conversions', companyId, from?.toISOString(), to?.toISOString()],
    enabled: !!companyId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_agent_conversions', {
        p_company_id: companyId!,
        p_from: from?.toISOString() ?? new Date(Date.now() - 30 * 86400000).toISOString(),
        p_to:   to?.toISOString()   ?? new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
      return (data ?? []) as AgentConversionRow[];
    },
  });
}

export function useAgentTrace(companyId: string | null, traceId: string | null) {
  return useQuery<AgentTraceRow[]>({
    queryKey: ['agent-trace', companyId, traceId],
    enabled: !!companyId && !!traceId,
    staleTime: 300_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_agent_trace', {
        p_company_id: companyId!,
        p_trace_id:   traceId!,
      });
      if (error) throw new Error(error.message);
      return (data ?? []) as AgentTraceRow[];
    },
  });
}

export function useAgentHourlyTrend(companyId: string | null, from?: Date, to?: Date) {
  return useQuery<AgentHourlyPoint[]>({
    queryKey: ['agent-hourly', companyId, from?.toISOString(), to?.toISOString()],
    enabled: !!companyId,
    staleTime: 60_000,
    queryFn: async () => {
      const fromTs = from?.toISOString() ?? new Date(Date.now() - 30 * 86400000).toISOString();
      const toTs   = to?.toISOString()   ?? new Date().toISOString();
      const { data, error } = await supabase
        .from('agent_hourly_stats')
        .select('hour, agent_name, model, total_tasks, input_tokens, output_tokens, estimated_cost_usd, p50_duration_ms, p95_duration_ms, tool_calls_total, tool_calls_ok')
        .eq('company_id', companyId!)
        .gte('hour', fromTs)
        .lte('hour', toTs)
        .order('hour', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as AgentHourlyPoint[];
    },
  });
}

export function useRecentTraces(companyId: string | null, agentName?: string, limit = 20) {
  return useQuery<RecentTrace[]>({
    queryKey: ['agent-recent-traces', companyId, agentName, limit],
    enabled: !!companyId,
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase
        .from('agent_spans')
        .select('trace_id, gen_ai_agent_name, span_name, status_code, start_time, duration_ms, estimated_cost_usd, gen_ai_usage_total_tokens')
        .eq('company_id', companyId!)
        .is('parent_span_id', null)         // root spans only
        .order('start_time', { ascending: false })
        .limit(limit);
      if (agentName) q = q.eq('gen_ai_agent_name', agentName);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []).map(r => ({
        trace_id:          r.trace_id,
        agent_name:        r.gen_ai_agent_name,
        span_name:         r.span_name,
        status_code:       r.status_code,
        start_time:        r.start_time,
        duration_ms:       r.duration_ms,
        estimated_cost_usd: r.estimated_cost_usd,
        total_tokens:      r.gen_ai_usage_total_tokens,
      }));
    },
  });
}
