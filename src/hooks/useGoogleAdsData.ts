import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GoogleAdsCampaign {
  campaign_id: string;
  campaign_name: string;
  status: string;
  channel_type: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversions_value: number;
  ctr: number;
  cpc: number;
  roas: number;
  conversion_rate: number;
}

export interface GoogleAdsTotals {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversions_value: number;
}

export type GoogleAdsDateRange = 'last_7_days' | 'last_30_days' | 'last_90_days';

export function useGoogleAdsData(siteId: string, dateRange: GoogleAdsDateRange = 'last_30_days') {
  const [campaigns, setCampaigns] = useState<GoogleAdsCampaign[]>([]);
  const [totals, setTotals] = useState<GoogleAdsTotals | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!siteId) return;

    // Check if configured first
    const { data: integration } = await supabase
      .from('site_integrations')
      .select('is_active')
      .eq('site_id', siteId)
      .eq('integration_type', 'google_ads_api')
      .eq('is_active', true)
      .maybeSingle();

    if (!integration) {
      setIsConfigured(false);
      setCampaigns([]);
      setTotals(null);
      return;
    }

    setIsConfigured(true);
    setLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const supabaseUrl = (supabase as any).supabaseUrl as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/google-ads-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ site_id: siteId, date_range: dateRange }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const json = await res.json();
      setCampaigns(json.campaigns ?? []);
      setTotals(json.totals ?? null);
    } catch (err: any) {
      setError(err?.message ?? 'Could not fetch Google Ads data');
    } finally {
      setLoading(false);
    }
  }, [siteId, dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { campaigns, totals, isConfigured, loading, error, refetch: fetchData };
}
