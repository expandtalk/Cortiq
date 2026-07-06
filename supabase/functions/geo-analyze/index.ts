import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// SSRF guard for the caller-supplied audit URL.
const PRIVATE_HOST = /^(localhost$|127\.|10\.|192\.168\.|169\.254\.|::1$|fe80:|fc|fd|0\.0\.0\.0$)/i;
const PRIVATE_172 = /^172\.(1[6-9]|2\d|3[01])\./;
async function assertSafeUrl(raw: string): Promise<string> {
  let u: URL;
  try { u = new URL(raw); } catch { throw new Error('Invalid URL'); }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('Only http(s) URLs allowed');
  const host = u.hostname.toLowerCase();
  if (PRIVATE_HOST.test(host) || PRIVATE_172.test(host) || host.endsWith('.internal') || host.endsWith('.local')) {
    throw new Error('Blocked host');
  }
  try {
    const ips = await Deno.resolveDns(host, 'A');
    for (const ip of ips) if (PRIVATE_HOST.test(ip) || PRIVATE_172.test(ip)) throw new Error('Blocked host');
  } catch (_) { /* resolver unavailable — literal checks above still apply */ }
  return u.toString();
}

// AI crawlers to check in robots.txt
const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'ClaudeBot',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
  'CCBot',
  'Omgilibot',
];

// ── HTML helpers ──────────────────────────────────────────────────────────────

function extractMeta(html: string, name: string): string {
  const m = html.match(
    new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')
  ) || html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, 'i')
  );
  return m?.[1]?.trim() ?? '';
}

function extractTitle(html: string): string {
  return html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? '';
}

function extractCanonical(html: string): string {
  return html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]?.trim() ?? '';
}

function extractH1s(html: string): string[] {
  return [...html.matchAll(/<h1[^>]*>([^<]*(?:<(?!\/h1>)[^<]*)*)<\/h1>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);
}

function extractH2s(html: string): string[] {
  return [...html.matchAll(/<h2[^>]*>([^<]*(?:<(?!\/h2>)[^<]*)*)<\/h2>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean)
    .slice(0, 10);
}

function extractSchemaTypes(html: string): string[] {
  const types: string[] = [];
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const s of scripts) {
    try {
      const obj = JSON.parse(s[1]);
      const items = Array.isArray(obj) ? obj : [obj];
      for (const item of items) {
        if (item['@type']) types.push(item['@type']);
      }
    } catch { /* malformed JSON-LD */ }
  }
  return [...new Set(types)];
}

function approximateWordCount(html: string): number {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.split(' ').filter(w => w.length > 2).length;
}

function extractDates(html: string, httpLastModified: string | null): { published: string | null; modified: string | null } {
  let published: string | null =
    extractMeta(html, 'article:published_time') ||
    extractMeta(html, 'og:article:published_time') ||
    extractMeta(html, 'date') ||
    null;

  let modified: string | null =
    extractMeta(html, 'article:modified_time') ||
    extractMeta(html, 'og:article:modified_time') ||
    extractMeta(html, 'og:updated_time') ||
    null;

  // JSON-LD datePublished / dateModified
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const s of scripts) {
    try {
      const obj = JSON.parse(s[1]);
      const items = Array.isArray(obj) ? obj : [obj];
      for (const item of items) {
        if (!published && item.datePublished) published = item.datePublished;
        if (!modified && item.dateModified) modified = item.dateModified;
      }
    } catch { /* malformed JSON-LD */ }
  }

  // Fall back to HTTP Last-Modified
  if (!modified && httpLastModified) modified = httpLastModified;

  return { published, modified };
}

function extractLocalBusinessData(html: string): {
  hasAddress: boolean; hasTelephone: boolean; hasOpeningHours: boolean; hasPriceRange: boolean;
} | null {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const s of scripts) {
    try {
      const obj = JSON.parse(s[1]);
      const items = Array.isArray(obj) ? obj : [obj];
      for (const item of items) {
        const localBusinessTypes = ['LocalBusiness', 'Restaurant', 'Store', 'Hotel', 'MedicalBusiness', 'AutomotiveBusiness'];
        if (localBusinessTypes.includes(item['@type'])) {
          return {
            hasAddress: !!(item.address || item.streetAddress),
            hasTelephone: !!(item.telephone || item.phone),
            hasOpeningHours: !!(item.openingHours || item.openingHoursSpecification),
            hasPriceRange: !!item.priceRange,
          };
        }
      }
    } catch { /* malformed JSON-LD */ }
  }
  return null;
}

