import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle, TrendingUp, Bot, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface AIBotSecurityWidgetProps {
  siteId: string;
}

export function AIBotSecurityWidget({ siteId }: AIBotSecurityWidgetProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-bot-behavior-analysis', {
        body: { siteId, days: 7 }
      });

      if (error) throw error;

      setAnalysis(data);
      toast.success('AI-analys klar! Säkerhetshot identifierade.');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Kunde inte köra AI-analys');
    } finally {
      setAnalyzing(false);
    }
  };

  const getThreatLevel = (score: number) => {
    if (score < 30) return { label: 'Låg', color: 'bg-green-500', textColor: 'text-green-700' };
    if (score < 60) return { label: 'Medel', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { label: 'Hög', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>AI Bot Cybersecurity Analysis</CardTitle>
              <CardDescription>
                AI-driven threat detection & behavior analysis
              </CardDescription>
            </div>
          </div>
          <Button 
            onClick={runAnalysis}
            disabled={analyzing}
            className="bg-gradient-primary hover-scale"
          >
            {analyzing ? (
              <>
                <Activity className="mr-2 h-4 w-4 animate-spin" />
                Analyserar...
              </>
            ) : (
              <>
                <Bot className="mr-2 h-4 w-4" />
                Kör AI-Analys
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!analysis ? (
          <div className="text-center py-12">
            <Bot className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Klicka på "Kör AI-Analys" för att få en djupgående säkerhetsanalys av AI-bot trafik
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 max-w-md mx-auto">
              <li>✓ Identifiera hot vs legitim trafik</li>
              <li>✓ Upptäck DDoS & scraping-attacker</li>
              <li>✓ AI-genererade rekommendationer</li>
              <li>✓ Automatisk threat scoring</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Threat Score */}
            <div className="p-6 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">Hotnivå</h3>
                  <p className="text-sm text-muted-foreground">
                    Baserat på {analysis.summary.totalVisits} bot-besök
                  </p>
                </div>
                <Badge className={`${getThreatLevel(analysis.threatScore).color} text-white text-lg px-4 py-2`}>
                  {getThreatLevel(analysis.threatScore).label}
                </Badge>
              </div>
              <Progress value={analysis.threatScore} className="h-3 mb-2" />
              <p className={`text-sm font-semibold ${getThreatLevel(analysis.threatScore).textColor}`}>
                Threat Score: {analysis.threatScore.toFixed(1)}/100
              </p>
            </div>

            {/* Threat Indicators */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Rapid Fire</span>
                    <AlertTriangle className={`h-4 w-4 ${analysis.threatIndicators.rapidFireRequests > 50 ? 'text-red-500' : 'text-yellow-500'}`} />
                  </div>
                  <div className="text-2xl font-bold">{analysis.threatIndicators.rapidFireRequests.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">Requests/minut mönster</p>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">IP Koncentration</span>
                    <AlertTriangle className={`h-4 w-4 ${analysis.threatIndicators.ipConcentration > 70 ? 'text-red-500' : 'text-green-500'}`} />
                  </div>
                  <div className="text-2xl font-bold">{analysis.threatIndicators.ipConcentration.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Från samma IP-range</p>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">URL Scanning</span>
                    <AlertTriangle className={`h-4 w-4 ${analysis.threatIndicators.urlScanningPattern > 60 ? 'text-red-500' : 'text-yellow-500'}`} />
                  </div>
                  <div className="text-2xl font-bold">{analysis.threatIndicators.urlScanningPattern.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">Systematisk skanning</p>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Automation</span>
                    <Bot className={`h-4 w-4 ${analysis.threatIndicators.automationScore > 50 ? 'text-red-500' : 'text-green-500'}`} />
                  </div>
                  <div className="text-2xl font-bold">{analysis.threatIndicators.automationScore.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Automation signals</p>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Headless</span>
                    <Shield className={`h-4 w-4 ${analysis.threatIndicators.headlessRatio > 40 ? 'text-red-500' : 'text-green-500'}`} />
                  </div>
                  <div className="text-2xl font-bold">{analysis.threatIndicators.headlessRatio.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Headless browsers</p>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Unika Botar</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold">{analysis.summary.uniqueBots}</div>
                  <p className="text-xs text-muted-foreground">Bot-typer identifierade</p>
                </CardContent>
              </Card>
            </div>

            {/* AI Analysis */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>AI-Genererad Säkerhetsanalys</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {analysis.aiAnalysis}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">
                <Shield className="mr-2 h-4 w-4" />
                Blockera Hot-IP
              </Button>
              <Button variant="outline" className="flex-1">
                <Bot className="mr-2 h-4 w-4" />
                Uppdatera Robots.txt
              </Button>
              <Button variant="outline" className="flex-1">
                <Activity className="mr-2 h-4 w-4" />
                Aktivera Rate Limiting
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
