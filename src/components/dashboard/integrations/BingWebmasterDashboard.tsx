import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, MousePointer, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Site } from '@/types/dashboard';

interface BingWebmasterData {
  searchPerformance: {
    totalClicks: number;
    totalImpressions: number;
    averageCTR: number;
    averagePosition: number;
    topQueries: Array<{ query: string; clicks: number; impressions: number }>;
  };
  indexingStatus: {
    totalPages: number;
    indexedPages: number;
    blockedPages: number;
    errorsCount: number;
  };
  crawlStats: {
    crawlRequests: number;
    crawlErrors: number;
    lastCrawl: string;
  };
  siteHealth: {
    score: number;
    issues: Array<{ type: string; count: number; severity: 'low' | 'medium' | 'high' }>;
  };
}

interface BingWebmasterDashboardProps {
  selectedSite: Site;
  apiKey: string;
}

export function BingWebmasterDashboard({ selectedSite, apiKey }: BingWebmasterDashboardProps) {
  const [data, setData] = useState<BingWebmasterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey || !selectedSite) {
      setLoading(false);
      return;
    }

    const fetchBingData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/functions/v1/bing-webmaster-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            siteUrl: selectedSite.domain,
            apiKey: apiKey
          })
        });

        if (!response.ok) {
          throw new Error('Kunde inte hämta data från Bing Webmaster Tools API');
        }

        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }

        setData({
          searchPerformance: result.searchPerformance,
          indexingStatus: result.indexingStatus,
          crawlStats: result.crawlStats,
          siteHealth: result.siteHealth
        });
      } catch (err) {
        console.error('Bing Webmaster API error:', err);
        setError(err instanceof Error ? err.message : 'Okänt fel vid hämtning av Bing data');
      } finally {
        setLoading(false);
      }
    };

    fetchBingData();
  }, [apiKey, selectedSite]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Hämtar data från Bing Webmaster Tools...</span>
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
        <AlertDescription>Ingen data tillgänglig från Bing Webmaster Tools.</AlertDescription>
      </Alert>
    );
  }

  const getSeverityBadge = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low': return 'secondary';
      case 'medium': return 'outline';
      case 'high': return 'destructive';
      default: return 'secondary';
    }
  };

  const getHealthBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Search className="h-5 w-5" />
        <h3 className="text-xl font-semibold">Bing Webmaster Tools Dashboard</h3>
        <Badge variant="outline">Live data</Badge>
      </div>

      {/* Search Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Sökprestanda i Bing (Senaste 30 dagarna)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MousePointer className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Klick</span>
              </div>
              <div className="text-2xl font-bold">{data.searchPerformance.totalClicks.toLocaleString()}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Visningar</span>
              </div>
              <div className="text-2xl font-bold">{data.searchPerformance.totalImpressions.toLocaleString()}</div>
            </div>
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">CTR</span>
              <div className="text-2xl font-bold">{data.searchPerformance.averageCTR}%</div>
            </div>
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Genomsnittlig position</span>
              <div className="text-2xl font-bold">{data.searchPerformance.averagePosition}</div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-semibold mb-3">Toppfrågor i Bing</h4>
            <div className="space-y-2">
              {data.searchPerformance.topQueries.map((query, index) => (
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

      {/* Indexing & Site Health */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Indexeringsstatus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Totalt antal sidor</span>
                <span className="font-bold">{data.indexingStatus.totalPages}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Indexerade sidor</span>
                </div>
                <span className="font-bold text-green-600">{data.indexingStatus.indexedPages}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Blockerade sidor</span>
                <span className="font-bold">{data.indexingStatus.blockedPages}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-muted-foreground">Fel</span>
                </div>
                <span className="font-bold text-red-600">{data.indexingStatus.errorsCount}</span>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h5 className="font-semibold mb-2">Crawling-statistik</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Crawl-förfrågningar</span>
                  <span>{data.crawlStats.crawlRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Crawl-fel</span>
                  <span className="text-red-600">{data.crawlStats.crawlErrors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Senaste crawl</span>
                  <span>{data.crawlStats.lastCrawl}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Webbplatshälsa
              <Badge variant={getHealthBadgeVariant(data.siteHealth.score)}>
                {data.siteHealth.score}/100
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h5 className="font-semibold">Identifierade problem</h5>
              {data.siteHealth.issues.map((issue, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${
                      issue.severity === 'high' ? 'text-red-600' : 
                      issue.severity === 'medium' ? 'text-yellow-600' : 
                      'text-gray-600'
                    }`} />
                    <span className="text-sm">{issue.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{issue.count}</span>
                    <Badge variant={getSeverityBadge(issue.severity)} className="text-xs">
                      {issue.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}