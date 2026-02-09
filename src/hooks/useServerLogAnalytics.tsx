import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ServerLogAnalytics {
  id: string;
  site_id: string;
  date: string;
  url: string;
  page_views: number;
  unique_visitors: number;
  device_type: string | null;
  browser: string | null;
  country_code: string | null;
  referrer_domain: string | null;
  avg_load_time_ms: number | null;
  status_2xx: number;
  status_3xx: number;
  status_4xx: number;
  status_5xx: number;
  created_at: string;
  updated_at: string;
}

export function useServerLogAnalytics(
  siteId: string,
  dateRange: { from: Date; to: Date }
) {
  return useQuery({
    queryKey: ['server-log-analytics', siteId, dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('server_log_analytics')
        .select('*')
        .eq('site_id', siteId)
        .gte('date', dateRange.from.toISOString().split('T')[0])
        .lte('date', dateRange.to.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      return data as ServerLogAnalytics[];
    },
    enabled: !!siteId
  });
}

export function useServerLogImports(siteId: string) {
  return useQuery({
    queryKey: ['server-log-imports', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('server_log_imports')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!siteId
  });
}
