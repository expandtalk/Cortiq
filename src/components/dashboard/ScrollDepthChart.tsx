import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingDown, Users } from 'lucide-react';
import type { HeatmapPoint } from '@/types/dashboard';

interface ScrollDepthChartProps {
  heatmapData: HeatmapPoint[];
  selectedUrl: string;
  loading?: boolean;
}

const MILESTONES = [25, 50, 75, 100];
const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-background border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-medium">{d.label}</p>
      <p className="text-muted-foreground">{d.sessions.toLocaleString()} sessions reached this depth</p>
      {d.dropoff > 0 && (
        <p className="text-red-400 text-xs mt-1">−{d.dropoff}% dropped off before here</p>
      )}
    </div>
  );
}

export function ScrollDepthChart({ heatmapData, selectedUrl, loading }: ScrollDepthChartProps) {
  const chartData = useMemo(() => {
    // Count unique sessions per scroll milestone
    const sessionsByDepth: Record<number, Set<string>> = { 25: new Set(), 50: new Set(), 75: new Set(), 100: new Set() };

    for (const point of heatmapData) {
      const depth = point.y_coordinate ?? (point as any).scroll_depth;
      const sessionId = (point as any).session_id ?? String(point.x_coordinate);
      if (MILESTONES.includes(depth)) {
        // A session that reached 75% also reached 25% and 50%
        for (const m of MILESTONES) {
          if (m <= depth) sessionsByDepth[m].add(sessionId);
        }
      }
    }

    // If no session_id available, count raw events per milestone
    const hasSessionData = Object.values(sessionsByDepth).some(s => s.size > 0);
    if (!hasSessionData) {
      const counts: Record<number, number> = { 25: 0, 50: 0, 75: 0, 100: 0 };
      for (const point of heatmapData) {
        const depth = point.y_coordinate ?? (point as any).scroll_depth;
        if (MILESTONES.includes(depth)) counts[depth] = (counts[depth] || 0) + 1;
      }
      const max = counts[25] || 1;
      return MILESTONES.map((m, i) => ({
        milestone: m,
        label: `${m}% scroll depth`,
        sessions: counts[m],
        pct: max > 0 ? Math.round((counts[m] / max) * 100) : 0,
        dropoff: i === 0 ? 0 : Math.max(0, Math.round(((counts[MILESTONES[i - 1]] - counts[m]) / Math.max(counts[MILESTONES[i - 1]], 1)) * 100)),
      }));
    }

    const max = sessionsByDepth[25].size || 1;
    return MILESTONES.map((m, i) => ({
      milestone: m,
      label: `${m}% scroll depth`,
      sessions: sessionsByDepth[m].size,
      pct: Math.round((sessionsByDepth[m].size / max) * 100),
      dropoff: i === 0 ? 0 : Math.max(0, Math.round(((sessionsByDepth[MILESTONES[i - 1]].size - sessionsByDepth[m].size) / Math.max(sessionsByDepth[MILESTONES[i - 1]].size, 1)) * 100)),
    }));
  }, [heatmapData]);

  const totalSessions = chartData[0]?.sessions ?? 0;
  const reachedBottom = chartData[3]?.sessions ?? 0;
  const avgDepth = useMemo(() => {
    if (totalSessions === 0) return 0;
    const weights = chartData.map(d => d.sessions * d.milestone);
    return Math.round(weights.reduce((a, b) => a + b, 0) / (totalSessions * MILESTONES.length));
  }, [chartData, totalSessions]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  if (totalSessions === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <TrendingDown className="h-10 w-10 mb-4 opacity-30" />
          <p className="font-medium">No scroll data yet</p>
          <p className="text-sm mt-1 max-w-xs">
            Scroll depth tracking fires at 25%, 50%, 75% and 100%. Make sure the latest tracking script is installed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Total sessions</span>
            </div>
            <div className="text-2xl font-bold">{totalSessions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs font-medium">Reached bottom</span>
            </div>
            <div className="text-2xl font-bold">
              {totalSessions > 0 ? Math.round((reachedBottom / totalSessions) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">{reachedBottom.toLocaleString()} sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <span className="text-xs font-medium">Avg scroll depth</span>
            </div>
            <div className="text-2xl font-bold">{avgDepth}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Scroll depth funnel</CardTitle>
          <CardDescription className="truncate">{selectedUrl || 'All pages'}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 16, right: 32, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={32}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Drop-off annotations */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {chartData.slice(1).map((d) => (
              <div key={d.milestone} className="text-center">
                <div className="text-sm font-medium text-red-400">−{d.dropoff}%</div>
                <div className="text-xs text-muted-foreground">dropped before {d.milestone}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
