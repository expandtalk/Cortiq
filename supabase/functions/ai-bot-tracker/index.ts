import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AI bot detection patterns
const AI_BOT_PATTERNS = {
  chatgpt: /ChatGPT|GPTBot|OpenAI/i,
  perplexity: /PerplexityBot|Perplexity/i,
  claude: /ClaudeBot|Anthropic/i,
  gemini: /GoogleOther|Googlebot|Bard/i,
  grok: /Grok|TwitterBot/i,
  bingbot: /bingbot|BingPreview/i,
  meta: /facebookexternalhit|Meta/i,
  other: /bot|crawler|spider|scraper/i
};

// Asset file patterns
const ASSET_PATTERNS = {
  css: /\.css(\?|$)/i,
  js: /\.js(\?|$)/i,
  image: /\.(png|jpg|jpeg|gif|webp|svg|ico)(\?|$)/i,
  font: /\.(woff|woff2|ttf|eot|otf)(\?|$)/i,
  other: /\.(json|xml|txt|pdf)(\?|$)/i
};

// Detect if request is for an asset
function detectAssetType(url: string): { isAsset: boolean; assetType: string | null } {
  for (const [type, pattern] of Object.entries(ASSET_PATTERNS)) {
    if (pattern.test(url)) {
      return { isAsset: true, assetType: type };
    }
  }
  return { isAsset: false, assetType: null };
}

// Detect if browser is visual (renders CSS/JS) vs headless/text-based
function detectBrowserType(probeData: any, assetsLoaded: boolean): { isVisual: boolean; browserType: string } {
  // If probe detected webdriver or headless indicators
  if (probeData?.signals?.webdriver || probeData?.signals?.headless) {
    return { isVisual: false, browserType: 'headless' };
  }
  
  // If JS executed and assets loaded, likely visual browser
  if (probeData?.jsExecuted && assetsLoaded) {
    return { isVisual: true, browserType: 'visual' };
  }
  
  // If no JS execution at all, text-based browser
  if (!probeData?.jsExecuted) {
    return { isVisual: false, browserType: 'text-based' };
  }
  
  return { isVisual: false, browserType: 'unknown' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      siteId, 
      url, 
      referrer,
      userAgent,
      sessionId,
      probeData,
      citationData,
      assetsLoaded // New: indicates if CSS/JS were loaded
    } = await req.json();

    console.log('AI bot tracker received:', { siteId, url, userAgent, assetsLoaded });

    // Detect bot type from user agent
    let botType = 'other';
    let botName = 'Unknown Bot';
    
    for (const [type, pattern] of Object.entries(AI_BOT_PATTERNS)) {
      if (pattern.test(userAgent || '')) {
        botType = type;
        botName = type.charAt(0).toUpperCase() + type.slice(1);
        break;
      }
    }

    // Detect asset type
    const { isAsset, assetType } = detectAssetType(url);

    // Detect browser type (visual vs headless vs text-based)
    const { isVisual, browserType } = detectBrowserType(probeData, assetsLoaded);

    // Determine request type
    let requestType = 'unknown';
    if (probeData?.jsExecuted) {
      requestType = 'training'; // Bot executed JS, likely training
    } else if (citationData) {
      requestType = 'citation'; // Citation request
    } else if (botType !== 'other') {
      requestType = 'scraping'; // Known bot, likely scraping
    }

    // Use the new upsert function for agent session tracking
    const { data: agentSessionId, error: sessionError } = await supabase
      .rpc('upsert_ai_agent_session', {
        p_site_id: siteId,
        p_session_id: sessionId || `bot_${Date.now()}`,
        p_bot_type: botType,
        p_bot_name: botName,
        p_url: url,
        p_is_visual_browser: isVisual,
        p_is_asset: isAsset,
        p_asset_type: assetType
      });

    if (sessionError) {
      console.error('Error upserting agent session:', sessionError);
    } else {
      console.log('Agent session tracked:', agentSessionId);
    }

    // Insert bot traffic record (existing behavior)
    const { data: trafficData, error: trafficError } = await supabase
      .from('ai_bot_traffic')
      .insert({
        site_id: siteId,
        bot_type: botType,
        bot_name: botName,
        user_agent: userAgent,
        url,
        referrer,
        session_id: sessionId,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        js_executed: probeData?.jsExecuted || false,
        probe_triggered: !!probeData,
        request_type: requestType,
      })
      .select()
      .single();

    if (trafficError) {
      console.error('Error inserting traffic:', trafficError);
      throw trafficError;
    }

    console.log('Bot traffic recorded:', trafficData);

    // If probe data exists, insert probe signal
    if (probeData && trafficData) {
      const { error: probeError } = await supabase
        .from('ai_bot_probe_signals')
        .insert({
          site_id: siteId,
          traffic_id: trafficData.id,
          execution_time_ms: probeData.executionTime,
          webdriver_detected: probeData.signals?.webdriver || false,
          headless_detected: probeData.signals?.headless || false,
          automation_signals: probeData.signals || {},
          browser_signals: probeData.browserSignals || {},
        });

      if (probeError) {
        console.error('Error inserting probe signal:', probeError);
      }
    }

    // If citation data exists, insert citation record
    if (citationData && trafficData) {
      const { error: citationError } = await supabase
        .from('ai_citations')
        .insert({
          site_id: siteId,
          traffic_id: trafficData.id,
          cited_url: citationData.url || url,
          citation_context: citationData.context,
          utm_source: citationData.utmSource,
          utm_medium: citationData.utmMedium,
          utm_campaign: citationData.utmCampaign,
        });

      if (citationError) {
        console.error('Error inserting citation:', citationError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        botType,
        requestType,
        browserType,
        isVisualBrowser: isVisual,
        trafficId: trafficData.id,
        agentSessionId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-bot-tracker:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
