import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, type FieldValues } from 'react-hook-form';
import { Shield, FileText, Trash2, Download, Clock, Search, Cookie, Upload, ExternalLink, ToggleLeft, ToggleRight, Calendar, Users, Globe, MousePointer } from 'lucide-react';
import { useGDPRSettings, useUpdateGDPRSettings, type GDPRSettings } from '@/hooks/useGDPR';
import { useCookieDefinitions, enrichCookieWithDefinition, getCategoryDisplayName, getCategorySortOrder } from '@/hooks/useCookieDefinitions';
import { DataRequestsTable } from './DataRequestsTable';
import { DataRequestForm } from './DataRequestForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GDPRSettingsProps {
  siteId: string;
}

export function GDPRSettings({ siteId }: GDPRSettingsProps) {
  const { data: settings, isLoading } = useGDPRSettings(siteId);
  const updateSettings = useUpdateGDPRSettings();
  const { data: cookieDefinitions = [] } = useCookieDefinitions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [bannerType, setBannerType] = useState('internal');
  const [cookiebotId, setCookiebotId] = useState('');
  const [onetrustId, setOnetrustId] = useState('');
  const [customFunction, setCustomFunction] = useState('');
  const [savedCookies, setSavedCookies] = useState<any[]>([]);
  const [savedScripts, setSavedScripts] = useState<any[]>([]);
  const [lastScanDate, setLastScanDate] = useState<string | null>(null);
  const [showSavedData, setShowSavedData] = useState(true);
  const [consentStats, setConsentStats] = useState<any>(null);
  const [recentConsents, setRecentConsents] = useState<any[]>([]);

  const { register, handleSubmit, watch, setValue, formState: { isDirty } } = useForm<FieldValues>();

  // Update form when settings change
  React.useEffect(() => {
    if (settings) {
      setValue('cookie_consent_enabled', settings.cookie_consent_enabled);
      setValue('cookiefree_mode', (settings as any).cookiefree_mode || false);
      setValue('anonymize_ip', settings.anonymize_ip);
      setValue('data_retention_days', settings.data_retention_days);
      setValue('contact_email', settings.contact_email);
      setValue('dpo_email', settings.dpo_email);
      setValue('privacy_policy_url', settings.privacy_policy_url);
      setValue('heatmap_tracking_enabled', settings.heatmap_tracking_enabled);
    }
  }, [settings, setValue]);

  const onSubmit = (data: any) => {
    console.log('Form submission data:', data);
    updateSettings.mutate({ ...data, site_id: siteId });
  };

  // Load saved cookies and scripts
  const loadSavedData = async () => {
    try {
      // Get saved cookies
      const { data: cookies } = await supabase
        .from('detected_cookies')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      // Get saved scripts  
      const { data: scripts } = await supabase
        .from('detected_scripts')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      // Get last scan date
      const { data: site } = await supabase
        .from('sites')
        .select('last_cookie_scan')
        .eq('id', siteId)
        .single();

      setSavedCookies(cookies || []);
      setSavedScripts(scripts || []);
      setLastScanDate(site?.last_cookie_scan || null);
      
      // Load consent statistics
      await loadConsentStats();
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  // Load consent statistics
  const loadConsentStats = async () => {
    try {
      // Get consent statistics
      const { data: consents } = await supabase
        .from('cookie_consents')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate statistics
      const stats = {
        total_consents: consents?.length || 0,
        accepted_all: consents?.filter(c => {
          const consentTypes = c.consent_types as any;
          return consentTypes?.analytics && consentTypes?.marketing && consentTypes?.preferences;
        }).length || 0,
        rejected_all: consents?.filter(c => {
          const consentTypes = c.consent_types as any;
          return !consentTypes?.analytics && !consentTypes?.marketing && !consentTypes?.preferences;
        }).length || 0,
        partial_consent: consents?.filter(c => {
          const consentTypes = c.consent_types as any;
          return (consentTypes?.analytics || consentTypes?.marketing || consentTypes?.preferences) &&
            !(consentTypes?.analytics && consentTypes?.marketing && consentTypes?.preferences);
        }).length || 0
      };

      // Get country breakdown
      const { data: countryStats } = await supabase
        .from('cookie_consents')
        .select('geo_country')
        .eq('site_id', siteId)
        .not('geo_country', 'is', null);

      const countries = countryStats?.reduce((acc: any, curr: any) => {
        acc[curr.geo_country] = (acc[curr.geo_country] || 0) + 1;
        return acc;
      }, {}) || {};

      setConsentStats({ ...stats, countries });
      setRecentConsents(consents || []);
    } catch (error) {
      console.error('Error loading consent stats:', error);
    }
  };

  // Load saved data on component mount
  React.useEffect(() => {
    if (siteId) {
      loadSavedData();
    }
  }, [siteId]);

  const scanCookies = async () => {
    setIsScanning(true);
    try {
      // Get the site domain first
      const { data: site } = await supabase
        .from('sites')
        .select('domain')
        .eq('id', siteId)
        .single();

      if (!site) {
        toast.error('Kunde inte hitta webbplats');
        return;
      }

      const { data, error } = await supabase.functions.invoke('cookie-scanner', {
        body: {
          site_id: siteId,
          url: site.domain.startsWith('http') ? site.domain : `https://${site.domain}`
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        toast.error('Fel vid skanning: ' + error.message);
        return;
      }

      if (!data) {
        console.error('No data returned from edge function');
        toast.error('Ingen data returnerad från skanning');
        return;
      }

      console.log('Scan results:', data);
      setScanResults(data);
      toast.success(`Skanning klar! Hittade ${data.cookies_found || 0} cookies och ${data.scripts_found || 0} scripts`);

      // Reload saved data to show updated results
      await loadSavedData();

      // Update last scan timestamp
      await supabase
        .from('sites')
        .update({ last_cookie_scan: new Date().toISOString() })
        .eq('id', siteId);

    } catch (error) {
      console.error('Cookie scan error:', error);
      toast.error('Fel vid skanning av cookies');
    } finally {
      setIsScanning(false);
    }
  };

  const importExternalCookies = async () => {
    if (!bannerType || bannerType === 'internal') {
      toast.error('Välj en extern cookie banner först');
      return;
    }

    if (bannerType === 'cookiebot' && !cookiebotId) {
      toast.error('Ange Cookiebot ID');
      return;
    }

    if (bannerType === 'onetrust' && !onetrustId) {
      toast.error('Ange OneTrust Script ID');
      return;
    }

    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('cookie-importer', {
        body: {
          site_id: siteId,
          banner_type: bannerType,
          external_id: cookiebotId || onetrustId,
          domain: (await supabase.from('sites').select('domain').eq('id', siteId).single()).data?.domain
        }
      });

      if (error) {
        toast.error('Fel vid import: ' + error.message);
        return;
      }

      toast.success(`Import klar! Importerade ${data.imported_count} cookies från ${bannerType}`);
      
    } catch (error) {
      console.error('Cookie import error:', error);
      toast.error('Fel vid import av cookies');
    } finally {
      setIsImporting(false);
    }
  };

  const exportAllData = async () => {
    try {
      toast.info('Förbereder dataexport...');
      
      // Fetch all data for the site
      const [sessionsData, heatmapData, pageViewsData, interactionsData, cookiesData] = await Promise.all([
        supabase.from('tracking_sessions').select('*').eq('site_id', siteId),
        supabase.from('heatmap_data').select('*').eq('site_id', siteId),
        supabase.from('page_views').select('*').eq('site_id', siteId),
        supabase.from('user_interactions').select('*, page_views!inner(site_id)').eq('page_views.site_id', siteId),
        supabase.from('detected_cookies').select('*').eq('site_id', siteId)
      ]);

      const exportData = {
        site_id: siteId,
        export_date: new Date().toISOString(),
        tracking_sessions: sessionsData.data || [],
        heatmap_data: heatmapData.data || [],
        page_views: pageViewsData.data || [],
        user_interactions: interactionsData.data || [],
        detected_cookies: cookiesData.data || []
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gdpr-export-${siteId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Dataexport klar! Fil nedladdad.');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Fel vid dataexport');
    }
  };

  const generateGDPRReport = async () => {
    try {
      toast.info('Genererar GDPR-rapport...');
      
      // Get site info
      const { data: site } = await supabase.from('sites').select('*').eq('id', siteId).single();
      
      // Calculate data statistics
      const [sessionsCount, heatmapCount, pageViewsCount, interactionsCount] = await Promise.all([
        supabase.from('tracking_sessions').select('id', { count: 'exact' }).eq('site_id', siteId),
        supabase.from('heatmap_data').select('id', { count: 'exact' }).eq('site_id', siteId),
        supabase.from('page_views').select('id', { count: 'exact' }).eq('site_id', siteId),
        supabase.from('user_interactions').select('id, page_views!inner(site_id)', { count: 'exact' }).eq('page_views.site_id', siteId)
      ]);

      const report = {
        site_name: site?.site_name || 'Okänd webbplats',
        domain: site?.domain || 'Okänd domän',
        report_date: new Date().toISOString(),
        gdpr_settings: settings,
        data_summary: {
          tracking_sessions: sessionsCount.count || 0,
          heatmap_data_points: heatmapCount.count || 0,
          page_views: pageViewsCount.count || 0,
          user_interactions: interactionsCount.count || 0,
          detected_cookies: savedCookies.length
        },
        compliance_status: {
          cookie_consent_enabled: settings?.cookie_consent_enabled || false,
          ip_anonymization: settings?.anonymize_ip || false,
          data_retention_configured: !!settings?.data_retention_days,
          privacy_policy_url: !!settings?.privacy_policy_url,
          contact_email: !!settings?.contact_email
        }
      };

      // Create and download report
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gdpr-rapport-${site?.site_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'site'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('GDPR-rapport genererad och nedladdad!');
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error('Fel vid generering av GDPR-rapport');
    }
  };

  const cleanOldData = async () => {
    try {
      const retentionDays = settings?.data_retention_days || 365;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      toast.info('Rensar gammal data...');
      
      // Delete old data based on retention policy
      const cutoffDateString = cutoffDate.toISOString();
      await Promise.all([
        supabase.from('tracking_sessions').delete().eq('site_id', siteId).lt('started_at', cutoffDateString),
        supabase.from('heatmap_data').delete().eq('site_id', siteId).lt('created_at', cutoffDateString),
        supabase.from('page_views').delete().eq('site_id', siteId).lt('viewed_at', cutoffDateString)
      ]);
      
      // Delete user_interactions separately (they cascade from page_views deletion)

      toast.success(`Gammal data (äldre än ${retentionDays} dagar) har rensats`);
    } catch (error) {
      console.error('Data cleanup error:', error);
      toast.error('Fel vid rensning av gammal data');
    }
  };

  if (isLoading) {
    return <div>Laddar GDPR-inställningar...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Main GDPR Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            GDPR-inställningar
          </CardTitle>
          <CardDescription>
            Konfigurera dataskydd och integritetsinställningar för din webbplats.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Cookie Banner Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="cookie_consent">Cookie-samtycke</Label>
                  <p className="text-sm text-muted-foreground">
                    Visa cookie-banner för besökare
                  </p>
                </div>
                <Switch
                  id="cookie_consent"
                  checked={watch('cookie_consent_enabled')}
                  onCheckedChange={(checked) => setValue('cookie_consent_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between border-l-4 border-primary/50 pl-4 bg-primary/5 p-3 rounded">
                <div className="space-y-0.5">
                  <Label htmlFor="cookiefree_mode" className="font-semibold flex items-center gap-2">
                    <Cookie className="h-4 w-4" />
                    Cookiefree-läge
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Dölj cookie-bannern och kör 100% cookiefree tracking (säkerhets-fingerprinting för bot-detektion + aggregerad server-side analytics)
                  </p>
                </div>
                <Switch
                  id="cookiefree_mode"
                  checked={watch('cookiefree_mode')}
                  onCheckedChange={(checked) => setValue('cookiefree_mode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="heatmap_tracking">
                    <div className="flex items-center gap-2">
                      <MousePointer className="h-4 w-4" />
                      Heatmap-spårning
                    </div>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Aktivera eller inaktivera heatmap-spårning för denna webbplats
                  </p>
                </div>
                <Switch
                  id="heatmap_tracking"
                  checked={watch('heatmap_tracking_enabled')}
                  onCheckedChange={(checked) => {
                    console.log('Heatmap tracking switch changed to:', checked);
                    setValue('heatmap_tracking_enabled', checked);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner_type">Cookie Banner Typ</Label>
                <Select 
                  value={bannerType} 
                  onValueChange={setBannerType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj banner typ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Inbyggd Banner</SelectItem>
                    <SelectItem value="cookiebot">Cookiebot</SelectItem>
                    <SelectItem value="onetrust">OneTrust</SelectItem>
                    <SelectItem value="custom">Anpassad Integration</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Välj vilken cookie banner du vill använda
                </p>
              </div>

              {bannerType === 'cookiebot' && (
                <div className="space-y-2">
                  <Label htmlFor="cookiebot_id">Cookiebot ID</Label>
                  <Input
                    id="cookiebot_id"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={cookiebotId}
                    onChange={(e) => setCookiebotId(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Din Cookiebot domain group ID
                  </p>
                </div>
              )}

              {bannerType === 'onetrust' && (
                <div className="space-y-2">
                  <Label htmlFor="onetrust_id">OneTrust Script ID</Label>
                  <Input
                    id="onetrust_id"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={onetrustId}
                    onChange={(e) => setOnetrustId(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Din OneTrust script ID
                  </p>
                </div>
              )}

              {bannerType === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="custom_consent_function">Consent Check Function</Label>
                  <Textarea
                    id="custom_consent_function"
                    placeholder="window.checkAnalyticsConsent()"
                    value={customFunction}
                    onChange={(e) => setCustomFunction(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    JavaScript funktion som returnerar true om analytics consent är givet
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="anonymize_ip">Anonymisera IP-adresser</Label>
                  <p className="text-sm text-muted-foreground">
                    Maskera de sista siffrorna i IP-adresser
                  </p>
                </div>
                <Switch
                  id="anonymize_ip"
                  checked={watch('anonymize_ip')}
                  onCheckedChange={(checked) => setValue('anonymize_ip', checked)}
                />
              </div>
            </div>

            {/* Data Retention */}
            <div className="space-y-2">
              <Label htmlFor="retention">Datalagring (dagar)</Label>
              <Select 
                value={watch('data_retention_days')?.toString()} 
                onValueChange={(value) => setValue('data_retention_days', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj lagringstid" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 dagar</SelectItem>
                  <SelectItem value="90">90 dagar</SelectItem>
                  <SelectItem value="180">180 dagar</SelectItem>
                  <SelectItem value="365">1 år</SelectItem>
                  <SelectItem value="730">2 år</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Automatisk radering av äldre tracking-data
              </p>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Kontakt-email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  placeholder="kontakt@example.com"
                  {...register('contact_email')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dpo_email">Dataskyddsombud (DPO)</Label>
                <Input
                  id="dpo_email"
                  type="email"
                  placeholder="dpo@example.com"
                  {...register('dpo_email')}
                />
              </div>
            </div>

            {/* Privacy Policy URL */}
            <div className="space-y-2">
              <Label htmlFor="privacy_policy">URL till integritetspolicy</Label>
              <Input
                id="privacy_policy"
                type="url"
                placeholder="https://example.com/privacy-policy"
                {...register('privacy_policy_url')}
              />
            </div>

            <Button 
              type="submit" 
              disabled={!isDirty || updateSettings.isPending}
              className="w-full md:w-auto"
            >
              {updateSettings.isPending ? 'Sparar...' : 'Spara inställningar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Cookie Consent Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Cookie Consent Statistik
          </CardTitle>
          <CardDescription>
            Översikt över användarnas cookie-samtycken och geografisk fördelning.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {consentStats && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{consentStats.total_consents}</div>
                  <div className="text-sm text-muted-foreground">Totalt samtycken</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{consentStats.accepted_all}</div>
                  <div className="text-sm text-muted-foreground">Accepterat alla</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{consentStats.rejected_all}</div>
                  <div className="text-sm text-muted-foreground">Avvisat alla</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{consentStats.partial_consent}</div>
                  <div className="text-sm text-muted-foreground">Delvis samtycke</div>
                </div>
              </div>

              {Object.keys(consentStats.countries).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Geografisk fördelning
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(consentStats.countries)
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .slice(0, 8)
                      .map(([country, count]) => (
                        <div key={country} className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm">
                          <span>{country || 'Okänt'}</span>
                          <span className="font-medium">{count as number}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {recentConsents.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <MousePointer className="h-4 w-4" />
                    Senaste samtycken
                  </h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {recentConsents.map((consent: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg bg-muted/30 text-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {consent.consent_given ? '✅ Samtycke givet' : '❌ Samtycke nekat'}
                            </span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {consent.source || 'banner'}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(consent.created_at).toLocaleString('sv-SE')}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          <div className={`text-xs p-1 rounded text-center ${(consent.consent_types as any)?.analytics ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            Analytics
                          </div>
                          <div className={`text-xs p-1 rounded text-center ${(consent.consent_types as any)?.marketing ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            Marketing
                          </div>
                          <div className={`text-xs p-1 rounded text-center ${(consent.consent_types as any)?.preferences ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            Preferences
                          </div>
                          <div className="text-xs p-1 rounded text-center bg-blue-100 text-blue-800">
                            Necessary
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{consent.geo_country || 'Okänt land'}</span>
                          <span className="truncate max-w-32 ml-2">
                            {consent.user_agent ? consent.user_agent.split(' ')[0] : 'Okänd browser'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          
          {!consentStats && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ingen consent-data tillgänglig ännu.</p>
              <p className="text-sm">Statistik visas när användare börjar ge samtycken.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Databegäranden
          </CardTitle>
          <CardDescription>
            Hantera användarnas begäranden om dataexport eller radering.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <DataRequestForm siteId={siteId} />
          <DataRequestsTable siteId={siteId} />
        </CardContent>
      </Card>

      {/* Cookie Scanner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            Cookie Scanner
          </CardTitle>
          <CardDescription>
            Skanna din webbplats för cookies och tracking-scripts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Senaste skanning: {lastScanDate ? new Date(lastScanDate).toLocaleString('sv-SE') : 'Aldrig'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSavedData(!showSavedData)}
                className="flex items-center gap-2"
              >
                {showSavedData ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                {showSavedData ? 'Visa live-skanning' : 'Visa sparade data'}
              </Button>
            </div>
          </div>

          <Button 
            onClick={scanCookies} 
            disabled={isScanning}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            {isScanning ? 'Skannar...' : 'Skanna cookies'}
          </Button>

          {/* Saved Data View */}
          {showSavedData && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium">Sparade cookie-data för denna webbplats:</h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground">Aktuella cookies</h5>
                  <div className="text-2xl font-bold">
                    {scanResults?.cookies_found || savedCookies.filter(c => {
                      // Show only cookies from last 24 hours as "current"
                      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                      return new Date(c.updated_at || c.created_at) > dayAgo;
                    }).length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {savedCookies.length} totalt historiskt
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground">Kända cookies</h5>
                  <div className="text-2xl font-bold text-green-600">
                    {savedCookies.filter(cookie => 
                      enrichCookieWithDefinition(cookie.cookie_name, cookieDefinitions)
                    ).length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {savedCookies.length > 0 ? 
                      Math.round((savedCookies.filter(cookie => 
                        enrichCookieWithDefinition(cookie.cookie_name, cookieDefinitions)
                      ).length / savedCookies.length) * 100) : 0}% identifierade
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground">Okända cookies</h5>
                  <div className="text-2xl font-bold text-orange-600">
                    {savedCookies.filter(cookie => 
                      !enrichCookieWithDefinition(cookie.cookie_name, cookieDefinitions)
                    ).length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Behöver kategorisering
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground">Scripts</h5>
                  <div className="text-2xl font-bold">
                    {scanResults?.scripts_found || savedScripts.filter(s => {
                      // Show only scripts from last 24 hours as "current"
                      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                      return new Date(s.last_seen || s.created_at) > dayAgo;
                    }).length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {savedScripts.length} totalt historiskt
                  </div>
                </div>
              </div>

              {savedCookies.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Sparade cookies ({savedCookies.length}):</h5>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {savedCookies
                      .map((cookie: any) => {
                        // Enrich cookie with definition data
                        const definition = enrichCookieWithDefinition(cookie.cookie_name, cookieDefinitions);
                        return {
                          ...cookie,
                          enriched: definition,
                          sortKey: getCategorySortOrder(definition?.category_key || cookie.cookie_category)
                        };
                      })
                      .sort((a, b) => a.sortKey - b.sortKey)
                      .map((enrichedCookie: any, index: number) => {
                        const { cookie_name, cookie_category, cookie_provider, cookie_purpose, detection_method, enriched } = enrichedCookie;
                        
                        return (
                          <div key={index} className="text-sm p-2 bg-background rounded border">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium flex items-center gap-2">
                                  {cookie_name}
                                  {enriched && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                      Känd cookie
                                    </span>
                                  )}
                                </div>
                                <div className="text-muted-foreground">
                                  {getCategoryDisplayName(enriched?.category_key || cookie_category)} • {enriched?.provider_name || cookie_provider || 'Okänd leverantör'}
                                </div>
                                {(enriched?.description || enriched?.purpose || cookie_purpose) && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    <strong>Syfte:</strong> {enriched?.description || enriched?.purpose || cookie_purpose}
                                  </div>
                                )}
                                {enriched && (
                                  <div className="text-xs text-muted-foreground mt-1 grid grid-cols-2 gap-2">
                                    {enriched.expiry && (
                                      <div><strong>Upphör:</strong> {enriched.expiry}</div>
                                    )}
                                    {enriched.security_level && (
                                      <div><strong>Säkerhet:</strong> {enriched.security_level}</div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground text-right">
                                <div>{enriched?.detection_confidence || detection_method || 'automatisk'}</div>
                                {enriched && (
                                  <div className="text-xs text-green-600 mt-1">Definierad</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {savedScripts.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Sparade scripts ({savedScripts.length}):</h5>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {savedScripts.map((script: any, index: number) => (
                      <div key={index} className="text-sm p-2 bg-background rounded border">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{script.script_name}</div>
                            <div className="text-muted-foreground">
                              {script.category} • {script.provider || 'Okänd leverantör'}
                            </div>
                            {script.purpose && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {script.purpose}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(script.last_seen || script.created_at).toLocaleDateString('sv-SE')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {savedCookies.length === 0 && savedScripts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Cookie className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Inga cookies eller scripts sparade ännu.</p>
                  <p className="text-sm">Kör en cookie-skanning för att komma igång!</p>
                </div>
              )}
            </div>
          )}

          {/* Live Scan Results */}
          {!showSavedData && scanResults && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium">Live skanningsresultat:</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground">Cookies hittade</h5>
                  <div className="text-2xl font-bold">{scanResults.cookies_found}</div>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground">Scripts hittade</h5>
                  <div className="text-2xl font-bold">{scanResults.scripts_found}</div>
                </div>
              </div>

              {scanResults.cookies && scanResults.cookies.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Identifierade cookies:</h5>
                  <div className="space-y-1">
                    {scanResults.cookies.map((cookie: any, index: number) => (
                      <div key={index} className="text-sm p-2 bg-background rounded border">
                        <div className="font-medium">{cookie.name}</div>
                        <div className="text-muted-foreground">
                          {cookie.category} • {cookie.provider || 'Okänd leverantör'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {scanResults.scripts && scanResults.scripts.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Identifierade scripts:</h5>
                  <div className="space-y-1">
                    {scanResults.scripts.map((script: any, index: number) => (
                      <div key={index} className="text-sm p-2 bg-background rounded border">
                        <div className="font-medium">{script.name}</div>
                        <div className="text-muted-foreground">
                          {script.category} • {script.provider || 'Okänd leverantör'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cookie Import from External Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importera cookies från extern leverantör
          </CardTitle>
          <CardDescription>
            Importera cookie-data från Cookiebot, OneTrust eller annan leverantör
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Banner Typ</Label>
              <Select value={bannerType} onValueChange={setBannerType}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj extern leverantör" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Inbyggd Banner</SelectItem>
                  <SelectItem value="cookiebot">Cookiebot</SelectItem>
                  <SelectItem value="onetrust">OneTrust</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bannerType === 'cookiebot' && (
              <div className="space-y-2">
                <Label>Cookiebot Domain Group ID</Label>
                <Input
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={cookiebotId}
                  onChange={(e) => setCookiebotId(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Hittas under Settings &gt; Your scripts i Cookiebot
                </p>
              </div>
            )}

            {bannerType === 'onetrust' && (
              <div className="space-y-2">
                <Label>OneTrust Application ID</Label>
                <Input
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={onetrustId}
                  onChange={(e) => setOnetrustId(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Hittas i OneTrust Admin Console under Account Management
                </p>
              </div>
            )}

            <Button 
              onClick={importExternalCookies}
              disabled={isImporting || bannerType === 'internal'}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isImporting ? 'Importerar...' : 'Importera cookies'}
            </Button>
          </div>

          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Vad händer vid import?</h5>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Hämtar cookie-kategoriseringar från extern leverantör</li>
              <li>• Uppdaterar vår databas med korrekt cookie-information</li>
              <li>• Synkroniserar consent-inställningar</li>
              <li>• Behåller befintliga tracking-data</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Snabbåtgärder
          </CardTitle>
          <CardDescription>
            Hantera data och GDPR-compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              onClick={exportAllData}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportera all data
            </Button>
            
            <Button 
              variant="outline" 
              onClick={cleanOldData}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Rensa gammal data
            </Button>
            
            <Button 
              variant="outline" 
              onClick={generateGDPRReport}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              GDPR-rapport
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}