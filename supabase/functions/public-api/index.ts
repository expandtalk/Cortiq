import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { createHash } from "https://deno.land/std@0.168.0/hash/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface ApiKeyValidation {
  api_key_id: string;
  company_id: string;
  site_id: string;
  permissions: string[];
  rate_limit: number;
}

/**
 * Validate API key from Authorization header
 */
async function validateApiKey(authHeader: string | null, supabase: any): Promise<ApiKeyValidation | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const apiKey = authHeader.substring(7); // Remove 'Bearer '

  // Hash the API key for database lookup
  const hash = createHash("sha256");
  hash.update(apiKey);
  const keyHash = hash.toString();

  const { data, error } = await supabase.rpc('validate_api_key', { p_key_hash: keyHash });

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0];
}

/**
 * Check rate limit for API key
 */
async function checkRateLimit(apiKeyId: string, rateLimit: number, supabase: any): Promise<boolean> {
  const { data } = await supabase.rpc('check_rate_limit', {
    p_api_key_id: apiKeyId,
    p_rate_limit: rateLimit
  });

  return data === true;
}

/**
 * Log API usage
 */
async function logUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  requestIp: string,
  userAgent: string,
  supabase: any
) {
  await supabase.rpc('log_api_usage', {
    p_api_key_id: apiKeyId,
    p_endpoint: endpoint,
    p_method: method,
    p_status_code: statusCode,
    p_response_time_ms: responseTimeMs,
    p_request_ip: requestIp,
    p_user_agent: userAgent
  });
}

/**
 * Parse query parameters
 */
function getQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const urlObj = new URL(url);
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ];

  return csvRows.join('\n');
}

/**
 * GET /api/v1/sites - List sites for account
 */
