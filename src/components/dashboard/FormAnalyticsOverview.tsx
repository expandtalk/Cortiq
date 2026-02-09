import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useFormAnalytics, useFormPerformanceMetrics } from '@/hooks/useFormAnalytics';
import type { Site } from '@/types/dashboard';
import { 
  FileText, 
  Users, 
  Target, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer,
  BarChart3,
  Filter
} from 'lucide-react';

interface FormAnalyticsOverviewProps {
  selectedSite: Site;
}

export function FormAnalyticsOverview({ selectedSite }: FormAnalyticsOverviewProps) {
  const { data: forms, isLoading: formsLoading } = useFormAnalytics(selectedSite.id);
  const { data: metrics, isLoading: metricsLoading } = useFormPerformanceMetrics(selectedSite.id);

  if (formsLoading || metricsLoading) {
    return <div className="animate-pulse">Loading form analytics...</div>;
  }

  if (!forms || forms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Formuläranalys
          </CardTitle>
          <CardDescription>
            Inga formulär detekterade. Kontrollera att formulär finns på webbplatsen och att tracking-skriptet är installerat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <h3 className="text-lg font-semibold mb-2">Inga formulär detekterade</h3>
            <p className="text-muted-foreground mb-4">
              För Contact Form 7: Kontrollera att shortcodes som [contact-form-7 id="15a2a0e" title="Contact form 1"] finns på sidan.
            </p>
            <p className="text-muted-foreground mb-4">
              För Traffikboost: Kontrollera att shortcodes som [traffikboost_form type="contact"] finns på sidan.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.open('/installation', '_blank')}
            >
              Se installationsguide
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getFormTypeIcon = (type: string) => {
    switch (type) {
      case 'contact_form_7':
        return '📝';
      case 'gravity_forms':
        return '⚡';
      case 'woocommerce_checkout':
        return '🛒';
      default:
        return '📋';
    }
  };

  const getFormTypeName = (type: string) => {
    switch (type) {
      case 'contact_form_7':
        return 'Contact Form 7';
      case 'gravity_forms':
        return 'Gravity Forms';
      case 'woocommerce_checkout':
        return 'WooCommerce Checkout';
      default:
        return 'Anpassat formulär';
    }
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totala starter</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalStarts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              från {metrics?.formsCount} formulär
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genomsnittlig konvertering</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(metrics?.avgConversionRate || 0)}`}>
              {metrics?.avgConversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.totalCompletions} slutförda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genomsnittlig tid</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(metrics?.avgCompletionTime || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              till slutförande
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avhopp</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics?.totalAbandons.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              användare hoppade av
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Best/Worst Performers */}
      {metrics?.bestForm && metrics?.worstForm && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Bästa formulär
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{metrics.bestForm.form_name || metrics.bestForm.form_id}</p>
                  <p className="text-sm text-muted-foreground">
                    {getFormTypeName(metrics.bestForm.form_type)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {metrics.bestForm.conversion_rate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">konvertering</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Behöver förbättring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{metrics.worstForm.form_name || metrics.worstForm.form_id}</p>
                  <p className="text-sm text-muted-foreground">
                    {getFormTypeName(metrics.worstForm.form_type)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-red-600">
                    {metrics.worstForm.conversion_rate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">konvertering</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Individual Form Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Formulärprestanda
          </CardTitle>
          <CardDescription>
            Detaljerad analys av varje formulär på din webbplats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {forms.map((form) => (
              <div key={form.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFormTypeIcon(form.form_type)}</span>
                    <div>
                      <h4 className="font-medium">{form.form_name || form.form_id}</h4>
                      <p className="text-sm text-muted-foreground">
                        {getFormTypeName(form.form_type)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={form.conversion_rate >= 70 ? 'default' : form.conversion_rate >= 40 ? 'secondary' : 'destructive'}>
                      {form.conversion_rate.toFixed(1)}% konvertering
                    </Badge>
                    <Button variant="outline" size="sm">
                      Detaljvy
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Starter</p>
                    <p className="text-lg font-semibold">{form.total_starts.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Slutförda</p>
                    <p className="text-lg font-semibold text-green-600">{form.total_completions.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Avhopp</p>
                    <p className="text-lg font-semibold text-red-600">{form.total_abandons.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Genomsnittlig tid</p>
                    <p className="text-lg font-semibold">{formatTime(form.avg_completion_time)}</p>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Konvertering</span>
                    <span className={getPerformanceColor(form.conversion_rate)}>
                      {form.conversion_rate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={form.conversion_rate} className="h-2" />
                </div>

                {form.conversion_rate < 50 && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      Låg konvertering - överväg att analysera fältspecifik data för förbättringsmöjligheter
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}