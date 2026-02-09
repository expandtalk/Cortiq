import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Eye, FileText, HelpCircle } from "lucide-react";

interface BrowserTypeBreakdownProps {
  breakdown: { type: string; count: number; percentage: number }[];
  totalSessions: number;
}

const BROWSER_TYPE_CONFIG: Record<string, { 
  label: string; 
  icon: typeof Monitor; 
  description: string;
  color: string;
}> = {
  visual: {
    label: 'Visual Browser',
    icon: Eye,
    description: 'Renderar CSS/JS, accepterar ofta cookies',
    color: 'bg-green-500'
  },
  headless: {
    label: 'Headless Browser',
    icon: Monitor,
    description: 'Exekverar JS men ingen visuell rendering',
    color: 'bg-amber-500'
  },
  'text-based': {
    label: 'Text-based Browser',
    icon: FileText,
    description: 'Ingen JS-exekvering, endast HTML',
    color: 'bg-blue-500'
  },
  unknown: {
    label: 'Okänd',
    icon: HelpCircle,
    description: 'Kunde inte avgöra browser-typ',
    color: 'bg-gray-500'
  }
};

export const AIBrowserTypeBreakdown = ({ breakdown, totalSessions }: BrowserTypeBreakdownProps) => {
  if (breakdown.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Browser Type Detection</CardTitle>
          <CardDescription>
            Ingen data tillgänglig ännu
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Browser Type Detection</CardTitle>
        <CardDescription>
          Identifiera om agenter använder visual, headless eller text-baserade browsers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {breakdown.map((item) => {
          const config = BROWSER_TYPE_CONFIG[item.type] || BROWSER_TYPE_CONFIG.unknown;
          const Icon = config.icon;

          return (
            <div 
              key={item.type} 
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${config.color} bg-opacity-20 flex items-center justify-center`}>
                  <Icon className={`h-5 w-5`} style={{ color: config.color.replace('bg-', 'var(--') + ')' }} />
                </div>
                <div>
                  <p className="font-medium">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{item.count}</p>
                <Badge variant="secondary" className="text-xs">
                  {item.percentage.toFixed(1)}%
                </Badge>
              </div>
            </div>
          );
        })}

        {/* Insights */}
        <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <h4 className="font-medium text-sm mb-2">Insikter</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            {breakdown.find(b => b.type === 'visual')?.percentage > 50 && (
              <li>• Majoriteten av agenterna använder visuella browsers - de kommer synas i GA4</li>
            )}
            {breakdown.find(b => b.type === 'text-based')?.percentage > 30 && (
              <li>• Många text-baserade agents - dessa är helt osynliga för cookie-baserad analytics</li>
            )}
            {breakdown.find(b => b.type === 'headless')?.percentage > 20 && (
              <li>• Headless browsers kan indikera automation eller training crawlers</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
