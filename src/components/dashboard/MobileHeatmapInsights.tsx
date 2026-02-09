import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Smartphone, Hand, Zap, Timer, Target, TrendingUp } from 'lucide-react';
import type { HeatmapPoint } from '@/types/dashboard';

interface MobileHeatmapInsightsProps {
  heatmapData: HeatmapPoint[];
  loading?: boolean;
}

export function MobileHeatmapInsights({ heatmapData, loading }: MobileHeatmapInsightsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobilanalys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter mobile-only data
  const mobileData = heatmapData.filter(point => 
    point.device_type?.toLowerCase() === 'mobile' || point.is_touch_device
  );

  if (mobileData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobilanalys
          </CardTitle>
          <CardDescription>Ingen mobildata tillgänglig</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Inga mobilinteraktioner hittades för den valda tidsperioden.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate mobile-specific metrics
  const totalMobileInteractions = mobileData.reduce((sum, point) => sum + point.intensity, 0);
  
  // Device brand analysis
  const brandCounts = mobileData.reduce((acc, point) => {
    const brand = point.mobile_device_brand || 'Okänd';
    acc[brand] = (acc[brand] || 0) + point.intensity;
    return acc;
  }, {} as Record<string, number>);

  // OS analysis
  const osCounts = mobileData.reduce((acc, point) => {
    const os = point.operating_system || 'Okänt';
    acc[os] = (acc[os] || 0) + point.intensity;
    return acc;
  }, {} as Record<string, number>);

  // Touch vs click analysis
  const touchInteractions = mobileData.filter(p => p.is_touch_device).reduce((sum, p) => sum + p.intensity, 0);
  const touchPercentage = totalMobileInteractions > 0 ? Math.round((touchInteractions / totalMobileInteractions) * 100) : 0;

  // Touch force analysis (for devices that support it)
  const touchForceData = mobileData.filter(p => p.touch_force && p.touch_force > 0);
  const avgTouchForce = touchForceData.length > 0 
    ? touchForceData.reduce((sum, p) => sum + (p.touch_force || 0), 0) / touchForceData.length 
    : 0;

  // Top brands sorted by interactions
  const topBrands = Object.entries(brandCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Top OS sorted by interactions  
  const topOS = Object.entries(osCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-blue-600" />
          Mobilanalys
        </CardTitle>
        <CardDescription>
          Detaljerad analys av mobilanvändning och touch-interaktioner
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Touch vs Click Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Hand className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-sm font-medium text-blue-800">{totalMobileInteractions}</div>
              <div className="text-xs text-blue-600">Totala mobil-interaktioner</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Target className="h-4 w-4 text-green-600" />
            <div>
              <div className="text-sm font-medium text-green-800">{touchPercentage}%</div>
              <div className="text-xs text-green-600">Touch-interaktioner</div>
            </div>
          </div>
          {avgTouchForce > 0 && (
            <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <Zap className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-sm font-medium text-purple-800">{avgTouchForce.toFixed(1)}</div>
                <div className="text-xs text-purple-600">Genomsnittlig touch-kraft</div>
              </div>
            </div>
          )}
        </div>

        {/* Device Brands */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Populäraste mobil-märken
          </h4>
          <div className="space-y-2">
            {topBrands.map(([brand, count], index) => {
              const percentage = Math.round((count / totalMobileInteractions) * 100);
              return (
                <div key={brand} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      #{index + 1} {brand}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{count} interaktioner</span>
                      <Badge variant="secondary">{percentage}%</Badge>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Operating Systems */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Operativsystem
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {topOS.map(([os, count]) => {
              const percentage = Math.round((count / totalMobileInteractions) * 100);
              return (
                <div key={os} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                  <span className="text-sm font-medium">{os}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{count}</span>
                    <Badge variant="outline">{percentage}%</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile-specific insights */}
        <div className="bg-muted/20 p-4 rounded-lg space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-orange-500" />
            Mobil-insights
          </h4>
          <div className="text-sm text-muted-foreground space-y-1">
            {touchPercentage > 80 && (
              <p>✅ Hög touch-användning ({touchPercentage}%) indikerar god mobil-optimering</p>
            )}
            {touchPercentage < 50 && (
              <p>⚠️ Låg touch-användning ({touchPercentage}%) kan indikera problem med mobil-UX</p>
            )}
            {topBrands[0] && topBrands[0][1] / totalMobileInteractions > 0.6 && (
              <p>📱 Stark dominans av {topBrands[0][0]} ({Math.round((topBrands[0][1] / totalMobileInteractions) * 100)}%)</p>
            )}
            {avgTouchForce > 0 && (
              <p>💪 Force Touch-data tillgänglig (genomsnitt: {avgTouchForce.toFixed(1)})</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}