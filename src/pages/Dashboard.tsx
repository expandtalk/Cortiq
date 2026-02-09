import React, { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';
import { Button } from '@/components/ui/button';
import { useSites } from '@/hooks/useSites';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useNavigate } from 'react-router-dom';
import { DateRange } from 'react-day-picker';

export default function Dashboard() {
  const { sites, selectedSite, setSelectedSite } = useSites();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { from: thirtyDaysAgo, to: today };
  });
  const { analytics } = useAnalytics(selectedSite?.id || null, dateRange && dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined);
  const navigate = useNavigate();
  
  console.log('Dashboard render:', { sites, selectedSite, dateRange });
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Site Selector and Global Date Picker */}
        <DashboardHeader 
          selectedSite={selectedSite}
          sites={sites}
          onSiteSelect={setSelectedSite}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {/* Show tabs only when site is selected */}
        {selectedSite ? (
          <DashboardTabs
            selectedSite={selectedSite}
            analytics={analytics}
            dateRange={dateRange}
          />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">Välj en webbsida för att se analytics</h2>
            <p className="text-muted-foreground mb-6">
              Du behöver först lägga till en webbsida för att börja analysera data
            </p>
            <Button onClick={() => navigate('/installation')}>
              Lägg till webbsida
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}