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
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Clock
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

  const controlResult = results.find(r => r.variant_id === controlVariant?.id);
  const variantResult = results.find(r => r.variant_id === testVariant?.id);

  const statisticalData = (controlResult && variantResult) ? {
    control: { conversions: controlResult.conversions, sessions: controlResult.sessions },
    variant: { conversions: variantResult.conversions, sessions: variantResult.sessions },
    baseline_rate: test?.baseline_value != null ? test.baseline_value / 100 : undefined,
    target_lift: test?.target_lift != null ? test.target_lift / 100 : 0.2,
    confidence_level: test?.confidence_level ?? 95,
  } : null;

  const stats = useABStatistics(statisticalData);

  const testDuration = test?.start_date
    ? Math.max(1, Math.ceil((Date.now() - new Date(test.start_date).getTime()) / 86400000))
    : 0;

  const controlProgress = stats?.required_sample_size
    ? Math.min(100, Math.round((stats.sessions_a / stats.required_sample_size) * 100))
    : 0;
  const variantProgress = stats?.required_sample_size
    ? Math.min(100, Math.round((stats.sessions_b / stats.required_sample_size) * 100))
    : 0;

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

  if (!test) {
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

  const noData = !isLoading && !stats;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {test.test_name} - Results
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading results...
          </div>
        ) : noData ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <Clock className="h-8 w-8" />
            <p className="text-sm">No results yet. Results appear once the test has collected data.</p>
          </div>
        ) : (
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
                    {stats!.is_significant ? 'Statistically Significant' : 'Not Significant'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {stats!.relative_improvement.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Relative Improvement</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {stats!.statistical_significance.toFixed(0)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {(stats!.sessions_a + stats!.sessions_b).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {testDuration} days
                    </div>
                    <div className="text-sm text-muted-foreground">Test Duration</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Variant Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <span className="font-medium">{stats!.sessions_a.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Conversions</span>
                      <span className="font-medium">{stats!.conversions_a.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Conversion Rate</span>
                      <span className="font-bold text-lg">{stats!.conversion_rate_a.toFixed(2)}%</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="text-sm text-muted-foreground mb-1">Sample progress</div>
                    <Progress value={controlProgress} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-primary rounded-full"></div>
                    Variant ({testVariant?.variant_name})
                    {stats!.relative_improvement > 0
                      ? <TrendingUp className="h-4 w-4 text-success" />
                      : <TrendingDown className="h-4 w-4 text-destructive" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Sessions</span>
                      <span className="font-medium">{stats!.sessions_b.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Conversions</span>
                      <span className="font-medium">{stats!.conversions_b.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Conversion Rate</span>
                      <span className="font-bold text-lg">{stats!.conversion_rate_b.toFixed(2)}%</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="text-sm text-muted-foreground mb-1">Sample progress</div>
                    <Progress value={variantProgress} className="h-2" />
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
                    <div className="text-2xl font-bold">{stats!.p_value.toFixed(4)}</div>
                    <div className="text-sm">
                      {stats!.p_value < 0.05 ? 'Significant' : 'Not Significant'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Confidence Interval</div>
                    <div className="text-lg font-semibold">
                      {stats!.confidence_interval_lower.toFixed(2)}% to {stats!.confidence_interval_upper.toFixed(2)}%
                    </div>
                    <div className="text-sm">{test.confidence_level ?? 95}% confidence</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Statistical Power</div>
                    <div className="text-2xl font-bold">{stats!.statistical_power.toFixed(0)}%</div>
                    <div className="text-sm">
                      {stats!.statistical_power >= 80 ? 'Adequate' : 'Underpowered'}
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Recommendation</h4>
                  {stats!.is_significant ? (
                    <p className="text-sm">
                      {stats!.relative_improvement > 0 ? (
                        <><strong>Winner!</strong> The variant performs {Math.abs(stats!.relative_improvement).toFixed(1)}% better than the control. Consider implementing this change across your site.</>
                      ) : (
                        <>The variant performs {Math.abs(stats!.relative_improvement).toFixed(1)}% worse than the control. Stick with the original version.</>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm">
                      The test has not reached statistical significance yet. Continue until you reach {stats!.required_sample_size.toLocaleString()} sessions per variant.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}