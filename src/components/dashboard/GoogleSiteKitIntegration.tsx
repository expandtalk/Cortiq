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
        title: "Site Kit not detected",
        description: "Google Site Kit does not appear to be installed or activated on this website.",
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
          title: "Sync complete",
          description: "Site Kit data has been synced successfully."
        });

        await checkSiteKitStatus();
      } else {
        throw new Error(data.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
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
        <span>Checking Site Kit status...</span>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (!siteKitStatus?.detected) {
      return <Badge variant="secondary">Not detected</Badge>;
    }
    if (!siteKitStatus.configured) {
      return <Badge variant="outline">Not configured</Badge>;
    }
    if (siteKitStatus.analytics.connected || siteKitStatus.searchConsole.connected) {
      return <Badge variant="default">Configured</Badge>;
    }
    return <Badge variant="secondary">Partially configured</Badge>;
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
          Automatic integration with the Google Site Kit plugin for WordPress
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!siteKitStatus?.detected ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Google Site Kit not detected</strong><br />
              To use this integration, Google Site Kit must be installed and activated on your WordPress website.
              <div className="mt-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://wordpress.org/plugins/google-site-kit/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Install Site Kit
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
                  {siteKitStatus.analytics.connected ? 'Connected' : 'Not connected'}
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
                  {siteKitStatus.searchConsole.connected ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>

            {/* Sync Status */}
            {siteKitStatus.lastSync && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm">
                  <strong>Last sync:</strong> {new Date(siteKitStatus.lastSync).toLocaleString('sv-SE')}
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
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync now
                  </>
                )}
              </Button>

              <Button variant="outline" size="sm" asChild>
                <a href={`${selectedSite.domain}/wp-admin/admin.php?page=googlesitekit-dashboard`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Site Kit
                </a>
              </Button>
            </div>

            {/* Integration Benefits */}
            {isEnabled && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Integration enabled!</strong><br />
                  Data from your Site Kit connections is synced automatically and displayed in the dashboard.
                  This includes Search Console data, Analytics metrics, and PageSpeed results.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}