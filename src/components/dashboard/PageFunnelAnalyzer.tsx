import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageSelector } from '@/components/dashboard/PageSelector';
import { 
  Users, 
  MousePointer, 
  Send, 
  TrendingDown, 
  TrendingUp, 
  Eye,
  FormInput,
  Phone,
  ArrowRight,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FunnelData {
  pageVisits: number;
  formStarts: number;
  formSubmissions: number;
  phoneClicks: number;
  emailClicks: number;
  totalClicks: number;
  conversionRate: number;
  dropoffRate: number;
}

interface PageFunnelAnalyzerProps {
  siteId: string;
}

export function PageFunnelAnalyzer({ siteId }: PageFunnelAnalyzerProps) {
  const [selectedUrl, setSelectedUrl] = useState('');
  const [timeRange, setTimeRange] = useState('7');
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [availablePages, setAvailablePages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (siteId) {
      loadAvailablePages();
    }
  }, [siteId]);

  useEffect(() => {
    if (selectedUrl && siteId) {
      loadFunnelData();
    }
  }, [selectedUrl, timeRange, siteId]);

  const loadAvailablePages = async () => {
    try {
      // Hämta alla sidor med antal besök
      const { data, error } = await supabase
        .from('page_views')
        .select('url, title')
        .eq('site_id', siteId)
        .order('viewed_at', { ascending: false });

      if (error) throw error;

      // Räkna besök per sida
      const pageCounts = data.reduce((acc, page) => {
        const url = page.url;
        acc[url] = (acc[url] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Sortera efter popularitet
      const sortedPages = Object.entries(pageCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([url]) => url);

      // Prioritera viktiga sidor
      const importantPages = sortedPages.filter(url => 
        url.includes('/kontakt') || 
        url.includes('/contact') || 
        url.includes('/boka') ||
        url.includes('/offert') ||
        url.includes('/lediga-jobb') ||
        url.includes('/karriar') ||
        url.includes('/jobs') ||
        url.includes('/ansok') ||
        url.includes('/tjanster') ||
        url.includes('/services') ||
        url.includes('/produkter') ||
        url.includes('/products') ||
        url.includes('/priser') ||
        url.includes('/pricing')
      );

      // Kombinera viktiga sidor först, sedan populära
      const remainingPages = sortedPages.filter(url => !importantPages.includes(url));
      const finalPages = [...importantPages, ...remainingPages].slice(0, 25);
      
      setAvailablePages(finalPages);
      
      // Sätt default till första viktiga sidan eller mest populära
      if (finalPages.length > 0 && !selectedUrl) {
        setSelectedUrl(finalPages[0]);
      }
    } catch (error) {
      console.error('Error loading available pages:', error);
    }
  };

  const loadFunnelData = async () => {
    if (!selectedUrl) return;
    
    setIsLoading(true);
    try {
      const daysAgo = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // 1. Sidbesök
      const { data: pageVisitsData, error: pageError } = await supabase
        .from('page_views')
        .select('id, session_id')
        .eq('site_id', siteId)
        .eq('url', selectedUrl)
        .gte('viewed_at', startDate.toISOString());

      if (pageError) throw pageError;

      // 2. Alla klick på sidan
      const { data: clicksData, error: clickError } = await supabase
        .from('heatmap_data')
        .select('*')
        .eq('site_id', siteId)
        .eq('url', selectedUrl)
        .gte('created_at', startDate.toISOString());

      if (clickError) throw clickError;

      // 3. Konverteringshändelser
      const { data: conversionsData, error: convError } = await supabase
        .from('conversion_events')
        .select('*')
        .eq('site_id', siteId)
        .gte('created_at', startDate.toISOString());

      if (convError) console.warn('Conversion events error:', convError);

      // Analysera data
      const pageVisits = pageVisitsData?.length || 0;
      const totalClicks = clicksData?.length || 0;
      
      // Identifiera formulärinteraktioner baserat på element_text och interaction_type
      const formStarts = clicksData?.filter(click => 
        click.interaction_type?.includes('form') ||
        click.element_text?.toLowerCase().includes('input') ||
        click.element_text?.toLowerCase().includes('textarea') ||
        click.interaction_type?.includes('input')
      ).length || 0;

      const formSubmissions = clicksData?.filter(click =>
        click.interaction_type?.includes('submit') ||
        click.element_text?.toLowerCase().includes('skicka') ||
        click.element_text?.toLowerCase().includes('send') ||
        click.element_text?.toLowerCase().includes('submit')
      ).length || 0;

      const phoneClicks = clicksData?.filter(click =>
        click.interaction_type?.includes('phone') ||
        click.element_text?.toLowerCase().includes('ring') ||
        click.element_text?.toLowerCase().includes('telefon') ||
        click.element_text?.toLowerCase().includes('call')
      ).length || 0;

      const emailClicks = clicksData?.filter(click =>
        click.element_text?.toLowerCase().includes('email') ||
        click.element_text?.toLowerCase().includes('mejl') ||
        click.element_text?.toLowerCase().includes('@')
      ).length || 0;

      const conversionRate = pageVisits > 0 ? (formSubmissions / pageVisits) * 100 : 0;
      const dropoffRate = formStarts > 0 ? ((formStarts - formSubmissions) / formStarts) * 100 : 0;

      setFunnelData({
        pageVisits,
        formStarts,
        formSubmissions,
        phoneClicks,
        emailClicks,
        totalClicks,
        conversionRate,
        dropoffRate
      });

    } catch (error) {
      console.error('Error loading funnel data:', error);
      toast({
        title: "❌ Fel",
        description: "Kunde inte ladda funnel-data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const FunnelStep = ({ 
    icon: Icon, 
    title, 
    value, 
    total, 
    color = "blue",
    description 
  }: {
    icon: any;
    title: string;
    value: number;
    total: number;
    color?: string;
    description: string;
  }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${color}-100`}>
            <Icon className={`h-5 w-5 text-${color}-600`} />
          </div>
          <div>
            <div className="font-medium">{title}</div>
            <div className="text-sm text-muted-foreground">{description}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-muted-foreground">
            {percentage.toFixed(1)}% av besökare
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Konfiguration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-purple-500" />
            Konverteringstratt Analys
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Analysera hela konverteringsflödet för en specifik sida
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="page-url">Välj sida att analysera</Label>
              <div className="space-y-2">
                <PageSelector 
                  siteId={siteId}
                  selectedPage={selectedUrl}
                  onPageChange={setSelectedUrl}
                  placeholder="Välj en sida att analysera..."
                />
                <div className="text-xs text-muted-foreground">
                  Viktiga sidor som kontakt, jobb och tjänster prioriteras först
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="time-range">Tidsperiod</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Senaste 24h</SelectItem>
                  <SelectItem value="7">Senaste 7 dagarna</SelectItem>
                  <SelectItem value="30">Senaste 30 dagarna</SelectItem>
                  <SelectItem value="90">Senaste 90 dagarna</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedUrl && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <strong>Analyserar:</strong> {selectedUrl}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Funnel Data */}
      {funnelData && (
        <>
          {/* Översikt */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{funnelData.pageVisits}</div>
                    <div className="text-sm text-muted-foreground">Sidbesök</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MousePointer className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{funnelData.totalClicks}</div>
                    <div className="text-sm text-muted-foreground">Totala klick</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">{funnelData.formSubmissions}</div>
                    <div className="text-sm text-muted-foreground">Formulär skickade</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">{funnelData.conversionRate.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Konverteringsgrad</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detaljerad Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Konverteringstratt</CardTitle>
              <p className="text-sm text-muted-foreground">
                Flöde från sidbesök till konvertering
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <FunnelStep
                icon={Eye}
                title="1. Sidbesök"
                value={funnelData.pageVisits}
                total={funnelData.pageVisits}
                color="blue"
                description="Antal unika besök på denna sida"
              />

              <div className="flex justify-center">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>

              <FunnelStep
                icon={FormInput}
                title="2. Formulärinteraktion"
                value={funnelData.formStarts}
                total={funnelData.pageVisits}
                color="green"
                description="Började fylla i formulär eller klickade i fält"
              />

              <div className="flex justify-center">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>

              <FunnelStep
                icon={Send}
                title="3. Formulär skickat"
                value={funnelData.formSubmissions}
                total={funnelData.pageVisits}
                color="purple"
                description="Slutförde och skickade formuläret"
              />

              {/* Alternativa konverteringar */}
              <div className="border-t pt-4 mt-6">
                <h4 className="font-medium mb-3">Alternativa konverteringar</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <FunnelStep
                    icon={Phone}
                    title="Telefonklick"
                    value={funnelData.phoneClicks}
                    total={funnelData.pageVisits}
                    color="orange"
                    description="Klickade på telefonnummer"
                  />

                  <FunnelStep
                    icon={Users}
                    title="Email-klick"
                    value={funnelData.emailClicks}
                    total={funnelData.pageVisits}
                    color="indigo"
                    description="Klickade på email-adress"
                  />
                </div>
              </div>

              {/* Insights */}
              <div className="border-t pt-4 mt-6">
                <h4 className="font-medium mb-3">Insights</h4>
                <div className="space-y-2">
                  {funnelData.dropoffRate > 50 && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      <div className="text-sm">
                        <strong>Hög avhoppsfrekvens:</strong> {funnelData.dropoffRate.toFixed(1)}% hoppar av från formuläret. 
                        Överväg att förenkla formuläret.
                      </div>
                    </div>
                  )}
                  
                  {funnelData.conversionRate > 5 && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <div className="text-sm">
                        <strong>Bra konvertering:</strong> {funnelData.conversionRate.toFixed(1)}% konverteringsgrad är över genomsnittet.
                      </div>
                    </div>
                  )}

                  {funnelData.phoneClicks > funnelData.formSubmissions && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <Phone className="h-5 w-5 text-blue-500" />
                      <div className="text-sm">
                        <strong>Telefon föredras:</strong> Fler klickar på telefon än skickar formulär. 
                        Överväg att göra telefonnumret mer prominent.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Analyserar konverteringstratt...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}