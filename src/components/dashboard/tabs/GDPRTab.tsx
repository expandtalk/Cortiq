import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GDPRSettings } from '@/components/gdpr/GDPRSettings';
import CMPDashboard from '@/components/dashboard/CMPDashboard';
import type { Site } from '@/types/dashboard';

interface GDPRTabProps {
  selectedSite: Site;
}

export function GDPRTab({ selectedSite }: GDPRTabProps) {
  return (
    <Tabs defaultValue="gdpr" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="gdpr">GDPR Inställningar</TabsTrigger>
        <TabsTrigger value="cmp">CMP Dashboard</TabsTrigger>
      </TabsList>
      
      <TabsContent value="gdpr">
        <GDPRSettings siteId={selectedSite.id} />
      </TabsContent>
      
      <TabsContent value="cmp">
        <CMPDashboard selectedSite={selectedSite} />
      </TabsContent>
    </Tabs>
  );
}