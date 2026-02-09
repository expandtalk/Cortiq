export type ConsentChoices = {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

export type ConsentData = {
  v: string; // policy version
  ts: string; // timestamp
  choices: ConsentChoices;
  locale: string;
  gpc: boolean;
};

export class ConsentEnforcer {
  private consent: ConsentChoices | null = null;
  private gcmEnabled: boolean = false;
  private policyVersion: string = '2025-08-01';

  constructor(gcmEnabled: boolean = false) {
    this.gcmEnabled = gcmEnabled;
    this.loadStoredConsent();
  }

  private loadStoredConsent(): void {
    try {
      const stored = localStorage.getItem('heatmap_consent');
      if (stored) {
        const data: ConsentData = JSON.parse(stored);
        this.consent = data.choices;
      }
    } catch (error) {
      console.error('Failed to load stored consent:', error);
    }
  }

  public setConsent(choices: ConsentChoices): void {
    this.consent = choices;
    this.saveConsentToStorage(choices);
    this.enforceConsent(choices);
    
    if (this.gcmEnabled) {
      this.updateGoogleConsentMode(choices);
    }
  }

  private saveConsentToStorage(choices: ConsentChoices): void {
    const consentData: ConsentData = {
      v: this.policyVersion,
      ts: new Date().toISOString(),
      choices,
      locale: document.documentElement.lang || 'sv-SE',
      gpc: !!(navigator as any).globalPrivacyControl
    };

    // Save to localStorage
    localStorage.setItem('heatmap_consent', JSON.stringify(consentData));
    
    // Save to cookie for server-side access
    document.cookie = `heatmap_consent=${encodeURIComponent(JSON.stringify(consentData))}; Path=/; Max-Age=${365*24*3600}; SameSite=Lax`;
  }

  private enforceConsent(choices: ConsentChoices): void {
    // Activate scripts for consented categories
    Object.entries(choices).forEach(([category, allowed]) => {
      if (allowed) {
        this.activateScriptsForCategory(category);
      } else {
        this.deactivateScriptsForCategory(category);
      }
    });

    // Dispatch consent event for other scripts to listen
    window.dispatchEvent(new CustomEvent('consent:updated', { 
      detail: { choices, timestamp: new Date().toISOString() }
    }));
  }

  private activateScriptsForCategory(category: string): void {
    // Activate deferred scripts
    document.querySelectorAll(`script[type="text/plain"][data-category="${category}"]`)
      .forEach(node => {
        const script = document.createElement('script');
        
        // Copy all attributes except type
        Array.from(node.attributes).forEach(attr => {
          if (attr.name !== 'type') {
            script.setAttribute(attr.name, attr.value);
          }
        });
        
        script.text = node.textContent || '';
        script.async = true;
        
        // Replace the placeholder script
        node.parentNode?.replaceChild(script, node);
      });

    // Handle external script loading
    this.loadExternalScriptsForCategory(category);
  }

  private deactivateScriptsForCategory(category: string): void {
    // Remove active scripts for this category (for consent withdrawal)
    document.querySelectorAll(`script[data-category="${category}"]`).forEach(node => {
      node.remove();
    });
  }

  private loadExternalScriptsForCategory(category: string): void {
    const scriptConfigs = this.getExternalScriptConfigs();
    const categoryScripts = scriptConfigs[category] || [];
    
    categoryScripts.forEach(config => {
      if (!document.querySelector(`script[src="${config.src}"]`)) {
        const script = document.createElement('script');
        script.src = config.src;
        script.async = true;
        script.defer = true;
        script.setAttribute('data-category', category);
        
        if (config.onload) {
          script.onload = config.onload;
        }
        
        document.head.appendChild(script);
      }
    });
  }

  private getExternalScriptConfigs(): Record<string, Array<{src: string, onload?: () => void}>> {
    // Get configuration from window object (set by site admin)
    const ga4MeasurementId = (window as any).HEATMAP_GA4_ID;
    const fbPixelId = (window as any).HEATMAP_FB_PIXEL_ID;

    const configs: Record<string, Array<{src: string, onload?: () => void}>> = {
      analytics: [],
      marketing: []
    };

    // Add GA4 script if measurement ID is provided
    if (ga4MeasurementId) {
      configs.analytics.push({
        src: `https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`,
        onload: () => {
          if ((window as any).gtag) {
            (window as any).gtag('js', new Date());
            (window as any).gtag('config', ga4MeasurementId, {
              anonymize_ip: true,
              allow_google_signals: false
            });
          }
        }
      });
    }

    // Add Facebook Pixel if pixel ID is provided
    if (fbPixelId) {
      configs.marketing.push({
        src: 'https://connect.facebook.net/en_US/fbevents.js',
        onload: () => {
          if ((window as any).fbq) {
            (window as any).fbq('init', fbPixelId);
            (window as any).fbq('track', 'PageView');
          }
        }
      });
    }

    return configs;
  }

  private updateGoogleConsentMode(choices: ConsentChoices): void {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: choices.analytics ? 'granted' : 'denied',
        ad_storage: choices.marketing ? 'granted' : 'denied',
        ad_user_data: choices.marketing ? 'granted' : 'denied',
        ad_personalization: choices.marketing ? 'granted' : 'denied',
        functionality_storage: choices.functional ? 'granted' : 'denied',
        security_storage: 'granted'
      });
      
      // Notify GTM about consent update
      (window as any).dataLayer?.push({ event: 'consent_update', consent_choices: choices });
    }
  }

  public initializeGoogleConsentMode(): void {
    if (!this.gcmEnabled) return;
    
    // Initialize dataLayer
    (window as any).dataLayer = (window as any).dataLayer || [];
    
    // Initialize gtag function
    if (!(window as any).gtag) {
      (window as any).gtag = function() {
        (window as any).dataLayer.push(arguments);
      };
    }
    
    // Set default consent (all denied except security)
    (window as any).gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted',
      wait_for_update: 500
    });
    
    (window as any).gtag('js', new Date());
  }

  public hasConsent(category: keyof ConsentChoices): boolean {
    return this.consent?.[category] ?? false;
  }

  public getAllowedCategories(): string[] {
    if (!this.consent) return ['necessary'];
    
    return Object.entries(this.consent)
      .filter(([_, allowed]) => allowed)
      .map(([category, _]) => category);
  }

  public getConsentData(): ConsentData | null {
    try {
      const stored = localStorage.getItem('heatmap_consent');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  public needsConsentUpdate(): boolean {
    const data = this.getConsentData();
    return !data || data.v !== this.policyVersion;
  }

  public handleGPC(): ConsentChoices {
    const gpcEnabled = !!(navigator as any).globalPrivacyControl;
    
    if (gpcEnabled) {
      // GPC signal detected - default to minimal cookies
      return {
        necessary: true,
        functional: false,
        analytics: false,
        marketing: false,
        preferences: false
      };
    }
    
    // No GPC signal - use normal defaults
    return {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      preferences: false
    };
  }
}