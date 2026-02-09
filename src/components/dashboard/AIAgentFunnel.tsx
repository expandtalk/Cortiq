import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowDown, AlertTriangle, CheckCircle2 } from "lucide-react";

interface FunnelStep {
  page_type: string;
  sessions_count: number;
  drop_off_rate: number;
}

interface AIAgentFunnelProps {
  funnel: FunnelStep[];
  totalSessions: number;
}

const PAGE_TYPE_LABELS: Record<string, string> = {
  landing: 'Landing Page',
  category: 'Kategori',
  product: 'Produkt',
  checkout: 'Checkout',
  conversion: 'Konvertering',
  other: 'Övriga'
};

const PAGE_TYPE_COLORS: Record<string, string> = {
  landing: 'bg-blue-500',
  category: 'bg-purple-500',
  product: 'bg-amber-500',
  checkout: 'bg-orange-500',
  conversion: 'bg-green-500',
  other: 'bg-gray-500'
};

export const AIAgentFunnel = ({ funnel, totalSessions }: AIAgentFunnelProps) => {
  if (!funnel || funnel.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDown className="h-5 w-5" />
            Agent Journey Funnel
          </CardTitle>
          <CardDescription>
            Ingen funnel-data tillgänglig ännu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Data visas när AI-agenter börjar besöka din sajt och vi kan spåra deras resa.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort funnel by expected order
  const sortOrder = ['landing', 'category', 'product', 'checkout', 'conversion', 'other'];
  const sortedFunnel = [...funnel].sort((a, b) => 
    sortOrder.indexOf(a.page_type) - sortOrder.indexOf(b.page_type)
  );

  const maxSessions = Math.max(...funnel.map(f => f.sessions_count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDown className="h-5 w-5" />
          Agent Journey Funnel
        </CardTitle>
        <CardDescription>
          Se var AI-agenter fastnar och om de når konverteringsmålet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedFunnel.map((step, index) => {
          const percentage = maxSessions > 0 ? (step.sessions_count / maxSessions) * 100 : 0;
          const isConversion = step.page_type === 'conversion';
          const hasHighDropOff = step.drop_off_rate > 50;

          return (
            <div key={step.page_type} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${PAGE_TYPE_COLORS[step.page_type] || 'bg-gray-500'}`} />
                  <span className="font-medium">{PAGE_TYPE_LABELS[step.page_type] || step.page_type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{step.sessions_count}</span>
                  <span className="text-xs text-muted-foreground">sessions</span>
                  {isConversion && step.sessions_count > 0 && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {hasHighDropOff && !isConversion && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              </div>
              
              <Progress value={percentage} className="h-6" />
              
              {index < sortedFunnel.length - 1 && step.drop_off_rate > 0 && (
                <div className="flex items-center justify-center gap-2 py-1">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  <Badge 
                    variant={hasHighDropOff ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    -{step.drop_off_rate.toFixed(1)}% drop-off
                  </Badge>
                </div>
              )}
            </div>
          );
        })}

        {/* Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total agent sessions:</span>
            <span className="font-bold">{totalSessions}</span>
          </div>
          {sortedFunnel.find(f => f.page_type === 'conversion') && (
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-muted-foreground">Konverteringsgrad:</span>
              <Badge variant="default" className="bg-green-500">
                {totalSessions > 0 
                  ? ((sortedFunnel.find(f => f.page_type === 'conversion')?.sessions_count || 0) / totalSessions * 100).toFixed(1)
                  : 0}%
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
