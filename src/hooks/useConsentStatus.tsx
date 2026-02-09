import { useState, useEffect } from 'react';

export interface ConsentStatus {
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  ecommerce: boolean;
  granted: boolean;
  timestamp: number;
}

export function useConsentStatus() {
  const [consent, setConsent] = useState<ConsentStatus>({
    analytics: false,
    marketing: false,
    preferences: false,
    ecommerce: false,
    granted: false,
    timestamp: 0
  });

  useEffect(() => {
    // Load consent from sessionStorage
    const loadConsent = () => {
      try {
        const stored = sessionStorage.getItem('user_consent');
        if (stored) {
          const parsed = JSON.parse(stored);
          setConsent(parsed);
        }
      } catch (error) {
        console.error('Failed to load consent:', error);
      }
    };

    loadConsent();

    // Listen for consent updates
    const handleConsentUpdate = (event: CustomEvent) => {
      const detail = event.detail;
      const newConsent: ConsentStatus = {
        analytics: detail.analytics || false,
        marketing: detail.marketing || false,
        preferences: detail.preferences || false,
        ecommerce: detail.marketing || false, // E-commerce requires marketing consent
        granted: true,
        timestamp: detail.timestamp || Date.now()
      };
      
      setConsent(newConsent);
      
      // Update sessionStorage
      try {
        sessionStorage.setItem('user_consent', JSON.stringify(newConsent));
      } catch (error) {
        console.error('Failed to save consent:', error);
      }
    };

    window.addEventListener('siteConsentUpdated', handleConsentUpdate as EventListener);

    return () => {
      window.removeEventListener('siteConsentUpdated', handleConsentUpdate as EventListener);
    };
  }, []);

  return consent;
}
