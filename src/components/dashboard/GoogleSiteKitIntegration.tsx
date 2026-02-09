import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Settings, CheckCircle, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Site } from '@/types/dashboard';

interface GoogleSiteKitIntegrationProps {
  selectedSite: Site;
  isEnabled?: boolean;
  onToggle?: (enabled: boolean) => void;
}

interface SiteKitStatus {
  detected: boolean;
  configured: boolean;
  analytics: {
    connected: boolean;
    propertyId?: string;
    measurementId?: string;
  };
  searchConsole: {
    connected: boolean;
    propertyId?: string;
  };
  lastSync?: string;
  version?: string;
}

export function GoogleSiteKitIntegration({ 
  selectedSite, 
  isEnabled = false, 
  onToggle 
}: GoogleSiteKitIntegrationProps) {
  const [siteKitStatus, setSiteKitStatus] = useState<SiteKitStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkSiteKitStatus();
  }, [selectedSite.id]);

  const checkSiteKitStatus = async () => {
    setLoading(true);
    try {
      // Kontrollera Site Kit-status via WordPress REST API eller Supabase
      const response = await fetch(`${selectedSite.domain}/wp-json/heatmap-analytics/v1/sitekit-status`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const status = await response.json();
        setSiteKitStatus(status);
      } else {
        // Fallback: Kontrollera via Supabase om vi har lagrad Site Kit-data
        const { data: siteData } = await supabase
          .from('sites')
          .select('domain, name')
          .eq('id', selectedSite.id)
          .single();

        if (siteData) {
          // Default status when no direct WordPress connection available
          setSiteKitStatus({
            detected: false,
            configured: false,
            analytics: { connected: false },
            searchConsole: { connected: false }
          });
        } else {
          setSiteKitStatus({
            detected: false,
            configured: false,
            analytics: { connected: false },
            searchConsole: { connected: false }
          });
        }
      }
    } catch (error) {
      console.error('Failed to check Site Kit status:', error);
      setSiteKitStatus({
        detected: false,
        configured: false,
        analytics: { connected: false },
        searchConsole: { connected: false }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!siteKitStatus?.detected) {
      toast({
        title: "Site Kit inte upptäckt",
        description: "Google Site Kit verkar inte vara installerat eller aktiverat på denna webbplats.",
        variant: "destructive"
      });
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sitekit-sync', {
        body: {
          siteId: selectedSite.id,
          siteUrl: selectedSite.domain,
          syncType: 'full'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Synkronisering slutförd",
          description: "Site Kit-data har synkroniserats framgångsrikt."
        });
        
        // Uppdatera status
        await checkSiteKitStatus();
      } else {
        throw new Error(data.message || 'Synkronisering misslyckades');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Synkronisering misslyckades",
        description: error instanceof Error ? error.message : "Ett okänt fel uppstod.",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleIntegration = (enabled: boolean) => {
    if (onToggle) {
      onToggle(enabled);
    }
    
    if (enabled && siteKitStatus?.detected) {
      // Om integration aktiveras och Site Kit är upptäckt, kör automatisk sync
      setTimeout(() => handleSync(), 1000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Kontrollerar Site Kit-status...</span>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (!siteKitStatus?.detected) {
      return <Badge variant="secondary">Inte upptäckt</Badge>;
    }
    if (!siteKitStatus.configured) {
      return <Badge variant="outline">Inte konfigurerad</Badge>;
    }
    if (siteKitStatus.analytics.connected || siteKitStatus.searchConsole.connected) {
      return <Badge variant="default">Konfigurerad</Badge>;
    }
    return <Badge variant="secondary">Delvis konfigurerad</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Google Site Kit</CardTitle>
            </div>
            {getStatusBadge()}
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggleIntegration}
            disabled={!siteKitStatus?.detected}
          />
        </div>
        <CardDescription>
          Automatisk integration med Google Site Kit plugin för WordPress
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!siteKitStatus?.detected ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Google Site Kit inte upptäckt</strong><br />
              För att använda denna integration måste Google Site Kit vara installerat och aktiverat på din WordPress-webbplats.
              <div className="mt-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://wordpress.org/plugins/google-site-kit/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Installera Site Kit
                  </a>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {/* Status Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  {siteKitStatus.analytics.connected ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  <Label className="font-medium">Google Analytics</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {siteKitStatus.analytics.connected ? 'Ansluten' : 'Inte ansluten'}
                </p>
                {siteKitStatus.analytics.propertyId && (
                  <p className="text-xs text-muted-foreground">
                    Property: {siteKitStatus.analytics.propertyId}
                  </p>
                )}
              </div>

              <div className="p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  {siteKitStatus.searchConsole.connected ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  <Label className="font-medium">Search Console</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {siteKitStatus.searchConsole.connected ? 'Ansluten' : 'Inte ansluten'}
                </p>
              </div>
            </div>

            {/* Sync Status */}
            {siteKitStatus.lastSync && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm">
                  <strong>Senaste synkronisering:</strong> {new Date(siteKitStatus.lastSync).toLocaleString('sv-SE')}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                onClick={handleSync} 
                disabled={syncing || !isEnabled}
                size="sm"
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Synkroniserar...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Synkronisera nu
                  </>
                )}
              </Button>

              <Button variant="outline" size="sm" asChild>
                <a href={`${selectedSite.domain}/wp-admin/admin.php?page=googlesitekit-dashboard`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Öppna Site Kit
                </a>
              </Button>
            </div>

            {/* Integration Benefits */}
            {isEnabled && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Integration aktiverad!</strong><br />
                  Data från dina Site Kit-anslutningar synkroniseras automatiskt och visas i dashboarden.
                  Detta inkluderar Search Console-data, Analytics-metrics och PageSpeed-resultat.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}