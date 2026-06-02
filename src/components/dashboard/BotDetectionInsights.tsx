import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Bot, ShieldAlert, Search, Wrench, Activity, BookOpen, Cpu } from 'lucide-react';
import {
  useBotOverview,
  useBotHourlyTrend,
  computeBotSummary,
  getBotCategoryLabel,
  type BotOverviewRow,
} from '@/hooks/useBotDetection';
import type { DateRange } from 'react-day-picker';

interface BotDetectionInsightsProps {
  companyId: string | null;
  dateRange?: DateRange;
}

const CATEGORY_COLORS: Record<string, string> = {
  ai_agent:         '#6366f1',
  search_crawler:   '#10b981',
  seo_tool:         '#f59e0b',
  monitoring:       '#3b82f6',
  training_crawler: '#8b5cf6',
  generic_bot:      '#6b7280',
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ai_agent:         Cpu,
  search_crawler:   Search,
  seo_tool:         Wrench,
  monitoring:       Activity,
  training_crawler: BookOpen,
  generic_bot:      Bot,
};

function SummaryCard({ label, value, sub, icon: Icon, color }: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function BotRow({ bot }: { bot: BotOverviewRow }) {
  const Icon = CATEGORY_ICONS[bot.bot_category] ?? Bot;
  const color = CATEGORY_COLORS[bot.bot_category] ?? '#6b7280';
  const label = getBotCategoryLabel(bot.bot_category);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
             style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{bot.bot_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-xs px-1.5 py-0" style={{ borderColor: color, color }}>
              {label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              last seen {new Date(bot.last_seen).toLocaleDateString('en-US')}
            </span>
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 text-right ml-4">
        <p className="text-sm font-bold">{bot.total_requests.toLocaleString('sv-SE')}</p>
        <p className="text-xs text-muted-foreground">requests</p>
      </div>
    </div>
  );
}

function HourlyTrendChart({ companyId, dateRange }: { companyId: string; dateRange?: DateRange }) {
  const { data: hourly, isLoading } = useBotHourlyTrend(
    companyId,
    dateRange?.from,
    dateRange?.to,
  );

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!hourly || hourly.length === 0) return null;

  // Aggregate by day for readability
  const byDay = hourly.reduce<Record<string, number>>((acc, row) => {
    const day = row.hour.slice(0, 10);
    acc[day] = (acc[day] ?? 0) + row.request_count;
    return acc;
  }, {});

  const chartData = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day: day.slice(5), count })); // MM-DD

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(v: number) => [v.toLocaleString('sv-SE'), 'Requests']}
          labelFormatter={(l) => `Date: ${l}`}
        />
        <Bar dataKey="count" fill="#6366f1" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BotDetectionInsights({ companyId, dateRange }: BotDetectionInsightsProps) {
  const { data: bots, isLoading, error } = useBotOverview(
    companyId,
    dateRange?.from,
    dateRange?.to,
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground text-sm">
          Failed to load bot detection data.
        </CardContent>
      </Card>
    );
  }

  const rows = bots ?? [];
  const { total, aiAgentCount, crawlerCount, topBot } = computeBotSummary(rows);

  if (total === 0) {
    return (
      <Card>
        <CardContent className="pt-8 pb-8 text-center">
          <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No bots detected yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Bot detection runs automatically on every tracked request. Data will
            appear once your tracking script has received traffic.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by category for bar chart
  const byCategory = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.bot_category] = (acc[r.bot_category] ?? 0) + r.total_requests;
    return acc;
  }, {});

  const categoryChartData = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, count]) => ({
      label: getBotCategoryLabel(cat),
      count,
      color: CATEGORY_COLORS[cat] ?? '#6b7280',
    }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Bot Requests"
          value={total.toLocaleString('sv-SE')}
          sub={`${rows.length} distinct bots`}
          icon={Bot}
          color="#6366f1"
        />
        <SummaryCard
          label="AI Agents"
          value={aiAgentCount.toLocaleString('sv-SE')}
          sub={total > 0 ? `${((aiAgentCount / total) * 100).toFixed(1)}% of bot traffic` : undefined}
          icon={Cpu}
          color="#6366f1"
        />
        <SummaryCard
          label="Search & Training Crawlers"
          value={crawlerCount.toLocaleString('sv-SE')}
          sub={total > 0 ? `${((crawlerCount / total) * 100).toFixed(1)}% of bot traffic` : undefined}
          icon={Search}
          color="#10b981"
        />
        <SummaryCard
          label="Top Bot"
          value={topBot?.bot_name ?? '—'}
          sub={topBot ? `${topBot.total_requests.toLocaleString('sv-SE')} requests` : undefined}
          icon={ShieldAlert}
          color="#f59e0b"
        />
      </div>

      {/* Trend chart */}
      {companyId && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Daily bot request trend</CardTitle>
          </CardHeader>
          <CardContent>
            <HourlyTrendChart companyId={companyId} dateRange={dateRange} />
          </CardContent>
        </Card>
      )}

      {/* Category breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">By category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={categoryChartData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={120} />
              <Tooltip formatter={(v: number) => [v.toLocaleString('sv-SE'), 'Requests']} />
              <Bar dataKey="count" radius={[0, 2, 2, 0]}>
                {categoryChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bot list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Detected bots</CardTitle>
          <CardDescription>
            Sorted by request volume. Detection uses User-Agent patterns and IP reputation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rows.map((bot) => (
              <BotRow key={bot.bot_name} bot={bot} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* GDPR note */}
      <p className="text-xs text-muted-foreground px-1">
        Bot detection data is stored according to your pipeline compliance mode.
        In <strong>EU Strict</strong> mode IP addresses are anonymized and raw User-Agent
        strings are not stored.
      </p>
    </div>
  );
}