async function handleGetSites(apiKey: ApiKeyValidation, supabase: any) {
  const { data, error } = await supabase
    .from('sites')
    .select('id, domain, name, created_at, is_active')
    .eq('company_id', apiKey.company_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * GET /api/v1/sites/{id}/visits - Get visits data
 */
async function handleGetVisits(
  siteId: string,
  params: Record<string, string>,
  supabase: any
) {
  const dateFrom = params.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const dateTo = params.date_to || new Date().toISOString();
  const limit = parseInt(params.limit || '1000');
  const offset = parseInt(params.offset || '0');

  const { data, error } = await supabase
    .from('tracking_sessions')
    .select('*')
    .eq('site_id', siteId)
    .gte('started_at', dateFrom)
    .lte('started_at', dateTo)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

/**
 * GET /api/v1/sites/{id}/pages - Get page views
 */
async function handleGetPages(
  siteId: string,
  params: Record<string, string>,
  supabase: any
) {
  const dateFrom = params.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const dateTo = params.date_to || new Date().toISOString();
  const limit = parseInt(params.limit || '1000');
  const offset = parseInt(params.offset || '0');

  const { data, error } = await supabase
    .from('page_views')
    .select('*')
    .eq('site_id', siteId)
    .gte('viewed_at', dateFrom)
    .lte('viewed_at', dateTo)
    .order('viewed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

/**
 * GET /api/v1/sites/{id}/referrers - Get traffic sources
 */
async function handleGetReferrers(
  siteId: string,
  params: Record<string, string>,
  supabase: any
) {
  const dateFrom = params.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const dateTo = params.date_to || new Date().toISOString();

  const { data, error } = await supabase
    .from('tracking_sessions')
    .select('referrer_url, referrer_domain')
    .eq('site_id', siteId)
    .gte('started_at', dateFrom)
    .lte('started_at', dateTo)
    .not('referrer_url', 'is', null);

  if (error) throw error;

  // Aggregate by domain
  const referrersMap = new Map<string, number>();
  data.forEach((row: any) => {
    const domain = row.referrer_domain || 'direct';
    referrersMap.set(domain, (referrersMap.get(domain) || 0) + 1);
  });

  return Array.from(referrersMap.entries()).map(([domain, count]) => ({
    domain,
    visits: count
  })).sort((a, b) => b.visits - a.visits);
}

/**
 * GET /api/v1/sites/{id}/events - Get events
 */
async function handleGetEvents(
  siteId: string,
  params: Record<string, string>,
  supabase: any
) {
  const dateFrom = params.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const dateTo = params.date_to || new Date().toISOString();
  const limit = parseInt(params.limit || '1000');
  const offset = parseInt(params.offset || '0');

  const { data, error } = await supabase
    .from('tracking_events')
    .select('*')
    .eq('site_id', siteId)
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

/**
 * GET /api/v1/sites/{id}/agents - Get AI agent traffic (CortIQ unique!)
 */
async function handleGetAgents(
  siteId: string,
  params: Record<string, string>,
  supabase: any
) {
  const dateFrom = params.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const dateTo = params.date_to || new Date().toISOString();

  const { data, error } = await supabase
    .from('ai_agent_sessions')
    .select('*')
    .eq('site_id', siteId)
    .gte('started_at', dateFrom)
    .lte('started_at', dateTo)
    .order('started_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * GET /api/v1/sites/{id}/conversions - Get conversions
 */
async function handleGetConversions(
  siteId: string,
  params: Record<string, string>,
  supabase: any
) {
  const dateFrom = params.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const dateTo = params.date_to || new Date().toISOString();

  const { data, error } = await supabase
    .from('conversion_events')
    .select('*')
    .eq('site_id', siteId)
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * GET /api/v1/sites/{id}/heatmaps - Get heatmap data
 */
async function handleGetHeatmaps(
  siteId: string,
  params: Record<string, string>,
  supabase: any
) {
  const dateFrom = params.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const dateTo = params.date_to || new Date().toISOString();
  const pageUrl = params.page_url;

  let query = supabase
    .from('heatmap_clicks')
    .select('*')
    .eq('site_id', siteId)
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo);

  if (pageUrl) {
    query = query.eq('page_url', pageUrl);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Main request handler
 */
serve(async (req) => {
  const startTime = Date.now();

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate API key
    const authHeader = req.headers.get('authorization');
    const apiKey = await validateApiKey(authHeader, supabase);

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing API key' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check rate limit
    const withinLimit = await checkRateLimit(apiKey.api_key_id, apiKey.rate_limit, supabase);
    if (!withinLimit) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', retry_after: 3600 }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': apiKey.rate_limit.toString(),
            'Retry-After': '3600'
          }
        }
      );
    }

    // Parse URL and route
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(p => p);
    const params = getQueryParams(req.url);
    const format = params.format || 'json';

    let data: any;
    let endpoint = url.pathname;

    // API routing
    if (pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'v1' && pathParts[2] === 'sites') {
      // GET /api/v1/sites
      data = await handleGetSites(apiKey, supabase);
    } else if (pathParts.length === 5 && pathParts[0] === 'api' && pathParts[1] === 'v1' && pathParts[2] === 'sites') {
      const siteId = pathParts[3];
      const resource = pathParts[4];

      // Verify site belongs to company
      const { data: site } = await supabase
        .from('sites')
        .select('id')
        .eq('id', siteId)
        .eq('company_id', apiKey.company_id)
        .single();

      if (!site) {
        return new Response(
          JSON.stringify({ error: 'Site not found or access denied' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Route to specific resource
      switch (resource) {
        case 'visits':
          data = await handleGetVisits(siteId, params, supabase);
          break;
        case 'pages':
          data = await handleGetPages(siteId, params, supabase);
          break;
        case 'referrers':
          data = await handleGetReferrers(siteId, params, supabase);
          break;
        case 'events':
          data = await handleGetEvents(siteId, params, supabase);
          break;
        case 'agents':
          data = await handleGetAgents(siteId, params, supabase);
          break;
        case 'conversions':
          data = await handleGetConversions(siteId, params, supabase);
          break;
        case 'heatmaps':
          data = await handleGetHeatmaps(siteId, params, supabase);
          break;
        default:
          return new Response(
            JSON.stringify({ error: 'Unknown resource: ' + resource }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid API endpoint' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Log usage
    const responseTime = Date.now() - startTime;
    const requestIp = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await logUsage(
      apiKey.api_key_id,
      endpoint,
      req.method,
      200,
      responseTime,
      requestIp,
      userAgent,
      supabase
    );

    // Format response
    if (format === 'csv') {
      const csv = convertToCSV(data);
      return new Response(csv, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="cortiq-data-${Date.now()}.csv"`
        }
      });
    } else {
      return new Response(JSON.stringify(data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': apiKey.rate_limit.toString(),
          'X-Response-Time': responseTime.toString()
        }
      });
    }

  } catch (error) {
    console.error('Public API error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
