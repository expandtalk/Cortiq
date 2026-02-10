import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Settings, Download, ExternalLink, Key, Zap, Code2, Play, Globe, Database, DollarSign, TrendingUp } from 'lucide-react';
import { OverviewTab } from './tabs/OverviewTab';
import { HeatmapTab } from './tabs/HeatmapTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { PaidAdsTab } from './tabs/PaidAdsTab';
import { ServerSidePaidAdsTab } from './tabs/ServerSidePaidAdsTab';
import { FormAnalyticsTab } from './tabs/FormAnalyticsTab';
import { ABTestingTab } from './tabs/ABTestingTab';
import { AITab } from './tabs/AITab';
import { AIBotTab } from './tabs/AIBotTab';
import { KPITab } from './tabs/KPITab';
import { KPICatalogTab } from './tabs/KPICatalogTab';
import { SegmentsTab } from './tabs/SegmentsTab';
import { SetupTab } from './tabs/SetupTab';
import { ExternalIntegrationsTab } from './tabs/ExternalIntegrationsTab';
import { CookiefreeAnalyticsTab } from './tabs/CookiefreeAnalyticsTab';
import { ApiKeysTab } from './tabs/ApiKeysTab';
import { GDPRTab } from './tabs/GDPRTab';
import { NavigationTab } from './tabs/NavigationTab';
import { BehavioralAlertsTab } from './tabs/BehavioralAlertsTab';
import { UserLTVTab } from './tabs/UserLTVTab';
import { TagManager } from './TagManager';
import { SessionRecordingList } from './SessionRecordingList';
import { GeolocationDashboard } from './GeolocationDashboard';
import { WarehouseConnectorManager } from './WarehouseConnectorManager';
import { FinalFas3Features } from './FinalFas3Features';
import type { Site, Analytics } from '@/types/dashboard';

interface DashboardTabsProps {
  selectedSite: Site;
  analytics: Analytics | null;
  dateRange?: import('react-day-picker').DateRange;
}

