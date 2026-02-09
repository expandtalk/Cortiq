import React from 'react';
import { ABTestingOverview } from '@/components/dashboard/ABTestingOverview';

interface ABTestingTabProps {
  siteId: string;
}

export function ABTestingTab({ siteId }: ABTestingTabProps) {
  return (
    <div className="space-y-6">
      <ABTestingOverview siteId={siteId} />
    </div>
  );
}