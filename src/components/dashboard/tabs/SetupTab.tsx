import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Download, Globe, Settings, Zap, Plus, ChevronDown, Link } from 'lucide-react';
import { InstallationGuide } from '@/components/dashboard/InstallationGuide';
import { AddSiteForm } from '@/components/dashboard/AddSiteForm';
import { SiteSelector } from '@/components/dashboard/SiteSelector';
import { AgentMacroManager } from '@/components/dashboard/AgentMacroManager';
import PluginDownloader from '@/components/PluginDownloader';
import { useSites } from '@/hooks/useSites';
import { useNavigate } from 'react-router-dom';
import type { Site } from '@/types/dashboard';

interface SetupTabProps {
  selectedSite: Site | null;
}

export function SetupTab({ selectedSite }: SetupTabProps) {
  const { sites, setSelectedSite, loadSites } = useSites();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Site Management Section */}
      <div className="grid gap-6">
        {/* Add Website Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Lägg till webbplats
            </CardTitle>
            <p className="text-muted-foreground">
              Registrera en ny webbplats för att börja spåra analytics och heatmaps
            </p>
          </CardHeader>
          <CardContent>
            <AddSiteForm onSiteAdded={loadSites} />
          </CardContent>
        </Card>

        {/* Site Selection */}
        {sites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Välj aktiv webbplats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SiteSelector 
                sites={sites}
                selectedSite={selectedSite}
                onSiteSelect={setSelectedSite}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* WordPress Plugin Section */}
      <Collapsible>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="hover:bg-muted/50 cursor-pointer">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  WordPress Plugin - Expandtalk.se
                </div>
                <ChevronDown className="h-4 w-4" />
              </CardTitle>
              <p className="text-muted-foreground">
                Ladda ner WordPress-pluginet utvecklat av Expandtalk.se för enkel installation på din webbplats.
              </p>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <PluginDownloader trackingId={selectedSite?.tracking_id} />
              
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold">Installation & Konfiguration</h3>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div><strong>Tracking ID:</strong> {selectedSite?.tracking_id || 'Välj en webbplats först'}</div>
                  <div><strong>Supabase-integration:</strong> <span className="text-green-600">Redo att använda</span></div>
                  <div><strong>Google Analytics:</strong> Ange din GA4 Measurement ID i inställningarna</div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Headless CMS & Enterprise Installation */}
      <Collapsible>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="hover:bg-muted/50 cursor-pointer">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  Headless CMS & Enterprise Installation
                </div>
                <ChevronDown className="h-4 w-4" />
              </CardTitle>
              <p className="text-muted-foreground">
                Installation för Headless CMS-system och Adobe Enterprise Manager
              </p>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Headless CMS Section */}
              <div className="border-l-4 border-purple-500 pl-4 space-y-3">
                <h3 className="text-lg font-semibold text-purple-700">Headless CMS Installation</h3>
                <p className="text-sm text-muted-foreground">
                  För moderna headless CMS-lösningar som Strapi, Contentful, eller Sanity
                </p>
                
                <div className="bg-purple-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium">1. Integrera tracking-scriptet</h4>
                  <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono overflow-x-auto">
                    {`<!-- Lägg till i ditt template eller layout-fil -->
<script>
  window.heatmapAnalytics = {
    trackingId: '${selectedSite?.tracking_id || 'din-tracking-id'}',
    apiUrl: 'https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/'
  };
</script>
<script src="https://itsäkerhet.com/tracking-script.js" async></script>`}
                  </div>
                  
                  <h4 className="font-medium">2. API-integration för innehållshantering</h4>
                  <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono overflow-x-auto">
                    {`// REST API för cookiefree analytics
GET /wp-json/heatmap/v2/cookiefree-analytics
Headers: X-API-Key: din-api-nyckel

// För GDPR-kompatibel tracking
POST /wp-json/heatmap/v2/track-gdpr
Content-Type: application/json
{
  "site_id": "${selectedSite?.id || 'site-uuid'}",
  "event_type": "page_view",
  "consent_given": true
}`}
                  </div>
                  
                  <h4 className="font-medium">3. Konfiguration för populära CMS</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded border">
                      <strong className="text-blue-600">Strapi</strong>
                      <p className="text-sm mt-1">Använd plugin-systemet för att integrera tracking i alla sidor automatiskt</p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <strong className="text-green-600">Contentful</strong>
                      <p className="text-sm mt-1">Integrera via webhooks och custom delivery API</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Adobe Enterprise Manager Section */}
              <div className="border-l-4 border-red-500 pl-4 space-y-3">
                <h3 className="text-lg font-semibold text-red-700">Adobe Enterprise Manager (AEM)</h3>
                <p className="text-sm text-muted-foreground">
                  Företagslösning för Adobe Experience Manager och Adobe Analytics integration
                </p>
                
                <div className="bg-red-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium">1. AEM Component Integration</h4>
                  <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono overflow-x-auto">
                    {`<!-- AEM Component Template (HTL) -->
<div data-sly-use.analytics="com.expandtalk.analytics.AnalyticsComponent">
  <script data-sly-unwrap>
    window.heatmapAnalytics = {
      trackingId: '\${analytics.trackingId}',
      aemPagePath: '\${currentPage.path}',
      apiUrl: 'https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/'
    };
  </script>
  <script src="https://itsäkerhet.com/tracking-script.js" async></script>
</div>`}
                  </div>
                  
                  <h4 className="font-medium">2. OSGi Service Configuration</h4>
                  <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono overflow-x-auto">
                    {`// AnalyticsService.java
@Component(service = AnalyticsService.class)
public class AnalyticsServiceImpl implements AnalyticsService {
    
    @Reference
    private ConfigurationAdmin configAdmin;
    
    public String getTrackingId() {
        return "${selectedSite?.tracking_id || 'konfigurera-tracking-id'}";
    }
    
    public void trackEvent(String eventType, Map<String, Object> data) {
        // GDPR-kompatibel event tracking
        HttpClient client = HttpClient.newBuilder().build();
        // Implementation...
    }
}`}
                  </div>
                  
                  <h4 className="font-medium">3. Adobe Analytics Bridge</h4>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm">
                      <strong>Hybrid-approach:</strong> Använd vårt system för heatmaps och detaljerad användarinteraktion, 
                      medan Adobe Analytics hanterar högre nivå-metrics. Data kan synkroniseras via API.
                    </p>
                  </div>
                  
                  <h4 className="font-medium">4. Enterprise Säkerhetskonfiguration</h4>
                  <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                    <p className="text-sm">
                      <strong>Viktigt:</strong> För enterprise-miljöer, kontakta support för dedicated Supabase-instans, 
                      custom CORS-policies och IP-whitlisting för säker dataöverföring.
                    </p>
                  </div>
                </div>
              </div>

              {/* Support Contact */}
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-medium text-blue-800">Enterprise Support</h4>
                <p className="text-sm text-blue-700 mt-1">
                  För avancerad integration med Headless CMS eller Adobe Enterprise Manager, 
                  kontakta vårt enterprise-team för skräddarsydd implementation och support.
                </p>
                <Button className="mt-2" variant="outline" size="sm">
                  Kontakta Enterprise Support
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Installation Guide */}
      <InstallationGuide selectedSite={selectedSite} />
      
      {/* Agent Browser Macros */}
      {selectedSite && <AgentMacroManager siteId={selectedSite.id} />}

      {/* Version 2.0 Features - Moved to end */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            🆕 Senaste uppdateringar - Version 2.0
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3">
            <div className="flex items-start gap-2">
              <span className="text-green-500">✅</span>
              <div>
                <strong>Google Analytics 4 Integration</strong> - Fullständig GA4-synkronisering
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✅</span>
              <div>
                <strong>Förbättrat Admin-gränssnitt</strong> - Alla inställningar på ett ställe
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✅</span>
              <div>
                <strong>Enhanced E-commerce</strong> - Korrelera köpbeteende med heatmaps
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✅</span>
              <div>
                <strong>Prestandaoptimering</strong> - Ännu snabbare och effektivare
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✅</span>
              <div>
                <strong>Korrekt Expandtalk.se-branding</strong> - Ingen förvirring
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-orange-500">🍪</span>
              <div>
                <strong>Version 2.0 - Rött tema = Cookie-hantering!</strong> Ta bort gamla versioner först. 
                Denna version innehåller avancerad GDPR cookie-hantering med kategoriserade samtycken.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}