// ── Robots.txt parser ─────────────────────────────────────────────────────────

function parseCrawlerAccess(robotsTxt: string, crawlers: string[]): Record<string, string> {
  const lines = robotsTxt.split('\n').map(l => l.trim());
  const result: Record<string, string> = {};
  let currentAgents: string[] = [];
  let disallowAll = false;

  for (const line of lines) {
    if (line.startsWith('#') || !line) continue;
    const [key, ...rest] = line.split(':');
    const value = rest.join(':').trim();

    if (key.toLowerCase() === 'user-agent') {
      currentAgents = value === '*' ? ['*'] : [value];
    } else if (key.toLowerCase() === 'disallow') {
      if (currentAgents.includes('*') && value === '/') disallowAll = true;
      for (const agent of currentAgents) {
        for (const crawler of crawlers) {
          if (agent.toLowerCase() === crawler.toLowerCase()) {
            if (!result[crawler]) result[crawler] = value === '/' ? 'blocked' : 'allowed';
          }
        }
      }
    } else if (key.toLowerCase() === 'allow') {
      for (const agent of currentAgents) {
        for (const crawler of crawlers) {
          if (agent.toLowerCase() === crawler.toLowerCase() && value === '/') {
            result[crawler] = 'allowed';
          }
        }
      }
    }
  }

  // Fill missing crawlers: if * disallows all they're blocked, otherwise unknown
  for (const crawler of crawlers) {
    if (!result[crawler]) {
      result[crawler] = disallowAll ? 'blocked' : 'allowed';
    }
  }

  return result;
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function scoreContent(f: Record<string, unknown>): number {
  let score = 0;
  if ((f.h1Count as number) >= 1) score += 25;
  if ((f.metaDescription as string)?.length > 50) score += 25;
  if ((f.wordCount as number) >= 300) score += 25;
  else if ((f.wordCount as number) >= 150) score += 12;
  if ((f.h2Count as number) >= 2) score += 15;
  if (f.hasAuthorSignal) score += 10;
  return Math.min(score, 100);
}

function scoreTechnical(f: Record<string, unknown>): number {
  let score = 0;
  if (f.isHttps) score += 25;
  if (f.hasCanonical) score += 20;
  if (f.hasOgTitle) score += 20;
  if (f.hasOgDescription) score += 20;
  if (f.hasTitle) score += 15;
  return Math.min(score, 100);
}

function scoreSchema(
  types: string[],
  localBusiness: { hasAddress: boolean; hasTelephone: boolean; hasOpeningHours: boolean; hasPriceRange: boolean } | null
): number {
  if (types.length === 0) return 0;
  let score = 30;
  const highValue = ['Article', 'NewsArticle', 'BlogPosting', 'FAQPage', 'HowTo', 'Product', 'Review', 'SoftwareApplication', 'Service', 'Event'];
  const orgTypes = ['Organization', 'Person', 'LocalBusiness', 'WebSite'];
  if (types.some(t => highValue.includes(t))) score += 35;
  if (types.some(t => orgTypes.includes(t))) score += 20;
  // LocalBusiness completeness bonus: agents need address/phone/hours to act on data
  if (localBusiness) {
    if (localBusiness.hasAddress) score += 3;
    if (localBusiness.hasTelephone) score += 3;
    if (localBusiness.hasOpeningHours) score += 3;
    if (localBusiness.hasPriceRange) score += 1;
  }
  if (types.includes('speakable') || types.includes('Speakable')) score += 15;
  return Math.min(score, 100);
}

function scoreCrawlers(access: Record<string, string>): number {
  const priority = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'];
  const allowed = priority.filter(c => access[c] === 'allowed').length;
  return Math.round((allowed / priority.length) * 100);
}

function scoreFreshness(modified: string | null, published: string | null): number {
  const dateStr = modified ?? published;
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 0;
  const daysSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 30)  return 100;
  if (daysSince <= 90)  return 80;
  if (daysSince <= 180) return 60;
  if (daysSince <= 365) return 40;
  if (daysSince <= 730) return 20;
  return 10; // has a date but very old
}

