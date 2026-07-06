import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays } from "date-fns";

interface AIBotTrafficData {
  totalTraffic: number;
  citationRequests: number;
  trainingCrawlers: number;
  citationCtr: number;
  botBreakdown: { name: string; count: number; percentage: number; category: string }[];
  dailyTrend: { date: string; traffic: number }[];
  topUrls: { url: string; visits: number }[];
}

export const useAIBotTracking = (siteId: string | null, days: number = 7) => {
  return useQuery({
    queryKey: ['ai-bot-tracking', siteId, days],
    queryFn: async (): Promise<AIBotTrafficData> => {
      if (!siteId) {
        throw new Error('No site ID provided');
      }

      const startDate = startOfDay(subDays(new Date(), days));

      // Fetch AI bot traffic
      const { data: traffic, error: trafficError } = await supabase
        .from('ai_bot_traffic')
        .select('*')
        .eq('site_id', siteId)
        .gte('detected_at', startDate.toISOString())
        .order('detected_at', { ascending: false });

      if (trafficError) throw trafficError;

      // Fetch citations
      const { data: citations, error: citationsError } = await supabase
        .from('ai_citations')
        .select('*')
        .eq('site_id', siteId)
        .gte('created_at', startDate.toISOString());

      if (citationsError) throw citationsError;

      // Calculate metrics
      const totalTraffic = traffic?.length || 0;
      const citationRequests = citations?.length || 0;
      const trainingCrawlers = traffic?.filter(t => t.request_type === 'training').length || 0;
      const citationClicks = citations?.filter(c => c.clicked).length || 0;
      const citationCtr = citationRequests > 0 ? (citationClicks / citationRequests) * 100 : 0;

      // Bot breakdown. Carry the category stored at ingest (request_type) so the UI
      // classifies from the single source of truth instead of re-deriving from names.
      const botAgg: Record<string, { count: number; category: string }> = {};
      traffic?.forEach(t => {
        const name = t.bot_name || t.bot_type;
        if (!botAgg[name]) botAgg[name] = { count: 0, category: t.request_type || 'citation' };
        botAgg[name].count += 1;
      });

      const botBreakdown = Object.entries(botAgg)
        .map(([name, { count, category }]) => ({
          name,
          count,
          category,
          percentage: totalTraffic > 0 ? (count / totalTraffic) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      // Daily trend
      const dailyTraffic: Record<string, number> = {};
      traffic?.forEach(t => {
        const date = new Date(t.detected_at).toISOString().split('T')[0];
        dailyTraffic[date] = (dailyTraffic[date] || 0) + 1;
      });

      const dailyTrend = Object.entries(dailyTraffic)
        .map(([date, traffic]) => ({ date, traffic }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Top URLs — exclude static assets
      const ASSET_URL_RE = /\.(css|js|mjs|png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot|otf|json|xml|txt|pdf|map)(\?|$)/i;
      const urlCounts: Record<string, number> = {};
      traffic?.forEach(t => {
        if (t.url && !ASSET_URL_RE.test(t.url)) {
          urlCounts[t.url] = (urlCounts[t.url] || 0) + 1;
        }
      });

      const topUrls = Object.entries(urlCounts)
        .map(([url, visits]) => ({ url, visits }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 10);

      return {
        totalTraffic,
        citationRequests,
        trainingCrawlers,
        citationCtr,
        botBreakdown,
        dailyTrend,
        topUrls,
      };
    },
    enabled: !!siteId,
  });
};