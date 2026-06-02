import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Analytics } from '@/types/dashboard';

export function useAnalytics(siteId: string | null, dateRange?: { from: Date; to: Date }) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  const loadAnalytics = async (siteId: string, range?: { from: Date; to: Date }) => {
    console.log('🔄 Loading analytics for site:', siteId, 'range:', range);
    try {
      // Clamp dates to avoid future dates
      const today = new Date();
      const defaultFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const fromDate = range?.from ? new Date(Math.min(range.from.getTime(), today.getTime())) : defaultFrom;
      const toDateBase = range?.to ?? today;
      const toDate = new Date(Math.min(toDateBase.getTime(), today.getTime()));

      const fromIso = fromDate.toISOString();
      const toIso = toDate.toISOString();

      // Exact session count (no row fetch — avoids Supabase 1000-row default limit)
      const { count: sessionCount, error: sessionCountError } = await supabase
        .from('tracking_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .gte('started_at', fromIso)
        .lte('started_at', toIso);

      if (sessionCountError) throw sessionCountError;

      // Exact page view count
      const { count: pageViewCount, error: pageViewCountError } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .gte('viewed_at', fromIso)
        .lte('viewed_at', toIso);

      if (pageViewCountError) throw pageViewCountError;

      // Fetch session detail rows for engagement/device metrics (up to 5000)
      const { data: sessions, error: sessionError } = await supabase
        .from('tracking_sessions')
        .select('duration_seconds, device_type, page_views')
        .eq('site_id', siteId)
        .gte('started_at', fromIso)
        .lte('started_at', toIso)
        .limit(5000);

      if (sessionError) throw sessionError;

      // Fetch page view URLs for top-pages (up to 5000)
      const { data: pageViews, error: pageError } = await supabase
        .from('page_views')
        .select('url')
        .eq('site_id', siteId)
        .gte('viewed_at', fromIso)
        .lte('viewed_at', toIso)
        .limit(5000);

      if (pageError) throw pageError;

      // Use exact counts for display; row data for derived metrics
      const totalSessions = sessionCount ?? sessions?.length ?? 0;
      const totalPageViews = pageViewCount ?? pageViews?.length ?? 0;
      
      // GA4 Engagement metrics
      // Engaged session = session with >10s duration OR >1 page view OR conversion event
      const engagedSessions = sessions?.filter(session => 
        (session.duration_seconds && session.duration_seconds > 10) || 
        (session.page_views && session.page_views > 1)
      ) || [];
      
      const engagementRate = totalSessions > 0 ? (engagedSessions.length / totalSessions) * 100 : 0;
      
      // Average Engagement Time (GA4) - only for engaged sessions
      const totalEngagementTime = engagedSessions.reduce((sum, session) => 
        sum + (session.duration_seconds || 0), 0);
      const averageEngagementTime = engagedSessions.length > 0 ? 
        totalEngagementTime / engagedSessions.length : 0;
      
      // Average Session Duration (all sessions)
      const totalSessionDuration = sessions?.reduce((sum, session) => 
        sum + (session.duration_seconds || 0), 0) || 0;
      const averageSessionDuration = totalSessions > 0 ? 
        totalSessionDuration / totalSessions : 0;
      
      // Time on site (average time per page view)
      const totalTimeOnSite = sessions?.reduce((sum, session) => 
        sum + (session.duration_seconds || 0), 0) || 0;
      const averageTimeOnSite = totalPageViews > 0 ? totalTimeOnSite / totalPageViews : 0;

      // Top pages - filter out admin/editor URLs
      const filteredPageViews = pageViews?.filter(p => {
        const url = p.url;
        try {
          const urlParams = new URL(url).searchParams;
          
          // Filter out Elementor editor
          if (urlParams.has('elementor-preview') || 
              urlParams.has('elementor') || 
              url.includes('elementor-preview=')) {
            return false;
          }
          
          // Filter out WordPress admin
          if (url.includes('/wp-admin/') || 
              url.includes('/wp-login.php') ||
              url.includes('wp-admin')) {
            return false;
          }
          
          // Filter out other page builders and admin tools
          const adminParams = ['preview', 'customize_changeset_uuid', 'fl_builder', 'et_fb', 'vc_editable', 'builder', 'edit'];
          const adminFunctions = ['redigera-kategori', 'redigera-inlägg', 'edit-category', 'edit-post', 'post-new', 'edit.php', 'post.php'];
          
          // Check URL parameters for admin functions
          for (const param of adminParams) {
            if (urlParams.has(param)) {
              return false;
            }
          }
          
          // Check URL path for WordPress admin functions
          for (const func of adminFunctions) {
            if (url.includes(func)) {
              return false;
            }
          }
          
          return true;
        } catch {
          return true; // If URL parsing fails, include it
        }
      }) || [];
      
      const pageUrls = filteredPageViews.map(p => p.url);
      const pageCount = pageUrls.reduce((acc: Record<string, number>, url) => {
        acc[url] = (acc[url] || 0) + 1;
        return acc;
      }, {});
      const topPages = Object.entries(pageCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([url, views]) => ({ url, views }));

      // Device breakdown with percentages
      const deviceCount = sessions?.reduce((acc: Record<string, number>, s) => {
        const device = s.device_type || 'unknown';
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      }, {}) || {};
      
      const deviceBreakdown = Object.entries(deviceCount)
        .map(([device, count]) => ({ 
          device, 
          count, 
          percentage: totalSessions > 0 ? (count / totalSessions) * 100 : 0 
        }));

      setAnalytics({
        totalSessions,
        totalPageViews,
        averageSessionDuration: Math.round(averageSessionDuration),
        averageEngagementTime: Math.round(averageEngagementTime),
        engagementRate: Math.round(engagementRate * 10) / 10, // One decimal
        averageTimeOnSite: Math.round(averageTimeOnSite),
        topPages,
        deviceBreakdown
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  useEffect(() => {
    if (siteId) {
      console.log('🔄 useAnalytics: Params changed', { siteId, dateRange });
      setAnalytics(null); // Clear old data immediately
      loadAnalytics(siteId, dateRange);
    } else {
      console.log('🔄 useAnalytics: No site selected, clearing analytics');
      setAnalytics(null);
    }
  }, [siteId, dateRange?.from?.getTime(), dateRange?.to?.getTime()]);

  return { analytics };
}