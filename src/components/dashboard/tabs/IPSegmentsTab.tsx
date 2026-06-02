import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Network, TrendingUp, MousePointer, Eye, Info } from 'lucide-react';
import { IPSegmentManager } from '@/components/dashboard/IPSegmentManager';
import { useIPSegmentStats } from '@/hooks/useIPSegments';
import type { Site } from '@/types/dashboard';
import type { DateRange } from 'react-day-picker';

interface IPSegmentsTabProps {
  selectedSite: Site;
  dateRange?: DateRange;
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold mt-1">{value.toLocaleString('sv-SE')}</p>
      </CardContent>
    </Card>
  );
}

function SegmentStatsPanel({ companyId, dateRange }: { companyId: string; dateRange?: DateRange }) {
  const { data: stats = [], isLoading } = useIPSegmentStats(
    companyId,
    dateRange?.from,
    dateRange?.to,
  );

  if (isLoading) return <p className="text-sm text-muted-foreground py-4">Loading analytics…</p>;

  if (stats.length === 0) {
    return (
      <Alert className="border-border bg-muted/40">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          No segment traffic recorded yet for the selected period. Once a visitor from a defined
          IP range is tracked, their events will appear here.
        </AlertDescription>
      </Alert>
    );
  }

  const totals = stats.reduce(
    (acc, s) => ({
      events:   acc.events   + s.total_events,
      sessions: acc.sessions + s.unique_sessions,
      views:    acc.views    + s.page_views,
      conv:     acc.conv     + s.conversions,
    }),
    { events: 0, sessions: 0, views: 0, conv: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total events"    value={totals.events}   icon={TrendingUp} />
        <StatCard label="Unique sessions" value={totals.sessions} icon={Network} />
        <StatCard label="Page views"      value={totals.views}    icon={Eye} />
        <StatCard label="Conversions"     value={totals.conv}     icon={MousePointer} />
      </div>

      {/* Per-segment bar chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Events by segment</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="segment_name" type="category" tick={{ fontSize: 11 }} width={130} />
              <Tooltip
                formatter={(v: number) => [v.toLocaleString('sv-SE'), 'Events']}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="total_events" radius={[0, 4, 4, 0]}>
                {stats.map((s, i) => (
                  <Cell key={i} fill={s.segment_color || '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Per-segment detail cards */}
      <div className="space-y-3">
        {stats.map((seg, i) => (
          <Card key={i} className="border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="h-3 w-3 rounded-full inline-block border shrink-0"
                  style={{ background: seg.segment_color, borderColor: seg.segment_color }}
                />
                <span className="font-medium text-sm">{seg.segment_name}</span>
                <Badge variant="outline" className="text-xs capitalize">{seg.segment_category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                <div><span className="text-muted-foreground">Events</span><br /><strong>{seg.total_events.toLocaleString('sv-SE')}</strong></div>
                <div><span className="text-muted-foreground">Sessions</span><br /><strong>{seg.unique_sessions.toLocaleString('sv-SE')}</strong></div>
                <div><span className="text-muted-foreground">Page views</span><br /><strong>{seg.page_views.toLocaleString('sv-SE')}</strong></div>
                <div><span className="text-muted-foreground">Conversions</span><br /><strong>{seg.conversions.toLocaleString('sv-SE')}</strong></div>
              </div>

              {seg.top_pages && seg.top_pages.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Top pages</p>
                  <div className="space-y-1">
                    {seg.top_pages.slice(0, 5).map((p, j) => (
                      <div key={j} className="flex items-center justify-between text-xs">
                        <span className="truncate max-w-xs text-muted-foreground font-mono">{p.url}</span>
                        <span className="shrink-0 ml-2 font-medium">{p.views}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function IPSegmentsTab({ selectedSite, dateRange }: IPSegmentsTabProps) {
  const companyId = selectedSite.company_id || selectedSite.id;

  return (
    <div className="space-y-10">
      {/* Analytics section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Segment Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Traffic statistics broken down by your defined network segments for the selected date range.
          </p>
        </div>
        <SegmentStatsPanel companyId={companyId} dateRange={dateRange} />
      </section>

      <hr />

      {/* Configuration section */}
      <section className="space-y-4">
        <IPSegmentManager companyId={companyId} />
      </section>
    </div>
  );
}
