import React, { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';
import { OnboardingWizard } from '@/components/dashboard/OnboardingWizard';
import { useSites } from '@/hooks/useSites';
import { useAnalytics } from '@/hooks/useAnalytics';
import { DateRange } from 'react-day-picker';

export default function Dashboard() {
  const { sites, selectedSite, setSelectedSite, loadSites, loading } = useSites();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { from: thirtyDaysAgo, to: today };
  });
  const { analytics } = useAnalytics(selectedSite?.id || null, dateRange && dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined);

  // First-run: no sites yet → guided onboarding (add site + install snippet).
  // Wait for the initial load so the wizard doesn't flash before sites arrive.
  if (!loading && sites.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <OnboardingWizard onComplete={loadSites} />
        </div>
      </div>
    );
  }

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
            <h2 className="text-xl font-semibold mb-4">Select a website to view analytics</h2>
            <p className="text-muted-foreground">
              Choose a website from the selector above to start analyzing data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}