import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NavigationAnalytics } from '@/components/dashboard/NavigationAnalytics';
import { SiteSelector } from '@/components/dashboard/SiteSelector';
import { useSites } from '@/hooks/useSites';
import PublicNavigation from '@/components/PublicNavigation';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Navigation() {
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const { sites } = useSites();
  const selectedSite = sites?.find(site => site.id === selectedSiteId);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-subtle">
        <PublicNavigation />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gradient-primary mb-2">
                Navigering
              </h1>
              <p className="text-muted-foreground">
                Analysera hur användare navigerar på din webbplats och optimera menystrukturen.
              </p>
            </div>

            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Välj webbplats</CardTitle>
                </CardHeader>
                <CardContent>
                  <SiteSelector
                    sites={sites || []}
                    selectedSite={selectedSite || null}
                    onSiteSelect={(site) => setSelectedSiteId(site.id)}
                  />
                </CardContent>
              </Card>
            </div>

            <NavigationAnalytics
              siteId={selectedSiteId}
              selectedSite={selectedSite}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}