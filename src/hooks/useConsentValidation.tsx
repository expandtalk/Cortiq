import { supabase } from '@/integrations/supabase/client';

export type ConsentValidationResult = {
  allowed: boolean;
  allowedTypes: string[];
  blockedTypes: string[];
};

export function useConsentValidation() {
  const validateConsent = async (
    siteId: string,
    sessionId: string,
    requiredConsentTypes: string[]
  ): Promise<ConsentValidationResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('consent-check', {
        body: {
          site_id: siteId,
          session_id: sessionId,
          consent_types: requiredConsentTypes
        }
      });

      if (error) {
        console.error('Consent validation error:', error);
        // Fail safe - block all if validation fails
        return {
          allowed: false,
          allowedTypes: [],
          blockedTypes: requiredConsentTypes
        };
      }

      return data as ConsentValidationResult;
    } catch (error) {
      console.error('Consent validation failed:', error);
      // Fail safe - block all if validation fails
      return {
        allowed: false,
        allowedTypes: [],
        blockedTypes: requiredConsentTypes
      };
    }
  };

  return { validateConsent };
}