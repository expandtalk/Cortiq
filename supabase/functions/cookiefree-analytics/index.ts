import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { siteId, startDate, endDate } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Calculating cookiefree analytics for site:', siteId, 'from:', startDate, 'to:', endDate);

    // 🎯 Grundläggande Traffic KPIs
    const { data: trackingSessions, error: sessionsError } = await supabase
      .from('tracking_sessions')
      .select('*')
      .eq('site_id', siteId)
      .gte('started_at', startDate)
      .lte('started_at', endDate);

    if (sessionsError) {
      console.error('Sessions error:', sessionsError);
      throw sessionsError;
    }

    const { data: pageViews, error: pageViewsError } = await supabase
      .from('page_views')
      .select('*')
      .eq('site_id', siteId)
      .gte('viewed_at', startDate)
      .lte('viewed_at', endDate);

    if (pageViewsError) {
      console.error('Page views error:', pageViewsError);
      throw pageViewsError;
    }

    // 📊 Cookie Banner Data
    const { data: cookieConsents, error: consentsError } = await supabase
      .from('cookie_consents')
      .select('*')
      .eq('site_id', siteId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (consentsError) {
      console.error('Cookie consents error:', consentsError);
      throw consentsError;
    }

    // 🧮 Calculate Basic KPIs
    const totalPageViews = pageViews?.length || 0;
    const totalSessions = trackingSessions?.length || 0;
    const uniqueVisitors = new Set(trackingSessions?.map(s => s.ip_address + s.user_agent)).size;

    // Calculate session metrics
    const sessionsWithDuration = trackingSessions?.filter(s => s.duration_seconds > 0) || [];
    const avgSessionDuration = sessionsWithDuration.length > 0 
      ? sessionsWithDuration.reduce((sum, s) => sum + s.duration_seconds, 0) / sessionsWithDuration.length 
      : 0;

    const avgPagesPerSession = totalSessions > 0 ? totalPageViews / totalSessions : 0;
    const bounceRate = trackingSessions?.filter(s => s.page_views === 1).length / totalSessions * 100 || 0;

    // 📊 Cookie Banner Intelligence
    const totalBannerViews = cookieConsents?.length || 0;
    const acceptedAll = cookieConsents?.filter(c => 
      c.consent_types?.analytics && c.consent_types?.marketing && c.consent_types?.preferences
    ).length || 0;
    const rejectedAll = cookieConsents?.filter(c => 
      !c.consent_types?.analytics && !c.consent_types?.marketing && !c.consent_types?.preferences
    ).length || 0;
    const selectiveAccept = cookieConsents?.filter(c => 
      (c.consent_types?.analytics || c.consent_types?.marketing || c.consent_types?.preferences) &&
      !(c.consent_types?.analytics && c.consent_types?.marketing && c.consent_types?.preferences)
    ).length || 0;

    const acceptanceRate = totalBannerViews > 0 ? (acceptedAll / totalBannerViews * 100) : 0;
    const rejectionRate = totalBannerViews > 0 ? (rejectedAll / totalBannerViews * 100) : 0;
    const selectiveRate = totalBannerViews > 0 ? (selectiveAccept / totalBannerViews * 100) : 0;

    // 🌍 Device & Browser Analysis
    const deviceBreakdown = trackingSessions?.reduce((acc, session) => {
      const device = session.device_type || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const browserBreakdown = trackingSessions?.reduce((acc, session) => {
      const browser = session.browser || 'unknown';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const osBreakdown = trackingSessions?.reduce((acc, session) => {
      const os = session.os || 'unknown';
      acc[os] = (acc[os] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // 📈 Content Performance
    const pagePopularity = pageViews?.reduce((acc, pv) => {
      const url = pv.url;
      if (!acc[url]) {
        acc[url] = { views: 0, title: pv.title, avgTime: 0, totalTime: 0 };
      }
      acc[url].views += 1;
      acc[url].totalTime += pv.time_on_page || 0;
      acc[url].avgTime = acc[url].totalTime / acc[url].views;
      return acc;
    }, {} as Record<string, any>) || {};

    const topPages = Object.entries(pagePopularity)
      .sort(([,a], [,b]) => b.views - a.views)
      .slice(0, 10)
      .map(([url, data]) => ({ url, ...data }));

    // 🔄 Referral Sources
    const referralSources = trackingSessions?.reduce((acc, session) => {
      let source = 'Direct';
      if (session.referrer) {
        if (session.referrer.includes('google')) source = 'Google';
        else if (session.referrer.includes('bing')) source = 'Bing';
        else if (session.referrer.includes('facebook')) source = 'Facebook';
        else if (session.referrer.includes('linkedin')) source = 'LinkedIn';
        else if (session.referrer.includes('twitter') || session.referrer.includes('x.com')) source = 'Twitter/X';
        else source = 'Other';
      }
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // ⏰ Time Pattern Analysis
    const hourlyPattern = trackingSessions?.reduce((acc, session) => {
      const hour = new Date(session.started_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>) || {};

    const dailyPattern = trackingSessions?.reduce((acc, session) => {
      const day = new Date(session.started_at).getDay();
      const dayNames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
      const dayName = dayNames[day];
      acc[dayName] = (acc[dayName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // 🎯 Estimated Business Metrics
    const consentRate = acceptanceRate / 100;
    const estimatedTotalSessions = consentRate > 0 ? Math.round(totalSessions / consentRate) : totalSessions;
    const estimatedLostData = Math.round(estimatedTotalSessions - totalSessions);
    const dataLossPercentage = estimatedTotalSessions > 0 ? (estimatedLostData / estimatedTotalSessions * 100) : 0;

    // 📱 Mobile-Specific Analysis
    const mobileMetrics = {
      mobilePercentage: deviceBreakdown.mobile ? (deviceBreakdown.mobile / totalSessions * 100) : 0,
      tabletPercentage: deviceBreakdown.tablet ? (deviceBreakdown.tablet / totalSessions * 100) : 0,
      desktopPercentage: deviceBreakdown.desktop ? (deviceBreakdown.desktop / totalSessions * 100) : 0,
    };

    const analytics = {
      // Basic Traffic
      totalPageViews,
      totalSessions,
      uniqueVisitors,
      avgSessionDuration: Math.round(avgSessionDuration),
      avgPagesPerSession: Math.round(avgPagesPerSession * 10) / 10,
      bounceRate: Math.round(bounceRate * 10) / 10,

      // Cookie Banner Intelligence
      totalBannerViews,
      acceptanceRate: Math.round(acceptanceRate * 10) / 10,
      rejectionRate: Math.round(rejectionRate * 10) / 10,
      selectiveRate: Math.round(selectiveRate * 10) / 10,
      acceptedAll,
      rejectedAll,
      selectiveAccept,

      // Device & Technology
      deviceBreakdown,
      browserBreakdown,
      osBreakdown,
      mobileMetrics,

      // Content Performance
      topPages,
      pagePopularity,

      // Traffic Sources
      referralSources,

      // Time Patterns
      hourlyPattern,
      dailyPattern,

      // Estimated Business Impact
      estimatedTotalSessions,
      estimatedLostData,
      dataLossPercentage: Math.round(dataLossPercentage * 10) / 10,
      consentRate: Math.round(consentRate * 1000) / 10, // As percentage

      // Meta information
      period: {
        startDate,
        endDate,
        days: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
      }
    };

    console.log('Cookiefree analytics calculated successfully:', {
      totalSessions,
      totalPageViews,
      acceptanceRate,
      dataLossPercentage
    });

    return new Response(JSON.stringify({ success: true, analytics }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in cookiefree-analytics function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});