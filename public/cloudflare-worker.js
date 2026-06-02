/**
 * CortIQ — Cloudflare Worker for server-side traffic analytics
 *
 * SETUP (one-time, ~3 min):
 * 1. In Cloudflare dashboard → Workers & Pages → Create Worker
 * 2. Paste this file, then click "Save and Deploy"
 * 3. Go to the Worker → Settings → Variables → add:
 *      CORTIQ_INGEST_URL  = https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/cloudflare-ingest
 *      CORTIQ_INGEST_KEY  = <the value you set for CLOUDFLARE_INGEST_SECRET in Supabase>
 * 4. Go to Workers & Pages → your Worker → Triggers → Add route:
 *      expandtalk.se/*   (or your domain)
 *
 * The Worker adds ZERO latency to visitors — tracking is fully async.
 * It skips asset files (CSS/JS/images/fonts) to save quota.
 */

const ASSET_EXT = /\.(css|js|mjs|map|woff2?|ttf|eot|otf|png|jpe?g|gif|webp|svg|ico|avif|mp4|mp3|pdf|zip)(\?|$)/i;

export default {
  async fetch(request, env, ctx) {
    // Pass through to origin first — visitors never wait for analytics
    const response = await fetch(request);

    const url = new URL(request.url);

    // Skip Cloudflare internals and static assets
    if (
      url.pathname.startsWith('/cdn-cgi/') ||
      ASSET_EXT.test(url.pathname)
    ) {
      return response;
    }

    // Fire-and-forget: doesn't affect response time
    ctx.waitUntil(sendAnalytics(request, response.status, url, env));

    return response;
  },
};

async function sendAnalytics(request, statusCode, url, env) {
  try {
    const userAgent  = request.headers.get('User-Agent') || '';
    const country    = request.headers.get('CF-IPCountry') || 'unknown';
    const referrer   = request.headers.get('Referer') || '';
    const rayId      = request.headers.get('CF-Ray') || '';
    const rawIP      = request.headers.get('CF-Connecting-IP') || '';

    // Anonymise to /24 subnet (GDPR)
    const ipSubnet = anonymiseIP(rawIP);

    await fetch(env.CORTIQ_INGEST_URL, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ingest-key': env.CORTIQ_INGEST_KEY || '',
      },
      body: JSON.stringify({
        domain:     url.hostname,
        urlPath:    url.pathname,
        method:     request.method,
        statusCode,
        country,
        userAgent,
        referrer,
        rayId,
        ipSubnet,
        isAsset:    false,
      }),
    });
  } catch (_) {
    // Never let tracking errors surface to visitors
  }
}

function anonymiseIP(ip) {
  if (!ip) return null;
  if (ip.includes(':')) {
    // IPv6: keep first 3 groups
    return ip.split(':').slice(0, 3).join(':') + '::/48';
  }
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
  return null;
}