function overallScore(c: number, t: number, s: number, cr: number, fr: number): number {
  return Math.round(c * 0.28 + t * 0.22 + s * 0.22 + cr * 0.13 + fr * 0.15);
}

// ── Recommendations ───────────────────────────────────────────────────────────

function buildRecommendations(
  f: Record<string, unknown>,
  schemaTypes: string[],
  crawlerAccess: Record<string, string>,
  hasLlmsTxt: boolean,
  localBusiness: { hasAddress: boolean; hasTelephone: boolean; hasOpeningHours: boolean; hasPriceRange: boolean } | null,
  freshnessScore: number,
  pageModified: string | null,
): Array<{ priority: string; category: string; issue: string; fix: string }> {
  const recs = [];

  if (!hasLlmsTxt) {
    recs.push({ priority: 'high', category: 'Technical', issue: 'No llms.txt file found', fix: 'Create /llms.txt in the site root with a structured description of your site for AI systems.' });
  }
  if ((f.h1Count as number) === 0) {
    recs.push({ priority: 'high', category: 'Content', issue: 'Missing H1 heading', fix: 'Add a clear H1 heading that describes the page topic.' });
  }
  if ((f.metaDescription as string)?.length < 50) {
    recs.push({ priority: 'high', category: 'Technical', issue: 'Meta description missing or too short', fix: 'Write a meta description of 120–160 characters summarising the page content with relevant keywords.' });
  }
  if ((f.wordCount as number) < 300) {
    recs.push({ priority: 'high', category: 'Content', issue: `Thin content (${f.wordCount} words)`, fix: 'AI systems cite pages with substance. Aim for at least 500 words of concrete, factual content.' });
  }
  if (schemaTypes.length === 0) {
    recs.push({ priority: 'high', category: 'Schema', issue: 'No schema.org markup found', fix: 'Add JSON-LD with an appropriate type: Article, Organization, FAQPage or Product.' });
  } else if (!schemaTypes.some(t => ['Article','NewsArticle','BlogPosting','FAQPage','HowTo','Product','SoftwareApplication','Service'].includes(t))) {
    recs.push({ priority: 'medium', category: 'Schema', issue: 'Schema lacks content or product type', fix: `Current types: ${schemaTypes.join(', ')}. Add Article, FAQPage, Product or SoftwareApplication depending on page purpose.` });
  }
  if (!f.hasCanonical) {
    recs.push({ priority: 'medium', category: 'Technical', issue: 'Missing canonical tag', fix: 'Add <link rel="canonical"> to prevent duplicate content issues in AI indexing.' });
  }
  if (!f.hasOgTitle || !f.hasOgDescription) {
    recs.push({ priority: 'medium', category: 'Technical', issue: 'Incomplete Open Graph tags', fix: 'Add og:title, og:description and og:image for better representation in AI-generated answers.' });
  }
  if ((f.h2Count as number) < 2) {
    recs.push({ priority: 'medium', category: 'Content', issue: 'Few subheadings', fix: 'Structure content with H2/H3 headings. AI systems prefer well-structured pages.' });
  }

  const blockedCrawlers = Object.entries(crawlerAccess)
    .filter(([, v]) => v === 'blocked')
    .map(([k]) => k);
  if (blockedCrawlers.length > 0) {
    recs.push({ priority: 'high', category: 'Crawlers', issue: `${blockedCrawlers.join(', ')} blocked in robots.txt`, fix: 'Remove or adjust Disallow rules for AI crawlers to allow indexing.' });
  }

  // Freshness
  if (freshnessScore === 0) {
    recs.push({ priority: 'medium', category: 'Freshness', issue: 'No date signal found', fix: 'Add datePublished and dateModified to your JSON-LD schema so AI systems can assess content recency.' });
  } else if (freshnessScore <= 20) {
    const date = pageModified ? new Date(pageModified).toLocaleDateString('en-GB') : 'unknown';
    recs.push({ priority: 'medium', category: 'Freshness', issue: `Content not updated since ${date}`, fix: 'AI systems favour recently updated content. Review and update key pages, then update dateModified in your JSON-LD.' });
  }

  // LocalBusiness completeness
  if (localBusiness) {
    const missing = [];
    if (!localBusiness.hasAddress) missing.push('address');
    if (!localBusiness.hasTelephone) missing.push('telephone');
    if (!localBusiness.hasOpeningHours) missing.push('openingHours');
    if (!localBusiness.hasPriceRange) missing.push('priceRange');
    if (missing.length > 0) {
      recs.push({ priority: 'high', category: 'Schema', issue: `LocalBusiness schema missing: ${missing.join(', ')}`, fix: `AI agents need complete contact and hours data to act on your listing. Add the missing fields to your LocalBusiness JSON-LD: ${missing.map(f => `"${f}"`).join(', ')}.` });
    }
  }

  return recs;
}

