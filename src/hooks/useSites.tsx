import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Site } from '@/types/dashboard';

export function useSites() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
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
        title: "❌ Fel",
        description: "Kunde inte ladda dina webbsidor",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  return {
    sites,
    selectedSite,
    setSelectedSite,
    loadSites
  };
}