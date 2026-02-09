import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface PaidAdsSummary {
  totalSessions: number;
  totalPageViews: number;
  totalConversions: number;
  totalRevenue: number;
  avgDuration: number;
  conversionRate: number;
}

interface CampaignMetrics {
  campaign: string;
  source: string;
  medium: string;
  sessions: number;
  pageViews: number;
  conversions: number;
  revenue: number;
  avgDuration: number;
  conversionRate: number;
  revenuePerSession: number;
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
}

interface SourceMetrics {
  source: string;
  sessions: number;
  conversions: number;
  revenue: number;
}

interface MonthlyMetrics {
  month: string;
  sessions: number;
  conversions: number;
  revenue: number;
}

interface PaidAdsData {
  summary: PaidAdsSummary;
  campaigns: CampaignMetrics[];
  sources: SourceMetrics[];
  monthly: MonthlyMetrics[];
  rawSessions: number;
}

export function usePaidAdsAnalytics(siteId: string, startDate?: string, endDate?: string) {
  const [data, setData] = useState<PaidAdsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!siteId) return;

    const fetchPaidAdsData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Default to last 30 days if no dates provided
        const end = endDate || new Date().toISOString().split('T')[0];
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        console.log('Fetching paid ads analytics:', { siteId, start, end });

        const { data: responseData, error: functionError } = await supabase.functions.invoke('paid-ads-analytics', {
          body: {
            siteId,
            startDate: start,
            endDate: end
          }
        });

        if (functionError) {
          console.error('Paid ads analytics error:', functionError);
          throw new Error(functionError.message || 'Failed to fetch paid ads data');
        }

        if (!responseData.success) {
          throw new Error(responseData.error || 'Failed to fetch paid ads data');
        }

        console.log('Paid ads data received:', responseData);
        setData(responseData);

      } catch (err) {
        console.error('Error fetching paid ads analytics:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch paid ads analytics';
        setError(errorMessage);
        toast({
          title: 'Fel vid hämtning av annonsdata',
          description: errorMessage,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPaidAdsData();
  }, [siteId, startDate, endDate]);

  return {
    data,
    loading,
    error,
    refetch: () => {
      // Trigger refetch by updating state
      setData(null);
    }
  };
}
