import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  MousePointer, 
  FormInput, 
  Settings, 
  Zap,
  Brain,
  Users,
  TrendingUp
} from 'lucide-react';

interface QuickNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  insights?: {
    newInsights: number;
    urgentIssues: number;
    improvements: number;
  };
}

export function QuickNavigation({ activeTab, onTabChange, insights }: QuickNavigationProps) {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      description: 'Main overview and key metrics',
      badge: insights?.newInsights
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      description: 'Detailed traffic analysis'
    },
    {
      id: 'heatmap',
      label: 'Heatmap',
      icon: MousePointer,
      description: 'User interactions'
    },
    {
      id: 'form-analytics',
      label: 'Forms',
      icon: FormInput,
      description: 'Form analytics and conversion'
    },
    {
      id: 'ai',
      label: 'AI Insights',
      icon: Brain,
      description: 'Automatic recommendations',
      badge: insights?.urgentIssues,
      badgeVariant: 'destructive' as const
    },
    {
      id: 'segments',
      label: 'Segments',
      icon: Users,
      description: 'Audience analysis'
    }
  ];

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                onClick={() => onTabChange(item.id)}
                className="flex flex-col items-center justify-center h-20 relative group"
              >
                <IconComponent className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
                
                {item.badge && item.badge > 0 && (
                  <div className={`absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs flex items-center justify-center text-white ${
                    item.badgeVariant === 'destructive' ? 'bg-destructive' : 'bg-primary'
                  }`}>
                    {item.badge}
                  </div>
                )}
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-md border">
                  {item.description}
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}