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

function scoreSchema(types: string[]): number {
  if (types.length === 0) return 0;
  let score = 30; // has any schema
  const highValue = ['Article', 'NewsArticle', 'BlogPosting', 'FAQPage', 'HowTo', 'Product', 'Review', 'SoftwareApplication', 'Service', 'Event'];
  const orgTypes = ['Organization', 'Person', 'LocalBusiness', 'WebSite'];
  if (types.some(t => highValue.includes(t))) score += 35;
  if (types.some(t => orgTypes.includes(t))) score += 20;
  if (types.includes('speakable') || types.includes('Speakable')) score += 15;
  return Math.min(score, 100);
}

function scoreCrawlers(access: Record<string, string>): number {
  const priority = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'];
  const allowed = priority.filter(c => access[c] === 'allowed').length;
  return Math.round((allowed / priority.length) * 100);
}

function overallScore(c: number, t: number, s: number, cr: number): number {
  return Math.round(c * 0.35 + t * 0.25 + s * 0.25 + cr * 0.15);
}

// ── Recommendations ───────────────────────────────────────────────────────────

function buildRecommendations(
  f: Record<string, unknown>,
  schemaTypes: string[],
  crawlerAccess: Record<string, string>,
  hasLlmsTxt: boolean,
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
): Promise<string> {
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
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) return '';
  const json = await res.json();
  return json.content?.[0]?.text?.trim() ?? '';
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const startMs = Date.now();

  try {
    const { siteId, url: rawUrl } = await req.json();
    if (!siteId) throw new Error('siteId is required');

    // Resolve URL: use provided URL or fall back to site domain
    let targetUrl = rawUrl?.trim();
    if (!targetUrl) {
      const { data: site } = await supabase.from('sites').select('url').eq('id', siteId).maybeSingle();
      if (!site?.url) throw new Error('No URL provided and site has no configured URL');
      targetUrl = site.url.startsWith('http') ? site.url : `https://${site.url}`;
    }
    if (!targetUrl.startsWith('http')) targetUrl = `https://${targetUrl}`;

    // Resolve origin for robots.txt and llms.txt lookups
    const origin = new URL(targetUrl).origin;

    // Fetch page, robots.txt and llms.txt concurrently
    const [pageRes, robotsRes, llmsRes] = await Promise.allSettled([
      fetch(targetUrl, { headers: { 'User-Agent': 'CortIQ-GEO-Audit/1.0' }, signal: AbortSignal.timeout(10000) }),
      fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${origin}/llms.txt`, { signal: AbortSignal.timeout(5000) }),
    ]);

    if (pageRes.status === 'rejected') throw new Error(`Could not fetch ${targetUrl}: ${pageRes.reason}`);

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
    };

    const crawlerAccess = robotsTxt ? parseCrawlerAccess(robotsTxt, AI_CRAWLERS) : Object.fromEntries(AI_CRAWLERS.map(c => [c, 'unknown']));

    // Compute scores
    const contentScore  = scoreContent(findings);
    const technicalScore = scoreTechnical(findings);
    const schemaScore   = scoreSchema(schemaTypes);
    const crawlerScore  = scoreCrawlers(crawlerAccess);
    const overall       = overallScore(contentScore, technicalScore, schemaScore, crawlerScore);

    const recommendations = buildRecommendations(findings, schemaTypes, crawlerAccess, hasLlmsTxt);

    // Anthropic key (BYOK → platform fallback)
    let anthropicKey: string | null = null;
    const { data: siteRow } = await supabase.from('sites').select('company_id').eq('id', siteId).maybeSingle();
    if (siteRow?.company_id) {
      const { data: co } = await supabase.from('companies').select('anthropic_api_key').eq('id', siteRow.company_id).maybeSingle();
      anthropicKey = co?.anthropic_api_key ?? null;
    }
    if (!anthropicKey) anthropicKey = Deno.env.get('ANTHROPIC_API_KEY') ?? null;

    const citabilityAnalysis = anthropicKey
      ? await analyzeCitability(targetUrl, title, h1s, h2s, metaDescription, wordCount, schemaTypes, anthropicKey)
      : null;

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
