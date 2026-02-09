import { useEffect } from 'react';
import { ConsentTypes } from './useGDPR';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    gtagConsentInitialized?: boolean;
  }
}

export function useGoogleConsentMode() {
  const initializeConsentMode = () => {
    if (typeof window === 'undefined') return;
    
    // Initialize dataLayer if not exists
    window.dataLayer = window.dataLayer || [];
    
    // Initialize gtag function
    if (!window.gtag) {
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };
    }
    
    // Set default consent state (denied for all non-necessary)
    if (!window.gtagConsentInitialized) {
      window.gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        functionality_storage: 'denied',
        personalization_storage: 'denied',
        security_storage: 'granted',
        wait_for_update: 500 // Wait 500ms for consent update
      });
      
      window.gtag('js', new Date());
      window.gtagConsentInitialized = true;
      
      console.log('Google Consent Mode v2 initialized with default denied state');
    }
  };

  const updateConsent = (consentTypes: ConsentTypes) => {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('consent', 'update', {
      analytics_storage: consentTypes.analytics ? 'granted' : 'denied',
      ad_storage: consentTypes.marketing ? 'granted' : 'denied',
      ad_user_data: consentTypes.marketing ? 'granted' : 'denied',
      ad_personalization: consentTypes.marketing ? 'granted' : 'denied',
      functionality_storage: consentTypes.preferences ? 'granted' : 'denied',
      personalization_storage: consentTypes.preferences ? 'granted' : 'denied',
      security_storage: 'granted'
    });
    
    console.log('Google Consent Mode v2 updated:', consentTypes);
  };

  const loadGoogleAnalytics = (measurementId: string) => {
    if (typeof window === 'undefined') return;
    
    // Load Google Analytics script only after consent
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
    
    script.onload = () => {
      window.gtag('config', measurementId, {
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false
      });
      console.log('Google Analytics loaded with privacy-safe configuration');
    };
  };

  const loadGoogleTagManager = (containerId: string) => {
    if (typeof window === 'undefined') return;
    
    // Load GTM script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${containerId}`;
    document.head.appendChild(script);
    
    script.onload = () => {
      window.gtag('config', containerId, {
        anonymize_ip: true
      });
      console.log('Google Tag Manager loaded');
    };
  };

  useEffect(() => {
    initializeConsentMode();
  }, []);

  return {
    initializeConsentMode,
    updateConsent,
    loadGoogleAnalytics,
    loadGoogleTagManager
  };
}