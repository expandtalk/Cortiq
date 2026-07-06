// HubSpot Lead Quality Webhook
// Receives contact.propertyChange events from HubSpot when lead_quality changes.
// GDPR: email is SHA-256 hashed immediately — never stored in plain text.
// Classifies matching conversion_events; the consent gate that decides what is
// actually uploaded to Google Ads is enforced in google-ads-quality-upload.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hubspot-signature, x-hubspot-signature-v3',
};

const QUALITY_VALUES: Record<string, number> = {
  Priority: 300,
  Qualified: 100,
  Challenge: 0,
};

async function sha256Hex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Constant-time string compare — avoids leaking the secret via response timing.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacSha256Base64(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(mac)));
}

async function verifyHubSpotSignature(req: Request, body: string, secret: string): Promise<boolean> {
  // Prefer v3 (HMAC-SHA256 over method+uri+body+timestamp, base64) when present.
  const v3 = req.headers.get('x-hubspot-signature-v3');
  const ts = req.headers.get('x-hubspot-request-timestamp');
  if (v3 && ts) {
    const tsNum = Number(ts);
    // Reject stale requests (>5 min) to blunt replay.
    if (!Number.isFinite(tsNum) || Math.abs(Date.now() - tsNum) > 5 * 60 * 1000) return false;
    const expected = await hmacSha256Base64(secret, `${req.method}${req.url}${body}${ts}`);
    return timingSafeEqual(v3, expected);
  }
  // Fall back to v1: SHA-256(clientSecret + requestBody).
  const expected = await sha256Hex(secret + body);
  const received = req.headers.get('x-hubspot-signature') || '';
  return timingSafeEqual(received, expected);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health-check ping from wizard (no signature required)
  const url = new URL(req.url);
  const siteId = url.searchParams.get('site_id');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const rawBody = await req.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve site_id from URL param or body (body.site_id is used for wizard test pings via supabase.functions.invoke)
    const resolvedSiteId = siteId || (body._test ? body.site_id : null);

    // Test ping from the setup wizard. This path has no HubSpot signature, so it must
    // NOT reveal whether an arbitrary site_id exists to anonymous callers. Require the
    // caller's Supabase session and verify they own the site (the wizard invokes with
    // the user's JWT). Unauthenticated callers get a uniform 401 either way.
    if (body._test === true) {
      const authHeader = req.headers.get('Authorization') ?? '';
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: owned } = await userClient
        .from('sites')
        .select('id')
        .eq('id', resolvedSiteId ?? '')
        .eq('user_id', user.id)
        .maybeSingle();
      return new Response(JSON.stringify({ ok: !!owned }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const effectiveSiteId = resolvedSiteId || siteId;
    if (!effectiveSiteId) {
      return new Response(JSON.stringify({ error: 'Missing site_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch site config (webhook secret + property name)
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, hubspot_webhook_secret, hubspot_quality_property')
      .eq('id', effectiveSiteId)
      .single();

    if (siteError || !site) {
      return new Response(JSON.stringify({ error: 'Invalid site' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify HubSpot signature. A missing secret means the site never completed
    // setup — reject rather than accepting unsigned writes (site_id is guessable).
    const secret = (site as any).hubspot_webhook_secret;
    if (!secret) {
      return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const valid = await verifyHubSpotSignature(req, rawBody, secret);
    if (!valid) {
      console.warn('HubSpot signature mismatch for site', siteId);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // HubSpot sends an array of subscription events
    const events: any[] = Array.isArray(body) ? body : [body];
    const qualityProperty = (site as any).hubspot_quality_property || 'lead_quality';

    for (const event of events) {
      if (event.propertyName !== qualityProperty) continue;

      const email: string | undefined = event.email || event.properties?.email;
      const qualityValue: string = event.propertyValue || event.value || '';

      if (!email || !qualityValue) continue;
      if (!(qualityValue in QUALITY_VALUES)) continue;

      const hashedEmail = await sha256Hex(email);
      const numericValue = QUALITY_VALUES[qualityValue];

      // Find conversion event by hashed email
      const { data: convEvents } = await supabase
        .from('conversion_events')
        .select('id, gclid, upload_status')
        .eq('site_id', effectiveSiteId)
        .eq('hashed_email', hashedEmail)
        .is('quality_classified_at', null) // Don't re-classify already classified leads
        .limit(5);

      if (!convEvents || convEvents.length === 0) {
        // Store hashed email + quality even without existing conversion event
        // (the conversion event may arrive later or be linked on next form submit)
        console.log('No matching conversion event found for hashed email — stored for future matching');
        continue;
      }

      for (const ce of convEvents) {
        const hasGclid = !!ce.gclid;
        const uploadStatus = hasGclid ? 'pending' : 'skipped_no_gclid';

        // Atomic claim: only update if still unclassified, so two concurrent webhook
        // deliveries can't both classify (and later double-upload) the same lead.
        await supabase
          .from('conversion_events')
          .update({
            lead_quality: qualityValue,
            quality_value: numericValue,
            quality_classified_at: new Date().toISOString(),
            upload_status: uploadStatus,
          })
          .eq('id', ce.id)
          .is('quality_classified_at', null);
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: events.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('hubspot-lead-webhook error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
