
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SearchTerm {
  term: string;
  count: number;
  lastSearched: string;
}

interface GA4SearchTermsProps {
  siteId: string | null;
  dateRange?: { from: Date; to: Date };
}

export function useGA4SearchTerms({ siteId, dateRange }: GA4SearchTermsProps) {
  const [searchTerms, setSearchTerms] = useState<SearchTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (siteId) {
      fetchSearchTerms();
    }
  }, [siteId, dateRange]);

  const fetchSearchTerms = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get date range
      const endDate = dateRange?.to || new Date();
      const startDate = dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      console.log('🔍 Fetching search terms for site:', siteId);
      console.log('Date range:', startDate.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0]);

      // Call GA4 API via Edge Function with just siteId (same pattern as working functions)
      const { data, error: functionError } = await supabase.functions.invoke('ga4-search-terms', {
        body: {
          siteId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      });

      if (functionError) {
        console.error('GA4 Search Terms function error:', functionError);
        
        // Provide user-friendly error messages
        if (functionError.message?.includes('PERMISSION_DENIED') || data?.details?.includes('PERMISSION_DENIED')) {
          throw new Error('GA4 service account saknar behörighet till denna property. Kontrollera att service account har "Viewer"-åtkomst i GA4.');
        } else if (functionError.message?.includes('not found') || data?.details?.includes('not found')) {
          throw new Error('GA4 property kunde inte hittas. Kontrollera att GA4 Property ID är korrekt konfigurerat.');
        } else if (functionError.message?.includes('GA4_SERVICE_ACCOUNT_KEY') || data?.error?.includes('GA4 API key')) {
          throw new Error('GA4 service account är inte konfigurerad. Kontakta administratör för att lägga till GA4 API-nyckel.');
        }
        
        throw new Error(data?.error || functionError.message || 'Kunde inte hämta GA4 söktermer');
      }

      console.log('GA4 Search Terms data received:', data);

      // Process search terms data
      const processedTerms = data?.searchTerms?.map((term: any) => ({
        term: term.searchTerm || 'Unknown',
        count: parseInt(term.eventCount) || 0,
        lastSearched: term.lastSearched || new Date().toISOString()
      })) || [];

      // Sort by count descending
      processedTerms.sort((a: SearchTerm, b: SearchTerm) => b.count - a.count);

      setSearchTerms(processedTerms);

    } catch (error) {
      console.error('Error fetching GA4 search terms:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch search terms');
      setSearchTerms([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    searchTerms,
    loading,
    error,
    refetch: fetchSearchTerms
  };
}
