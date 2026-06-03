import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, Globe, BarChart3, Info, TrendingUp, Target, Tag, Settings, CheckCircle } from 'lucide-react';
import { GoogleAnalyticsIntegration } from '@/components/dashboard/GoogleAnalyticsIntegration';
import { GoogleSearchConsoleSetup } from '@/components/dashboard/GoogleSearchConsoleSetup';
import { BingWebmasterSetup } from '@/components/dashboard/BingWebmasterSetup';
import { GoogleSiteKitIntegration } from '@/components/dashboard/GoogleSiteKitIntegration';
import { TikTokIntegration } from '@/components/dashboard/integrations/TikTokIntegration';
import { useIntegrations, useUpdateIntegrations, type IntegrationItem } from '@/hooks/useIntegrations';
import type { Site } from '@/types/dashboard';

interface ExternalIntegrationsTabProps {
  selectedSite: Site;
}

const integrationItems: IntegrationItem[] = [
  // WordPress & CMS
  { key: 'sitekit', name: 'Google Site Kit', category: 'wordpress', enabledField: 'sitekit_integration_enabled', description: 'Auto-detects and synchronizes Site Kit data', isWordPress: true },

  // Analytics
  { key: 'heatmap', name: 'CortIQ Visual Analytics', category: 'analytics', enabledField: 'heatmap_tracking_enabled', description: 'Internal heatmap tracking' },
  { key: 'google-analytics', name: 'Google Analytics', category: 'analytics', enabledField: 'ga_integration_enabled', configField: 'ga_measurement_id', placeholder: 'G-XXXXXXXXXX' },
  { key: 'hotjar', name: 'Hotjar', category: 'analytics', enabledField: 'hotjar_enabled', configField: 'hotjar_site_id', placeholder: 'Site ID' },
  { key: 'clarity', name: 'Microsoft Clarity', category: 'analytics', enabledField: 'microsoft_clarity_enabled', configField: 'microsoft_clarity_project_id', placeholder: 'Project ID' },
  { key: 'mixpanel', name: 'Mixpanel', category: 'analytics', enabledField: 'mixpanel_enabled', configField: 'mixpanel_token', placeholder: 'Token' },
  
  // Marketing  
  { key: 'google-ads', name: 'Google Ads Remarketing', category: 'marketing', enabledField: 'google_ads_enabled', configField: 'google_ads_conversion_id', placeholder: 'Conversion ID', secondaryConfigField: 'google_ads_developer_token', secondaryPlaceholder: 'Developer Token (för Enhanced Conversions)' },
  { key: 'facebook', name: 'Facebook/Instagram Pixel', category: 'marketing', enabledField: 'facebook_pixel_enabled', configField: 'facebook_pixel_id', placeholder: 'Pixel ID', secondaryConfigField: 'facebook_conversion_api_token', secondaryPlaceholder: 'Conversions API Access Token' },
  { key: 'tiktok', name: 'TikTok Pixel', category: 'marketing', enabledField: 'tiktok_pixel_enabled', configField: 'tiktok_pixel_id', placeholder: 'C9XXXXXXXXXXXXX', secondaryConfigField: 'tiktok_events_api_token', secondaryPlaceholder: 'Events API Access Token', highRisk: true },
  { key: 'linkedin', name: 'LinkedIn Insight', category: 'marketing', enabledField: 'linkedin_insight_enabled', configField: 'linkedin_partner_id', placeholder: 'Partner ID', secondaryConfigField: 'linkedin_conversion_api_token', secondaryPlaceholder: 'Conversions API Access Token' },
  { key: 'shopify', name: 'Shopify Customer Events', category: 'marketing', enabledField: 'shopify_enabled', configField: 'shopify_store_url', placeholder: 'mystore.myshopify.com', secondaryConfigField: 'shopify_access_token', secondaryPlaceholder: 'Admin API Access Token' },
  { key: 'hubspot', name: 'HubSpot', category: 'marketing', enabledField: 'hubspot_enabled', configField: 'hubspot_hub_id', placeholder: 'Hub ID' },
  
  // Tag Managers
  { key: 'gtm', name: 'Google Tag Manager', category: 'tag_manager', enabledField: 'gtm_enabled', configField: 'gtm_container_id', placeholder: 'GTM-XXXXXXX' },
  { key: 'adobe-tm', name: 'Adobe Tag Manager', category: 'tag_manager', enabledField: 'adobe_tag_manager_enabled', configField: 'adobe_container_id', placeholder: 'Container ID' },
  
  // Automation
  { key: 'pardot', name: 'Salesforce Pardot', category: 'automation', enabledField: 'salesforce_pardot_enabled', configField: 'salesforce_account_id', placeholder: 'Account ID' },
  { key: 'eloqua', name: 'Oracle Eloqua', category: 'automation', enabledField: 'oracle_eloqua_enabled', configField: 'oracle_site_id', placeholder: 'Site ID' },
  { key: 'activecampaign', name: 'ActiveCampaign', category: 'automation', enabledField: 'activecampaign_enabled', configField: 'activecampaign_account', placeholder: 'Account' },
  { key: 'marketo', name: 'Marketo', category: 'automation', enabledField: 'marketo_enabled', configField: 'marketo_munchkin_id', placeholder: 'Munchkin ID' },
];

