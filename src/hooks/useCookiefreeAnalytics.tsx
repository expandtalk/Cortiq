import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

export interface CookiefreeAnalytics {
  // Basic Traffic
  totalPageViews: number;
  totalSessions: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  avgPagesPerSession: number;
  bounceRate: number;

  // Cookie Banner Intelligence
  totalBannerViews: number;
  acceptanceRate: number;
  rejectionRate: number;
  selectiveRate: number;
  acceptedAll: number;
  rejectedAll: number;
  selectiveAccept: number;

  // Device & Technology
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  osBreakdown: Record<string, number>;
  mobileMetrics: {
    mobilePercentage: number;
    tabletPercentage: number;
    desktopPercentage: number;
  };

  // Content Performance
  topPages: Array<{
    url: string;
    views: number;
    title: string;
    avgTime: number;
  }>;

  // Traffic Sources
  referralSources: Record<string, number>;

  // Time Patterns
  hourlyPattern: Record<number, number>;
  dailyPattern: Record<string, number>;

  // Estimated Business Impact
  estimatedTotalSessions: number;
  estimatedLostData: number;
  dataLossPercentage: number;
  consentRate: number;

  // Meta information
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
}

export const useCookiefreeAnalytics = (
  siteId: string | null,
  dateRange: { from: Date; to: Date } = {
    from: subDays(new Date(), 30),
    to: new Date()
  }
) => {
  return useQuery({
    queryKey: ['cookiefree-analytics', siteId, dateRange.from, dateRange.to],
    queryFn: async (): Promise<CookiefreeAnalytics | null> => {
      if (!siteId) return null;

      // Clamp to avoid future dates
      const today = new Date();
      const from = new Date(Math.min(dateRange.from.getTime(), today.getTime()));
      const to = new Date(Math.min(dateRange.to.getTime(), today.getTime()));

      const startDate = format(from, 'yyyy-MM-dd');
      const endDate = format(to, 'yyyy-MM-dd');

      console.log('Fetching cookiefree analytics for:', { siteId, startDate, endDate });

      const { data, error } = await supabase.functions.invoke('cookiefree-analytics', {
        body: {
          siteId,
          startDate,
          endDate
        }
      });

      if (error) {
        console.error('Error fetching cookiefree analytics:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch cookiefree analytics');
      }

      return data.analytics;
    },
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};