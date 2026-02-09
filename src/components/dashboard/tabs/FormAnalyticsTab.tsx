import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormAnalyticsOverview } from '../FormAnalyticsOverview';
import { FormFunnelVisualization } from '../FormFunnelVisualization';
import { FormTypeSelector } from '../FormTypeSelector';
import { SystemSpecificConfig } from '../SystemSpecificConfig';
import { ConversionGoalsConfig } from '../ConversionGoalsConfig';
import { useFormAnalytics } from '@/hooks/useFormAnalytics';
import type { Site } from '@/types/dashboard';
import { 
  BarChart3, 
  TrendingDown, 
  Users, 
  FileText,
  Filter,
  Settings
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface FormAnalyticsTabProps {
  selectedSite: Site;
}

export function FormAnalyticsTab({ selectedSite }: FormAnalyticsTabProps) {
  const { data: forms } = useFormAnalytics(selectedSite.id);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [selectedFormType, setSelectedFormType] = useState<string>('');
  const [systemConfigured, setSystemConfigured] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'setup' | 'config' | 'goals' | 'overview' | 'funnel' | 'heatmap'>('setup');

  // Auto-select first form when forms load
  React.useEffect(() => {
    if (forms && forms.length > 0 && !selectedFormId) {
      setSelectedFormId(forms[0].form_id);
    }
  }, [forms, selectedFormId]);

  const selectedForm = forms?.find(form => form.form_id === selectedFormId);

  const getFormTypeIcon = (type: string) => {
    switch (type) {
      case 'contact_form_7':
        return '📝';
      case 'gravity_forms':
        return '⚡';
      case 'woocommerce_checkout':
        return '🛒';
      default:
        return '📋';
    }
  };

  const getFormTypeName = (type: string) => {
    switch (type) {
      case 'contact_form_7':
        return 'Contact Form 7';
      case 'gravity_forms':
        return 'Gravity Forms';
      case 'woocommerce_checkout':
        return 'WooCommerce Checkout';
      default:
        return 'Anpassat formulär';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Formuläranalys</h2>
          <p className="text-muted-foreground">
            Analysera prestanda för Contact Form 7, Gravity Forms och andra formulär
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {forms && forms.length > 0 && (
            <Select value={selectedFormId} onValueChange={setSelectedFormId}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Välj formulär att analysera" />
              </SelectTrigger>
              <SelectContent>
                {forms.map((form) => (
                  <SelectItem key={form.form_id} value={form.form_id}>
                    <div className="flex items-center gap-2">
                      <span>{getFormTypeIcon(form.form_type)}</span>
                      <div>
                        <p className="font-medium">{form.form_name || form.form_id}</p>
                        <p className="text-xs text-muted-foreground">
                          {getFormTypeName(form.form_type)}
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Välj System
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2" disabled={!selectedFormType}>
            <Settings className="h-4 w-4" />
            Konfigurera
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Konverteringsmål
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2" disabled={!systemConfigured}>
            <BarChart3 className="h-4 w-4" />
            Översikt
          </TabsTrigger>
          <TabsTrigger value="funnel" className="flex items-center gap-2" disabled={!selectedFormId}>
            <TrendingDown className="h-4 w-4" />
            Formulärtratt
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="flex items-center gap-2" disabled={!selectedFormId}>
            <Users className="h-4 w-4" />
            Formulär-heatmap
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <FormTypeSelector 
            onTypeSelect={(type) => {
              setSelectedFormType(type);
              setActiveView('config');
            }}
            selectedType={selectedFormType}
          />
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          {selectedFormType && (
            <SystemSpecificConfig 
              systemType={selectedFormType}
              onConfigSave={(config) => {
                console.log('System configuration saved:', config);
                setSystemConfigured(true);
                setActiveView('overview');
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <ConversionGoalsConfig selectedSite={selectedSite} />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <FormAnalyticsOverview selectedSite={selectedSite} />
        </TabsContent>

        <TabsContent value="funnel" className="space-y-6">
          {selectedFormId ? (
            <FormFunnelVisualization 
              siteId={selectedSite.id} 
              formId={selectedFormId}
              formName={selectedForm?.form_name}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Välj ett formulär</CardTitle>
                <CardDescription>
                  Välj ett formulär från dropdown-menyn ovan för att se funnelanalys.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-6">
          {selectedFormId ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Formulär-heatmap: {selectedForm?.form_name || selectedFormId}
                </CardTitle>
                <CardDescription>
                  Visar var användare klickar, fokuserar och interagerar i formuläret
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🔥</div>
                  <h3 className="text-lg font-semibold mb-2">Formulär-heatmap</h3>
                  <p className="text-muted-foreground mb-4">
                    Denna funktion visar interaktions-heatmaps för specifika formulärfält
                  </p>
                  <div className="text-sm text-muted-foreground">
                    Kommer snart: Visuell representation av klick- och fokusdata för formulärfält
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Välj ett formulär</CardTitle>
                <CardDescription>
                  Välj ett formulär från dropdown-menyn ovan för att se heatmap-data.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Stats Footer */}
      {forms && forms.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4 text-center">
              <div>
                <div className="text-2xl font-bold">{forms.length}</div>
                <p className="text-sm text-muted-foreground">Aktiva formulär</p>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {forms.reduce((sum, form) => sum + form.total_starts, 0).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Totala starter</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {forms.reduce((sum, form) => sum + form.total_completions, 0).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Slutförda</p>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {forms.length > 0 
                    ? (forms.reduce((sum, form) => sum + form.conversion_rate, 0) / forms.length).toFixed(1)
                    : 0}%
                </div>
                <p className="text-sm text-muted-foreground">Genomsnittlig konvertering</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}