import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { google } from 'npm:googleapis'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { siteUrl, apiKey, propertyId } = await req.json()
    
    if (!siteUrl || !apiKey) {
      throw new Error('Site URL and API key are required')
    }

    console.log('Fetching data for:', siteUrl)

    // Hämta data från Google Search Console API
    const searchConsoleData = await fetchSearchConsoleData(siteUrl, apiKey)
    
    // Hämta data från Google Analytics API (om propertyId finns)
    const analyticsData = propertyId ? 
      await fetchAnalyticsData(propertyId, apiKey) : 
      { sessions: 0, users: 0, pageviews: 0, bounceRate: 0, sessionDuration: 0 }
    
    // Hämta data från PageSpeed Insights API
    const pagespeedData = await fetchPageSpeedData(siteUrl, apiKey)

    const responseData = {
      searchConsole: searchConsoleData,
      analytics: analyticsData,
      pagespeed: pagespeedData
    }

    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error fetching Google APIs data:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function fetchSearchConsoleData(siteUrl: string, apiKey: string) {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  try {
    // Initiera Google Search Console API klient
    const searchConsole = google.webmasters({
      version: 'v3',
      auth: apiKey
    })
    
    // Hämta sökanalysdata
    const searchAnalyticsResponse = await searchConsole.searchanalytics.query({
      siteUrl: siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 10
      }
    })
    
    const data = searchAnalyticsResponse.data
    
    // Aggregera totaler
    let totalClicks = 0
    let totalImpressions = 0
    let totalCtr = 0
    let totalPosition = 0
    
    const rows = data.rows || []
    
    rows.forEach((row) => {
      totalClicks += row.clicks || 0
      totalImpressions += row.impressions || 0
      totalCtr += row.ctr || 0
      totalPosition += row.position || 0
    })
    
    return {
      totalClicks,
      totalImpressions,
      averageCTR: rows.length > 0 ? +(totalCtr / rows.length * 100).toFixed(2) : 0,
      averagePosition: rows.length > 0 ? +(totalPosition / rows.length).toFixed(1) : 0,
      topQueries: rows.slice(0, 5).map((row) => ({
        query: row.keys ? row.keys[0] : '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0
      }))
    }
  } catch (error) {
    console.error('Search Console API error:', error)
    return {
      totalClicks: 0,
      totalImpressions: 0,
      averageCTR: 0,
      averagePosition: 0,
      topQueries: []
    }
  }
}

async function fetchAnalyticsData(propertyId: string, apiKey: string) {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  try {
    // Initiera Google Analytics Data API klient
    const analyticsData = google.analyticsdata({
      version: 'v1beta',
      auth: apiKey
    })
    
    // Skapa rapport
    const analyticsResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' }
        ]
      }
    })
    
    const metrics = analyticsResponse.data.rows?.[0]?.metricValues || []
    
    return {
      sessions: parseInt(metrics[0]?.value || '0'),
      users: parseInt(metrics[1]?.value || '0'),
      pageviews: parseInt(metrics[2]?.value || '0'),
      bounceRate: parseFloat(metrics[3]?.value || '0'),
      sessionDuration: parseInt(metrics[4]?.value || '0')
    }
  } catch (error) {
    console.error('Analytics API error:', error)
    return {
      sessions: 0,
      users: 0,
      pageviews: 0,
      bounceRate: 0,
      sessionDuration: 0
    }
  }
}

async function fetchPageSpeedData(siteUrl: string, apiKey: string) {
  try {
    // Initiera PageSpeed Insights API klient
    const pagespeedapi = google.pagespeedonline({
      version: 'v5',
      auth: apiKey
    })
    
    // Hämta resultat för både mobil och desktop
    const [mobileResponse, desktopResponse] = await Promise.all([
      pagespeedapi.pagespeedapi.runpagespeed({
        url: siteUrl,
        strategy: 'mobile'
      }),
      pagespeedapi.pagespeedapi.runpagespeed({
        url: siteUrl,
        strategy: 'desktop'
      })
    ])
    
    const mobileData = mobileResponse.data
    const desktopData = desktopResponse.data
    
    return {
      mobileScore: Math.round((mobileData.lighthouseResult?.categories?.performance?.score || 0) * 100),
      desktopScore: Math.round((desktopData.lighthouseResult?.categories?.performance?.score || 0) * 100),
      fcp: +(mobileData.lighthouseResult?.audits?.['first-contentful-paint']?.numericValue / 1000 || 0).toFixed(1),
      lcp: +(mobileData.lighthouseResult?.audits?.['largest-contentful-paint']?.numericValue / 1000 || 0).toFixed(1)
    }
  } catch (error) {
    console.error('PageSpeed API error:', error)
    return {
      mobileScore: 0,
      desktopScore: 0,
      fcp: 0,
      lcp: 0
    }
  }
}