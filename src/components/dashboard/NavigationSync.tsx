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
        title: "✅ Sync begärd",
        description: "Navigation-synkning har begärts. WordPress-pluginet kommer att synka nästa gång sidan laddas."
      });

    } catch (error) {
      console.error('Manual sync error:', error);
      setSyncStatus('error');
      
      toast({
        title: "❌ Sync misslyckades",
        description: "Kunde inte begära navigation-synkning.",
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
          Synkronisera WordPress-menystruktur för exakt navigation tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasNavigationData ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Ingen navigation-data hittad.</strong> Se till att WordPress-pluginet är installerat 
                och aktiverat, och att minst en meny är konfigurerad på din WordPress-sida.
              </AlertDescription>
            </Alert>
            
            {/* Sync Button for Initial Setup */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Första synkning</h4>
                  <p className="text-sm text-muted-foreground">
                    Tryck för att försöka synka navigation från WordPress
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
                    Synkar...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Synka nu
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
                      ? 'Senaste sync lyckades'
                      : syncStatus === 'error'
                      ? 'Sync misslyckades'
                      : 'Redo för synkning'
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
                    Synkar...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Synka nu
                  </>
                )}
              </Button>
            </div>

            {/* Navigation Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Menu className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Menyposter</p>
                  <p className="text-xl font-bold">{totalMenuItems}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Navigation className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Menyplaceringar</p>
                  <p className="text-xl font-bold">{menuLocations.length}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Senaste sync</p>
                  <p className="text-sm font-bold">
                    {navigationConfig.last_sync 
                      ? new Date(navigationConfig.last_sync).toLocaleDateString('sv-SE')
                      : 'Aldrig'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Locations */}
            {menuLocations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Aktiva menyplaceringar:</h4>
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
                <strong>Automatisk synkning:</strong> Navigation-strukturen synkas automatiskt när 
                du uppdaterar menyer i WordPress. Använd "Synka nu" endast om du misstänker att 
                datan inte är uppdaterad.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}