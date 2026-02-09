import React from 'react';
import { AnalyticsOverview } from '@/components/dashboard/AnalyticsOverview';
import { TopPagesData } from '@/components/dashboard/TopPagesData';
import { ImportantInteractions } from '@/components/dashboard/ImportantInteractions';
import { SearchTermsAnalytics } from '@/components/dashboard/SearchTermsAnalytics';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { AIInsightsWidget } from '@/components/dashboard/AIInsightsWidget';
import { RealTimeWidget } from '@/components/dashboard/RealTimeWidget';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import type { Analytics } from '@/types/dashboard';
import { DateRange } from 'react-day-picker';

interface OverviewTabProps {
  analytics: Analytics | null;
  siteId: string;
  selectedSite: { id: string; site_name: string };
  dateRange?: DateRange;
}

export function OverviewTab({ analytics, siteId, selectedSite, dateRange }: OverviewTabProps) {
  const today = new Date();
  const startDate = dateRange?.from ? new Date(Math.min(dateRange.from.getTime(), today.getTime())).toISOString().split('T')[0] : '';
  const endDate = dateRange?.to ? new Date(Math.min(dateRange.to.getTime(), today.getTime())).toISOString().split('T')[0] : '';

  if (!analytics) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Insights - Top Priority */}
          <div className="card-variant-2 rounded-lg p-6 hover-lift hover-glow">
            <AIInsightsWidget siteId={selectedSite.id} />
          </div>
          
          <div className="card-variant-1 rounded-lg p-6 hover-lift">
            <AnalyticsOverview analytics={analytics} />
          </div>
        </div>
        
        {/* Right Column - Side Widgets */}
        <div className="space-y-6">
          {/* Real-time Stats */}
          <div className="card-variant-3 rounded-lg p-6 hover-lift hover-glow">
            <RealTimeWidget siteId={selectedSite.id} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-variant-1 rounded-lg p-6 hover-lift">
          <TopPagesData 
            siteId={siteId} 
            startDate={startDate} 
            endDate={endDate} 
          />
        </div>
        <div className="card-variant-4 rounded-lg p-6 hover-lift">
          <ImportantInteractions 
            siteId={siteId} 
            dateRange={dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined} 
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="card-variant-2 rounded-lg p-6 hover-lift">
          <SearchTermsAnalytics 
            siteId={siteId} 
            dateRange={dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined} 
          />
        </div>
      </div>
    </div>
  );
}