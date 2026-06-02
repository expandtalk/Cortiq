import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw } from 'lucide-react';

interface HealthData {
  lastEventAt: Date | null;
  eventsLastHour: number;
  eventsLast24h: number;
  fetchedAt: Date;
}

type Status = 'active' | 'slow' | 'dead' | 'loading';

function getStatus(data: HealthData | null): Status {
  if (!data) return 'loading';
  if (data.eventsLastHour === 0 && data.eventsLast24h === 0) return 'dead';
  if (!data.lastEventAt) return 'dead';
  const minutesSinceLast = (Date.now() - data.lastEventAt.getTime()) / 60000;
  if (minutesSinceLast <= 15) return 'active';
  return 'slow';
}

const STATUS_META: Record<Status, { label: string; dot: string; text: string }> = {
  active:  { label: 'Tracking Active',       dot: 'bg-green-500',  text: 'text-green-600 dark:text-green-400' },
  slow:    { label: 'No Recent Events',       dot: 'bg-yellow-400', text: 'text-yellow-600 dark:text-yellow-400' },
  dead:    { label: 'No Events in 24h',       dot: 'bg-red-500',    text: 'text-red-600 dark:text-red-400' },
  loading: { label: 'Checking…',              dot: 'bg-muted animate-pulse', text: 'text-muted-foreground' },
};

function timeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}

interface Props {
  siteId: string;
}

export function TrackingHealthWidget({ siteId }: Props) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const since1h = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const [last, count1h, count24h] = await Promise.all([
      supabase
        .from('page_views')
        .select('viewed_at')
        .eq('site_id', siteId)
        .order('viewed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .gte('viewed_at', since1h),

      supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .gte('viewed_at', since24h),
    ]);

    setHealth({
      lastEventAt: last.data?.viewed_at ? new Date(last.data.viewed_at) : null,
      eventsLastHour: count1h.count ?? 0,
      eventsLast24h: count24h.count ?? 0,
      fetchedAt: now,
    });
    setLoading(false);
  }, [siteId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const status = getStatus(health);
  const meta = STATUS_META[status];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          Tracking Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${meta.dot}`} />
          <span className={`text-sm font-medium ${meta.text}`}>{meta.label}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground mb-0.5">Last event</p>
            <p className="text-sm font-semibold tabular-nums">
              {loading ? '—' : health?.lastEventAt ? timeAgo(health.lastEventAt) : 'Never'}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground mb-0.5">Events (1h)</p>
            <p className="text-sm font-semibold tabular-nums">
              {loading ? '—' : (health?.eventsLastHour ?? 0).toLocaleString('sv-SE')}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground mb-0.5">Events (24h)</p>
            <p className="text-sm font-semibold tabular-nums">
              {loading ? '—' : (health?.eventsLast24h ?? 0).toLocaleString('sv-SE')}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground mb-0.5">Checked</p>
            <p className="text-sm font-semibold tabular-nums">
              {loading ? '—' : health ? timeAgo(health.fetchedAt) : '—'}
            </p>
          </div>
        </div>

        {status === 'dead' && (
          <p className="text-xs text-muted-foreground">
            No page views recorded in the last 24 hours. Verify the tracking script is installed and the Site ID matches.
          </p>
        )}
        {status === 'slow' && (
          <p className="text-xs text-muted-foreground">
            Events exist in the last 24h but none in the past 15 minutes. Traffic may be low.
          </p>
        )}

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">
            {health ? `Updated ${timeAgo(health.fetchedAt)}` : 'Loading…'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={fetch}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
