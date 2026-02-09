import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, CheckCircle, XCircle, AlertTriangle, Activity, BarChart, Settings } from 'lucide-react';
import { useGDPRSettings, useUpdateGDPRSettings } from '@/hooks/useGDPR';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Site } from '@/types/dashboard';

interface CMPDashboardProps {
  selectedSite: Site;
}

export function CMPDashboard({ selectedSite }: CMPDashboardProps) {
  const { data: gdprSettings } = useGDPRSettings(selectedSite.id);
  const updateGDPRSettings = useUpdateGDPRSettings();
  const [serverSideConfig, setServerSideConfig] = useState<any>((selectedSite as any).server_side_tracking_config || {});
  const [consentStats, setConsentStats] = useState<any>(null);
  const [recentValidations, setRecentValidations] = useState<any[]>([]);

  React.useEffect(() => {
    loadConsentStats();
    loadRecentValidations();
  }, [selectedSite]);

  const loadConsentStats = async () => {
    try {
      const { data } = await supabase
        .from('cookie_consents')
        .select('consent_types, created_at')
        .eq('site_id', selectedSite.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        const stats = {
          total: data.length,
          analytics_granted: data.filter(c => (c.consent_types as any)?.analytics).length,
          marketing_granted: data.filter(c => (c.consent_types as any)?.marketing).length,
          all_rejected: data.filter(c => !(c.consent_types as any)?.analytics && !(c.consent_types as any)?.marketing).length,
          recent_24h: data.filter(c => new Date(c.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length
        };
        setConsentStats(stats);
      }
    } catch (error) {
      console.error('Error loading consent stats:', error);
    }
  };

  const loadRecentValidations = async () => {
    try {
      const { data } = await supabase
        .from('consent_validations')
        .select('*')
        .eq('site_id', selectedSite.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setRecentValidations(data || []);
    } catch (error) {
      console.error('Error loading recent validations:', error);
    }
  };

  const updateServerSideConfig = async (newConfig: any) => {
    try {
      await supabase
        .from('sites')
        .update({ server_side_tracking_config: newConfig })
        .eq('id', selectedSite.id);
      
      setServerSideConfig(newConfig);
      toast.success('Server-side tracking konfiguration uppdaterad');
    } catch (error) {
      console.error('Error updating server-side config:', error);
      toast.error('Fel vid uppdatering av konfiguration');
    }
  };

  const testConsentFlow = async () => {
    try {
      const testSessionId = `test_${Date.now()}`;
      
      const result = await supabase.functions.invoke('consent-check', {
        body: {
          site_id: selectedSite.id,
          session_id: testSessionId,
          consent_types: ['analytics', 'marketing'],
          integration_type: 'test'
        }
      });

      if (result.error) {
        toast.error('Test misslyckades: ' + result.error.message);
      } else {
        toast.success('Consent-flöde fungerar korrekt');
        loadRecentValidations();
      }
    } catch (error) {
      toast.error('Test misslyckades');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CMP Dashboard</h1>
          <p className="text-muted-foreground">
            GDPR-kompatibel server-side tracking för {selectedSite.site_name}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="configuration">Konfiguration</TabsTrigger>
          <TabsTrigger value="monitoring">Övervakning</TabsTrigger>
          <TabsTrigger value="testing">Testning</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CMP Status</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {serverSideConfig?.block_analytics_without_consent || serverSideConfig?.block_marketing_without_consent ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium">Aktivt</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-sm font-medium">Inaktivt</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Server-side blockering {serverSideConfig?.block_analytics_without_consent ? 'aktiverad' : 'inaktiverad'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Samtycken (24h)</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{consentStats?.recent_24h || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {consentStats?.total || 0} totalt
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Blockerade Anrop</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {recentValidations.filter(v => v.blocked_calls?.length > 0).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Senaste 20 valideringarna
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Consent Statistics */}
          {consentStats && (
            <Card>
              <CardHeader>
                <CardTitle>Samtyckes-statistik</CardTitle>
                <CardDescription>Översikt över användarnas samtycken</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round((consentStats.analytics_granted / consentStats.total) * 100) || 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">Analytics samtycke</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round((consentStats.marketing_granted / consentStats.total) * 100) || 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">Marknadsföring samtycke</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {Math.round((consentStats.all_rejected / consentStats.total) * 100) || 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">Avvisade alla</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{consentStats.total}</div>
                    <p className="text-sm text-muted-foreground">Totala samtycken</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Server-Side Tracking Konfiguration</CardTitle>
              <CardDescription>
                Konfigurera hur server-side tracking ska blockeras baserat på användarsamtycke
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Blockera Analytics utan samtycke</Label>
                    <p className="text-sm text-muted-foreground">
                      Blockera Google Analytics, Hotjar etc. utan analytics-samtycke
                    </p>
                  </div>
                  <Switch
                    checked={serverSideConfig?.block_analytics_without_consent || false}
                    onCheckedChange={(checked) =>
                      updateServerSideConfig({
                        ...serverSideConfig,
                        block_analytics_without_consent: checked
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Blockera Marknadsföring utan samtycke</Label>
                    <p className="text-sm text-muted-foreground">
                      Blockera Meta Pixel, Google Ads etc. utan marknadsförings-samtycke
                    </p>
                  </div>
                  <Switch
                    checked={serverSideConfig?.block_marketing_without_consent || false}
                    onCheckedChange={(checked) =>
                      updateServerSideConfig({
                        ...serverSideConfig,
                        block_marketing_without_consent: checked
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Kräv explicit samtycke</Label>
                    <p className="text-sm text-muted-foreground">
                      Blockera allt tills användaren har gett explicit samtycke
                    </p>
                  </div>
                  <Switch
                    checked={serverSideConfig?.require_explicit_consent || false}
                    onCheckedChange={(checked) =>
                      updateServerSideConfig({
                        ...serverSideConfig,
                        require_explicit_consent: checked
                      })
                    }
                  />
                </div>
              </div>

              {/* Integration Status */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Aktiva Integrationer</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedSite.ga_integration_enabled && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Google Analytics</span>
                      <Badge variant={serverSideConfig?.block_analytics_without_consent ? "default" : "secondary"}>
                        {serverSideConfig?.block_analytics_without_consent ? 'Skyddad' : 'Oskyddad'}
                      </Badge>
                    </div>
                  )}
                  {(selectedSite as any).facebook_pixel_enabled && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Meta Pixel</span>
                      <Badge variant={serverSideConfig?.block_marketing_without_consent ? "default" : "secondary"}>
                        {serverSideConfig?.block_marketing_without_consent ? 'Skyddad' : 'Oskyddad'}
                      </Badge>
                    </div>
                  )}
                  {(selectedSite as any).google_ads_enabled && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span>Google Ads</span>
                      <Badge variant={serverSideConfig?.block_marketing_without_consent ? "default" : "secondary"}>
                        {serverSideConfig?.block_marketing_without_consent ? 'Skyddad' : 'Oskyddad'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Senaste Samtyckes-valideringar</CardTitle>
              <CardDescription>
                Realtidsövervakning av consent-checks och blockerade anrop
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentValidations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Inga valideringar hittades ännu
                  </p>
                ) : (
                  recentValidations.map((validation) => (
                    <div key={validation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          {validation.consent_status?.overall_allowed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium">
                            {validation.consent_status?.integration_type || 'Unknown'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(validation.created_at).toLocaleString('sv-SE')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex space-x-2 mb-1">
                          {validation.consent_status?.allowed_types?.map((type: string) => (
                            <Badge key={type} variant="default" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                          {validation.consent_status?.blocked_types?.map((type: string) => (
                            <Badge key={type} variant="destructive" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Session: {validation.session_id.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Testa Consent-flöde</CardTitle>
              <CardDescription>
                Testa att consent-checks fungerar korrekt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testConsentFlow} className="w-full">
                Kör Consent Test
              </Button>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Detta kommer att köra en test-validering och visa resultatet.
                  Kontrollera fliken "Övervakning" för att se testresultatet.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CMPDashboard;