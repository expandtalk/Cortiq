import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Globe, TrendingUp } from 'lucide-react';
import type { PageHeatmapData } from '@/hooks/useHeatmapData';

interface HeatmapPageSelectorProps {
  pages: PageHeatmapData[];
  selectedUrl: string;
  onUrlChange: (url: string) => void;
  loading?: boolean;
}

export function HeatmapPageSelector({ 
  pages, 
  selectedUrl, 
  onUrlChange, 
  loading 
}: HeatmapPageSelectorProps) {
  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch {
      return url;
    }
  };

  const getPageTitle = (url: string) => {
    const formatted = formatUrl(url);
    if (formatted === '/' || formatted === '') return 'Startsida';
    return formatted.length > 50 ? formatted.substring(0, 50) + '...' : formatted;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <span className="text-sm text-muted-foreground">Laddar sidor...</span>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Inga sidor med heatmap-data hittades
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Välj sida att visa heatmap för</h3>
      </div>
      
      <Select value={selectedUrl} onValueChange={onUrlChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Välj en sida">
            {selectedUrl && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="truncate">{getPageTitle(selectedUrl)}</span>
                <Badge variant="secondary" className="ml-auto">
                  {pages.find(p => p.url === selectedUrl)?.pageViews || 0} visningar
                </Badge>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {pages.map((page, index) => (
            <SelectItem key={page.url} value={page.url}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  <Globe className="h-4 w-4" />
                  <span className="truncate max-w-[200px]">{getPageTitle(page.url)}</span>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {page.pageViews} visningar
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedUrl && (
        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
          <strong>Fullständig URL:</strong> {selectedUrl}
        </div>
      )}
    </div>
  );
}