import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGA4SearchTerms } from '@/hooks/useGA4SearchTerms';
import { Search, TrendingUp, Calendar } from 'lucide-react';
import { GA4SetupGuide } from './GA4SetupGuide';

interface SearchTermsAnalyticsProps {
  siteId: string | null;
  dateRange?: { from: Date; to: Date };
}

export function SearchTermsAnalytics({ siteId, dateRange }: SearchTermsAnalyticsProps) {
  const { searchTerms, loading, error } = useGA4SearchTerms({ siteId, dateRange });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Söktermsanalys
          </CardTitle>
          <CardDescription>Laddar sökdata från GA4...</CardDescription>
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
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Söktermsanalys
          </CardTitle>
          <CardDescription>Problem med att hämta sökdata</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="space-y-2">
              <p className="font-medium">{error}</p>
              {error.includes('service account') && (
                <p className="text-xs">Detta kräver att en administratör konfigurerar GA4 service account-nyckel i Supabase.</p>
              )}
              {error.includes('behörighet') && (
                <div className="text-xs space-y-1">
                  <p>Lösning:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Gå till GA4 Admin → Property Access Management</li>
                    <li>Lägg till service account email med "Viewer" roll</li>
                    <li>Service account email finns i din Supabase edge function miljövariabler</li>
                  </ol>
                </div>
              )}
            </AlertDescription>
          </Alert>
          {error.includes('service account') && (
            <GA4SetupGuide />
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
            Söktermsanalys
          </CardTitle>
          <CardDescription>Inga söktermer funna för denna period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground p-4 bg-muted rounded">
            <p className="font-medium text-foreground mb-2">🔍 Ingen sökaktivitet</p>
            <p className="mb-2">För att spåra söktermer behöver din webbplats:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>En sökfunktion med query parameters (q, s, search, query, keyword)</li>
              <li>GA4 Enhanced Measurement aktiverat</li>
              <li>Eller manuell view_search_results event-spårning</li>
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
          Söktermsanalys
        </CardTitle>
        <CardDescription>
          Top söktermer från GA4 ({totalSearches} totala sökningar)
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
                      Senast: {new Date(searchTerm.lastSearched).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {searchTerm.count}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    sökningar
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {searchTerms.length > 10 && (
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Visar topp 10 av {searchTerms.length} söktermer
            </p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            <p className="mb-2">💡 <strong>Tips för bättre sökspårning:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Använd standardiserade query parameters (q, s, search)</li>
              <li>Aktivera Enhanced Measurement i GA4</li>
              <li>Implementera custom search events för avancerad spårning</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}