import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Monitor, 
  Smartphone, 
  Globe,
  Target,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  PieChart,
  Activity,
  Plus,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import type { Site } from '@/types/dashboard';
import { useSegmentAnalytics } from '@/hooks/useSegmentAnalytics';
import { useGASegmentAnalytics } from '@/hooks/useGASegmentAnalytics';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { CustomSegmentCreator } from '@/components/dashboard/CustomSegmentCreator';
import { PrioritySegmentConfig } from '@/components/dashboard/PrioritySegmentConfig';
import { DateRange } from 'react-day-picker';

interface SegmentsTabProps {
  selectedSite: Site;
}

export function SegmentsTab({ selectedSite }: SegmentsTabProps) {
  const [activeView, setActiveView] = useState('overview');
  const [performanceCategory, setPerformanceCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [showCustomSegmentDialog, setShowCustomSegmentDialog] = useState(false);
  const [showPriorityConfig, setShowPriorityConfig] = useState(false);
  const [customSegments, setCustomSegments] = useState<any[]>([]);
  const [prioritySegments, setPrioritySegments] = useState<any[]>([]);
  const [enabledSegments, setEnabledSegments] = useState<Record<string, boolean>>({
    'high-variance': true,
    'medium-variance': true,
    'low-variance': true
  });
  
  const startDate = dateRange?.from?.toISOString().split('T')[0];
  const endDate = dateRange?.to?.toISOString().split('T')[0];
  
  const { segmentMetrics: internalMetrics, insights, isLoading: internalLoading } = useSegmentAnalytics(selectedSite.id);
  const { segmentMetrics: gaMetrics, isLoading: gaLoading, hasGAIntegration } = useGASegmentAnalytics(selectedSite.id, startDate, endDate);
  
  // Använd GA-data om tillgängligt, annars intern data
  const segmentMetrics = hasGAIntegration && gaMetrics.length > 0 ? 
    gaMetrics.map(metric => ({
      name: metric.name,
      overallValue: metric.totalValue,
      unit: metric.unit,
      varianceScore: calculateVarianceFromGASegments(metric.segments),
      segments: metric.segments.map(segment => ({
        id: segment.id,
        name: segment.name,
        value: segment.conversionRate || (segment.sessions / metric.totalValue * 100),
        variance: calculateSegmentVariance(segment, metric),
        impact: segment.percentage > 50 ? 'high' as const : segment.percentage > 20 ? 'medium' as const : 'low' as const,
        trend: 'stable' as const,
        volumeImpact: segment.percentage
      })),
      maxVariance: Math.max(...metric.segments.map(s => Math.abs(calculateSegmentVariance(s, metric))))
    })) : internalMetrics;
  
  const isLoading = hasGAIntegration ? gaLoading : internalLoading;

  // Hjälpfunktioner för GA-data
  function calculateVarianceFromGASegments(segments: any[]): number {
    if (segments.length < 2) return 0;
    const values = segments.map(s => s.conversionRate || 0);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean * 100 || 0;
  }

  function calculateSegmentVariance(segment: any, metric: any): number {
    const segmentValue = segment.conversionRate || (segment.sessions / metric.totalValue * 100);
    const avgValue = metric.segments.reduce((sum: number, s: any) => 
      sum + (s.conversionRate || (s.sessions / metric.totalValue * 100)), 0) / metric.segments.length;
    return avgValue > 0 ? ((segmentValue - avgValue) / avgValue) * 100 : 0;
  }

  const getVarianceColor = (variance: number) => {
    if (variance > 20) return 'text-success font-medium';
    if (variance < -20) return 'text-destructive font-medium';
    return 'text-muted-foreground';
  };

  const getVarianceLevel = (variance: number) => {
    if (Math.abs(variance) > 30) return 'high';
    if (Math.abs(variance) > 15) return 'medium';
    return 'low';
  };

  const getVarianceBgColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-destructive/10 border-destructive/20';
      case 'medium': return 'bg-warning/10 border-warning/20';
      case 'low': return 'bg-success/10 border-success/20';
      default: return 'bg-muted/50 border-muted';
    }
  };

  const getImpactBadge = (impact: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[impact as keyof typeof colors] || colors.low;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-600" />;
      default: return <Activity className="h-3 w-3 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Date Range Picker */}
      <Card>
        <CardHeader>
          <CardTitle>Period</CardTitle>
        </CardHeader>
        <CardContent>
          <DateRangePicker 
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </CardContent>
      </Card>

      {/* Segment Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Segment Hälsoöversikt
          </CardTitle>
          <CardDescription>
            Upptäck dolda insikter genom att analysera prestanda per segment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-destructive rounded-full"></div>
                <span className="text-sm font-medium">Hög variation (3)</span>
              </div>
              <Switch 
                checked={enabledSegments['high-variance']}
                onCheckedChange={(checked) => setEnabledSegments(prev => ({...prev, 'high-variance': checked}))}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-warning rounded-full"></div>
                <span className="text-sm font-medium">Medel variation (5)</span>
              </div>
              <Switch 
                checked={enabledSegments['medium-variance']}
                onCheckedChange={(checked) => setEnabledSegments(prev => ({...prev, 'medium-variance': checked}))}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <span className="text-sm font-medium">Låg variation (2)</span>
              </div>
              <Switch 
                checked={enabledSegments['low-variance']}
                onCheckedChange={(checked) => setEnabledSegments(prev => ({...prev, 'low-variance': checked}))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="performance">Prestanda</TabsTrigger>
          <TabsTrigger value="revenue">Intäkt</TabsTrigger>
          <TabsTrigger value="custom">Anpassade</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-12 bg-muted rounded"></div>
                      <div className="h-12 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : segmentMetrics.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">Ingen segmentdata tillgänglig</p>
                <p className="text-sm text-muted-foreground">
                  Data kommer att visas när du har tracking-sessioner och konverteringar
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
          {/* Main Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {segmentMetrics.map((metric) => (
              <Card key={metric.name} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    {metric.name}
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${metric.varianceScore > 70 ? 'border-red-200 text-red-700' : 
                        metric.varianceScore > 50 ? 'border-yellow-200 text-yellow-700' : 
                        'border-green-200 text-green-700'}`}
                    >
                      σ: {metric.varianceScore.toFixed(0)}%
                    </Badge>
                  </CardTitle>
                    <div className="text-2xl font-bold">
                     {Math.round(metric.overallValue)} {metric.unit}
                   </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {metric.segments.slice(0, 2).map((segment) => {
                    const varianceLevel = getVarianceLevel(segment.variance);
                    const isEnabled = enabledSegments[`${varianceLevel}-variance`];
                    
                    if (!isEnabled) return null;
                    
                    return (
                      <div key={segment.id} className={`flex items-center justify-between p-3 rounded-lg border-2 ${getVarianceBgColor(varianceLevel)} hover:shadow-sm transition-all`}>
                        <div className="flex items-center gap-2">
                          {segment.id === 'mobile' && <Smartphone className="h-4 w-4 text-primary" />}
                          {segment.id === 'desktop' && <Monitor className="h-4 w-4 text-primary" />}
                          {segment.id === 'new' && <Users className="h-4 w-4 text-primary" />}
                          {segment.id === 'returning' && <Target className="h-4 w-4 text-primary" />}
                          {segment.id === 'organic' && <Globe className="h-4 w-4 text-primary" />}
                          {segment.id === 'paid' && <TrendingUp className="h-4 w-4 text-primary" />}
                          <span className="text-sm font-medium">{segment.name}</span>
                          {getTrendIcon(segment.trend)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base">
                            {Math.round(segment.value)} {metric.unit}
                          </span>
                          <span className={`text-sm px-2 py-1 rounded ${getVarianceColor(segment.variance)}`}>
                            ({segment.variance > 0 ? '+' : ''}{Math.round(Math.abs(segment.variance))})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {metric.segments.length > 2 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full hover:bg-background/80"
                      onClick={() => {
                        // Show all segments functionality
                        console.log('Show all segments for', metric.name);
                      }}
                    >
                      Visa alla segment <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                  
                  <div className="pt-3 border-t text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                    <span className="font-medium">Största gapet:</span> {Math.round(metric.maxVariance)} sessioner
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Top Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Veckans viktigaste insikter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.map((insight) => (
                <div key={insight.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge className={getImpactBadge(insight.impact)}>
                        {insight.impact}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {insight.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-blue-600 font-medium">{insight.metric}</span>
                      <span>•</span>
                      <span className="text-green-700">Åtgärd: {insight.action}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Undersök
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
          </>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {!performanceCategory ? (
            <Card>
              <CardHeader>
                <CardTitle>Prestanda Segment</CardTitle>
                <CardDescription>
                  Analysera traffic källor, användarbeteende, enheter och geografi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => setPerformanceCategory('traffic')}
                  >
                    <Globe className="h-5 w-5 mb-2" />
                    Traffic Källor
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => setPerformanceCategory('behavior')}
                  >
                    <Users className="h-5 w-5 mb-2" />
                    Användarbeteende
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => setPerformanceCategory('devices')}
                  >
                    <Monitor className="h-5 w-5 mb-2" />
                    Enheter & Tech
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => setPerformanceCategory('geography')}
                  >
                    <Target className="h-5 w-5 mb-2" />
                    Geografisk
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Back Button */}
              <Button 
                variant="outline" 
                onClick={() => setPerformanceCategory(null)}
                className="mb-4"
              >
                ← Tillbaka till kategorier
              </Button>

              {/* Traffic Källor */}
              {performanceCategory === 'traffic' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Traffic Källor Segment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {gaMetrics.find(m => m.name === 'Kanalsegment')?.segments.length > 0 ? (
                      <div className="space-y-4">
                        {gaMetrics.find(m => m.name === 'Kanalsegment')?.segments.map((segment) => (
                          <div key={segment.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Globe className="h-5 w-5 text-blue-600" />
                              <div>
                                <h3 className="font-medium">{segment.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {segment.sessions} sessioner ({segment.percentage.toFixed(1)}%)
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{segment.users} användare</div>
                              <div className="text-sm text-muted-foreground">
                                Ø {(segment.avgSessionDuration / 60).toFixed(1)}min
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Ingen traffic källdata tillgänglig</p>
                        <p className="text-sm">Kontrollera din Google Analytics integration</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Enheter & Tech */}
              {performanceCategory === 'devices' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      Enhets Segment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {gaMetrics.find(m => m.name === 'Enhetssegment')?.segments.length > 0 ? (
                      <div className="space-y-4">
                        {gaMetrics.find(m => m.name === 'Enhetssegment')?.segments.map((segment) => (
                          <div key={segment.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {segment.id === 'mobile' && <Smartphone className="h-5 w-5 text-green-600" />}
                              {segment.id === 'desktop' && <Monitor className="h-5 w-5 text-blue-600" />}
                              {segment.id === 'tablet' && <Monitor className="h-5 w-5 text-purple-600" />}
                              <div>
                                <h3 className="font-medium">{segment.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {segment.sessions} sessioner ({segment.percentage.toFixed(1)}%)
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{segment.users} användare</div>
                              <div className="text-sm text-muted-foreground">
                                {segment.bounceRate.toFixed(1)}% avhopp
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Ingen enhetsdata tillgänglig</p>
                        <p className="text-sm">Data kommer från Google Analytics</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Användarbeteende */}
              {performanceCategory === 'behavior' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Användarbeteende Segment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {gaMetrics.find(m => m.name === 'Användarbeteende')?.segments.length > 0 ? (
                      <div className="space-y-4">
                        {gaMetrics.find(m => m.name === 'Användarbeteende')?.segments.map((segment) => (
                          <div key={segment.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Users className="h-5 w-5 text-purple-600" />
                              <div>
                                <h3 className="font-medium">{segment.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {segment.sessions} sessioner ({segment.percentage.toFixed(1)}%)
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{segment.users} användare</div>
                              <div className="text-sm text-muted-foreground">
                                {segment.conversionRate.toFixed(2)}% konvertering
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Ingen användarbeteendedata tillgänglig</p>
                        <p className="text-sm">Kontrollera din Google Analytics integration</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Geografisk */}
              {performanceCategory === 'geography' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Geografiska Segment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {gaMetrics.find(m => m.name === 'Geografiska segment')?.segments.length > 0 ? (
                      <div className="space-y-4">
                        {gaMetrics.find(m => m.name === 'Geografiska segment')?.segments.slice(0, 10).map((segment) => (
                          <div key={segment.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Target className="h-5 w-5 text-orange-600" />
                              <div>
                                <h3 className="font-medium">{segment.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {segment.sessions} sessioner ({segment.percentage.toFixed(1)}%)
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{segment.users} användare</div>
                              <div className="text-sm text-muted-foreground">
                                Ø {(segment.avgSessionDuration / 60).toFixed(1)}min
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Ingen geografisk data tillgänglig</p>
                        <p className="text-sm">Kontrollera din Google Analytics integration</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Intäkt Segment
                </div>
                <Badge variant="outline">Välj 3 viktigaste</Badge>
              </CardTitle>
              <CardDescription>
                Analysera intäkter baserat på kundsegment och beteende. Välj de 3 viktigaste segmenten att fokusera på.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* All Available Segments */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Nya kunder', value: 245000, growth: 12.5, priority: 1 },
                    { name: 'Återkommande kunder', value: 380000, growth: 8.2, priority: 2 },
                    { name: 'Premium kunder', value: 125000, growth: 22.1, priority: 3 },
                    { name: 'Mobila användare', value: 195000, growth: 15.8 },
                    { name: 'Desktop användare', value: 285000, growth: 5.4 },
                    { name: 'Organisk trafik', value: 220000, growth: 9.7 },
                    { name: 'Betald trafik', value: 160000, growth: 18.3 },
                    { name: 'Email kampanj', value: 95000, growth: 28.5 },
                    { name: 'Social media', value: 75000, growth: 35.2 }
                  ].map((segment, index) => (
                    <Card 
                      key={segment.name} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        segment.priority ? 'ring-2 ring-primary bg-primary/5' : 'hover:ring-1 hover:ring-muted'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{segment.name}</h4>
                          {segment.priority && (
                            <Badge variant="default" className="text-xs">
                              #{segment.priority}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xl font-bold mb-1">
                          {segment.value.toLocaleString()} kr
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <TrendingUp className="h-3 w-3 text-success" />
                          <span className="text-success font-medium">+{segment.growth}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">
                    De 3 viktigaste segmenten bidrar med <span className="font-bold">750 000 kr</span> av total intäkt
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowPriorityConfig(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Konfigurera prioriterade segment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Anpassade Segment</CardTitle>
              <CardDescription>
                Skapa och hantera dina egna segment baserat på specifika kriterier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fördefinierade segment att välja från */}
              <div>
                <h4 className="font-medium mb-4">Välj segment att aktivera:</h4>
                <div className="space-y-3">
                  {[
                    { id: 'high-value', name: 'Högt värde användare', description: 'Användare med hög konverteringsfrekvens eller långa sessioner' },
                    { id: 'mobile-users', name: 'Mobila användare', description: 'Fokus på mobilupplevelsen' },
                    { id: 'returning-customers', name: 'Återkommande kunder', description: 'Användare som besökt flera gånger' },
                    { id: 'bounce-risk', name: 'Studsningsrisk', description: 'Användare med hög sannolikhet att lämna snabbt' },
                    { id: 'conversion-ready', name: 'Konverteringsklara', description: 'Användare nära köpbeslut' },
                    { id: 'geographic-sweden', name: 'Svenska användare', description: 'Användare från Sverige' },
                    { id: 'weekend-traffic', name: 'Helgtrafik', description: 'Användare som besöker på helger' },
                    { id: 'social-media', name: 'Sociala medier trafik', description: 'Trafik från sociala plattformar' }
                  ].map(segment => (
                    <div key={segment.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id={segment.id}
                        className="h-4 w-4 text-blue-600 rounded"
                        defaultChecked={['high-value', 'mobile-users'].includes(segment.id)}
                      />
                      <label htmlFor={segment.id} className="flex-1 cursor-pointer">
                        <div className="font-medium">{segment.name}</div>
                        <div className="text-sm text-muted-foreground">{segment.description}</div>
                      </label>
                      <Badge variant="outline" className="text-xs">
                        {segment.id === 'high-value' || segment.id === 'mobile-users' ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Skapa eget segment</h4>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nytt segment
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Kombinera olika kriterier för att skapa skräddarsydda segment baserat på användaregenskaper, beteende och konverteringar.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Priority Segment Configuration Dialog */}
      <PrioritySegmentConfig
        open={showPriorityConfig}
        onOpenChange={setShowPriorityConfig}
        onSave={(segments) => {
          setPrioritySegments(segments);
          console.log('Priority segments updated:', segments);
        }}
      />
    </div>
  );
}