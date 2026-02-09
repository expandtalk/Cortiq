import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useABTesting } from '@/hooks/useABTesting';
import { useABStatistics } from '@/hooks/useABStatistics';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react';

interface ABTestResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId: string | null;
}

export function ABTestResultsDialog({ open, onOpenChange, testId }: ABTestResultsDialogProps) {
  const { tests, getTestResults } = useABTesting(null);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const test = tests.find(t => t.id === testId);
  const controlVariant = test?.variants.find(v => v.is_control);
  const testVariant = test?.variants.find(v => !v.is_control);

  // Mock data for demonstration (in real app, this would come from results)
  const statisticalData = {
    control: { conversions: 125, sessions: 5000 },
    variant: { conversions: 156, sessions: 4800 },
    baseline_rate: 2.5,
    target_lift: 20,
    confidence_level: 95
  };

  const stats = useABStatistics(statisticalData);

  useEffect(() => {
    if (testId && open) {
      loadResults();
    }
  }, [testId, open]);

  const loadResults = async () => {
    if (!testId) return;
    
    setIsLoading(true);
    try {
      const data = await getTestResults(testId);
      setResults(data);
    } catch (error) {
      console.error('Error loading test results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!test || !stats) {
    return null;
  }

  const getSignificanceColor = () => {
    if (stats.is_significant) {
      return stats.relative_improvement > 0 ? 'text-success' : 'text-destructive';
    }
    return 'text-warning';
  };

  const getSignificanceIcon = () => {
    if (stats.is_significant) {
      return stats.relative_improvement > 0 ? 
        <CheckCircle className="h-5 w-5 text-success" /> : 
        <XCircle className="h-5 w-5 text-destructive" />;
    }
    return <AlertTriangle className="h-5 w-5 text-warning" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {test.test_name} - Results
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Test Overview */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Test Summary</CardTitle>
                  <CardDescription>{test.test_description}</CardDescription>
                </div>
                <Badge className={getSignificanceColor()}>
                  {stats.is_significant ? 'Statistically Significant' : 'Not Significant'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {stats.relative_improvement.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Relative Improvement</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {stats.statistical_significance.toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Confidence</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {(stats.sessions_a + stats.sessions_b).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Sessions</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {Math.ceil(14)} days
                  </div>
                  <div className="text-sm text-muted-foreground">Test Duration</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variant Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-secondary rounded-full"></div>
                  Control ({controlVariant?.variant_name})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Sessions</span>
                    <span className="font-medium">{stats.sessions_a.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Conversions</span>
                    <span className="font-medium">{stats.conversions_a.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Conversion Rate</span>
                    <span className="font-bold text-lg">{stats.conversion_rate_a.toFixed(2)}%</span>
                  </div>
                </div>
                
                <div className="pt-2">
                  <div className="text-sm text-muted-foreground mb-1">Progress</div>
                  <Progress value={85} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Variant */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-primary rounded-full"></div>
                  Variant ({testVariant?.variant_name})
                  {stats.relative_improvement > 0 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Sessions</span>
                    <span className="font-medium">{stats.sessions_b.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Conversions</span>
                    <span className="font-medium">{stats.conversions_b.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Conversion Rate</span>
                    <span className="font-bold text-lg">{stats.conversion_rate_b.toFixed(2)}%</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-sm text-muted-foreground mb-1">Progress</div>
                  <Progress value={82} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistical Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getSignificanceIcon()}
                Statistical Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground">P-Value</div>
                  <div className="text-2xl font-bold">{stats.p_value.toFixed(4)}</div>
                  <div className="text-sm">
                    {stats.p_value < 0.05 ? 'Significant' : 'Not Significant'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Confidence Interval</div>
                  <div className="text-lg font-semibold">
                    {stats.confidence_interval_lower.toFixed(2)}% to {stats.confidence_interval_upper.toFixed(2)}%
                  </div>
                  <div className="text-sm">95% confidence</div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Statistical Power</div>
                  <div className="text-2xl font-bold">{stats.statistical_power.toFixed(0)}%</div>
                  <div className="text-sm">
                    {stats.statistical_power >= 80 ? 'Adequate' : 'Underpowered'}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Recommendation</h4>
                {stats.is_significant ? (
                  <p className="text-sm">
                    {stats.relative_improvement > 0 ? (
                      <>
                        🎉 <strong>Winner!</strong> The variant performs {Math.abs(stats.relative_improvement).toFixed(1)}% better than the control. 
                        Consider implementing this change across your site.
                      </>
                    ) : (
                      <>
                        📉 The variant performs {Math.abs(stats.relative_improvement).toFixed(1)}% worse than the control. 
                        Stick with the original version.
                      </>
                    )}
                  </p>
                ) : (
                  <p className="text-sm">
                    ⏳ The test hasn't reached statistical significance yet. 
                    Consider running it for {stats.test_duration_recommendation - 14} more days 
                    or until you reach {stats.required_sample_size.toLocaleString()} sessions per variant.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}