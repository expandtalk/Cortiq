import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackingEventRequest {
  company_id: string;
  content_type: 'image' | 'form' | 'event' | 'survey' | 'chatbot' | 'page';
  content_id: string;
  event_type: 'view' | 'click' | 'conversion' | 'submission';
  platform?: string;
  session_id: string;
  metadata?: {
    user_agent?: string;
    referrer?: string;
    country?: string;
    device_type?: string;
    [key: string]: any;
  };
  timestamp?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract API key from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = authHeader.replace('Bearer ', '');

    // Parse request body
    const body: TrackingEventRequest = await req.json();
    console.log('Tracking event request:', {
      company_id: body.company_id,
      content_type: body.content_type,
      event_type: body.event_type
    });

    // Validate company API key
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, is_active, consent_settings')
      .eq('api_key', apiKey)
      .single();

    if (companyError || !company) {
      console.error('Invalid API key:', companyError);
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!company.is_active) {
      console.error('Company is inactive:', company.id);
      return new Response(
        JSON.stringify({ error: 'Company account is inactive' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify company_id matches API key
    if (body.company_id !== company.id) {
      console.error('Company ID mismatch. Expected:', company.id, 'Got:', body.company_id);
      return new Response(
        JSON.stringify({ error: 'Company ID does not match API key' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check consent settings
    const consentSettings = company.consent_settings || {};
    const allowedEventTypes = consentSettings.gdpr_settings?.allowed_event_types || ['view', 'click', 'conversion', 'submission'];
    
    if (!allowedEventTypes.includes(body.event_type)) {
      console.log('Event type not allowed by consent settings:', body.event_type);
      return new Response(
        JSON.stringify({ 
          success: true, 
          event_id: null,
          message: 'Event type blocked by consent settings'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate UUID from content_id if it's not already a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let contentIdUuid = body.content_id;
    
    if (!uuidRegex.test(body.content_id)) {
      // Generate a consistent UUID v5 from the content_id string
      const encoder = new TextEncoder();
      const data = encoder.encode(body.content_id);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Format as valid UUID v5 with proper version (5) and variant (8-b) bits
      const p1 = hashHex.slice(0, 8);
      const p2 = hashHex.slice(8, 12);
      const p3 = '5' + hashHex.slice(13, 16); // Version 5
      const p4Char = parseInt(hashHex.slice(16, 17), 16);
      const p4Variant = ((p4Char & 0x3) | 0x8).toString(16); // Variant bits: 10xx
      const p4 = p4Variant + hashHex.slice(17, 20);
      const p5 = hashHex.slice(20, 32);
      
      contentIdUuid = `${p1}-${p2}-${p3}-${p4}-${p5}`;
    }

    // Prepare metadata with anonymization
    let metadata = body.metadata || {};
    
    if (consentSettings.anonymize_ip && metadata.ip_address) {
      delete metadata.ip_address;
    }
    
    if (!consentSettings.gdpr_settings?.store_user_agent) {
      delete metadata.user_agent;
    }
    
    if (!consentSettings.gdpr_settings?.store_referrer) {
      delete metadata.referrer;
    }

    // Rate limiting check (simple version - 10k events per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('tracking_events')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .gte('created_at', oneHourAgo);

    if (count && count >= 10000) {
      console.error('Rate limit exceeded for company:', company.id);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded (10,000 events/hour)' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert tracking event
    const { data: event, error: insertError } = await supabase
      .from('tracking_events')
      .insert({
        company_id: body.company_id,
        content_type: body.content_type,
        content_id: contentIdUuid, // Use generated UUID
        event_type: body.event_type,
        platform: body.platform || 'unknown',
        session_id: body.session_id,
        metadata: {
          ...metadata,
          original_content_id: body.content_id // Store original for reference
        },
        timestamp: body.timestamp ? new Date(body.timestamp).toISOString() : new Date().toISOString()
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to insert tracking event:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to insert tracking event', details: insertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Tracking event inserted successfully:', event.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        event_id: event.id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in track-event function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
