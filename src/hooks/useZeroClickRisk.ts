import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, startOfWeek, format } from "date-fns";

export interface ZeroClickRiskPage {
  url: string;
  totalVisits: number;
  trainingCrawls: number;
  citationCrawls: number;
  generalCrawls: number;
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  trend: 'rising' | 'stable' | 'falling';
  weeklyTrend: { week: string; visits: number }[];
  topBot: string;
}

export interface ZeroClickRiskSummary {
  criticalPages: number;
  highRiskPages: number;
  totalCrawlerVisits: number;
  mostActiveBot: string;
  overallTrend: 'rising' | 'stable' | 'falling';
}

export interface ZeroClickRiskData {
  pages: ZeroClickRiskPage[];
  summary: ZeroClickRiskSummary;
}

export const useZeroClickRisk = (siteId: string | null, days = 84) => {
  return useQuery({
    queryKey: ['zero-click-risk', siteId, days],
    queryFn: async (): Promise<ZeroClickRiskData> => {
      if (!siteId) throw new Error('No site ID');

      const startDate = startOfDay(subDays(new Date(), days));

      const { data: traffic, error } = await supabase
        .from('ai_bot_traffic')
        .select('url, bot_name, bot_type, request_type, detected_at')
        .eq('site_id', siteId)
        .gte('detected_at', startDate.toISOString());

      if (error) throw error;

      if (!traffic || traffic.length === 0) {
        return {
          pages: [],
          summary: {
            criticalPages: 0,
            highRiskPages: 0,
            totalCrawlerVisits: 0,
            mostActiveBot: '-',
            overallTrend: 'stable',
          },
        };
      }

      // Group by URL
      const urlMap: Record<string, typeof traffic> = {};
      traffic.forEach(t => {
        const url = t.url || '/';
        if (!urlMap[url]) urlMap[url] = [];
        urlMap[url].push(t);
      });

      // Max visits for normalization
      const maxVisits = Math.max(...Object.values(urlMap).map(v => v.length));

      const pages: ZeroClickRiskPage[] = Object.entries(urlMap).map(([url, visits]) => {
        const total = visits.length;
        const training = visits.filter(v => v.request_type === 'training').length;
        const citation = visits.filter(v => v.request_type === 'citation').length;
        const general = total - training - citation;

        // Weighted score: training has biggest displacement potential
        const weighted = training * 3 + citation * 2 + general * 1;
        const riskScore = Math.min(100, Math.round((weighted / (maxVisits * 3)) * 100));
        const riskLevel =
          riskScore >= 75 ? 'critical' :
          riskScore >= 50 ? 'high' :
          riskScore >= 25 ? 'medium' : 'low';

        // Top bot
        const botFreq: Record<string, number> = {};
        visits.forEach(v => {
          const name = v.bot_name || v.bot_type || 'Unknown';
          botFreq[name] = (botFreq[name] || 0) + 1;
        });
        const topBot = Object.entries(botFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Unknown';

        // Weekly trend buckets (last 4 weeks)
        const byWeek: Record<string, number> = {};
        visits.forEach(v => {
          const week = format(startOfWeek(new Date(v.detected_at)), 'MMM d');
          byWeek[week] = (byWeek[week] || 0) + 1;
        });
        const weeklyTrend = Object.entries(byWeek)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([week, v]) => ({ week, visits: v }));

        let trend: ZeroClickRiskPage['trend'] = 'stable';
        if (weeklyTrend.length >= 2) {
          const recent = weeklyTrend[weeklyTrend.length - 1].visits;
          const prev = weeklyTrend[weeklyTrend.length - 2].visits;
          if (recent > prev * 1.2) trend = 'rising';
          else if (recent < prev * 0.8) trend = 'falling';
        }

        return {
          url,
          totalVisits: total,
          trainingCrawls: training,
          citationCrawls: citation,
          generalCrawls: general,
          riskScore,
          riskLevel,
          trend,
          weeklyTrend,
          topBot,
        };
      }).sort((a, b) => b.riskScore - a.riskScore).slice(0, 20);

      // Summary
      const botFreqAll: Record<string, number> = {};
      traffic.forEach(t => {
        const name = t.bot_name || t.bot_type || 'Unknown';
        botFreqAll[name] = (botFreqAll[name] || 0) + 1;
      });
      const mostActiveBot = Object.entries(botFreqAll).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';

      const criticalPages = pages.filter(p => p.riskLevel === 'critical').length;
      const highRiskPages = pages.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length;

      const risingCount = pages.filter(p => p.trend === 'rising').length;
      const fallingCount = pages.filter(p => p.trend === 'falling').length;
      const overallTrend: ZeroClickRiskPage['trend'] =
        risingCount > fallingCount ? 'rising' :
        fallingCount > risingCount ? 'falling' : 'stable';

      return {
        pages,
        summary: { criticalPages, highRiskPages, totalCrawlerVisits: traffic.length, mostActiveBot, overallTrend },
      };
    },
    enabled: !!siteId,
  });
};
