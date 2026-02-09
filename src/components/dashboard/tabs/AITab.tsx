import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bot, Brain, Lightbulb, TrendingUp, TrendingDown, BarChart3, Users, MousePointer, DollarSign, Clock, Zap } from 'lucide-react';
import { useAITraffic } from '@/hooks/useAITraffic';
import { useAISearchTraffic } from '@/hooks/useAISearchTraffic';
import type { Site } from '@/types/dashboard';

interface AITabProps {
  selectedSite: Site;
}

export function AITab({ selectedSite }: AITabProps) {
  const [timeRange, setTimeRange] = useState('30');
  
  // Try native AI search tracking first (cookiefree, independent)
  const nativeResult = useAISearchTraffic(selectedSite?.id, parseInt(timeRange));
  
  // Fallback to GA4 if native has no data (requires GA4 integration)
  const ga4Result = useAITraffic(selectedSite.id, parseInt(timeRange));
  
  // Use native data if available and has sessions
  const hasNativeData = nativeResult.data && nativeResult.data.totalSessions > 0;
  const useNative = hasNativeData;
  
  const loading = useNative ? nativeResult.isLoading : ga4Result.loading;
  const error = useNative ? (nativeResult.error?.message || null) : ga4Result.error;
  
  // Normalize data structure
  const data = useNative && nativeResult.data ? {
    totalSessions: nativeResult.data.totalSessions,
    totalUsers: nativeResult.data.totalUsers,
    totalPageviews: nativeResult.data.totalPageviews,
    bounceRate: nativeResult.data.bounceRate,
    avgSessionDuration: nativeResult.data.avgSessionDuration,
    conversionRate: nativeResult.data.conversionRate,
    platforms: nativeResult.data.platforms,
    topLandingPages: nativeResult.data.topLandingPages,
    dailyTrend: nativeResult.data.dailyTrend
  } : ga4Result.data;
  
  // Calculate metrics
  const topPlatform = data?.platforms?.[0] ? {
    platform: (data.platforms[0] as any).name || (data.platforms[0] as any).platform || 'Unknown',
    sessions: data.platforms[0].sessions
  } : null;
  
  const growthTrend = 0; // Could calculate from dailyTrend if needed
  const conversionRate = (data as any)?.conversionRate || 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Bot className="h-6 w-6 text-primary animate-pulse" />
          <h2 className="text-2xl font-bold">AI-trafikanalys</h2>
          {useNative && (
            <Badge variant="secondary" className="text-xs">Cookiefri tracking</Badge>
          )}
        </div>
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>{useNative ? 'Hämtar cookiefri AI-trafikdata...' : 'Hämtar AI-trafikdata från Google Analytics...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Bot className="h-6 w-6 text-destructive" />
          <h2 className="text-2xl font-bold">AI-trafikanalys</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <p className="text-muted-foreground text-sm">
                Kontrollera att Google Analytics är korrekt konfigurerat för denna webbplats.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">AI-trafikanalys</h2>
          {useNative && (
            <Badge variant="default" className="text-xs">
              🔒 Cookiefri tracking
            </Badge>
          )}
          {!useNative && (
            <Badge variant="outline" className="text-xs">
              GA4-integration
            </Badge>
          )}
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Senaste 7 dagarna</SelectItem>
            <SelectItem value="30">Senaste 30 dagarna</SelectItem>
            <SelectItem value="90">Senaste 90 dagarna</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totala Sessioner</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalSessions || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {useNative ? (
                <span>Cookiefri spårning</span>
              ) : growthTrend >= 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  {Math.abs(growthTrend).toFixed(1)}% från föregående period
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  {Math.abs(growthTrend).toFixed(1)}% från föregående period
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unika Användare</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Från AI-plattformar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konverteringsgrad</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              Från AI-trafik
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bästa Plattform</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{topPlatform?.platform || 'Ingen data'}</div>
            <p className="text-xs text-muted-foreground">
              {topPlatform?.sessions || 0} sessioner
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Platforms Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-plattformar
          </CardTitle>
          <CardDescription>
            Trafik från olika AI-verktyg och chatbots
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.platforms && data.platforms.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plattform</TableHead>
                  <TableHead className="text-right">Sessioner</TableHead>
                  <TableHead className="text-right">Användare</TableHead>
                  <TableHead className="text-right">Konverteringar</TableHead>
                  <TableHead className="text-right">Engagemang</TableHead>
                  <TableHead className="text-right">Genomsn. tid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.platforms.map((platform, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {(platform as any).name || (platform as any).platform}
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Top
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{platform.sessions}</TableCell>
                    <TableCell className="text-right">{platform.users}</TableCell>
                    <TableCell className="text-right">{useNative ? 'N/A' : (platform as any).conversions || 0}</TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant={
                          useNative 
                            ? ((platform as any).bounceRate < 40 ? "default" : (platform as any).bounceRate < 60 ? "secondary" : "outline")
                            : ((platform as any).engagementRate > 0.6 ? "default" : (platform as any).engagementRate > 0.3 ? "secondary" : "outline")
                        }
                        className="text-xs"
                      >
                        {useNative ? `${((platform as any).bounceRate).toFixed(1)}% bounce` : `${((platform as any).engagementRate * 100).toFixed(1)}%`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(platform.avgDuration)}s
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Ingen AI-trafik upptäckt</p>
              <p className="text-muted-foreground text-sm mb-4">
                Vi hittade ingen trafik från kända AI-plattformar under den valda perioden.
              </p>
              <div className="text-xs text-muted-foreground">
                <p>Spårade plattformar: ChatGPT, Perplexity, Claude, Gemini, Copilot, Meta AI</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Landing Pages */}
      {data?.topLandingPages && data.topLandingPages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Populäraste landningssidor från AI
            </CardTitle>
            <CardDescription>
              Sidor som AI-användare besöker först
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sida</TableHead>
                  <TableHead className="text-right">Sessioner</TableHead>
                  <TableHead className="text-right">Användare</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topLandingPages.slice(0, 5).map((page, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm max-w-md truncate">
                      {page.page}
                    </TableCell>
                    <TableCell className="text-right">{page.sessions}</TableCell>
                    <TableCell className="text-right">{page.users}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI-trafikinsikter
          </CardTitle>
          <CardDescription>
            Automatisk analys av din AI-trafik
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Trafikmönster</h4>
              {data?.totalSessions && data.totalSessions > 0 ? (
                <p className="text-sm text-muted-foreground">
                  {useNative ? 
                    `${topPlatform?.platform || 'ChatGPT'} är din främsta AI-källa med ${((topPlatform?.sessions || 0) / data.totalSessions * 100).toFixed(1)}% av all AI-trafik. Data spåras cookiefritt och GDPR-kompatibelt.` :
                    `${topPlatform?.platform || 'ChatGPT'} är din främsta AI-källa med ${((topPlatform?.sessions || 0) / data.totalSessions * 100).toFixed(1)}% av all AI-trafik.${growthTrend > 0 ? ` AI-trafiken växer med ${growthTrend.toFixed(1)}% jämfört med föregående period.` : ''}`
                  }
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ingen AI-trafik upptäckt än. {useNative ? 'Installera tracking-scriptet för att börja spåra AI-trafik cookiefritt.' : 'AI-användare hittar ofta webbplatser genom att fråga chatbots om rekommendationer.'}
                </p>
              )}
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Engagemang</h4>
              {data?.totalSessions && data.totalSessions > 0 ? (
                <p className="text-sm text-muted-foreground">
                  {useNative ? 
                    `AI-användare har ${((data as any).bounceRate || 0).toFixed(1)}% bounce rate och spenderar i genomsnitt ${Math.round((data as any).avgSessionDuration || 0)} sekunder på sajten.${(data as any).bounceRate < 50 ? ' Detta är bra engagemang!' : ''}` :
                    (data as any).summary && (data as any).summary.averageEngagementRate > 0 ? 
                      `AI-användare har ${((data as any).summary.averageEngagementRate * 100).toFixed(1)}% engagemang och spenderar i genomsnitt ${Math.round((data as any).summary.averageSessionDuration)} sekunder på sajten.${(data as any).summary.averageEngagementRate > 0.5 ? ' Detta är högt engagemang!' : ''}` :
                      'AI-användare är ofta mycket målinriktade och söker specifik information.'
                  }
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  AI-användare är ofta mycket målinriktade och söker specifik information. Optimera för snabba svar på vanliga frågor.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}