function IntegrationSection({ title, icon: Icon, items, siteData, onUpdate, selectedSite }: {
  title: string;
  icon: any;
  items: IntegrationItem[];
  siteData: any;
  onUpdate: (updates: any) => void;
  selectedSite?: Site;
}) {
  const [pendingUpdates, setPendingUpdates] = useState<any>({});

  const handleToggle = (item: IntegrationItem, enabled: boolean) => {
    const updates = { [item.enabledField]: enabled };
    if (!enabled && item.configField) {
      updates[item.configField] = null;
    }
    setPendingUpdates(prev => ({ ...prev, ...updates }));
  };

  const handleConfigChange = (item: IntegrationItem, value: string) => {
    if (item.configField) {
      setPendingUpdates(prev => ({ ...prev, [item.configField]: value }));
    }
  };

  const handleSave = () => {
    onUpdate(pendingUpdates);
    setPendingUpdates({});
  };

  const hasChanges = Object.keys(pendingUpdates).length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => {
          const isEnabled = pendingUpdates[item.enabledField] ?? siteData?.[item.enabledField] ?? false;
          const configValue = pendingUpdates[item.configField as string] ?? siteData?.[item.configField as string] ?? '';
          
          // Special handling for Site Kit
          if (item.key === 'sitekit' && selectedSite) {
            return (
              <div key={item.key} className="border rounded-lg">
                <GoogleSiteKitIntegration
                  selectedSite={selectedSite}
                  isEnabled={isEnabled}
                  onToggle={(enabled) => handleToggle(item, enabled)}
                />
              </div>
            );
          }

          // Special handling for TikTok Pixel
          if (item.key === 'tiktok' && selectedSite) {
            return (
              <div key={item.key} className="border rounded-lg">
                <TikTokIntegration
                  isEnabled={isEnabled}
                  pixelId={configValue}
                  onToggle={(enabled) => handleToggle(item, enabled)}
                  onConfigChange={(config) => {
                    if (config.pixelId) {
                      handleConfigChange(item, config.pixelId);
                    }
                  }}
                />
              </div>
            );
          }
          
          return (
            <div key={item.key} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={isEnabled || item.isActive}
                    disabled={item.isActive}
                    onCheckedChange={(checked) => handleToggle(item, checked)}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Label className="font-medium">{item.name}</Label>
                      {item.isActive && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {item.isWordPress && <Badge variant="outline" className="text-xs">WordPress</Badge>}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                </div>
                
                {item.configField && isEnabled && !item.isActive && (
                  <div className="w-48">
                    <Input
                      placeholder={item.placeholder}
                      value={configValue}
                      onChange={(e) => handleConfigChange(item, e.target.value)}
                    />
                  </div>
                )}
              </div>
              
              {item.secondaryConfigField && isEnabled && !item.isActive && (
                <div className="pl-11">
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Server-Side API (Optional)
                  </Label>
                  <Input
                    placeholder={item.secondaryPlaceholder}
                    value={pendingUpdates[item.secondaryConfigField as string] ?? siteData?.[item.secondaryConfigField as string] ?? ''}
                    onChange={(e) => {
                      if (item.secondaryConfigField) {
                        setPendingUpdates(prev => ({ ...prev, [item.secondaryConfigField as string]: e.target.value }));
                      }
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
        
        {hasChanges && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave}>
              Save changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ExternalIntegrationsTab({ selectedSite }: ExternalIntegrationsTabProps) {
  const { data: siteData } = useIntegrations(selectedSite.id);
  const updateIntegrations = useUpdateIntegrations();

  const handleUpdate = (updates: any) => {
    updateIntegrations.mutate({
      siteId: selectedSite.id,
      config: updates
    });
  };

  const wordpressItems = integrationItems.filter(item => item.category === 'wordpress');
  const analyticsItems = integrationItems.filter(item => item.category === 'analytics');
  const marketingItems = integrationItems.filter(item => item.category === 'marketing');
  const tagManagerItems = integrationItems.filter(item => item.category === 'tag_manager');
  const automationItems = integrationItems.filter(item => item.category === 'automation');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Integration Hub</h2>
        <p className="text-muted-foreground">
          Manage all your marketing and analytics tools. Only enabled integrations will appear in the cookie banner.
        </p>
      </div>

      {/* Important Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>GDPR-Smart:</strong> When you enable an integration, its cookies are automatically added to
          the cookie banner. Disabled tools are not shown to visitors, reducing complexity.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        {/* WordPress Integrations */}
        {wordpressItems.length > 0 && (
          <IntegrationSection
            title="🔌 WordPress Integrations"
            icon={Settings}
            items={wordpressItems}
            siteData={siteData}
            onUpdate={handleUpdate}
            selectedSite={selectedSite}
          />
        )}

        <IntegrationSection
          title="📊 Analytics"
          icon={TrendingUp}
          items={analyticsItems}
          siteData={siteData}
          onUpdate={handleUpdate}
          selectedSite={selectedSite}
        />

        <IntegrationSection
          title="🎯 Marketing"
          icon={Target}
          items={marketingItems}
          siteData={siteData}
          onUpdate={handleUpdate}
          selectedSite={selectedSite}
        />

        <IntegrationSection
          title="🏷️ Tag Managers"
          icon={Tag}
          items={tagManagerItems}
          siteData={siteData}
          onUpdate={handleUpdate}
          selectedSite={selectedSite}
        />

        <IntegrationSection
          title="🏢 Marketing Automation"
          icon={Settings}
          items={automationItems}
          siteData={siteData}
          onUpdate={handleUpdate}
          selectedSite={selectedSite}
        />
      </div>

      {/* Legacy Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>🔗 API Integrations (Advanced)</CardTitle>
          <CardDescription>
            Direct API connections for advanced users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="google-search-console" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="google-search-console" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Google Search Console</span>
                <span className="sm:hidden">GSC</span>
              </TabsTrigger>
              <TabsTrigger value="bing-webmaster" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Bing Webmaster</span>
                <span className="sm:hidden">Bing</span>
              </TabsTrigger>
              <TabsTrigger value="google-analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Google Analytics API</span>
                <span className="sm:hidden">GA API</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="google-search-console" className="mt-6">
              <GoogleSearchConsoleSetup selectedSite={selectedSite} />
            </TabsContent>

            <TabsContent value="bing-webmaster" className="mt-6">
              <BingWebmasterSetup selectedSite={selectedSite} />
            </TabsContent>

            <TabsContent value="google-analytics" className="mt-6">
              <GoogleAnalyticsIntegration selectedSite={selectedSite} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}