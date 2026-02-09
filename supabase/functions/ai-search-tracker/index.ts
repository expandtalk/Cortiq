import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackingData {
  siteId: string;
  sessionId: string;
  userHash?: string;
  aiPlatform: string;
  referrer?: string;
  userAgent?: string;
  url: string;
  pageTitle?: string;
  deviceType?: string;
  browser?: string;
  operatingSystem?: string;
  landedAt?: string;
  update?: {
    sessionDuration?: number;
    pagesViewed?: number;
    conversions?: number;
    revenue?: number;
    engaged?: boolean;
    bounce?: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: TrackingData = await req.json();

    console.log('AI Search Tracking received:', {
      siteId: data.siteId,
      sessionId: data.sessionId,
      aiPlatform: data.aiPlatform,
      isUpdate: !!data.update
    });

    // Validate required fields
    if (!data.siteId || !data.sessionId) {
      throw new Error('Missing required fields: siteId, sessionId');
    }

    // If this is an update request
    if (data.update) {
      const { error: updateError } = await supabase
        .from('ai_search_traffic')
        .update(data.update)
        .eq('site_id', data.siteId)
        .eq('session_id', data.sessionId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      return new Response(
        JSON.stringify({ success: true, action: 'updated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if session already exists
    const { data: existingSession, error: checkError } = await supabase
      .from('ai_search_traffic')
      .select('id')
      .eq('site_id', data.siteId)
      .eq('session_id', data.sessionId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Check error:', checkError);
      throw checkError;
    }

    // If session exists, increment page views
    if (existingSession) {
      const { error: updateError } = await supabase
        .from('ai_search_traffic')
        .update({
          pages_viewed: supabase.rpc('increment', { x: 1 }),
          engaged: true
        })
        .eq('id', existingSession.id);

      if (updateError) {
        console.error('Page view update error:', updateError);
      }

      return new Response(
        JSON.stringify({ success: true, action: 'pageview_tracked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert new session
    const insertData = {
      site_id: data.siteId,
      session_id: data.sessionId,
      user_hash: data.userHash,
      ai_platform: data.aiPlatform,
      referrer: data.referrer,
      user_agent: data.userAgent,
      url: data.url,
      page_title: data.pageTitle,
      device_type: data.deviceType || 'desktop',
      browser: data.browser,
      operating_system: data.operatingSystem,
      landed_at: data.landedAt || new Date().toISOString(),
      pages_viewed: 1,
      engaged: false,
      bounce: false
    };

    const { error: insertError } = await supabase
      .from('ai_search_traffic')
      .insert(insertData);

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('AI search traffic tracked successfully');

    return new Response(
      JSON.stringify({ success: true, action: 'session_created' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-search-tracker:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
