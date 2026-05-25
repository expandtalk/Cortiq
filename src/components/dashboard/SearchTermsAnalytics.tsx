import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGA4SearchTerms } from '@/hooks/useGA4SearchTerms';
import { Search, TrendingUp, Calendar } from 'lucide-react';

interface SearchTermsAnalyticsProps {
  siteId: string | null;
  dateRange?: { from: Date; to: Date };
  onNavigateToIntegrations?: () => void;
}

export function SearchTermsAnalytics({ siteId, dateRange, onNavigateToIntegrations }: SearchTermsAnalyticsProps) {
  const { searchTerms, loading, error } = useGA4SearchTerms({ siteId, dateRange });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Term Analysis
          </CardTitle>
          <CardDescription>Loading search data from GA4...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const isNotConfigured =
      error.toLowerCase().includes('service account') ||
      error.toLowerCase().includes('not configured') ||
      error.toLowerCase().includes('non-2xx') ||
      error.toLowerCase().includes('integration not enabled');

    const isPermission =
      error.toLowerCase().includes('permission') ||
      error.toLowerCase().includes('behörighet');

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Term Analysis
          </CardTitle>
          <CardDescription>
            {isNotConfigured ? 'Setup required' : 'Problem fetching search data'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isNotConfigured ? (
            <div className="flex items-start gap-3 text-sm">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold mt-0.5">!</span>
              <div className="space-y-1">
                <p className="text-muted-foreground">
                  Requires a GA4 service account.{' '}
                  {onNavigateToIntegrations && (
                    <button className="text-primary hover:underline" onClick={onNavigateToIntegrations}>
                      Configure under Mer → Data Sources → GA4 →
                    </button>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  After setup: GA4 Admin → Property Access Management → add service account email with Viewer role.
                </p>
              </div>
            </div>
          ) : isPermission ? (
            <p className="text-sm text-muted-foreground">
              Permission error: add the service account email as Viewer in GA4 Admin → Property Access Management.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{error}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (searchTerms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Term Analysis
          </CardTitle>
          <CardDescription>No search terms found for this period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground p-4 bg-muted rounded">
            <p className="font-medium text-foreground mb-2">🔍 No search activity</p>
            <p className="mb-2">To track search terms your website needs:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>A search function with query parameters (q, s, search, query, keyword)</li>
              <li>GA4 Enhanced Measurement enabled</li>
              <li>Or manual view_search_results event tracking</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalSearches = searchTerms.reduce((sum, term) => sum + term.count, 0);
  const topSearchTerms = searchTerms.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Term Analysis
        </CardTitle>
        <CardDescription>
          Top search terms from GA4 ({totalSearches} total searches)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topSearchTerms.map((searchTerm, index) => {
            const percentage = ((searchTerm.count / totalSearches) * 100).toFixed(1);
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {percentage}%
                      </Badge>
                    </div>
                    <p className="font-medium text-sm">
                      "{searchTerm.term}"
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Last: {new Date(searchTerm.lastSearched).toLocaleDateString('en-US')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {searchTerm.count}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    searches
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {searchTerms.length > 10 && (
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Showing top 10 of {searchTerms.length} search terms
            </p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            <p className="mb-2">💡 <strong>Tips for better search tracking:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Use standardized query parameters (q, s, search)</li>
              <li>Enable Enhanced Measurement in GA4</li>
              <li>Implement custom search events for advanced tracking</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}