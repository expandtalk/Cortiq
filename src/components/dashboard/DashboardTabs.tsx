import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Settings, Download, ExternalLink, Key } from 'lucide-react';
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
    { value: 'integrations', label: 'Externa Integrationer', icon: ExternalLink },
    { value: 'api-keys', label: 'API-nycklar', icon: Key }
  ];

  const currentSettingsTab = settingsOptions.find(option => option.value === activeTab);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <div className="flex items-center gap-2 border-b pb-2 flex-wrap">
        <TabsList className="flex flex-wrap gap-1 bg-transparent border-0 h-auto p-0">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            Översikt
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="paid-ads" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            Annonser (GA4)
          </TabsTrigger>
          <TabsTrigger value="paid-ads-server" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            Annonser (Server-Side)
          </TabsTrigger>
          <TabsTrigger value="cookiefree" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            Cookiefri
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            Heatmap
          </TabsTrigger>
          <TabsTrigger value="forms" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            Formulär
          </TabsTrigger>
          <TabsTrigger value="abtesting" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            A/B Test
          </TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            AI Traffic
          </TabsTrigger>
          <TabsTrigger value="ai-bots" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            AI Bots
          </TabsTrigger>
          <TabsTrigger value="kpi" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            KPI
          </TabsTrigger>
          <TabsTrigger value="kpi-catalog" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            KPI Katalog
          </TabsTrigger>
          <TabsTrigger value="segments" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            Segment
          </TabsTrigger>
          <TabsTrigger value="navigation" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            Navigering
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">
            Varningar
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
              {currentSettingsTab ? currentSettingsTab.label : 'Inställningar'}
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
    </Tabs>
  );
}