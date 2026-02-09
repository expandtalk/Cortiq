import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AITrafficData {
  totalSessions: number;
  totalUsers: number;
  platforms: Array<{
    platform: string;
    medium: string;
    sessions: number;
    users: number;
    newUsers: number;
    conversions: number;
    revenue: number;
    avgDuration: number;
    bounceRate: number;
    engagementRate: number;
    pageViews: number;
    conversionRate: number;
  }>;
  dailyTrend: Array<{
    date: string;
    sessions: number;
    users: number;
    conversions: number;
  }>;
  topLandingPages: Array<{
    page: string;
    sessions: number;
    users: number;
  }>;
  summary: {
    totalSessions: number;
    totalUsers: number;
    totalConversions: number;
    totalRevenue: number;
    averageEngagementRate: number;
    averageSessionDuration: number;
    bounceRate: number;
  };
}

export function useAITraffic(siteId: string, days: number = 30) {
  const [data, setData] = useState<AITrafficData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAITraffic = async () => {
    if (!siteId) return;

    console.log('🤖 Fetching AI traffic data for site:', siteId);
    setLoading(true);
    setError(null);

    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
      };

      const { data: aiData, error: functionError } = await supabase.functions.invoke('ga4-ai-traffic', {
        body: {
          siteId,
          startDate: formatDate(startDate),
          endDate: formatDate(endDate)
        }
      });

      if (functionError) {
        console.error('AI Traffic function error:', functionError);
        throw new Error(functionError.message || 'Failed to fetch AI traffic data');
      }

      console.log('AI traffic data received:', aiData);
      setData(aiData);

    } catch (err) {
      console.error('Error fetching AI traffic data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAITraffic();
  }, [siteId, days]);

  // Helper functions for data analysis
  const getTopAIPlatform = () => {
    if (!data?.platforms || data.platforms.length === 0) return null;
    return data.platforms[0];
  };

  const getGrowthTrend = () => {
    if (!data?.dailyTrend || data.dailyTrend.length < 2) return 0;
    
    const recent = data.dailyTrend.slice(-7).reduce((sum, day) => sum + day.sessions, 0);
    const previous = data.dailyTrend.slice(-14, -7).reduce((sum, day) => sum + day.sessions, 0);
    
    if (previous === 0) return recent > 0 ? 100 : 0;
    return ((recent - previous) / previous) * 100;
  };

  const getConversionRate = () => {
    if (!data?.summary || data.summary.totalSessions === 0) return 0;
    return (data.summary.totalConversions / data.summary.totalSessions) * 100;
  };

  const getEngagementInsights = () => {
    if (!data?.platforms) return [];
    
    return data.platforms.map(platform => ({
      platform: platform.platform,
      quality: platform.engagementRate > 0.6 ? 'High' : platform.engagementRate > 0.3 ? 'Medium' : 'Low',
      avgDuration: platform.avgDuration,
      bounceRate: platform.bounceRate,
      sessions: platform.sessions
    }));
  };

  return {
    data,
    loading,
    error,
    refetch: fetchAITraffic,
    topPlatform: getTopAIPlatform(),
    growthTrend: getGrowthTrend(),
    conversionRate: getConversionRate(),
    engagementInsights: getEngagementInsights()
  };
}