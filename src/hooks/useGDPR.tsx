import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ConsentTypes = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

export type GDPRSettings = {
  id: string;
  site_id: string;
  cookie_consent_enabled: boolean;
  data_retention_days: number;
  anonymize_ip: boolean;
  heatmap_tracking_enabled: boolean;
  privacy_policy_url: string | null;
  contact_email: string | null;
  dpo_email: string | null;
  legal_basis: any;
  created_at: string;
  updated_at: string;
};

export type DataRequest = {
  id: string;
  site_id: string;
  email: string;
  request_type: 'export' | 'deletion' | 'portability';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  request_data: any;
  processed_at: string | null;
  created_at: string;
  expires_at: string;
};

export function useGDPRSettings(siteId: string) {
  return useQuery({
    queryKey: ['gdpr-settings', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gdpr_settings')
        .select('*')
        .eq('site_id', siteId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Return default settings if none exist
      return data || {
        site_id: siteId,
        cookie_consent_enabled: true,
        data_retention_days: 365,
        anonymize_ip: true,
        heatmap_tracking_enabled: true,
        privacy_policy_url: null,
        contact_email: null,
        dpo_email: null,
        legal_basis: { analytics: 'consent', necessary: 'legitimate_interest' }
      };
    },
    enabled: !!siteId,
  });
}

export function useUpdateGDPRSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: Partial<GDPRSettings> & { site_id: string }) => {
      const { data, error } = await supabase
        .from('gdpr_settings')
        .upsert(settings, { onConflict: 'site_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gdpr-settings', data.site_id] });
      toast({
        title: "GDPR inställningar uppdaterade",
        description: "Dina GDPR-inställningar har sparats."
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera GDPR-inställningar.",
        variant: "destructive"
      });
    }
  });
}

export function useDataRequests(siteId: string) {
  return useQuery({
    queryKey: ['data-requests', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_requests')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DataRequest[];
    },
    enabled: !!siteId,
  });
}

export function useCreateDataRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: {
      site_id: string;
      email: string;
      request_type: 'export' | 'deletion' | 'portability';
      request_data?: any;
    }) => {
      const { data, error } = await supabase
        .from('data_requests')
        .insert(request)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['data-requests', data.site_id] });
      toast({
        title: "Begäran skickad",
        description: "Din begäran har registrerats och kommer att behandlas inom 30 dagar."
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte skicka begäran.",
        variant: "destructive"
      });
    }
  });
}

export function useCookieConsent() {
  const saveConsent = async (
    siteId: string,
    sessionId: string,
    consentTypes: ConsentTypes,
    ipAddress?: string,
    userAgent?: string,
    geoCountry?: string,
    source: string = 'banner'
  ) => {
    // First save consent locally to ensure it's always saved regardless of API success
    setConsent(siteId, consentTypes);
    console.log('Local consent saved:', consentTypes);
    
    // Update Google Consent Mode v2 if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      // Initialize consent mode if not already done
      if (!(window as any).gtagConsentInitialized) {
        (window as any).gtag('consent', 'default', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          functionality_storage: 'denied',
          personalization_storage: 'denied',
          security_storage: 'granted'
        });
        (window as any).gtagConsentInitialized = true;
      }
      
      // Update consent based on user choices
      (window as any).gtag('consent', 'update', {
        analytics_storage: consentTypes.analytics ? 'granted' : 'denied',
        ad_storage: consentTypes.marketing ? 'granted' : 'denied',
        ad_user_data: consentTypes.marketing ? 'granted' : 'denied',
        ad_personalization: consentTypes.marketing ? 'granted' : 'denied',
        functionality_storage: consentTypes.preferences ? 'granted' : 'denied',
        personalization_storage: consentTypes.preferences ? 'granted' : 'denied',
        security_storage: 'granted', // Always granted for necessary cookies
      });
      console.log('Google Consent Mode v2 updated:', consentTypes);
    }
    
    // Then try to save to Supabase via Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('store-consent', {
        body: {
          site_id: siteId,
          session_id: sessionId,
          consent_types: consentTypes,
          ip_address: ipAddress,
          user_agent: userAgent,
          geo_country: geoCountry,
          source: source
        }
      });

      if (error) {
        console.error('Error saving consent via Edge Function:', error);
        // Already saved locally above, so we're good
        return;
      }
      
      console.log('Consent saved via Edge Function successfully:', data);
    } catch (err) {
      console.error('Error in saveConsent:', err);
      // Already saved locally above, so we're good
    }
  };

  const getConsent = (siteId: string): ConsentTypes | null => {
    try {
      // Försök nya cookie-namnet först
      let stored = localStorage.getItem(`gdpr_consent_${siteId}`);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Fallback till gamla namnet för bakåtkompatibilitet
      stored = localStorage.getItem(`cookie_consent_${siteId}`);
      if (stored) {
        const consent = JSON.parse(stored);
        // Migrera till nya namnet
        localStorage.setItem(`gdpr_consent_${siteId}`, stored);
        localStorage.removeItem(`cookie_consent_${siteId}`);
        return consent;
      }
      
      return null;
    } catch (err) {
      console.error('Error getting consent from localStorage:', err);
      return null;
    }
  };

  const setConsent = (siteId: string, consent: ConsentTypes) => {
    try {
      // Använd nya cookie-namnet
      localStorage.setItem(`gdpr_consent_${siteId}`, JSON.stringify(consent));
      
      // Ta bort gamla cookie-namnet om det finns
      localStorage.removeItem(`cookie_consent_${siteId}`);
    } catch (err) {
      console.error('Error setting consent to localStorage:', err);
    }
  };

  return { saveConsent, getConsent, setConsent };
}