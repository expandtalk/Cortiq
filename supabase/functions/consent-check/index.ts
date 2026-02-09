import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ConsentRequest {
  site_id: string;
  session_id: string;
  consent_types: string[]; // ['analytics', 'marketing', 'preferences']
  integration_type?: string; // 'google_analytics', 'meta_pixel', 'google_ads'
  ip_address?: string;
  user_agent?: string;
}

interface ConsentResponse {
  allowed: boolean;
  blocked_consent_types: string[];
  allowed_consent_types: string[];
  validation_id: string;
  reason?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === 'POST') {
    try {
      const body: ConsentRequest = await req.json();
      const { site_id, session_id, consent_types, integration_type, ip_address, user_agent } = body;

      console.log('Consent check request:', { site_id, session_id, consent_types, integration_type });

      // Validate required fields
      if (!site_id || !session_id || !consent_types || consent_types.length === 0) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: site_id, session_id, consent_types' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get site configuration
      const { data: site } = await supabase
        .from('sites')
        .select('server_side_tracking_config')
        .eq('id', site_id)
        .single();

      if (!site) {
        return new Response(JSON.stringify({ 
          error: 'Site not found' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const config = site.server_side_tracking_config || {};
      
      // Get latest consent for this session
      const { data: latestConsent } = await supabase
        .from('cookie_consents')
        .select('*')
        .eq('site_id', site_id)
        .eq('session_id', session_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let allowedTypes: string[] = [];
      let blockedTypes: string[] = [];
      let overallAllowed = true;
      let reason = '';

      // Check each consent type
      for (const consentType of consent_types) {
        let isAllowed = false;

        // Check site configuration first
        if (consentType === 'analytics' && !config.block_analytics_without_consent) {
          isAllowed = true;
        } else if (consentType === 'marketing' && !config.block_marketing_without_consent) {
          isAllowed = true;
        } else if (consentType === 'necessary') {
          isAllowed = true; // Always allow necessary
        } else {
          // Check actual consent
          if (latestConsent && latestConsent.consent_types) {
            const consentData = latestConsent.consent_types as any;
            isAllowed = consentData[consentType] === true;
          } else {
            isAllowed = false;
            reason = 'No consent found for session';
          }
        }

        if (isAllowed) {
          allowedTypes.push(consentType);
        } else {
          blockedTypes.push(consentType);
          overallAllowed = false;
        }
      }

      // If require_explicit_consent is true and no consent found, block everything except necessary
      if (config.require_explicit_consent && !latestConsent && consent_types.some(t => t !== 'necessary')) {
        overallAllowed = false;
        reason = 'Explicit consent required but not found';
        blockedTypes = consent_types.filter(t => t !== 'necessary');
        allowedTypes = consent_types.filter(t => t === 'necessary');
      }

      // Log validation
      const { data: validation } = await supabase
        .from('consent_validations')
        .insert({
          site_id,
          session_id,
          consent_status: {
            requested_types: consent_types,
            allowed_types: allowedTypes,
            blocked_types: blockedTypes,
            integration_type: integration_type || 'unknown',
            overall_allowed: overallAllowed
          },
          blocked_calls: blockedTypes.map(type => ({
            type,
            integration: integration_type,
            timestamp: new Date().toISOString()
          })),
          allowed_calls: allowedTypes.map(type => ({
            type,
            integration: integration_type,
            timestamp: new Date().toISOString()
          })),
          ip_address,
          user_agent
        })
        .select()
        .single();

      const response: ConsentResponse = {
        allowed: overallAllowed,
        blocked_consent_types: blockedTypes,
        allowed_consent_types: allowedTypes,
        validation_id: validation?.id || '',
        reason: reason || undefined
      };

      console.log('Consent check result:', response);

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Consent check error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response('Method not allowed', { 
    status: 405, 
    headers: corsHeaders 
  });
});