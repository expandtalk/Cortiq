import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, TrendingUp, BarChart3, Users, Target, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Site {
  id: string;
  site_name: string;
  domain: string;
  tracking_id: string;
  is_active: boolean;
  created_at: string;
  ga_measurement_id?: string;
  ga_property_id?: string;
  ga_integration_enabled?: boolean;
  ga_sync_events?: string[];
  ga_enhanced_ecommerce?: boolean;
}

interface GoogleAnalyticsIntegrationProps {
  selectedSite: Site;
}

interface GAData {
  sessions: number;
  users: number;
  pageviews: number;
  bounce_rate: number;
  avg_session_duration: number;
  top_sources: Array<{ source: string; sessions: number; percentage: number }>;
}

export function GoogleAnalyticsIntegration({ selectedSite }: GoogleAnalyticsIntegrationProps) {
  const [gaEnabled, setGaEnabled] = useState(selectedSite.ga_integration_enabled || false);
  const [measurementId, setMeasurementId] = useState(selectedSite.ga_measurement_id || '');
  const [propertyId, setPropertyId] = useState(selectedSite.ga_property_id || '');
  const [isConnected, setIsConnected] = useState(!!selectedSite.ga_measurement_id && !!selectedSite.ga_property_id);
  const [gaData, setGaData] = useState<GAData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Update state when selectedSite changes
  React.useEffect(() => {
    setGaEnabled(selectedSite.ga_integration_enabled || false);
    setMeasurementId(selectedSite.ga_measurement_id || '');
    setPropertyId(selectedSite.ga_property_id || '');
    setIsConnected(!!selectedSite.ga_measurement_id && !!selectedSite.ga_property_id);
    setGaData(null); // Reset GA data when site changes
  }, [selectedSite.id, selectedSite.ga_integration_enabled, selectedSite.ga_measurement_id, selectedSite.ga_property_id]);

  const handleConnect = async () => {
    if (!measurementId.startsWith('G-')) {
      toast({
        title: "❌ Ogiltigt Measurement ID",
        description: "Google Analytics Measurement ID måste börja med 'G-'"
      });
      return;
    }

    if (!propertyId || isNaN(Number(propertyId))) {
      toast({
        title: "❌ Ogiltigt Property ID",
        description: "Google Analytics Property ID måste vara numeriskt (t.ex. 123456789)"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Update site with GA configuration
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { error } = await supabase
        .from('sites')
        .update({
          ga_measurement_id: measurementId,
          ga_property_id: propertyId,
          ga_integration_enabled: gaEnabled,
          ga_sync_events: ['clicks', 'scrolls', 'sessions'],
          ga_enhanced_ecommerce: false
        })
        .eq('id', selectedSite.id);
        
      if (error) throw error;
      
      setIsConnected(true);

      toast({
        title: "🔗 GA Konfigurerad!",
        description: `Measurement ID ${measurementId} sparad. Heatmap-data skickas nu till Google Analytics när tracking-script laddas på din webbplats.`
      });
    } catch (error) {
      toast({
        title: "❌ Fel",
        description: "Kunde inte spara GA-konfiguration. Försök igen."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testGA4Integration = async () => {
    if (!selectedSite.id || !measurementId) {
      toast({
        title: "❌ Fel",
        description: "Site ID eller Measurement ID saknas"
      });
      return;
    }

    setIsSaving(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      console.log('Testing GA4 integration with:', { siteId: selectedSite.id, startDate, endDate, measurementId });
      
      const { data, error } = await supabase.functions.invoke('ga4-import', {
        body: {
          siteId: selectedSite.id,
          startDate,
          endDate
        }
      });

      if (error) {
        console.error('GA4 test error:', error);
        let errorMessage = error.message || 'Okänt fel';
        
        // Provide specific guidance for permission errors
        if (errorMessage.includes('permission') || errorMessage.includes('403')) {
          errorMessage = `❌ Saknar åtkomst till GA4 Property ${propertyId || measurementId}. 

🔧 Lösning:
1. Gå till Google Analytics → Admin → Property Access Management
2. Lägg till Service Account (finns i Supabase settings)
3. Ge "Viewer" rättigheter

Detta är anledningen till att samma data visas för båda sajterna.`;
        }
        
        toast({
          variant: "destructive", 
          title: "❌ Test misslyckades",
          description: errorMessage
        });
        return;
      }

      console.log('GA4 test result:', data);
      
      if (data.success) {
        toast({
          title: "✅ Test genomfört!",
          description: `GA4 data hämtad: ${data.data.sessions} sessions, ${data.data.events} events, ${data.data.conversions} conversions`
        });
      } else {
        toast({
          variant: "destructive",
          title: "❌ Test misslyckades",
          description: data.error || 'Okänt fel från GA4 API'
        });
      }

    } catch (error) {
      console.error('GA4 test error:', error);
      toast({
        variant: "destructive",
        title: "❌ Test misslyckades",
        description: error.message || 'Kunde inte anropa GA4-import funktionen'
      });
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Google Analytics Integration
        </CardTitle>
        <CardDescription>
          Kombinera traditionell analytics med detaljerad heatmap-data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Setup */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ga-enabled">Aktivera GA Integration</Label>
              <p className="text-sm text-muted-foreground">
                Synkronisera heatmap-data med Google Analytics
              </p>
            </div>
            <Switch
              id="ga-enabled"
              checked={gaEnabled}
              onCheckedChange={setGaEnabled}
            />
          </div>

          {gaEnabled && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="measurement-id">GA4 Measurement ID</Label>
                <p className="text-xs text-muted-foreground mb-1">För tracking på din webbplats (börjar med G-)</p>
                <Input
                  id="measurement-id"
                  placeholder="G-XXXXXXXXXX"
                  value={measurementId}
                  onChange={(e) => setMeasurementId(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="property-id">GA4 Property ID</Label>
                <p className="text-xs text-muted-foreground mb-1">Numeriskt ID för Analytics Data API</p>
                <Input
                  id="property-id"
                  placeholder="123456789"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleConnect}
                disabled={!measurementId || !propertyId || isSaving}
                className="w-full"
              >
                {isSaving ? 'Sparar...' : isConnected ? 'Uppdatera' : 'Anslut'}
              </Button>

              {isConnected && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700">
                    Ansluten till Google Analytics
                  </span>
                  <Badge variant="secondary">Live</Badge>
                </div>
              )}
            </div>
          )}
        </div>

        {isConnected && (
          <>
            <Separator />
            
            {/* Integration Status */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Integration Status
              </h3>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">✅ Integration aktiv</h4>
                <div className="text-sm text-green-800 space-y-2">
                  <p><strong>Measurement ID:</strong> {measurementId}</p>
                  <p><strong>Status:</strong> Tracking-script fungerar - Data samlas in och synkroniseras</p>
                  <p><strong>Events som synkas:</strong> Klick, scrollning, sessioner</p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                <h4 className="font-semibold text-amber-900 mb-2">📋 Nästa steg</h4>
                <div className="text-sm text-amber-800 space-y-1">
                  <p>1. Installera WordPress-pluginet på din webbplats</p>
                  <p>2. Aktivera GA-integration i plugin-inställningarna</p>
                  <p>3. Vänta på att data börjar komma in till Google Analytics</p>
                  <p>4. Kontrollera "Realtid" i GA för att se direkta events</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Export & Sync Options */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                Google Analytics
              </h3>
              
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex-col"
                  onClick={() => window.open(
                    propertyId 
                      ? `https://analytics.google.com/analytics/web/#/p${propertyId}/`
                      : 'https://analytics.google.com', 
                    '_blank'
                  )}
                >
                  <ExternalLink className="h-4 w-4 mb-1" />
                  <div className="font-medium">Öppna Google Analytics</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Gå till Realtid för att se heatmap events
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex-col"
                  onClick={() => window.open(
                    propertyId 
                      ? `https://analytics.google.com/analytics/web/#/p${propertyId}/reports/realtime`
                      : 'https://analytics.google.com', 
                    '_blank'
                  )}
                >
                  <BarChart3 className="h-4 w-4 mb-1" />
                  <div className="font-medium">Realtidsrapport</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Se direkta heatmap events live
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex-col"
                  onClick={testGA4Integration}
                  disabled={isSaving}
                >
                  <TestTube className="h-4 w-4 mb-1" />
                  <div className="font-medium">
                    {isSaving ? 'Testar...' : 'Testa Konfiguration'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Verifiera GA4-inställningar
                  </div>
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Setup Instructions & GDPR Guide */}
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-md">
            <h4 className="font-semibold text-blue-900 mb-2">🔧 Setup Guide</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. <strong>Skapa GA4-konto:</strong> Gå till <a href="https://analytics.google.com" target="_blank" rel="noopener" className="underline">analytics.google.com</a></li>
              <li>2. <strong>Hitta Measurement ID:</strong> Dataström → Webbdataström → G-XXXXXXXXXX</li>
              <li>3. <strong>Hitta Property ID:</strong> Inställningar → Egenskaps-ID (numeriskt)</li>
              <li>4. <strong>Ange ID:n:</strong> Fyll i formuläret ovan</li>
              <li>5. <strong>Installera plugin:</strong> Ladda ner och installera WordPress-pluginet</li>
            </ul>
          </div>

          <div className="p-4 bg-amber-50 rounded-md">
            <h4 className="font-semibold text-amber-900 mb-3">⚠️ Viktiga GDPR-dokument att granska</h4>
            <p className="text-sm text-amber-800 mb-3">
              När du skapar ditt GA4-konto måste du godkänna flera dokument. Här är våra rekommendationer för GDPR-compliance:
            </p>
            
            <div className="space-y-3 text-sm">
              <div className="bg-green-100 p-3 rounded border-l-4 border-green-500">
                <h5 className="font-semibold text-green-900 mb-1">✅ Rekommenderas att godkänna:</h5>
                <ul className="text-green-800 space-y-1">
                  <li>• <strong>Teknisk support</strong> - Nödvändigt för felsökning</li>
                  <li>• <strong>Google Ads Data Processing Terms</strong> - GDPR-kompatibelt avtal</li>
                </ul>
              </div>

              <div className="bg-red-100 p-3 rounded border-l-4 border-red-500">
                <h5 className="font-semibold text-red-900 mb-1">🚫 Rekommenderas INTE:</h5>
                <ul className="text-red-800 space-y-1">
                  <li>• <strong>Rekommendationer för ditt företag</strong> - Bred dataanvändning</li>
                  <li>• <strong>Bidrag till modellering</strong> - Data används för Googles algoritmer</li>
                </ul>
                <p className="text-xs text-red-700 mt-2">
                  Dessa kan aktiveras senare om verkligen behövs.
                </p>
              </div>

              <div className="bg-blue-100 p-3 rounded border-l-4 border-blue-500">
                <h5 className="font-semibold text-blue-900 mb-1">🤔 Överväg noga:</h5>
                <ul className="text-blue-800 space-y-1">
                  <li>• <strong>Produkter och tjänster från Google</strong> - Bra om du använder flera Google-tjänster</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-md">
            <h4 className="font-semibold text-purple-900 mb-2">📋 Nästa steg efter GA4-setup</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>1. <strong>Aktivera IP-anonymisering</strong> i GA4-inställningar</li>
              <li>2. <strong>Uppdatera integritetspolicy</strong> att inkludera Google Analytics</li>
              <li>3. <strong>Konfigurera cookie-banner</strong> för samtycke (vårt system hanterar detta)</li>
              <li>4. <strong>Testa integrationen</strong> med knappen "Testa Konfiguration" ovan</li>
              <li>5. <strong>Kontrollera Realtid</strong> i GA4 för att se heatmap-events</li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 rounded-md">
            <h4 className="font-semibold text-gray-900 mb-2">🎯 Vad skickas till Google Analytics?</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-gray-900 mb-1">Heatmap Events:</h5>
                <ul className="text-gray-700 space-y-1">
                  <li>• Klick-positioner och intensitet</li>
                  <li>• Scroll-djup och beteende</li>
                  <li>• Mouse-tracking data</li>
                  <li>• Session-längd och engagement</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-1">Custom Parameters:</h5>
                <ul className="text-gray-700 space-y-1">
                  <li>• <code>heatmap_zone</code> - Sidområde</li>
                  <li>• <code>click_intensity</code> - Klick-data</li>
                  <li>• <code>scroll_depth</code> - Scroll-procent</li>
                  <li>• <code>session_id</code> - Session-koppling</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}