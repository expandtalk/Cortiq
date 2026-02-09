import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, Users, Clock, DollarSign, Eye, MousePointer } from 'lucide-react';
import type { Site } from '@/types/dashboard';

interface GoogleSiteKitData {
  searchConsole: {
    totalClicks: number;
    totalImpressions: number;
    averageCTR: number;
    averagePosition: number;
    topQueries: Array<{ query: string; clicks: number; impressions: number }>;
  };
  analytics: {
    sessions: number;
    users: number;
    pageviews: number;
    bounceRate: number;
    sessionDuration: number;
  };
  pagespeed: {
    mobileScore: number;
    desktopScore: number;
    fcp: number;
    lcp: number;
  };
  adsense?: {
    revenue: number;
    impressions: number;
    clicks: number;
    ctr: number;
  };
}

interface GoogleSiteKitDashboardProps {
  selectedSite: Site;
  apiKey: string;
}

export function GoogleSiteKitDashboard({ selectedSite, apiKey }: GoogleSiteKitDashboardProps) {
  const [data, setData] = useState<GoogleSiteKitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey || !selectedSite) {
      setLoading(false);
      return;
    }

    const fetchGoogleData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/functions/v1/google-sitekit-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            siteUrl: selectedSite.domain,
            apiKey: apiKey,
            propertyId: localStorage.getItem('google-property-id') || null
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Google APIs error: ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }

        setData({
          searchConsole: result.searchConsole,
          analytics: result.analytics,
          pagespeed: result.pagespeed,
          adsense: result.adsense
        });
      } catch (err) {
        console.error('Google APIs error:', err);
        setError(err instanceof Error ? err.message : 'Okänt fel vid hämtning av Google APIs data');
      } finally {
        setLoading(false);
      }
    };

    fetchGoogleData();
  }, [apiKey, selectedSite]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Hämtar data från Google Site Kit...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>Ingen data tillgänglig från Google APIs. Kontrollera att API-nyckeln är korrekt och att webbplatsen är verifierad i Search Console.</AlertDescription>
      </Alert>
    );
  }

  const getSpeedBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        <h3 className="text-xl font-semibold">Google APIs Dashboard</h3>
        <Badge variant="outline">Live data</Badge>
      </div>

      {/* Search Console */}
      <Card>
        <CardHeader>
          <CardTitle>Search Console (Senaste 30 dagarna)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MousePointer className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Klick</span>
              </div>
              <div className="text-2xl font-bold">{data.searchConsole.totalClicks.toLocaleString()}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Visningar</span>
              </div>
              <div className="text-2xl font-bold">{data.searchConsole.totalImpressions.toLocaleString()}</div>
            </div>
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">CTR</span>
              <div className="text-2xl font-bold">{data.searchConsole.averageCTR}%</div>
            </div>
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Genomsnittlig position</span>
              <div className="text-2xl font-bold">{data.searchConsole.averagePosition}</div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-semibold mb-3">Toppfrågor</h4>
            <div className="space-y-2">
              {data.searchConsole.topQueries.map((query, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                  <span className="font-medium">{query.query}</span>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{query.clicks} klick</span>
                    <span>{query.impressions} visningar</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics & PageSpeed */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Google Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Sessioner</span>
                </div>
                <div className="text-xl font-bold">{data.analytics.sessions.toLocaleString()}</div>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Användare</span>
                <div className="text-xl font-bold">{data.analytics.users.toLocaleString()}</div>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Sidvisningar</span>
                <div className="text-xl font-bold">{data.analytics.pageviews.toLocaleString()}</div>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Studsfrekvens</span>
                <div className="text-xl font-bold">{data.analytics.bounceRate}%</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Genomsnittlig sessionslängd</span>
              </div>
              <div className="text-xl font-bold">
                {Math.floor(data.analytics.sessionDuration / 60)}m {data.analytics.sessionDuration % 60}s
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PageSpeed Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Mobil</span>
                <Badge variant={getSpeedBadgeVariant(data.pagespeed.mobileScore)}>
                  {data.pagespeed.mobileScore}/100
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Desktop</span>
                <Badge variant={getSpeedBadgeVariant(data.pagespeed.desktopScore)}>
                  {data.pagespeed.desktopScore}/100
                </Badge>
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">First Contentful Paint</span>
                  <span className="text-sm font-medium">{data.pagespeed.fcp}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Largest Contentful Paint</span>
                  <span className="text-sm font-medium">{data.pagespeed.lcp}s</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AdSense */}
      {data.adsense && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              AdSense Intäkter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Intäkter</span>
                <div className="text-2xl font-bold">${data.adsense.revenue}</div>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Visningar</span>
                <div className="text-2xl font-bold">{data.adsense.impressions.toLocaleString()}</div>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Klick</span>
                <div className="text-2xl font-bold">{data.adsense.clicks}</div>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">CTR</span>
                <div className="text-2xl font-bold">{data.adsense.ctr}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}