import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cookie, Shield, BarChart3, Settings, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useGoogleConsentMode } from '@/hooks/useGoogleConsentMode';

interface ConsentTypes {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export function SiteCookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cookiefreeMode, setCookiefreeMode] = useState(false);
  const [consent, setConsent] = useState<ConsentTypes>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  });

  const { updateConsent } = useGoogleConsentMode();

  useEffect(() => {
    // Check if running in cookiefree mode for this site
    const checkCookiefreeMode = async () => {
      try {
        // Get the tracking ID from the page (if available)
        const trackingId = document.querySelector('[data-tracking-id]')?.getAttribute('data-tracking-id');
        if (!trackingId) return;

        // Fetch GDPR settings for this site to check cookiefree mode
        const response = await fetch(`https://cxmkdtgfocgbfizawlwa.supabase.co/rest/v1/gdpr_settings?select=cookiefree_mode`, {
          headers: {
            'apikey': 'YOUR_SUPABASE_ANON_KEY',
          }
        });
        const data = await response.json();
        if (data?.[0]?.cookiefree_mode) {
          setCookiefreeMode(true);
          return; // Don't show banner in cookiefree mode
        }
      } catch (error) {
        console.error('Error checking cookiefree mode:', error);
      }

      // Check if consent already given
      const existingConsent = localStorage.getItem('site_cookie_consent');
      if (!existingConsent) {
        // Small delay to avoid flash of banner
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        const parsed = JSON.parse(existingConsent);
        setConsent(parsed);
        initializeAnalytics(parsed);
      }
    };

    checkCookiefreeMode();
  }, []); // Cookie banner should always be available regardless of auth state

  const initializeAnalytics = (consentTypes: ConsentTypes) => {
    if (consentTypes.analytics && window.gtag) {
      // Initialize Google Analytics if consent given
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: consentTypes.marketing ? 'granted' : 'denied'
      });
    }
  };

  const saveConsent = (consentTypes: ConsentTypes) => {
    setConsent(consentTypes);
    localStorage.setItem('site_cookie_consent', JSON.stringify(consentTypes));
    
    // Set cookie for server-side detection
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `site_consent=${JSON.stringify(consentTypes)}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`;
    
    // Initialize analytics
    initializeAnalytics(consentTypes);
    
    // Update Google Consent Mode v2
    updateConsent(consentTypes);
    
    // Dispatch custom event for tracking (includes e-commerce consent)
    window.dispatchEvent(new CustomEvent('siteConsentUpdated', { 
      detail: {
        ...consentTypes,
        ecommerce: consentTypes.marketing, // E-commerce requires marketing consent
        timestamp: Date.now()
      } 
    }));
    
    // Store consent for edge functions
    if (window.sessionStorage) {
      sessionStorage.setItem('user_consent', JSON.stringify({
        analytics: consentTypes.analytics,
        marketing: consentTypes.marketing,
        preferences: consentTypes.preferences,
        ecommerce: consentTypes.marketing,
        granted: true,
        timestamp: Date.now()
      }));
    }
    
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    });
  };

  const handleRejectAll = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    });
  };

  const handleSaveSettings = () => {
    saveConsent(consent);
  };

  // Don't show banner in cookiefree mode
  if (!showBanner || cookiefreeMode) return null;

  return (
    <>
      {/* Main Cookie Banner */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-4 transition-transform duration-500 ease-out z-[var(--z-cookie-banner,9999)]"
        style={{
          transform: showBanner ? 'translateY(0)' : 'translateY(100%)',
          contain: 'layout style',
          willChange: 'transform'
        }}
      >
        <Card className="mx-auto max-w-5xl border-2 bg-card shadow-elegant border-primary/30 shadow-2xl">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <Cookie className="h-6 w-6 text-white" />
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-bold">🍪 Vi respekterar din integritet</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Vi har fokus på <strong>1st party cookies</strong> för korrekt data och mäter även <strong>AI-trafik</strong> 
                    för att förbättra användarupplevelsen och visa relevanta funktioner.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                  <Button 
                    onClick={handleAcceptAll} 
                    className="group bg-gradient-primary hover-scale hover-glow text-sm px-8 py-3 h-auto font-semibold"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    ✨ Acceptera alla (Rekommenderat)
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleRejectAll}
                    className="text-sm px-6 py-2 h-auto"
                  >
                    Endast nödvändiga
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowBanner(false)}
                    className="text-sm px-4 py-2 h-auto text-muted-foreground"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Stäng
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Settings link below banner */}
        <div className="text-center mt-3">
          <button 
            onClick={() => setShowSettings(true)}
            className="text-primary hover:underline text-sm bg-background/90 px-3 py-1 rounded-md"
          >
            <Settings className="h-4 w-4 mr-1 inline" />
            Anpassa inställningar - AI-mätning & cookies
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Cookie className="h-5 w-5 text-primary" />
              Cookie-inställningar för Heatmap Analytics
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Aktuella cookies på denna webbplats:</strong> Vi prioriterar 1st party cookies för korrekt data och användarintegritet.
              </p>
            </div>

            <div className="space-y-4">
              {/* Necessary Cookies */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    checked={consent.necessary}
                    disabled
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">Nödvändiga cookies</h4>
                      <Badge variant="secondary" className="text-xs">Alltid aktiva</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Krävs för att webbplatsen ska fungera. Lagrar dina cookie-val och säkerhetsinställningar.
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="font-mono bg-muted px-2 py-1 rounded flex justify-between">
                        <span>site_consent</span>
                        <span className="text-green-600">1st party • Heatmap Analytics • 1 år</span>
                      </div>
                      <div className="font-mono bg-muted px-2 py-1 rounded flex justify-between">
                        <span>session_id</span>
                        <span className="text-green-600">1st party • Heatmap Analytics • Session</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    checked={consent.analytics}
                    onCheckedChange={(checked) => 
                      setConsent(prev => ({ ...prev, analytics: !!checked }))
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">Analys cookies</h4>
                      <Badge className="bg-gradient-primary text-white text-xs">1st Party Focus</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Hjälper oss förstå hur du använder webbplatsen för att förbättra användarupplevelsen. 
                      Vi använder främst 1st party cookies för högsta datakvalitet.
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="font-mono bg-muted px-2 py-1 rounded flex justify-between">
                        <span>heatmap_analytics</span>
                        <span className="text-green-600">1st party • Heatmap Analytics • 2 år</span>
                      </div>
                      <div className="font-mono bg-muted px-2 py-1 rounded flex justify-between">
                        <span>page_views</span>
                        <span className="text-green-600">1st party • Heatmap Analytics • 1 år</span>
                      </div>
                      <div className="font-mono bg-muted px-2 py-1 rounded flex justify-between">
                        <span>_ga</span>
                        <span className="text-orange-600">3rd party • Google Analytics • 2 år</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Marketing & E-commerce Cookies */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    checked={consent.marketing}
                    onCheckedChange={(checked) => 
                      setConsent(prev => ({ ...prev, marketing: !!checked }))
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">Marknadsföring & E-handel cookies</h4>
                      <Badge variant="outline" className="text-xs">Inkl. E-commerce tracking</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Används för att visa relevanta funktioner och spåra e-handelsaktiviteter (produktvisningar, köp). 
                      <strong className="text-primary"> Krävs för e-handelsspårning och User Lifetime Value-analys.</strong>
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="font-mono bg-muted px-2 py-1 rounded flex justify-between">
                        <span>feature_interest</span>
                        <span className="text-green-600">1st party • Heatmap Analytics • 6 månader</span>
                      </div>
                      <div className="font-mono bg-muted px-2 py-1 rounded flex justify-between">
                        <span>ecommerce_events</span>
                        <span className="text-green-600">1st party • Heatmap Analytics • 2 år</span>
                      </div>
                      <div className="font-mono bg-muted px-2 py-1 rounded flex justify-between">
                        <span>user_identity_hash</span>
                        <span className="text-green-600">1st party • SHA-256 hashed • 2 år</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferences Cookies */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    checked={consent.preferences}
                    onCheckedChange={(checked) => 
                      setConsent(prev => ({ ...prev, preferences: !!checked }))
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">Preferens cookies</h4>
                      <Badge variant="outline" className="text-xs">Förbättrar UX</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Kommer ihåg dina val och inställningar för en personligare upplevelse.
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="font-mono bg-muted px-2 py-1 rounded flex justify-between">
                        <span>theme_preference</span>
                        <span className="text-green-600">1st party • Heatmap Analytics • 1 år</span>
                      </div>
                      <div className="font-mono bg-muted px-2 py-1 rounded flex justify-between">
                        <span>language_choice</span>
                        <span className="text-green-600">1st party • Heatmap Analytics • 1 år</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h5 className="font-semibold text-primary mb-2">🎯 Vår 1st Party Strategi</h5>
              <p className="text-sm text-muted-foreground">
                Vi prioriterar 1st party cookies för högre datakvalitet och bättre användarintegritet. 
                3rd party cookies används endast för Google Analytics och med ditt uttryckliga samtycke.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Avbryt
              </Button>
              <Button onClick={handleSaveSettings} className="bg-gradient-primary">
                Spara inställningar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}