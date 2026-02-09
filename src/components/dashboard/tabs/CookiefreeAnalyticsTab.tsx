import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Eye, 
  Clock, 
  MousePointer, 
  Smartphone, 
  Globe, 
  TrendingUp, 
  Shield,
  Info,
  BarChart3,
  PieChart,
  Activity,
  Target,
  FileText
} from 'lucide-react';
import { useCookiefreeAnalytics } from '@/hooks/useCookiefreeAnalytics';
import { ServerLogImporter } from '@/components/dashboard/ServerLogImporter';
import { ServerLogAnalytics } from '@/components/dashboard/ServerLogAnalytics';
import type { Site } from '@/types/dashboard';
import { subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';

interface CookiefreeAnalyticsTabProps {
  selectedSite: Site;
  dateRange?: DateRange;
}

export function CookiefreeAnalyticsTab({ selectedSite, dateRange }: CookiefreeAnalyticsTabProps) {
  const [localRange, setLocalRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  // Use global dateRange if provided, else local
  const activeRange = dateRange && dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : localRange;
  const today = new Date();
  const clampedRange = {
    from: new Date(Math.min(activeRange.from.getTime(), today.getTime())),
    to: new Date(Math.min(activeRange.to.getTime(), today.getTime()))
  };

  const { data: analytics, isLoading, error } = useCookiefreeAnalytics(selectedSite?.id, clampedRange);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Analyserar cookiefri data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Ett fel uppstod vid hämtning av cookiefri analys: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!analytics) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Ingen data tillgänglig för den valda tidsperioden.
        </AlertDescription>
      </Alert>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('sv-SE').format(num);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-green-600" />
              Cookiefri Analys
            </h2>
            <p className="text-muted-foreground">
              GDPR-fri statistik för alla besökare - ingen cookie-banner påverkan
            </p>
          </div>
          {(!dateRange) && (
            <DateRangePicker
              dateRange={localRange}
              onDateRangeChange={(range) => {
                if (range?.from && range?.to) {
                  setLocalRange({ from: range.from, to: range.to });
                }
              }}
            />
          )}
        </div>

        {/* Period Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Vad mäts:</strong> Server-side tracking baserat på anonymiserade IP-hasher och user agent fingerprints. 
            Ingen personlig data lagras och inget consent krävs enligt GDPR.
            <br />
            <strong>Period:</strong> {analytics.period.days} dagar ({analytics.period.startDate} till {analytics.period.endDate})
          </AlertDescription>
        </Alert>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="banner">Cookie Banner</TabsTrigger>
          <TabsTrigger value="audience">Målgrupp</TabsTrigger>
          <TabsTrigger value="content">Innehåll</TabsTrigger>
          <TabsTrigger value="serverlogs">
            <FileText className="h-4 w-4 mr-1" />
            Server-loggar
          </TabsTrigger>
          <TabsTrigger value="impact">GDPR-påverkan</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totala Sidvisningar</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.totalPageViews)}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(analytics.totalPageViews / analytics.period.days)} per dag
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unika Besökare</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.uniqueVisitors)}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(analytics.uniqueVisitors / analytics.period.days)} per dag
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sessioner</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.totalSessions)}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.avgPagesPerSession} sidor/session
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sessionslängd</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(analytics.avgSessionDuration)}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.bounceRate}% avvisningsfrekvens
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Trafikkällor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.referralSources)
                  .sort(([,a], [,b]) => b - a)
                  .map(([source, count]) => {
                    const percentage = (count / analytics.totalSessions * 100);
                    return (
                      <div key={source} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{source}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cookie Banner Tab */}
        <TabsContent value="banner" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Banner Visningar</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.totalBannerViews)}</div>
                <p className="text-xs text-muted-foreground">
                  {((analytics.totalBannerViews / analytics.totalSessions) * 100).toFixed(1)}% av sessioner
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accepterar Alla</CardTitle>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {analytics.acceptanceRate}%
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.acceptedAll)}</div>
                <Progress value={analytics.acceptanceRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avvisar Alla</CardTitle>
                <Badge variant="destructive">
                  {analytics.rejectionRate}%
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.rejectedAll)}</div>
                <Progress value={analytics.rejectionRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Anpassade Val</CardTitle>
                <Badge variant="outline">
                  {analytics.selectiveRate}%
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.selectiveAccept)}</div>
                <Progress value={analytics.selectiveRate} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              <strong>Cookie Banner Insikter:</strong> {analytics.acceptanceRate}% av användarna accepterar alla cookies, 
              medan {analytics.rejectionRate}% avvisar. {analytics.selectiveRate}% gör anpassade val. 
              Detta påverkar kvaliteten på traditionell analytics-data.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Enhetsfördelning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(analytics.deviceBreakdown).map(([device, count]) => {
                  const percentage = (count / analytics.totalSessions * 100);
                  return (
                    <div key={device} className="flex items-center justify-between">
                      <span className="capitalize">{device}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm w-12 text-right">{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Browser Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Webbläsare
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(analytics.browserBreakdown)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([browser, count]) => {
                    const percentage = (count / analytics.totalSessions * 100);
                    return (
                      <div key={browser} className="flex items-center justify-between">
                        <span className="text-sm">{browser}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm w-12 text-right">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>

            {/* OS Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Operativsystem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(analytics.osBreakdown)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([os, count]) => {
                    const percentage = (count / analytics.totalSessions * 100);
                    return (
                      <div key={os} className="flex items-center justify-between">
                        <span className="text-sm">{os}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm w-12 text-right">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Populäraste Sidor
              </CardTitle>
              <CardDescription>
                De mest besökta sidorna baserat på cookiefri data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topPages.map((page, index) => (
                  <div key={page.url} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{page.title || page.url}</p>
                      <p className="text-sm text-muted-foreground truncate">{page.url}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatNumber(page.views)} visningar</p>
                      <p className="text-sm text-muted-foreground">
                        ⌀ {formatDuration(page.avgTime)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Server Logs Tab */}
        <TabsContent value="serverlogs" className="space-y-6">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>Server-loggfiler för cookiefree analytics:</strong> Importera dina server-loggar (Apache/Nginx) 
              för att analysera trafik utan cookies. IP-adresser anonymiseras omedelbart vid import.
            </AlertDescription>
          </Alert>

          {/* Server Log Importer */}
          <ServerLogImporter siteId={selectedSite.id} />

          {/* Server Log Analytics */}
          <ServerLogAnalytics 
            siteId={selectedSite.id} 
            dateRange={clampedRange}
          />
        </TabsContent>

        {/* GDPR Impact Tab */}
        <TabsContent value="impact" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uppskattad Total Trafik</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.estimatedTotalSessions)}</div>
                <p className="text-xs text-muted-foreground">
                  Inkluderar ej-consented användare
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Förlorad Data</CardTitle>
                <Badge variant="destructive">
                  {analytics.dataLossPercentage}%
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.estimatedLostData)}</div>
                <p className="text-xs text-muted-foreground">
                  Sessioner utan detaljerad tracking
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consent Rate</CardTitle>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {analytics.consentRate}%
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.consentRate}%</div>
                <Progress value={analytics.consentRate} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>GDPR-påverkan på data:</strong> Av den uppskattade totala trafiken på {formatNumber(analytics.estimatedTotalSessions)} sessioner 
              saknar vi detaljerad tracking-data för {formatNumber(analytics.estimatedLostData)} sessioner ({analytics.dataLossPercentage}%) 
              på grund av GDPR-regler. Cookiefri analys ger dock fortfarande värdefull grundstatistik för alla användare.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Rekommendationer för Förbättring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm">Förbättra Cookie Banner Acceptance</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Med {analytics.acceptanceRate}% acceptance rate finns potential att öka till 70-80% genom bättre UX och tydligare värdeproposition.
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm">Komplettera med Privacy-First Analytics</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Överväg Plausible, Umami eller liknande för detaljerad analytics utan cookies.
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm">Server-Side Tracking</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Implementera server-side Google Analytics för bättre data coverage med GDPR-compliance.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}