import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Site } from '@/types/dashboard';

export function useSites() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSites(data || []);

      if (data && data.length > 0 && !selectedSite) {
        setSelectedSite(data[0]);
      }
    } catch (error) {
      console.error('Error loading sites:', error);
      toast({
        title: "❌ Error",
        description: "Could not load your websites",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  return {
    sites,
    selectedSite,
    setSelectedSite,
    loadSites,
    loading
  };
}