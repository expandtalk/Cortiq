import { useAITraffic } from '@/hooks/useAITraffic';
import { Bot, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AITrafficSummaryWidgetProps {
  siteId: string;
  onNavigate?: () => void;
}

export function AITrafficSummaryWidget({ siteId, onNavigate }: AITrafficSummaryWidgetProps) {
  const { data, loading, topPlatform, growthTrend } = useAITraffic(siteId, 30);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-8 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
    );
  }

  const totalSessions = data?.summary?.totalSessions ?? 0;
  const safeGrowth = isNaN(growthTrend) || !isFinite(growthTrend) ? 0 : growthTrend;
  const isGrowing = safeGrowth >= 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">AI Agent Traffic</span>
        </div>
        {onNavigate && (
          <Button variant="ghost" size="sm" onClick={onNavigate} className="h-7 text-xs gap-1">
            Details <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-2xl font-bold">{totalSessions.toLocaleString('sv-SE')}</p>
          <p className="text-xs text-muted-foreground">AI sessions (30d)</p>
        </div>
        <div>
          <div className="flex items-center gap-1">
            {isGrowing
              ? <TrendingUp className="h-4 w-4 text-green-500" />
              : <TrendingDown className="h-4 w-4 text-destructive" />
            }
            <p className="text-2xl font-bold">
              {isGrowing ? '+' : ''}{safeGrowth.toFixed(0)}%
            </p>
          </div>
          <p className="text-xs text-muted-foreground">vs. prev. week</p>
        </div>
      </div>

      {topPlatform ? (
        <div className="border rounded-md px-3 py-2 bg-muted/40 text-sm flex items-center justify-between">
          <span className="text-muted-foreground">Top agent:</span>
          <span className="font-medium">{topPlatform.platform}</span>
          <span className="text-muted-foreground text-xs">{topPlatform.sessions.toLocaleString('sv-SE')} sessions</span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground leading-relaxed">
          No AI agent traffic detected yet. ChatGPT Browser, Perplexity and Claude will appear here automatically.
        </p>
      )}
    </div>
  );
}
