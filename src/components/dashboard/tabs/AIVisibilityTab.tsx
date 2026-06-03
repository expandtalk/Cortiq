import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSites } from '@/hooks/useSites';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  RefreshCw, Globe, FileText, Code2, Bot, AlertTriangle,
  CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Sparkles,
} from 'lucide-react';

interface GeoAudit {
  id: string;
  url: string;
  overall_score: number;
  content_score: number;
  technical_score: number;
  schema_score: number;
  crawler_score: number;
  findings: Record<string, unknown>;
  recommendations: Array<{ priority: string; category: string; issue: string; fix: string }>;
  schema_types: string[];
  crawler_access: Record<string, string>;
  has_llms_txt: boolean;
  citability_analysis: string | null;
  audit_duration_ms: number;
  created_at: string;
}

interface AIVisibilityTabProps {
  siteId: string;
}

const SCORE_COLOR = (score: number) =>
  score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';

const SCORE_BG = (score: number) =>
  score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';

const PRIORITY_BADGE: Record<string, string> = {
  high:   'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low:    'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const CRAWLER_ICON = (status: string) =>
  status === 'allowed'
    ? <CheckCircle2 className="h-4 w-4 text-green-400" />
    : status === 'blocked'
    ? <XCircle className="h-4 w-4 text-red-400" />
    : <Clock className="h-4 w-4 text-muted-foreground" />;

const KEY_CRAWLERS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'];

export function AIVisibilityTab({ siteId }: AIVisibilityTabProps) {
  const { selectedSite } = useSites();
  const defaultUrl = selectedSite?.domain
    ? (selectedSite.domain.startsWith('http') ? selectedSite.domain : `https://${selectedSite.domain}`)
    : '';

  const [audit, setAudit] = useState<GeoAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [auditUrl, setAuditUrl] = useState(defaultUrl);

  const fetchLatest = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('geo_audits')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setAudit(data ?? null);
    setLoading(false);
  }, [siteId]);

  useEffect(() => { fetchLatest(); }, [fetchLatest]);

  async function runAudit() {
    const url = auditUrl.trim();
    if (!url) { toast.error('Ange URL:en som ska analyseras.'); return; }
    const normalized = `https://${url.replace(/^https?:\/\//i, '')}`;
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('geo-analyze', {
        body: { siteId, url: normalized },
      });
      if (error || !data?.success) {
        let msg = data?.error ?? error?.message ?? 'Audit misslyckades';
        try {
          const body = await (error as any)?.context?.json?.();
          if (body?.error) msg = body.error;
        } catch { /* ignore */ }
        throw new Error(msg);
      }
      setAudit(data.audit);
      toast.success('AI Visibility-audit klar');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Laddar...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-400" />
            AI Visibility
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Mäter hur troligt det är att AI-system (ChatGPT, Claude, Perplexity) citerar din sajt.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com/sidan-att-analysera"
            value={auditUrl}
            onChange={e => setAuditUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !running && runAudit()}
            disabled={running}
            className="max-w-lg"
          />
          <Button onClick={runAudit} disabled={running || !auditUrl.trim()} className="shrink-0">
            <RefreshCw className={`h-4 w-4 mr-2 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Analyserar…' : audit ? 'Kör ny audit' : 'Kör audit'}
          </Button>
        </div>
      </div>

      {!audit ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Sparkles className="h-10 w-10 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Ingen audit ännu</p>
            <p className="text-sm mt-1">Klicka "Kör första audit" för att analysera AI-synligheten.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Score cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="lg:col-span-1 bg-card border-border">
              <CardContent className="pt-6 text-center">
                <div className={`text-5xl font-bold ${SCORE_COLOR(audit.overall_score)}`}>
                  {audit.overall_score}
                </div>
                <div className="text-xs text-muted-foreground mt-1">GEO Score</div>
                <Progress value={audit.overall_score} className={`mt-3 h-1.5 [&>div]:${SCORE_BG(audit.overall_score)}`} />
              </CardContent>
            </Card>

            {[
              { label: 'Innehåll', score: audit.content_score, icon: FileText, desc: 'Rubriker, ordantal, struktur' },
              { label: 'Tekniskt', score: audit.technical_score, icon: Code2, desc: 'Meta, canonical, HTTPS' },
              { label: 'Schema', score: audit.schema_score, icon: Globe, desc: 'JSON-LD strukturerad data' },
              { label: 'Crawlers', score: audit.crawler_score, icon: Bot, desc: 'Robots.txt AI-åtkomst' },
            ].map(({ label, score, icon: Icon, desc }) => (
              <Card key={label} className="bg-card border-border">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <div className={`text-3xl font-bold ${SCORE_COLOR(score)}`}>{score}</div>
                  <Progress value={score} className={`mt-2 h-1 [&>div]:${SCORE_BG(score)}`} />
                  <p className="text-xs text-muted-foreground mt-2">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Crawler access */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bot className="h-4 w-4" /> AI Crawler-åtkomst
                </CardTitle>
                <CardDescription>
                  {audit.has_llms_txt
                    ? <span className="text-green-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> llms.txt hittades</span>
                    : <span className="text-yellow-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Ingen llms.txt</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {KEY_CRAWLERS.map(crawler => (
                  <div key={crawler} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/30">
                    <span className="text-sm font-mono">{crawler}</span>
                    <div className="flex items-center gap-2">
                      {CRAWLER_ICON(audit.crawler_access[crawler] ?? 'unknown')}
                      <span className="text-xs text-muted-foreground capitalize">
                        {audit.crawler_access[crawler] ?? 'okänd'}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Schema types */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code2 className="h-4 w-4" /> Schema.org-markup
                </CardTitle>
                <CardDescription>Strukturerad data som hjälper AI att förstå innehållet</CardDescription>
              </CardHeader>
              <CardContent>
                {audit.schema_types.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {audit.schema_types.map(type => (
                      <Badge key={type} variant="secondary">{type}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-400" />
                    Ingen JSON-LD hittades
                  </p>
                )}
                {(audit.findings.wordCount as number) > 0 && (
                  <div className="mt-4 pt-4 border-t space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ordantal</span>
                      <span>{audit.findings.wordCount as number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">H1-rubriker</span>
                      <span>{audit.findings.h1Count as number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">H2-rubriker</span>
                      <span>{audit.findings.h2Count as number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Meta description</span>
                      <span>{(audit.findings.metaDescription as string)?.length > 0 ? '✓' : '—'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Claude citability analysis */}
          {audit.citability_analysis && (
            <Card className="border-purple-500/20 bg-purple-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" /> Claude Citability-analys
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{audit.citability_analysis}</p>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {audit.recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Åtgärder ({audit.recommendations.length})
                </CardTitle>
                <CardDescription>Sorterade efter prioritet — åtgärda High-issues först</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {audit.recommendations.map((rec, i) => (
                  <div key={i} className="rounded-lg border bg-card overflow-hidden">
                    <button
                      className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                      onClick={() => setExpanded(expanded === `rec-${i}` ? null : `rec-${i}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge className={`shrink-0 text-xs border ${PRIORITY_BADGE[rec.priority] ?? ''}`}>
                          {rec.priority.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium truncate">{rec.issue}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs">{rec.category}</Badge>
                        {expanded === `rec-${i}` ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </button>
                    {expanded === `rec-${i}` && (
                      <>
                        <Separator />
                        <div className="px-4 py-3 text-sm text-muted-foreground bg-muted/20">
                          <span className="font-medium text-foreground">Åtgärd: </span>
                          {rec.fix}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Footer metadata */}
          <p className="text-xs text-muted-foreground text-right">
            Senaste audit: {new Date(audit.created_at).toLocaleString('sv-SE')}
            {audit.audit_duration_ms && ` · ${(audit.audit_duration_ms / 1000).toFixed(1)}s`}
            {' · '}<span className="font-mono">{audit.url}</span>
          </p>
        </>
      )}
    </div>
  );
}