// ── Claude citability analysis ────────────────────────────────────────────────

async function analyzeCitability(
  url: string,
  title: string,
  h1s: string[],
  h2s: string[],
  metaDescription: string,
  wordCount: number,
  schemaTypes: string[],
  anthropicKey: string,
  model: string,
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const prompt = `You are an expert in Generative Engine Optimization (GEO). Analyze this web page's AI citability.

URL: ${url}
Title: ${title}
H1: ${h1s.join(' | ')}
H2s: ${h2s.slice(0, 5).join(' | ')}
Meta description: ${metaDescription}
Word count: ${wordCount}
Schema types: ${schemaTypes.join(', ') || 'none'}

Write 2-3 concise sentences in English assessing:
1. How likely AI systems (ChatGPT, Claude, Perplexity) are to cite this page
2. The main strength and main weakness for citability
3. The single most impactful improvement

Be specific and actionable. No generic advice.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) return { text: '', inputTokens: 0, outputTokens: 0 };
  const json = await res.json();
  return {
    text: json.content?.[0]?.text?.trim() ?? '',
    inputTokens: json.usage?.input_tokens ?? 0,
    outputTokens: json.usage?.output_tokens ?? 0,
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const startMs = Date.now();

  try {
    const { siteId, url: rawUrl } = await req.json();
    if (!siteId) throw new Error('siteId is required');

    // SECURITY: verify the caller owns this site — this function runs with the
    // service-role key, so without this check any authenticated user could run paid
    // Claude audits against any siteId.
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: owned } = await supabase.from('sites').select('id').eq('id', siteId).eq('user_id', user.id).maybeSingle();
    if (!owned) {
      return new Response(JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Resolve URL: use provided URL or fall back to site domain
    let targetUrl = rawUrl?.trim();
    if (!targetUrl) {
      const { data: site } = await supabase.from('sites').select('url').eq('id', siteId).maybeSingle();
      if (!site?.url) throw new Error('No URL provided and site has no configured URL');
      targetUrl = site.url.startsWith('http') ? site.url : `https://${site.url}`;
    }
    if (!targetUrl.startsWith('http')) targetUrl = `https://${targetUrl}`;

    // SSRF: block private/loopback/metadata targets before any server-side fetch.
    targetUrl = await assertSafeUrl(targetUrl);

    // Resolve origin for robots.txt and llms.txt lookups
    const origin = new URL(targetUrl).origin;

    // Fetch page, robots.txt and llms.txt concurrently
    const [pageRes, robotsRes, llmsRes] = await Promise.allSettled([
      fetch(targetUrl, { headers: { 'User-Agent': 'CortIQ-GEO-Audit/1.0' }, signal: AbortSignal.timeout(10000) }),
      fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${origin}/llms.txt`, { signal: AbortSignal.timeout(5000) }),
    ]);

    if (pageRes.status === 'rejected') throw new Error(`Could not fetch ${targetUrl}: ${pageRes.reason}`);

    const httpLastModified = pageRes.value.ok ? (pageRes.value.headers.get('last-modified') ?? null) : null;
    const html = pageRes.value.ok ? await pageRes.value.text() : '';
    const robotsTxt = (robotsRes.status === 'fulfilled' && robotsRes.value.ok) ? await robotsRes.value.text() : '';
    const hasLlmsTxt = llmsRes.status === 'fulfilled' && llmsRes.value.ok;

    // Parse HTML
    const title = extractTitle(html);
    const h1s = extractH1s(html);
    const h2s = extractH2s(html);
    const metaDescription = extractMeta(html, 'description');
    const ogTitle = extractMeta(html, 'og:title');
    const ogDescription = extractMeta(html, 'og:description');
    const canonical = extractCanonical(html);
    const wordCount = approximateWordCount(html);
    const schemaTypes = extractSchemaTypes(html);
    const { published: pagePublished, modified: pageModified } = extractDates(html, httpLastModified);
    const localBusiness = extractLocalBusinessData(html);

    const findings = {
      title,
      h1Count: h1s.length,
      h1s,
      h2Count: h2s.length,
      h2s,
      metaDescription,
      hasOgTitle: !!ogTitle,
      hasOgDescription: !!ogDescription,
      hasCanonical: !!canonical,
      hasTitle: !!title,
      isHttps: targetUrl.startsWith('https'),
      wordCount,
      hasAuthorSignal: /author|byline|written by/i.test(html),
      pagePublished,
      pageModified,
      localBusiness,
    };

    const crawlerAccess = robotsTxt ? parseCrawlerAccess(robotsTxt, AI_CRAWLERS) : Object.fromEntries(AI_CRAWLERS.map(c => [c, 'unknown']));

    // Compute scores
    const contentScore   = scoreContent(findings);
    const technicalScore = scoreTechnical(findings);
    const schemaScore    = scoreSchema(schemaTypes, localBusiness);
    const crawlerScore   = scoreCrawlers(crawlerAccess);
    const freshnessScore = scoreFreshness(pageModified, pagePublished);
    const overall        = overallScore(contentScore, technicalScore, schemaScore, crawlerScore, freshnessScore);

    const recommendations = buildRecommendations(findings, schemaTypes, crawlerAccess, hasLlmsTxt, localBusiness, freshnessScore, pageModified);

    // AI citability is BYOK-only — no platform ANTHROPIC_API_KEY fallback (consistent
    // with ai-assistant). A site without a company key still gets the full non-AI audit;
    // citabilityAnalysis just stays null. The rest of the pipeline never depends on it.
    let anthropicKey: string | null = null;
    let aiModel = 'claude-haiku-4-5-20251001';
    const { data: siteRow } = await supabase.from('sites').select('company_id').eq('id', siteId).maybeSingle();
    const companyId = siteRow?.company_id ?? null;
    if (companyId) {
      const { data: co } = await supabase
        .from('company_secrets')
        .select('anthropic_api_key, ai_model')
        .eq('company_id', companyId)
        .maybeSingle();
      anthropicKey = co?.anthropic_api_key ?? null;
      if (co?.ai_model) aiModel = co.ai_model;
    }

    // Enforce the company's monthly cost cap before spending on the paid call.
    let underBudget = true;
    if (anthropicKey && companyId) {
      const { data: ok } = await supabase.rpc('check_ai_budget', { p_company_id: companyId });
      underBudget = ok !== false; // fail open on RPC error
    }

    let citabilityAnalysis: string | null = null;
    if (anthropicKey && underBudget) {
      const ai = await analyzeCitability(targetUrl, title, h1s, h2s, metaDescription, wordCount, schemaTypes, anthropicKey, aiModel);
      citabilityAnalysis = ai.text || null;
      if (companyId && (ai.inputTokens || ai.outputTokens)) {
        await supabase.rpc('record_ai_usage', {
          p_company_id: companyId,
          p_site_id: siteId,
          p_function: 'geo-analyze',
          p_model: aiModel,
          p_input_tokens: ai.inputTokens,
          p_output_tokens: ai.outputTokens,
        });
      }
    }

    // Persist audit
    const { data: audit, error: insertError } = await supabase
      .from('geo_audits')
      .insert({
        site_id: siteId,
        url: targetUrl,
        overall_score: overall,
        content_score: contentScore,
        technical_score: technicalScore,
        schema_score: schemaScore,
        crawler_score: crawlerScore,
        freshness_score: freshnessScore,
        page_last_modified: pageModified ?? null,
        findings,
        recommendations,
        schema_types: schemaTypes,
        crawler_access: crawlerAccess,
        has_llms_txt: hasLlmsTxt,
        citability_analysis: citabilityAnalysis,
        audit_duration_ms: Date.now() - startMs,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, audit }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('geo-analyze error:', err);
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
