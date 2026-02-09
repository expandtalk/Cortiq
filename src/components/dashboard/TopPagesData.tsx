import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText, Eye, Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TopPage {
  url: string;
  views: number;
  title?: string;
  percentage: number;
}

interface TopPagesDataProps {
  siteId: string;
  startDate?: string;
  endDate?: string;
}

export function TopPagesData({ siteId, startDate, endDate }: TopPagesDataProps) {
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [totalViews, setTotalViews] = useState(0);
  const { toast } = useToast();

  const loadTopPages = async () => {
    console.log('📊 Fetching top pages for site:', siteId, 'from', startDate, 'to', endDate);
    setIsLoading(true);
    try {
      // Använd valda datum eller default till senaste 30 dagarna
      const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const defaultEndDate = new Date().toISOString();
      
      const { data: pageViews, error } = await supabase
        .from('page_views')
        .select('url, title')
        .eq('site_id', siteId)
        .gte('viewed_at', startDate || defaultStartDate)
        .lte('viewed_at', endDate || defaultEndDate);

      if (error) throw error;

      if (!pageViews || pageViews.length === 0) {
        setTopPages([]);
        setTotalViews(0);
        setLastUpdated(new Date());
        return;
      }

      // Gruppera och räkna per URL
      const urlCounts = new Map<string, { count: number; title?: string }>();
      
      pageViews.forEach(view => {
        const existing = urlCounts.get(view.url) || { count: 0, title: view.title };
        urlCounts.set(view.url, {
          count: existing.count + 1,
          title: existing.title || view.title
        });
      });

      // Konvertera till array och sortera
      const pages = Array.from(urlCounts.entries())
        .map(([url, data]) => ({
          url,
          views: data.count,
          title: data.title,
          percentage: 0 // Beräknas senare
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10); // Top 10

      // Beräkna procentsatser
      const total = pages.reduce((sum, page) => sum + page.views, 0);
      pages.forEach(page => {
        page.percentage = total > 0 ? (page.views / total) * 100 : 0;
      });

      setTopPages(pages);
      setTotalViews(total);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error loading top pages:', error);
      toast({
        title: "❌ Fel",
        description: "Kunde inte ladda populära sidor"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (siteId) {
      loadTopPages();
    }
  }, [siteId, startDate, endDate]);

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + (urlObj.search ? urlObj.search.substring(0, 20) + '...' : '');
    } catch {
      return url.length > 40 ? url.substring(0, 40) + '...' : url;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Populäraste sidor
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Period: Senaste 30 dagarna • Totalt {totalViews.toLocaleString()} visningar
          </p>
          {lastUpdated && (
            <Badge variant="secondary" className="text-xs">
              Uppdaterad: {lastUpdated.toLocaleTimeString()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({length: 5}).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : topPages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">Inga sidvisningar hittades</p>
            <p className="text-sm">Installera tracking-script för att börja samla data</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {topPages.map((page, index) => (
                <div key={page.url} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <a 
                          href={page.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:text-primary transition-colors truncate"
                        >
                          {formatUrl(page.url)}
                        </a>
                        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      </div>
                      {page.title && (
                        <p className="text-xs text-muted-foreground truncate">
                          {page.title}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{page.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Percent className="h-3 w-3" />
                      {page.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" size="sm" onClick={loadTopPages} disabled={isLoading}>
                {isLoading ? 'Laddar...' : 'Uppdatera data'}
              </Button>
              <div className="text-sm text-muted-foreground">
                Visar topp {topPages.length} av alla sidor
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}