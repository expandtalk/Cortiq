import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Activity, Bot, DollarSign, Zap, CheckCircle, AlertTriangle,
  ChevronRight, ChevronDown, Code2, Clock, Target, TrendingUp,
} from 'lucide-react';
import {
  useAgentOverview, useAgentConversions, useAgentHourlyTrend,
  useRecentTraces, useAgentTrace,
  type AgentOverviewRow, type RecentTrace,
} from '@/hooks/useAgentTelemetry';
import type { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';

interface AgentOpsTabProps {
  companyId: string | null;
  dateRange?: DateRange;
}

// ── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, trend, color = '#6366f1' }: {
  label: string; value: string | number; sub?: string;
  icon: React.ComponentType<{ className?: string }>; trend?: number; color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        {sub    && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        {trend != null && (
          <p className={`text-xs mt-0.5 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs prev period
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Agent row in the per-agent table ─────────────────────────────────────────
function AgentRow({ row, onSelect, selected }: {
  row: AgentOverviewRow; onSelect: () => void; selected: boolean;
}) {
  const tcr     = row.task_completion_rate;
  const tcrColor = tcr == null ? '#6b7280' : tcr >= 90 ? '#10b981' : tcr >= 70 ? '#f59e0b' : '#ef4444';
  const toolRate = row.tool_success_rate;
  const cost     = row.estimated_cost_usd;

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selected ? 'bg-primary/5 border-primary/40' : 'bg-card hover:bg-accent/30'}`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{row.agent_name}</p>
            <p className="text-xs text-muted-foreground">
              {row.total_tasks.toLocaleString('sv-SE')} tasks
              {row.last_active && ` · last active ${new Date(row.last_active).toLocaleDateString('en-US')}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 ml-4 text-right">
          <div>
            <p className="text-xs text-muted-foreground">TCR</p>
            <p className="text-sm font-bold" style={{ color: tcrColor }}>
              {tcr != null ? `${tcr}%` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">P95</p>
            <p className="text-sm font-medium">
              {row.p95_latency_ms != null ? `${(row.p95_latency_ms / 1000).toFixed(1)}s` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tool ok%</p>
            <p className="text-sm font-medium">{toolRate != null ? `${toolRate}%` : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cost</p>
            <p className="text-sm font-medium">
              ${cost > 1 ? cost.toFixed(2) : cost.toFixed(4)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Span tree (trace viewer) ──────────────────────────────────────────────────
function SpanNode({ span, depth = 0 }: {
  span: ReturnType<typeof useAgentTrace>['data'] extends (infer T)[] | undefined ? T : never;
  depth?: number;
}) {
  const [open, setOpen] = useState(false);
  const isError = span.status_code === 'ERROR';
  const icon = span.gen_ai_operation_name === 'tool_call' ? Code2 :
               span.gen_ai_operation_name === 'rag_retrieval' ? Activity : Zap;

  return (
    <div style={{ paddingLeft: `${depth * 20}px` }}>
      <div
        className={`flex items-start gap-2 py-1.5 px-2 rounded text-sm cursor-pointer hover:bg-muted/60 ${isError ? 'text-red-500' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        {span.attributes && Object.keys(span.attributes).length > 0
          ? (open ? <ChevronDown className="h-4 w-4 mt-0.5 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />)
          : <span className="w-4 flex-shrink-0" />
        }
        {React.createElement(icon, { className: 'h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground' })}
        <div className="flex-1 min-w-0">
          <span className="font-medium">{span.span_name}</span>
          {span.tool_name && <span className="text-muted-foreground ml-1">→ {span.tool_name}</span>}
          {span.mcp_server && <Badge variant="outline" className="ml-1 text-xs px-1">{span.mcp_server}</Badge>}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 text-xs text-muted-foreground">
          {span.gen_ai_usage_input_tokens != null && (
            <span>{(span.gen_ai_usage_input_tokens + (span.gen_ai_usage_output_tokens ?? 0)).toLocaleString('sv-SE')} tok</span>
          )}
          {span.estimated_cost_usd != null && span.estimated_cost_usd > 0 && (
            <span>${span.estimated_cost_usd.toFixed(4)}</span>
          )}
          {span.duration_ms != null && (
            <span>{span.duration_ms < 1000 ? `${span.duration_ms}ms` : `${(span.duration_ms / 1000).toFixed(2)}s`}</span>
          )}
          <Badge variant={isError ? 'destructive' : 'secondary'} className="text-xs px-1">
            {span.status_code}
          </Badge>
        </div>
      </div>

      {open && Object.keys(span.attributes ?? {}).length > 0 && (
        <div className="ml-6 mb-1 p-2 bg-muted/40 rounded text-xs font-mono space-y-0.5">
          {Object.entries(span.attributes as Record<string, unknown>).slice(0, 8).map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-muted-foreground">{k}:</span>
              <span className="truncate">{String(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TraceViewer({ companyId, traceId }: { companyId: string; traceId: string }) {
  const { data: spans, isLoading } = useAgentTrace(companyId, traceId);

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!spans || spans.length === 0) return <p className="text-sm text-muted-foreground">No spans found for this trace.</p>;

  // Build tree: root first, then children sorted by start_time
  const roots   = spans.filter(s => !s.parent_span_id);
  const byParent = new Map<string, typeof spans>();
  for (const s of spans) {
    if (s.parent_span_id) {
      const arr = byParent.get(s.parent_span_id) ?? [];
      arr.push(s);
      byParent.set(s.parent_span_id, arr);
    }
  }

  function renderTree(spanList: typeof spans, depth: number): React.ReactNode {
    return spanList.map(s => (
      <React.Fragment key={s.span_id}>
        <SpanNode span={s} depth={depth} />
        {(byParent.get(s.span_id) ?? []).length > 0 &&
          renderTree(byParent.get(s.span_id)!, depth + 1)}
      </React.Fragment>
    ));
  }

  return (
    <div className="border rounded-lg p-2 bg-card text-sm">
      {renderTree(roots, 0)}
    </div>
  );
}

// ── Recent traces list ────────────────────────────────────────────────────────
function TraceList({ companyId, agentName }: { companyId: string; agentName?: string }) {
  const [selectedTrace, setSelectedTrace] = useState<string | null>(null);
  const { data: traces, isLoading } = useRecentTraces(companyId, agentName);

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!traces || traces.length === 0) return (
    <p className="text-sm text-muted-foreground p-4 text-center">No traces recorded yet.</p>
  );

  return (
    <div className="space-y-2">
      {traces.map(t => (
        <div key={t.trace_id}>
          <div
            className={`flex items-center justify-between p-2 rounded border cursor-pointer text-sm hover:bg-accent/30 transition-colors ${selectedTrace === t.trace_id ? 'bg-primary/5 border-primary/40' : 'bg-card'}`}
            onClick={() => setSelectedTrace(selectedTrace === t.trace_id ? null : t.trace_id)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant={t.status_code === 'OK' ? 'secondary' : 'destructive'} className="text-xs px-1 flex-shrink-0">
                {t.status_code}
              </Badge>
              <span className="truncate font-medium">{t.span_name}</span>
              {t.agent_name && <span className="text-muted-foreground text-xs">({t.agent_name})</span>}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0 ml-2">
              {t.total_tokens != null && <span>{t.total_tokens.toLocaleString('sv-SE')} tok</span>}
              {t.estimated_cost_usd != null && t.estimated_cost_usd > 0 && (
                <span>${t.estimated_cost_usd.toFixed(4)}</span>
              )}
              {t.duration_ms != null && (
                <span>{t.duration_ms < 1000 ? `${t.duration_ms}ms` : `${(t.duration_ms / 1000).toFixed(1)}s`}</span>
              )}
              <span className="hidden sm:inline">{new Date(t.start_time).toLocaleString('sv-SE')}</span>
              {selectedTrace === t.trace_id
                ? <ChevronDown className="h-4 w-4" />
                : <ChevronRight className="h-4 w-4" />}
            </div>
          </div>

          {selectedTrace === t.trace_id && (
            <div className="mt-1 ml-2">
              <TraceViewer companyId={companyId} traceId={t.trace_id} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Cost / token trend ────────────────────────────────────────────────────────
function CostTrendChart({ companyId, dateRange }: { companyId: string; dateRange?: DateRange }) {
  const { data: hourly, isLoading } = useAgentHourlyTrend(companyId, dateRange?.from, dateRange?.to);
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!hourly || hourly.length === 0) return null;

  const byDay = hourly.reduce<Record<string, { cost: number; tokens: number }>>((acc, r) => {
    const day = r.hour.slice(0, 10);
    const e = acc[day] ?? { cost: 0, tokens: 0 };
    e.cost   += Number(r.estimated_cost_usd ?? 0);
    e.tokens += (r.input_tokens ?? 0) + (r.output_tokens ?? 0);
    acc[day] = e;
    return acc;
  }, {});

  const data = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, v]) => ({ day: day.slice(5), cost: +v.cost.toFixed(4), tokens: v.tokens }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(v: number, name: string) =>
            name === 'cost' ? [`$${v}`, 'Cost (USD)'] : [v.toLocaleString('sv-SE'), 'Tokens']}
        />
        <Line type="monotone" dataKey="cost" stroke="#6366f1" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Conversion attribution panel ──────────────────────────────────────────────
function ConversionPanel({ companyId, dateRange }: { companyId: string; dateRange?: DateRange }) {
  const { data: rows, isLoading } = useAgentConversions(companyId, dateRange?.from, dateRange?.to);

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  const hasData = rows && rows.some(r => r.sessions_with_agent > 0);

  if (!hasData) {
    return (
      <div className="p-4 rounded-lg bg-muted/40 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">How agent-assisted conversions work</p>
        <p>Pass the CortIQ web session ID as <code className="bg-muted px-1 rounded">webSessionId</code> when starting a task:</p>
        <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-x-auto">{
`const task = tracker.startTask('chat-assist', {
  webSessionId: cortiqSessionId, // from window._cortiq?.sessionId
});`
        }</pre>
        <p className="mt-2">CortIQ will join agent interactions with <code className="bg-muted px-1 rounded">tracking_events</code> conversions — no GA4 needed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rows!.map(r => (
        <div key={r.agent_name} className="flex items-center justify-between p-3 rounded border bg-card text-sm">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{r.agent_name}</span>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground text-xs">
            <span>{r.sessions_with_agent.toLocaleString('sv-SE')} sessions</span>
            <span className="font-bold text-green-600 text-sm">{r.conversions.toLocaleString('sv-SE')} conversions</span>
            <Badge variant="secondary">{r.conversion_rate ?? 0}% CVR</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Setup guide ───────────────────────────────────────────────────────────────
function SetupGuide({ endpoint, apiKey }: { endpoint: string; apiKey: string }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="p-4 rounded-lg border bg-card">
        <p className="font-medium mb-2">Claude Code</p>
        <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">{
`export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_ENDPOINT=${endpoint}
export OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer ${apiKey}`
        }</pre>
      </div>
      <div className="p-4 rounded-lg border bg-card">
        <p className="font-medium mb-2">CortIQ Agent SDK (TypeScript)</p>
        <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">{
`import { CortIQAgentTracker } from '@/lib/cortiq-agent-tracker';

const tracker = new CortIQAgentTracker({
  endpoint:  '${endpoint}',
  apiKey:    '${apiKey}',
  agentName: 'ingegard',
  defaultModel: 'claude-sonnet-4-6',
});

const task = tracker.startTask('process-request', {
  webSessionId: window._cortiq?.sessionId, // links to web conversion
});
const llm = task.startSpan('chat', { operation: 'chat' });
// ...call LLM...
llm.end({ inputTokens: 1200, outputTokens: 450 });
task.end({ status: 'OK' });
await tracker.flush();`
        }</pre>
      </div>
    </div>
  );
}

// ── Main tab component ────────────────────────────────────────────────────────
export function AgentOpsTab({ companyId, dateRange }: AgentOpsTabProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const { data: agents, isLoading } = useAgentOverview(companyId, dateRange?.from, dateRange?.to);

  // Fetch endpoint + api key for setup guide
  const [apiKey, setApiKey] = useState<string>('your_api_key');
  const endpoint = `${import.meta.env.VITE_SUPABASE_URL ?? ''}/functions/v1/agent-telemetry`;

  React.useEffect(() => {
    if (!companyId) return;
    supabase.from('companies').select('api_key').eq('id', companyId).single()
      .then(({ data }) => { if (data?.api_key) setApiKey(data.api_key); });
  }, [companyId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const rows = agents ?? [];

  // Aggregate totals
  const totalTasks = rows.reduce((s, r) => s + (r.total_tasks ?? 0), 0);
  const totalCost  = rows.reduce((s, r) => s + (r.estimated_cost_usd ?? 0), 0);
  const avgTCR     = rows.length > 0
    ? rows.reduce((s, r) => s + (r.task_completion_rate ?? 0), 0) / rows.filter(r => r.task_completion_rate != null).length
    : null;
  const avgP95     = rows.length > 0
    ? rows.reduce((s, r) => s + (r.p95_latency_ms ?? 0), 0) / rows.filter(r => r.p95_latency_ms != null).length
    : null;

  if (totalTasks === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Agent Observability</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Measure your own AI agents using OpenTelemetry GenAI Semantic Conventions.
            Works with Claude Code, AgentFlow, and any custom agent.
          </p>
        </div>
        <SetupGuide endpoint={endpoint} apiKey={apiKey} />
      </div>
    );
  }

  const selectedRow = rows.find(r => r.agent_name === selectedAgent) ?? rows[0];

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Tasks"     value={totalTasks.toLocaleString('sv-SE')} sub={`${rows.length} agents`} icon={Activity} />
        <KpiCard label="Task Completion" value={avgTCR != null ? `${avgTCR.toFixed(1)}%` : '—'} sub="avg across agents" icon={CheckCircle} color={avgTCR != null && avgTCR >= 90 ? '#10b981' : '#f59e0b'} />
        <KpiCard label="P95 Latency"     value={avgP95 != null ? `${(avgP95 / 1000).toFixed(1)}s` : '—'} sub="avg across agents" icon={Clock} />
        <KpiCard label="Total Cost"      value={`$${totalCost.toFixed(totalCost < 1 ? 4 : 2)}`} sub="estimated USD" icon={DollarSign} />
      </div>

      <Tabs defaultValue="agents">
        <TabsList>
          <TabsTrigger value="agents">Per Agent</TabsTrigger>
          <TabsTrigger value="traces">Traces</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="cost">Cost / Tokens</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
        </TabsList>

        {/* Per Agent */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Agent roster</CardTitle>
                <CardDescription>Click an agent to filter traces</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {rows.map(r => (
                  <AgentRow
                    key={r.agent_name}
                    row={r}
                    onSelect={() => setSelectedAgent(r.agent_name === selectedAgent ? null : r.agent_name)}
                    selected={r.agent_name === selectedAgent}
                  />
                ))}
              </CardContent>
            </Card>

            {selectedRow && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    {selectedRow.agent_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ['Task Completion Rate', `${selectedRow.task_completion_rate ?? '—'}%`],
                      ['First-Pass Rate',      `${selectedRow.first_pass_rate ?? '—'}%`],
                      ['Tool Success Rate',    `${selectedRow.tool_success_rate ?? '—'}%`],
                      ['Human Escalation',     `${selectedRow.escalation_rate ?? '—'}%`],
                      ['P50 Latency',          selectedRow.p50_latency_ms != null ? `${(selectedRow.p50_latency_ms / 1000).toFixed(2)}s` : '—'],
                      ['P95 Latency',          selectedRow.p95_latency_ms != null ? `${(selectedRow.p95_latency_ms / 1000).toFixed(2)}s` : '—'],
                      ['Input tokens',         (selectedRow.total_input_tokens ?? 0).toLocaleString('sv-SE')],
                      ['Output tokens',        (selectedRow.total_output_tokens ?? 0).toLocaleString('sv-SE')],
                      ['Cost',                 `$${(selectedRow.estimated_cost_usd ?? 0).toFixed(4)}`],
                      ['Hallucination flags',  String(selectedRow.hallucination_flags ?? 0)],
                    ].map(([label, value]) => (
                      <div key={label} className="p-2 rounded bg-muted/40">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="font-medium mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* MCP tool breakdown */}
          {companyId && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tool call success by MCP server</CardTitle>
              </CardHeader>
              <CardContent>
                <MCPToolChart companyId={companyId} dateRange={dateRange} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Traces */}
        <TabsContent value="traces" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recent traces</CardTitle>
              <CardDescription>Click a trace to expand the span tree</CardDescription>
            </CardHeader>
            <CardContent>
              {companyId && (
                <TraceList companyId={companyId} agentName={selectedAgent ?? undefined} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversions */}
        <TabsContent value="conversions" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Agent-assisted conversions</CardTitle>
              <CardDescription>
                Sessions where a user interacted with your agent AND converted — measured
                directly in CortIQ without GA4.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {companyId && <ConversionPanel companyId={companyId} dateRange={dateRange} />}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost / Tokens */}
        <TabsContent value="cost" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Daily cost (USD)</CardTitle>
            </CardHeader>
            <CardContent>
              {companyId && <CostTrendChart companyId={companyId} dateRange={dateRange} />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cost per agent</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart
                  data={rows.map(r => ({ name: r.agent_name, cost: +(r.estimated_cost_usd ?? 0).toFixed(4) }))}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={(v: number) => [`$${v}`, 'Cost USD']} />
                  <Bar dataKey="cost" fill="#6366f1" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Setup */}
        <TabsContent value="setup">
          <SetupGuide endpoint={endpoint} apiKey={apiKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── MCP server tool chart ─────────────────────────────────────────────────────
function MCPToolChart({ companyId, dateRange }: { companyId: string; dateRange?: DateRange }) {
  const fromTs = dateRange?.from?.toISOString() ?? new Date(Date.now() - 30 * 86400000).toISOString();
  const toTs   = dateRange?.to?.toISOString()   ?? new Date().toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ['mcp-tool-stats', companyId, fromTs, toTs],
    enabled: !!companyId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_spans')
        .select('mcp_server, tool_name, status_code')
        .eq('company_id', companyId)
        .eq('gen_ai_operation_name', 'tool_call')
        .not('mcp_server', 'is', null)
        .gte('start_time', fromTs)
        .lte('start_time', toTs);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!data || data.length === 0) return (
    <p className="text-sm text-muted-foreground">No MCP tool calls recorded yet. Set <code className="bg-muted px-1 rounded">mcpServer</code> in your spans.</p>
  );

  const byServer = data.reduce<Record<string, { total: number; ok: number }>>((acc, r) => {
    const s = r.mcp_server ?? 'unknown';
    const e = acc[s] ?? { total: 0, ok: 0 };
    e.total++;
    if (r.status_code === 'OK') e.ok++;
    acc[s] = e;
    return acc;
  }, {});

  const chartData = Object.entries(byServer).map(([name, v]) => ({
    name,
    success: +(v.ok / v.total * 100).toFixed(1),
    total: v.total,
  }));

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
        <Tooltip formatter={(v: number) => [`${v}%`, 'Success rate']} />
        <Bar dataKey="success" radius={[0, 2, 2, 0]}>
          {chartData.map((e, i) => (
            <Cell key={i} fill={e.success >= 90 ? '#10b981' : e.success >= 70 ? '#f59e0b' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

