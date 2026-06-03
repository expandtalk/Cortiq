import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, CheckCircle, AlertCircle, Loader2, Menu, Navigation, Clock } from 'lucide-react';
import type { Site } from '@/types/dashboard';

interface NavigationSyncProps {
  selectedSite: Site;
}

export function NavigationSync({ selectedSite }: NavigationSyncProps) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncStatus('idle');

    try {
      // Always allow manual sync, even if no navigation config exists yet
      const navigationConfig = (selectedSite as any).navigation_config || {};
      
      // Update last sync timestamp and trigger sync
      const now = new Date();
      const updatedConfig = {
        ...navigationConfig,
        manual_sync_requested: now.toISOString(),
        sync_trigger: 'manual_dashboard',
        last_sync_attempt: now.toISOString()
      };

      const { error } = await supabase
        .from('sites')
        .update({ 
          navigation_config: updatedConfig,
          updated_at: now.toISOString()
        })
        .eq('id', selectedSite.id);

      if (error) {
        throw error;
      }

      setLastSync(now);
      setSyncStatus('success');
      
      toast({
        title: "✅ Sync requested",
        description: "Navigation sync has been requested. The WordPress plugin will sync the next time the page loads."
      });

    } catch (error) {
      console.error('Manual sync error:', error);
      setSyncStatus('error');

      toast({
        title: "❌ Sync failed",
        description: "Could not request navigation sync.",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  const navigationConfig = (selectedSite as any).navigation_config;
  const hasNavigationData = navigationConfig && navigationConfig.last_sync;
  const totalMenuItems = navigationConfig?.total_menu_items || 0;
  const menuLocations = navigationConfig?.menu_locations || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          WordPress Navigation Sync
        </CardTitle>
        <CardDescription>
          Sync WordPress menu structure for accurate navigation tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasNavigationData ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>No navigation data found.</strong> Make sure the WordPress plugin is installed
                and activated, and that at least one menu is configured on your WordPress site.
              </AlertDescription>
            </Alert>
            
            {/* Sync Button for Initial Setup */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">First sync</h4>
                  <p className="text-sm text-muted-foreground">
                    Press to attempt syncing navigation from WordPress
                  </p>
                </div>
              </div>
              <Button
                onClick={handleManualSync}
                disabled={syncing}
                variant="default"
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
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sync Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {syncStatus === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : syncStatus === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <RefreshCw className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <h4 className="font-medium">Sync Status</h4>
                  <p className="text-sm text-muted-foreground">
                    {syncStatus === 'success' 
                      ? 'Last sync succeeded'
                      : syncStatus === 'error'
                      ? 'Sync failed'
                      : 'Ready to sync'
                    }
                  </p>
                </div>
              </div>
              <Button
                onClick={handleManualSync}
                disabled={syncing}
                variant="outline"
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
            </div>

            {/* Navigation Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Menu className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Menu items</p>
                  <p className="text-xl font-bold">{totalMenuItems}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Navigation className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Menu locations</p>
                  <p className="text-xl font-bold">{menuLocations.length}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last sync</p>
                  <p className="text-sm font-bold">
                    {navigationConfig.last_sync
                      ? new Date(navigationConfig.last_sync).toLocaleDateString('sv-SE')
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Locations */}
            {menuLocations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Active menu locations:</h4>
                <div className="flex flex-wrap gap-2">
                  {menuLocations.map((location: string) => (
                    <Badge key={location} variant="secondary" className="capitalize">
                      {location}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Sync Info */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Automatic sync:</strong> The navigation structure syncs automatically when
                you update menus in WordPress. Use "Sync now" only if you suspect the
                data is not up to date.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}