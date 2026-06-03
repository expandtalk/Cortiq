import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDashboardInsights } from '@/hooks/useDashboardInsights';
import { Brain, Sparkles, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AIInsightsWidgetProps {
  siteId: string;
}

export function AIInsightsWidget({ siteId }: AIInsightsWidgetProps) {
  const { 
    insights, 
    loading, 
    error, 
    generating, 
    generateInsights, 
    dismissInsight,
    getPriorityColor,
    getTypeIcon,
    hasInsights,
    highPriorityCount
  } = useDashboardInsights(siteId);

  const handleGenerateInsights = async () => {
    try {
      const result = await generateInsights();
      toast.success(`Generated ${result.insights?.length || 0} new insights!`);
    } catch (err) {
      toast.error('Could not generate insights. Please try again later.');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <CardTitle>AI Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <CardTitle>AI Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Could not load insights: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <CardTitle>AI Insights</CardTitle>
            {highPriorityCount > 0 && (
              <Badge variant="destructive">{highPriorityCount} high priority</Badge>
            )}
          </div>
          <Button 
            onClick={handleGenerateInsights}
            disabled={generating}
            size="sm"
            variant="outline"
          >
            {generating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? 'Generating...' : 'Generate new'}
          </Button>
        </div>
        <CardDescription>
          Automatically generated recommendations based on your data
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasInsights ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No insights available yet
            </p>
            <Button onClick={handleGenerateInsights} disabled={generating}>
              {generating ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate insights
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.slice(0, 3).map((insight) => (
              <div key={insight.id} className="border rounded-lg p-4 relative">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getTypeIcon(insight.insight_type)}</span>
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    <Badge variant={getPriorityColor(insight.priority) as any}>
                      {insight.priority}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissInsight(insight.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {insight.description}
                </p>
                
                {insight.action_items && insight.action_items.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1">Recommended actions:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {insight.action_items.map((action, index) => (
                        <li key={index} className="flex items-start space-x-1">
                          <span>•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-3 pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    Confidence: {insight.confidence_score}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(insight.created_at).toLocaleDateString('sv-SE')}
                  </span>
                </div>
              </div>
            ))}
            
            {insights.length > 3 && (
              <p className="text-center text-sm text-muted-foreground">
                +{insights.length - 3} more insights available
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}