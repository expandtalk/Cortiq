/**
 * CortIQ Intranet Relay
 *
 * Purpose:
 *   Enables analytics on closed corporate networks where pages cannot reach
 *   external endpoints directly.  Deploy this service inside the intranet; pages
 *   send events to the relay, which forwards them to CortIQ over outbound HTTPS.
 *
 *   The relay also injects the real internal client IP into each event payload so
 *   IP-segment matching works correctly server-side.
 *
 * Configuration (environment variables):
 *   CORTIQ_API_KEY   — required. The company API key from CortIQ → Settings → API Keys.
 *   CORTIQ_ENDPOINT  — optional. Defaults to the Supabase Edge Function URL.
 *   PORT             — optional. Defaults to 3478.
 *   ALLOWED_ORIGINS  — optional. Comma-separated CORS origins, e.g. http://intranet.corp.
 *                      Defaults to '*' (allow all intranet origins).
 *
 * Deployment:
 *   docker compose up -d   (see docker-compose.yml)
 *
 * Security notes:
 *   - Run behind an internal firewall; do NOT expose to the public internet.
 *   - The relay never stores events; it forwards and discards.
 *   - CORTIQ_API_KEY should be stored as a Docker secret or environment variable,
 *     not hard-coded in any file.
 *
 * Legal notes:
 *   - This relay is intended for intranet / own-company analytics only.
 *   - Ensure CortIQ is configured with an "own_company" IP segment and
 *     Intranet mode ENABLED for the relevant subnet so that only aggregated
 *     page views are stored (no individual session IDs or click coordinates).
 *   - Employees must be informed of monitoring via IT policy (GDPR Art. 13/14).
 */

'use strict';

const express = require('express');

const app = express();

const API_KEY  = process.env.CORTIQ_API_KEY;
const ENDPOINT = process.env.CORTIQ_ENDPOINT
  || 'https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/track-event';
const PORT     = parseInt(process.env.PORT || '3478', 10);
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*';

if (!API_KEY) {
  console.error('[cortiq-relay] FATAL: CORTIQ_API_KEY environment variable is required.');
  process.exit(1);
}

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(express.json({ limit: '256kb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Health check ──────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ ok: true, relay: 'cortiq-relay', version: '1.0.0' }));

// ── Event collection endpoint ─────────────────────────────────────────────────

app.post('/collect', async (req, res) => {
  // Extract the real client IP from the internal network
  const clientIP =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    null;

  // Merge client IP into metadata so CortIQ's IP-segment matching works
  const body = {
    ...req.body,
    metadata: {
      ...(req.body.metadata || {}),
      ip_address: clientIP,
    },
  };

  try {
    const upstream = await fetch(ENDPOINT, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        // Pass the real IP via Cloudflare-compatible header so jurisdiction.ts reads it
        'CF-Connecting-IP': clientIP || '',
      },
      body: JSON.stringify(body),
      // Abort if upstream takes more than 8 seconds
      signal: AbortSignal.timeout(8000),
    });

    const data = await upstream.json().catch(() => ({}));
    return res.status(upstream.status).json(data);
  } catch (err) {
    console.error('[cortiq-relay] upstream error:', err.message);
    // Return 202 Accepted to avoid the browser retrying on network errors
    return res.status(202).json({ queued: false, error: 'relay_upstream_error' });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[cortiq-relay] listening on :${PORT}`);
  console.log(`[cortiq-relay] forwarding to: ${ENDPOINT}`);
  console.log(`[cortiq-relay] allowed origins: ${ALLOWED_ORIGINS}`);
});
