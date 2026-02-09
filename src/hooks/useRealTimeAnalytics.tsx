import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RealTimeStats {
  activeVisitors: number;
  pageViewsToday: number;
  topPage: { url: string; views: number } | null;
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  lastUpdated: Date;
}

export function useRealTimeAnalytics(siteId: string | null) {
  const [stats, setStats] = useState<RealTimeStats>({
    activeVisitors: 0,
    pageViewsToday: 0,
    topPage: null,
    deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
    lastUpdated: new Date()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRealTimeData = async () => {
    if (!siteId) return;

    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const activeThreshold = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago

      // Get active visitors (sessions with activity in last 5 minutes)
      const { data: activeSessions, error: activeError } = await supabase
        .from('tracking_sessions')
        .select('id')
        .eq('site_id', siteId)
        .gte('last_activity', activeThreshold.toISOString());

      if (activeError) throw activeError;

      // Get today's page views
      const { data: todayViews, error: viewsError } = await supabase
        .from('page_views')
        .select('url')
        .eq('site_id', siteId)
        .gte('viewed_at', todayStart.toISOString());

      if (viewsError) throw viewsError;

      // Get device breakdown for today
      const { data: todaySessions, error: sessionsError } = await supabase
        .from('tracking_sessions')
        .select('device_type')
        .eq('site_id', siteId)
        .gte('started_at', todayStart.toISOString());

      if (sessionsError) throw sessionsError;

      // Calculate top page
      const pageCount = todayViews?.reduce((acc, view) => {
        acc[view.url] = (acc[view.url] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const topPage = Object.entries(pageCount).length > 0 
        ? Object.entries(pageCount).reduce((a, b) => pageCount[a[0]] > pageCount[b[0]] ? a : b)
        : null;

      // Calculate device breakdown
      const deviceBreakdown = todaySessions?.reduce((acc, session) => {
        const device = session.device_type?.toLowerCase() || 'desktop';
        if (device.includes('mobile')) acc.mobile++;
        else if (device.includes('tablet')) acc.tablet++;
        else acc.desktop++;
        return acc;
      }, { desktop: 0, mobile: 0, tablet: 0 }) || { desktop: 0, mobile: 0, tablet: 0 };

      setStats({
        activeVisitors: activeSessions?.length || 0,
        pageViewsToday: todayViews?.length || 0,
        topPage: topPage ? { url: topPage[0], views: topPage[1] } : null,
        deviceBreakdown,
        lastUpdated: new Date()
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching real-time data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch real-time data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (siteId) {
      fetchRealTimeData();
      
      // Update every 30 seconds
      const interval = setInterval(fetchRealTimeData, 30000);
      return () => clearInterval(interval);
    }
  }, [siteId]);

  return {
    stats,
    loading,
    error,
    refresh: fetchRealTimeData
  };
}