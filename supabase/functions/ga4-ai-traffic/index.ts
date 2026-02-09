import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 GA4 AI Traffic function started');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { siteId, startDate, endDate } = await req.json();
    
    console.log(`Fetching AI traffic for site: ${siteId} from ${startDate} to ${endDate}`);

    // Get site information using direct fetch
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const siteResponse = await fetch(`${supabaseUrl}/rest/v1/sites?id=eq.${siteId}&select=site_name,ga_property_id,ga_integration_enabled`, {
      headers: {
        'apikey': supabaseKey!,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    const sites = await siteResponse.json();
    if (!sites || sites.length === 0) {
      throw new Error('Site not found');
    }

    const site = sites[0];

    console.log(`Found site: ${site.site_name} GA Property ID: ${site.ga_property_id}`);

    if (!site.ga_integration_enabled || !site.ga_property_id) {
      throw new Error('Google Analytics integration not enabled for this site');
    }

    // Get Google service account credentials
    const serviceAccountKey = Deno.env.get('GA4_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKey) {
      throw new Error('GA4 service account key not configured');
    }

    const serviceAccount = JSON.parse(serviceAccountKey);
    console.log('Service account type:', serviceAccount.type);
    console.log('Service account client_email:', serviceAccount.client_email);

    // Generate JWT token for Google API (simplified version)
    console.log('Generating JWT token...');
    
    // Create JWT header and payload
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };
    
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600
    };

    // Encode header and payload
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    // Create signing input
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    
    // Import private key - properly decode PEM format
    const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');
    const pemContent = privateKey
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');
    
    const keyData = Uint8Array.from(atob(pemContent), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      keyData.buffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Sign the JWT
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(signingInput)
    );

    // Encode signature
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const jwt = `${signingInput}.${encodedSignature}`;
    console.log('JWT token generated successfully');

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token');
    }
    console.log('Successfully obtained access token');

    // AI source regex pattern
    const aiSourceRegex = 'chatgpt\\.com|perplexity\\.ai|gemini\\.google\\.com|copilot\\.microsoft\\.com|meta\\.ai|you\\.com|claude\\.ai|chat\\.mistral\\.ai|poe\\.com|character\\.ai';

    // Request AI traffic data from GA4
    const requestPayload = {
      dateRanges: [{ startDate, endDate }],
      dimensionFilter: {
        filter: {
          fieldName: 'sessionSource',
          stringFilter: {
            matchType: 'MATCHES_REGEX',
            value: aiSourceRegex
          }
        }
      },
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'landingPage' },
        { name: 'date' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'conversions' },
        { name: 'totalRevenue' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'engagementRate' },
        { name: 'screenPageViews' }
      ],
      orderBys: [
        { metric: { metricName: 'sessions' }, desc: true }
      ],
      limit: 1000
    };

    console.log('Making GA4 API request for AI traffic');
    console.log('Request payload:', JSON.stringify(requestPayload, null, 2));

    const ga4Response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${site.ga_property_id}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      }
    );

    const ga4Data = await ga4Response.json();
    console.log('GA4 AI traffic response received');

    if (!ga4Data.rows) {
      console.log('No AI traffic data found');
      return new Response(JSON.stringify({
        totalSessions: 0,
        totalUsers: 0,
        platforms: [],
        dailyTrend: [],
        topLandingPages: [],
        summary: {
          totalSessions: 0,
          totalUsers: 0,
          totalConversions: 0,
          totalRevenue: 0,
          averageEngagementRate: 0,
          averageSessionDuration: 0,
          bounceRate: 0
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Total AI traffic rows: ${ga4Data.rows.length}`);

    // Process the data
    const platformData: Record<string, any> = {};
    const dailyData: Record<string, any> = {};
    const landingPageData: Record<string, any> = {};
    let totalSessions = 0;
    let totalUsers = 0;
    let totalConversions = 0;
    let totalRevenue = 0;
    let totalEngagementRate = 0;
    let totalSessionDuration = 0;
    let totalBounceRate = 0;

    ga4Data.rows.forEach((row: any) => {
      const source = row.dimensionValues[0]?.value || 'Unknown';
      const medium = row.dimensionValues[1]?.value || 'Unknown';
      const landingPage = row.dimensionValues[2]?.value || 'Unknown';
      const date = row.dimensionValues[3]?.value || 'Unknown';
      
      const sessions = parseInt(row.metricValues[0]?.value || '0');
      const users = parseInt(row.metricValues[1]?.value || '0');
      const newUsers = parseInt(row.metricValues[2]?.value || '0');
      const conversions = parseFloat(row.metricValues[3]?.value || '0');
      const revenue = parseFloat(row.metricValues[4]?.value || '0');
      const avgDuration = parseFloat(row.metricValues[5]?.value || '0');
      const bounceRate = parseFloat(row.metricValues[6]?.value || '0');
      const engagementRate = parseFloat(row.metricValues[7]?.value || '0');
      const pageViews = parseInt(row.metricValues[8]?.value || '0');

      // Platform aggregation
      if (!platformData[source]) {
        platformData[source] = {
          platform: source,
          medium: medium,
          sessions: 0,
          users: 0,
          newUsers: 0,
          conversions: 0,
          revenue: 0,
          avgDuration: 0,
          bounceRate: 0,
          engagementRate: 0,
          pageViews: 0
        };
      }

      platformData[source].sessions += sessions;
      platformData[source].users += users;
      platformData[source].newUsers += newUsers;
      platformData[source].conversions += conversions;
      platformData[source].revenue += revenue;
      platformData[source].avgDuration += avgDuration;
      platformData[source].bounceRate += bounceRate;
      platformData[source].engagementRate += engagementRate;
      platformData[source].pageViews += pageViews;

      // Daily trend aggregation
      if (!dailyData[date]) {
        dailyData[date] = { date, sessions: 0, users: 0, conversions: 0 };
      }
      dailyData[date].sessions += sessions;
      dailyData[date].users += users;
      dailyData[date].conversions += conversions;

      // Landing page aggregation
      if (!landingPageData[landingPage]) {
        landingPageData[landingPage] = { page: landingPage, sessions: 0, users: 0 };
      }
      landingPageData[landingPage].sessions += sessions;
      landingPageData[landingPage].users += users;

      // Totals
      totalSessions += sessions;
      totalUsers += users;
      totalConversions += conversions;
      totalRevenue += revenue;
      totalEngagementRate += engagementRate;
      totalSessionDuration += avgDuration;
      totalBounceRate += bounceRate;
    });

    // Sort and format results
    const platforms = Object.values(platformData)
      .map((platform: any) => ({
        ...platform,
        conversionRate: platform.sessions > 0 ? (platform.conversions / platform.sessions * 100) : 0
      }))
      .sort((a: any, b: any) => b.sessions - a.sessions);

    const dailyTrend = Object.values(dailyData)
      .sort((a: any, b: any) => a.date.localeCompare(b.date));

    const topLandingPages = Object.values(landingPageData)
      .sort((a: any, b: any) => b.sessions - a.sessions)
      .slice(0, 10);

    console.log(`Processed AI traffic data: ${platforms.length} platforms, ${dailyTrend.length} days`);

    const result = {
      totalSessions,
      totalUsers,
      platforms,
      dailyTrend,
      topLandingPages,
      summary: {
        totalSessions,
        totalUsers,
        totalConversions,
        totalRevenue,
        averageEngagementRate: ga4Data.rows.length > 0 ? totalEngagementRate / ga4Data.rows.length : 0,
        averageSessionDuration: ga4Data.rows.length > 0 ? totalSessionDuration / ga4Data.rows.length : 0,
        bounceRate: ga4Data.rows.length > 0 ? totalBounceRate / ga4Data.rows.length : 0
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in GA4 AI traffic function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      totalSessions: 0,
      totalUsers: 0,
      platforms: [],
      dailyTrend: [],
      topLandingPages: [],
      summary: {
        totalSessions: 0,
        totalUsers: 0,
        totalConversions: 0,
        totalRevenue: 0,
        averageEngagementRate: 0,
        averageSessionDuration: 0,
        bounceRate: 0
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});