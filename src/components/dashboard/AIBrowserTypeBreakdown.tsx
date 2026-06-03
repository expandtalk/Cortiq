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
    description: 'Renders CSS/JS, often accepts cookies',
    color: 'bg-green-500'
  },
  headless: {
    label: 'Headless Browser',
    icon: Monitor,
    description: 'Executes JS but no visual rendering',
    color: 'bg-amber-500'
  },
  'text-based': {
    label: 'Text-based Browser',
    icon: FileText,
    description: 'No JS execution, HTML only',
    color: 'bg-blue-500'
  },
  unknown: {
    label: 'Unknown',
    icon: HelpCircle,
    description: 'Could not determine browser type',
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
            No data available yet
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
          Identify whether agents use visual, headless, or text-based browsers
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
          <h4 className="font-medium text-sm mb-2">Insights</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            {breakdown.find(b => b.type === 'visual')?.percentage > 50 && (
              <li>• The majority of agents use visual browsers — they will appear in GA4</li>
            )}
            {breakdown.find(b => b.type === 'text-based')?.percentage > 30 && (
              <li>• Many text-based agents — these are completely invisible to cookie-based analytics</li>
            )}
            {breakdown.find(b => b.type === 'headless')?.percentage > 20 && (
              <li>• Headless browsers may indicate automation or training crawlers</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
