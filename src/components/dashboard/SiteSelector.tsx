import React from 'react';
import { Button } from '@/components/ui/button';

interface Site {
  id: string;
  site_name: string;
  domain: string;
  tracking_id: string;
  is_active: boolean;
  created_at: string;
}

interface SiteSelectorProps {
  sites: Site[];
  selectedSite: Site | null;
  onSiteSelect: (site: Site) => void;
}

export function SiteSelector({ sites, selectedSite, onSiteSelect }: SiteSelectorProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {sites.map((site) => (
        <Button
          key={site.id}
          variant={selectedSite?.id === site.id ? 'default' : 'outline'}
          onClick={() => onSiteSelect(site)}
          className="flex items-center gap-2"
        >
          <div className={`w-2 h-2 rounded-full ${site.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
          {site.site_name}
        </Button>
      ))}
    </div>
  );
}