import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, TrendingUp, FileText, Route, Monitor, Target, ClipboardList } from "lucide-react";
import { useAIBotTracking } from "@/hooks/useAIBotTracking";
import { useAIAgentJourney } from "@/hooks/useAIAgentJourney";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AIBotSecurityWidget } from "@/components/dashboard/AIBotSecurityWidget";
import { AIAgentFunnel } from "@/components/dashboard/AIAgentFunnel";
import { AIBrowserTypeBreakdown } from "@/components/dashboard/AIBrowserTypeBreakdown";
import { AgentRegistry } from "@/components/dashboard/AgentRegistry";
import { BotTrafficClassification } from "@/components/dashboard/BotTrafficClassification";
interface AIBotTabProps {
  selectedSite: {
    id: string;
    tracking_id: string;
    domain: string;
  };
}

export const AIBotTab = ({ selectedSite }: AIBotTabProps) => {
  const [days, setDays] = useState(30);
  const { data, isLoading, error } = useAIBotTracking(selectedSite?.id, days);
  const { data: journeyData, isLoading: journeyLoading } = useAIAgentJourney(selectedSite?.id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading AI bot data: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  const isEmpty = !data || data.totalTraffic === 0;

  return (
    <div className="space-y-6">
      {/* AI Security Widget */}
      <AIBotSecurityWidget siteId={selectedSite.id} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">AI Bot Intelligence</h2>
          <p className="text-muted-foreground mt-1">
            Spåra AI-agents, deras resor och konverteringar
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Senaste 7 dagarna</SelectItem>
              <SelectItem value="30">Senaste 30 dagarna</SelectItem>
              <SelectItem value="90">Senaste 90 dagarna</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="flex items-center gap-2">
            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            Live Monitoring
          </Badge>
        </div>
      </div>

      {/* Installation Instructions */}
      {isEmpty && (
        <Alert>
          <Bot className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">No AI bot activity detected yet</p>
              <p>Installera det kombinerade AI-tracking scriptet på din webbplats:</p>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto mt-2">
{`<script 
  src="${window.location.origin}/ai-tracking-unified.js"
  data-site-id="${selectedSite.id}"
  data-supabase-url="https://cxmkdtgfocgbfizawlwa.supabase.co"
  defer>
</script>`}
              </pre>
              <p className="text-sm text-muted-foreground mt-2">
                Lägg till scriptet i &lt;head&gt;-sektionen. Data visas när AI-bottar och AI-söktrafik besöker din webbplats.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Översikt
          </TabsTrigger>
          <TabsTrigger value="journey" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            Agent Journey
          </TabsTrigger>
          <TabsTrigger value="browser-types" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Browser Detection
          </TabsTrigger>
          <TabsTrigger value="registry" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Agent Registry
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total LLM Traffic</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.totalTraffic.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data?.botBreakdown.length || 0} unique AI models
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Citation Requests</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.citationRequests.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data && data.totalTraffic > 0 
                    ? `${Math.round((data.citationRequests / data.totalTraffic) * 100)}% of LLM traffic`
                    : '0% of LLM traffic'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Training Crawlers</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.trainingCrawlers.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data && data.totalTraffic > 0 
                    ? `${((data.trainingCrawlers / data.totalTraffic) * 100).toFixed(1)}% of LLM traffic`
                    : '0% of LLM traffic'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Agent Conversions</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{journeyData?.conversions || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {journeyData?.conversionRate.toFixed(1) || 0}% konverteringsgrad
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Bot Traffic Classification */}
          {!isEmpty && data && (
            <BotTrafficClassification
              botBreakdown={data.botBreakdown}
              totalTraffic={data.totalTraffic}
              trainingCrawlers={data.trainingCrawlers}
            />
          )}

          {/* Bot Breakdown */}
          {!isEmpty && data && data.botBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>AI Bot Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.botBreakdown.map((bot) => (
                    <div key={bot.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{bot.name}</p>
                          <p className="text-sm text-muted-foreground">{bot.count} visits</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{bot.percentage.toFixed(1)}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top URLs */}
          {!isEmpty && data && data.topUrls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Most Visited Pages by AI Bots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.topUrls.map((page, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                      <p className="text-sm truncate flex-1">{page.url}</p>
                      <Badge variant="outline">{page.visits} visits</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Journey Tab */}
        <TabsContent value="journey" className="space-y-6">
          {journeyLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <>
              {/* Journey Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Agent Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{journeyData?.totalSessions || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Snitt sidor/session</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{journeyData?.avgPagesPerSession.toFixed(1) || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Snitt assets/session</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{journeyData?.avgAssetsPerSession.toFixed(1) || 0}</div>
                    <p className="text-xs text-muted-foreground">CSS, JS, images, fonts</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Når konvertering</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-500">{journeyData?.conversionRate.toFixed(1) || 0}%</div>
                  </CardContent>
                </Card>
              </div>

              {/* Funnel Visualization */}
              <AIAgentFunnel 
                funnel={journeyData?.funnel || []} 
                totalSessions={journeyData?.totalSessions || 0}
              />

              {/* Key Insight */}
              <Alert>
                <Route className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold">Varför är detta viktigt?</p>
                  <p className="text-sm mt-1">
                    Råa request-volymer är en "vanity metric". Den verkliga insikten ligger i att följa 
                    agenternas väg genom sajten till konverteringssidan. Om många requests inte når 
                    konverteringsvägen vet du att resan är trasig för AI-agenter.
                  </p>
                </AlertDescription>
              </Alert>
            </>
          )}
        </TabsContent>

        {/* Browser Types Tab */}
        <TabsContent value="browser-types" className="space-y-6">
          {journeyLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <>
              <AIBrowserTypeBreakdown 
                breakdown={journeyData?.browserTypeBreakdown || []}
                totalSessions={journeyData?.totalSessions || 0}
              />

              {/* Explanation */}
              <Card>
                <CardHeader>
                  <CardTitle>Varför spelar browser-typ roll?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <h4 className="font-medium text-green-700 dark:text-green-400">Visual Browser</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Accepterar cookies ~78% av tiden. Syns i GA4 men skapar konstiga metrics 
                        (desktop-trafik, Chrome-uppsving, udda engagement).
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <h4 className="font-medium text-amber-700 dark:text-amber-400">Headless Browser</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Exekverar JavaScript men renderar inte visuellt. Används ofta för 
                        automation och training crawlers. Kan detekteras via webdriver-signaler.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <h4 className="font-medium text-blue-700 dark:text-blue-400">Text-based Browser</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Helt osynlig för cookie-baserad analytics. Kan INTE spåras av GA4.
                        Kräver server-side eller bot log-analys.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Agent Registry Tab */}
        <TabsContent value="registry" className="space-y-6">
          <AgentRegistry siteId={selectedSite.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
