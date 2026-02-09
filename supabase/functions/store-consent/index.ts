import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConsentRequest {
  site_id?: string;
  tracking_id?: string; // Fallback for old implementations
  session_id?: string;
  uuid?: string; // Alternative field name for session_id
  consent_types: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
    preferences: boolean;
  };
  ip_address?: string;
  user_agent?: string;
  source?: string;
  locale?: string;
  gpc_signal?: boolean;
  policy_version?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const requestData: ConsentRequest = await req.json();
    console.log('Received consent request:', JSON.stringify(requestData, null, 2));

    // Normalize session_id from either session_id or uuid field
    const session_id = requestData.session_id || requestData.uuid;
    
    // Validate required fields
    if (!session_id || !requestData.consent_types) {
      throw new Error('Missing required fields: session_id (or uuid) and consent_types are required');
    }

    // Validate tracking_id format if provided
    if (requestData.tracking_id && !requestData.tracking_id.startsWith('tk_')) {
      throw new Error('Invalid tracking_id format. Must start with "tk_"');
    }

    let site_id = requestData.site_id;

    // If site_id is not provided but tracking_id is, try to resolve it
    if (!site_id && requestData.tracking_id) {
      console.log('Resolving site_id from tracking_id:', requestData.tracking_id);
      
      const { data: siteData, error: siteError } = await supabase
        .from('sites')
        .select('id')
        .eq('tracking_id', requestData.tracking_id)
        .maybeSingle();

      if (siteError) {
        console.error('Error finding site by tracking_id:', siteError);
        throw new Error(`Database error while resolving tracking_id: ${requestData.tracking_id}`);
      }

      if (!siteData) {
        console.error('Site not found for tracking_id:', requestData.tracking_id);
        throw new Error(`Site not found for tracking_id: ${requestData.tracking_id}`);
      }

      site_id = siteData.id;
      console.log('Resolved site_id:', site_id);
    }

    if (!site_id) {
      throw new Error('Either site_id or valid tracking_id must be provided');
    }

    // Validate that site_id is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(site_id)) {
      throw new Error(`Invalid site_id format: ${site_id}. Must be a valid UUID.`);
    }

    // Prepare consent data with sanitized inputs
    const consentData = {
      site_id,
      session_id: session_id.substring(0, 255), // Limit length to prevent overflow
      consent_given: true,
      consent_types: requestData.consent_types,
      ip_address: requestData.ip_address ? requestData.ip_address.substring(0, 45) : null, // IPv6 max length
      user_agent: requestData.user_agent ? requestData.user_agent.substring(0, 500) : null, // Reasonable limit
      source: requestData.source ? requestData.source.substring(0, 50) : 'cookie_banner',
      locale: requestData.locale ? requestData.locale.substring(0, 10) : 'sv',
      gpc_signal: requestData.gpc_signal || false,
      policy_version: requestData.policy_version ? requestData.policy_version.substring(0, 20) : '1.0',
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    };

    console.log('Storing consent data:', JSON.stringify(consentData, null, 2));

    // Check for existing consent for this session
    const { data: existingConsent } = await supabase
      .from('cookie_consents')
      .select('id')
      .eq('session_id', session_id)
      .eq('site_id', site_id)
      .maybeSingle();

    let result;
    if (existingConsent) {
      // Update existing consent
      const { data, error } = await supabase
        .from('cookie_consents')
        .update({
          consent_types: requestData.consent_types,
          updated_at: new Date().toISOString(),
          policy_version: consentData.policy_version,
        })
        .eq('id', existingConsent.id)
        .select()
        .single();

      if (error) {
        console.error('Database update error:', JSON.stringify(error, null, 2));
        throw error;
      }

      result = data;
      console.log('Updated existing consent:', result.id);
    } else {
      // Insert new consent
      const { data, error } = await supabase
        .from('cookie_consents')
        .insert(consentData)
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', JSON.stringify(error, null, 2));
        throw error;
      }

      result = data;
      console.log('Created new consent:', result.id);
    }

    // Also validate the consent for compliance tracking
    if (requestData.consent_types.analytics || requestData.consent_types.marketing) {
      console.log('Creating consent validation record');
      
        const { error: validationError } = await supabase
        .from('consent_validations')
        .insert({
          site_id,
          session_id: session_id,
          validation_timestamp: new Date().toISOString(),
          consent_status: requestData.consent_types,
          ip_address: consentData.ip_address,
          user_agent: consentData.user_agent,
        });

      if (validationError) {
        console.warn('Could not create consent validation:', validationError);
        // Don't fail the entire request for validation errors
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        consent_id: result.id,
        message: 'Consent stored successfully',
        consent_types: requestData.consent_types,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in store-consent function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});