export function DashboardTabs({ selectedSite, analytics, dateRange }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  // const { insights, highPriorityCount } = useDashboardInsights(selectedSite.id);

  const settingsOptions = [
    { value: 'setup', label: 'Setup', icon: Settings },
    { value: 'gdpr', label: 'GDPR', icon: Settings },
    { value: 'integrations', label: 'External Integrations', icon: ExternalLink },
    { value: 'api-keys', label: 'API Keys', icon: Key }
  ];

  const advancedOptions = [
    { value: 'tag-manager', label: 'Tag Manager', icon: Code2 },
    { value: 'session-recording', label: 'Session Recording', icon: Play },
    { value: 'geolocation', label: 'Geolocation Maps', icon: Globe },
    { value: 'warehouse', label: 'Data Warehouse', icon: Database },
    { value: 'user-ltv', label: 'User LTV & Cohorts', icon: DollarSign },
    { value: 'advanced-features', label: 'Web Vitals & White Label', icon: TrendingUp }
  ];

  const currentSettingsTab = settingsOptions.find(option => option.value === activeTab);
  const currentAdvancedTab = advancedOptions.find(option => option.value === activeTab);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <div className="flex items-center gap-2 border-b pb-2 flex-wrap">
        <TabsList className="flex flex-wrap gap-1 bg-transparent border-0 h-auto p-0">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="paid-ads" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            Ads (GA4)
          </TabsTrigger>
          <TabsTrigger value="paid-ads-server" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            Ads (Server-Side)
          </TabsTrigger>
          <TabsTrigger value="cookiefree" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            Cookie-Free
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            Heatmap
          </TabsTrigger>
          <TabsTrigger value="forms" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            Forms
          </TabsTrigger>
          <TabsTrigger value="abtesting" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            A/B Testing
          </TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            AI Traffic
          </TabsTrigger>
          <TabsTrigger value="ai-bots" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            AI Agents
          </TabsTrigger>
          <TabsTrigger value="kpi" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            KPI Dashboard
          </TabsTrigger>
          <TabsTrigger value="kpi-catalog" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            KPI Catalog
          </TabsTrigger>
          <TabsTrigger value="segments" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            Segments
          </TabsTrigger>
          <TabsTrigger value="navigation" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            Navigation
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            Alerts
          </TabsTrigger>
        </TabsList>

        {/* Settings Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={settingsOptions.some(opt => opt.value === activeTab) ? "default" : "ghost"}
              className="flex items-center gap-2 h-10 px-4 py-2 whitespace-nowrap"
            >
              <Settings className="h-4 w-4" />
              {currentSettingsTab ? currentSettingsTab.label : 'Settings'}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-card border shadow-lg z-[100]"
            sideOffset={5}
          >
            {settingsOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setActiveTab(option.value)}
                className={`cursor-pointer ${activeTab === option.value ? 'bg-muted' : ''}`}
              >
                <option.icon className="mr-2 h-4 w-4" />
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Advanced Features Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={advancedOptions.some(opt => opt.value === activeTab) ? "default" : "ghost"}
              className="flex items-center gap-2 h-10 px-4 py-2 whitespace-nowrap"
            >
              <Zap className="h-4 w-4" />
              {currentAdvancedTab ? currentAdvancedTab.label : 'Advanced'}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-card border shadow-lg z-[100]"
            sideOffset={5}
          >
            {advancedOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setActiveTab(option.value)}
                className={`cursor-pointer ${activeTab === option.value ? 'bg-muted' : ''}`}
              >
                <option.icon className="mr-2 h-4 w-4" />
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TabsContent value="overview" className="space-y-6">
        <OverviewTab analytics={analytics} siteId={selectedSite.id} selectedSite={selectedSite} dateRange={dateRange} />
      </TabsContent>

      <TabsContent value="heatmap" className="space-y-6">
        <HeatmapTab siteId={selectedSite.id} selectedSite={selectedSite} dateRange={dateRange} />
      </TabsContent>

      <TabsContent value="forms" className="space-y-6">
        <FormAnalyticsTab selectedSite={selectedSite} />
      </TabsContent>

      <TabsContent value="abtesting" className="space-y-6">
        <ABTestingTab siteId={selectedSite.id} />
      </TabsContent>

      <TabsContent value="ai" className="space-y-6">
        <AITab selectedSite={selectedSite} />
      </TabsContent>

      <TabsContent value="ai-bots" className="space-y-6">
        <AIBotTab selectedSite={selectedSite} />
      </TabsContent>

      <TabsContent value="kpi" className="space-y-6">
        <KPITab selectedSite={selectedSite} />
      </TabsContent>

      <TabsContent value="kpi-catalog" className="space-y-6">
        <KPICatalogTab selectedSite={selectedSite} />
      </TabsContent>

      <TabsContent value="segments" className="space-y-6">
        <SegmentsTab selectedSite={selectedSite} />
      </TabsContent>

      <TabsContent value="navigation" className="space-y-6">
        <NavigationTab selectedSite={selectedSite} />
      </TabsContent>

      <TabsContent value="alerts" className="space-y-6">
        <BehavioralAlertsTab selectedSite={selectedSite} />
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6">
        <AnalyticsTab analytics={analytics} dateRange={dateRange} />
      </TabsContent>

      <TabsContent value="paid-ads" className="space-y-6">
        <PaidAdsTab selectedSite={selectedSite.id} kpiData={null} />
      </TabsContent>

      <TabsContent value="paid-ads-server" className="space-y-6">
        <ServerSidePaidAdsTab 
          selectedSite={selectedSite.id}
          startDate={dateRange?.from?.toISOString().split('T')[0]}
          endDate={dateRange?.to?.toISOString().split('T')[0]}
        />
      </TabsContent>

      <TabsContent value="cookiefree" className="space-y-6">
        <CookiefreeAnalyticsTab selectedSite={selectedSite} dateRange={dateRange} />
      </TabsContent>

      <TabsContent value="integrations" className="space-y-6">
        <ExternalIntegrationsTab selectedSite={selectedSite} />
      </TabsContent>

      <TabsContent value="api-keys" className="space-y-6">
        <ApiKeysTab />
      </TabsContent>

      <TabsContent value="gdpr" className="space-y-6">
        <GDPRTab selectedSite={selectedSite} />
      </TabsContent>

      <TabsContent value="setup" className="space-y-6">
        <SetupTab selectedSite={selectedSite} />
      </TabsContent>

      {/* Advanced Features Tabs */}
      <TabsContent value="tag-manager" className="space-y-6">
        <TagManager siteId={selectedSite.id} />
      </TabsContent>

      <TabsContent value="session-recording" className="space-y-6">
        <SessionRecordingList siteId={selectedSite.id} />
      </TabsContent>

      <TabsContent value="geolocation" className="space-y-6">
        <GeolocationDashboard
          siteId={selectedSite.id}
          dateRange={{
            from: dateRange?.from?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            to: dateRange?.to?.toISOString() || new Date().toISOString()
          }}
        />
      </TabsContent>

      <TabsContent value="warehouse" className="space-y-6">
        <WarehouseConnectorManager siteId={selectedSite.id} />
      </TabsContent>

      <TabsContent value="user-ltv" className="space-y-6">
        <UserLTVTab selectedSiteId={selectedSite.id} />
      </TabsContent>

      <TabsContent value="advanced-features" className="space-y-6">
        <FinalFas3Features
          siteId={selectedSite.id}
          companyId={selectedSite.company_id || selectedSite.id}
        />
      </TabsContent>
    </Tabs>
  );
}