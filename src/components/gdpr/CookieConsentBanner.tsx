import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Cookie, Settings, Shield, X, ChevronDown, Info } from 'lucide-react';
import { useCookieConsent, type ConsentTypes } from '@/hooks/useGDPR';
import { useCookieDefinitions, enrichCookieWithDefinition, getCategoryDisplayName, getSwedishDescription, getSwedishPurpose, getSwedishProviderName } from '@/hooks/useCookieDefinitions';
import { useGoogleConsentMode } from '@/hooks/useGoogleConsentMode';
import { useCookiePerformanceMonitoring } from '@/hooks/useCookiePerformanceMonitoring';
import { supabase } from '@/integrations/supabase/client';

interface CookieConsentBannerProps {
  siteId: string;
  privacyPolicyUrl?: string;
  onConsentChange?: (consent: ConsentTypes) => void;
}

// System cookies som alltid finns och är nödvändiga
const SYSTEM_COOKIES = [
  {
    cookie_name: 'gdpr_consent',
    provider_name: 'CortIQ',
    category_key: 'nödvändig',
    purpose: 'Lagrar användarens cookie-samtycke för GDPR-efterlevnad',
    description: 'Nödvändig cookie som kommer ihåg dina cookie-inställningar och samtycke',
    expiry: '1 år'
  }
];

export function CookieConsentBanner({ 
  siteId, 
  privacyPolicyUrl,
  onConsentChange 
}: CookieConsentBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsentState] = useState<ConsentTypes>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  });
  
  const [detectedCookies, setDetectedCookies] = useState<any[]>([]);
  const [cookieCounts, setCookieCounts] = useState({
    necessary: 1, // Minst en system-cookie
    analytics: 0,
    marketing: 0,
    preferences: 0
  });
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const { getConsent, setConsent, saveConsent } = useCookieConsent();
  const { data: cookieDefinitions = [] } = useCookieDefinitions();
  const { updateConsent } = useGoogleConsentMode();
  const { 
    trackBannerLoadTime, 
    trackCookieLoadTime, 
    trackConsentSaveTime, 
    trackError,
    isServiceWorkerActive 
  } = useCookiePerformanceMonitoring();

  useEffect(() => {
    const existingConsent = getConsent(siteId);
    if (!existingConsent) {
      setShowBanner(true);
    } else {
      setConsentState(existingConsent);
      onConsentChange?.(existingConsent);
    }
    
    // Performance optimized cookie loading
    initializeCookieLoadingWithPerformanceMonitoring();
  }, [siteId]);

  const initializeCookieLoadingWithPerformanceMonitoring = () => {
    const startTime = performance.now();
    
    // Preload critical cookie definitions eagerly
    if (typeof requestIdleCallback !== 'undefined') {
      // Use requestIdleCallback for non-critical operations
      requestIdleCallback(() => {
        loadDetectedCookies().finally(() => {
          const endTime = performance.now();
          const loadTime = endTime - startTime;
          
          // Performance monitoring
          if (window.gtag) {
            window.gtag('event', 'cookie_banner_load_time', {
              event_category: 'Performance',
              event_label: 'Cookie Banner',
              value: Math.round(loadTime)
            });
          }
          
          console.log(`🍪 Cookie banner loaded in ${loadTime.toFixed(2)}ms`);
        });
      }, { timeout: 2000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => loadDetectedCookies(), 0);
    }
  };

  const loadDetectedCookies = async () => {
    const loadStartTime = performance.now();
    
    try {
      // Critical cookie definitions preload
      const criticalCookiePromise = loadCriticalCookieDefinitions();
      
      // Use new active-cookies function to get only cookies for enabled integrations
      const { data, error } = await supabase.functions.invoke('active-cookies', {
        body: { site_id: siteId }
      });
      
      if (error) {
        console.error('Failed to load active cookies:', error);
        // Fallback to old method
        return loadDetectedCookiesFallback();
      }
      
      if (data && data.cookies) {
        // Wait for critical cookies to load first
        await criticalCookiePromise;
        
        // Flatten categorized cookies into single array for compatibility
        const allCookies = [
          ...data.cookies.necessary,
          ...data.cookies.analytics,
          ...data.cookies.marketing,
          ...data.cookies.preferences
        ];
        
        setDetectedCookies(allCookies);
        setCookieCounts(data.counts);
        
        const loadTime = performance.now() - loadStartTime;
        console.log(`🍪 Active cookies loaded in ${loadTime.toFixed(2)}ms:`, data.counts);
        
        // Store performance metrics
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('cookie_load_performance', JSON.stringify({
            loadTime,
            timestamp: Date.now(),
            cookieCount: allCookies.length
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load active cookies:', error);
      // Fallback to old method
      loadDetectedCookiesFallback();
    }
  };

  const loadCriticalCookieDefinitions = async () => {
    // Preload essential cookie definitions that are needed immediately
    const criticalCookies = ['gdpr_consent', 'heatmap_analytics', '_ga', '_gid'];
    
    try {
      const promises = criticalCookies.map(cookieName => 
        enrichCookieWithDefinition(cookieName, cookieDefinitions)
      );
      await Promise.all(promises);
    } catch (error) {
      console.warn('Failed to preload critical cookie definitions:', error);
    }
  };

  const loadDetectedCookiesFallback = async () => {
    try {
      const { data: cookies } = await supabase
        .from('detected_cookies')
        .select('*')
        .eq('site_id', siteId);
      
      if (cookies) {
        setDetectedCookies(cookies);
        
        // Count cookies per category - map from detected_cookies format
        const counts = {
          necessary: cookies.filter(c => 
            c.cookie_category === 'necessary' || c.cookie_category === 'nödvändig'
          ).length + 1, // +1 för system-cookies
          analytics: cookies.filter(c => 
            c.cookie_category === 'analytics' || c.cookie_category === 'analys'
          ).length,
          marketing: cookies.filter(c => 
            c.cookie_category === 'marketing' || c.cookie_category === 'marknadsföring'
          ).length,
          preferences: cookies.filter(c => 
            c.cookie_category === 'preferences' || c.cookie_category === 'funktionell'
          ).length
        };
        setCookieCounts(counts);
      }
    } catch (error) {
      console.error('Failed to load detected cookies fallback:', error);
      // Set minimum count for system cookies even if detection fails
      setCookieCounts({
        necessary: 1,
        analytics: 0,
        marketing: 0,
        preferences: 0
      });
    }
  };

  const handleAcceptAll = async () => {
    const newConsent: ConsentTypes = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    await saveConsentAndClose(newConsent);
  };

  const handleRejectAll = async () => {
    const newConsent: ConsentTypes = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
    await saveConsentAndClose(newConsent);
  };

  const handleSaveSettings = async () => {
    await saveConsentAndClose(consent);
    setShowSettings(false);
  };

  const saveConsentAndClose = async (newConsent: ConsentTypes) => {
    const consentStartTime = performance.now();
    
    try {
      setConsent(siteId, newConsent);
      setConsentState(newConsent);
      onConsentChange?.(newConsent);
      
      // Update Google Consent Mode immediately
      updateConsent(newConsent);
      
      // Generate session ID
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get geo data if available
      let geoCountry = null;
      try {
        const storedGeoData = localStorage.getItem('heatmap_geo_data');
        if (storedGeoData) {
          const geoData = JSON.parse(storedGeoData);
          geoCountry = geoData.country;
        }
      } catch (err) {
        console.warn('Could not retrieve geo data:', err);
      }
      
      // Save to database with enhanced metadata including legal basis
      await saveConsent(
        siteId,
        sessionId,
        newConsent,
        undefined, // IP will be handled server-side
        navigator.userAgent,
        geoCountry,
        'banner' // source
      );
      
      // Track consent save performance
      const consentSaveTime = performance.now() - consentStartTime;
      trackConsentSaveTime(consentSaveTime);
      
      setShowBanner(false);
    } catch (error) {
      console.error('Failed to save consent:', error);
      
      // Track error
      trackError('consent_save_failed', error.message);
      
      setShowBanner(false);
    }
  };

  // Kombinera detekterade cookies med system-cookies
  const getCookiesForCategory = (category: string) => {
    // Lägg till system-cookies för nödvändig kategori
    const systemCookiesForCategory = category === 'necessary' ? SYSTEM_COOKIES : [];
    
    // Filtrera detekterade cookies baserat på kategori
    const detectedForCategory = detectedCookies.filter(c => {
      const cookieCategory = c.cookie_category;
      return (
        (category === 'necessary' && (cookieCategory === 'necessary' || cookieCategory === 'nödvändig')) ||
        (category === 'analytics' && (cookieCategory === 'analytics' || cookieCategory === 'analys')) ||
        (category === 'marketing' && (cookieCategory === 'marketing' || cookieCategory === 'marknadsföring')) ||
        (category === 'preferences' && (cookieCategory === 'preferences' || cookieCategory === 'funktionell'))
      );
    });

    // Enricha detekterade cookies med definitioner
    const enrichedDetected = detectedForCategory.map(cookie => {
      const definition = enrichCookieWithDefinition(cookie.cookie_name, cookieDefinitions);
      if (definition) {
        return {
          ...cookie,
          enhanced_description: getSwedishDescription(definition),
          enhanced_purpose: getSwedishPurpose(definition),
          enhanced_provider: getSwedishProviderName(definition),
          enhanced_expiry: definition.expiry
        };
      }
      return cookie;
    });

    return [...systemCookiesForCategory, ...enrichedDetected];
  };

  if (!showBanner) return null;

  return (
    <>
      <div 
        className="fixed bottom-0 left-0 right-0 p-4 transition-transform duration-300 ease-out"
        style={{
          zIndex: 'var(--z-cookie-banner, 950)',
          transform: showBanner ? 'translateY(0)' : 'translateY(100%)',
          contain: 'layout style',
          willChange: 'transform'
        }}
      >
        <Card className="mx-auto max-w-4xl border-2 bg-background/95 backdrop-blur-sm shadow-lg">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Cookie className="h-8 w-8 text-primary" />
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Vi respekterar din integritet</h3>
                  <p className="text-sm text-muted-foreground">
                    Vi använder cookies för att förbättra din upplevelse på vår webbplats. 
                    Nödvändiga cookies krävs för grundläggande funktionalitet, medan 
                    analysdata hjälper oss att förstå hur du använder sajten.
                    {privacyPolicyUrl && (
                      <>
                        {' '}Läs mer i vår{' '}
                        <a 
                          href={privacyPolicyUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          integritetspolicy
                        </a>.
                      </>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleAcceptAll} className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Acceptera alla
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleRejectAll}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Avvisa alla
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Anpassa inställningar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cookie-inställningar</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-4">
              {/* Necessary Cookies */}
              <CookieCategory
                id="necessary"
                title="Nödvändiga cookies"
                description="Dessa cookies är nödvändiga för att webbplatsen ska fungera korrekt. De kan inte inaktiveras."
                checked={consent.necessary}
                disabled={true}
                count={cookieCounts.necessary}
                cookies={getCookiesForCategory('necessary')}
                expanded={expandedCategories.includes('necessary')}
                onToggleExpanded={() => {
                  setExpandedCategories(prev => 
                    prev.includes('necessary') 
                      ? prev.filter(cat => cat !== 'necessary')
                      : [...prev, 'necessary']
                  );
                }}
              />

              {/* Analytics Cookies */}
              <CookieCategory
                id="analytics"
                title="Analytiska cookies"
                description="Hjälper oss att förstå hur besökare interagerar med webbplatsen genom att samla in anonymiserad information."
                checked={consent.analytics}
                onCheckedChange={(checked) => 
                  setConsentState(prev => ({ ...prev, analytics: !!checked }))
                }
                count={cookieCounts.analytics}
                cookies={getCookiesForCategory('analytics')}
                expanded={expandedCategories.includes('analytics')}
                onToggleExpanded={() => {
                  setExpandedCategories(prev => 
                    prev.includes('analytics') 
                      ? prev.filter(cat => cat !== 'analytics')
                      : [...prev, 'analytics']
                  );
                }}
              />

              {/* Marketing Cookies */}
              <CookieCategory
                id="marketing"
                title="Marknadsföringscookies"
                description="Används för att spåra besökare över webbplatser för att visa relevanta annonser."
                checked={consent.marketing}
                onCheckedChange={(checked) => 
                  setConsentState(prev => ({ ...prev, marketing: !!checked }))
                }
                count={cookieCounts.marketing}
                cookies={getCookiesForCategory('marketing')}
                expanded={expandedCategories.includes('marketing')}
                onToggleExpanded={() => {
                  setExpandedCategories(prev => 
                    prev.includes('marketing') 
                      ? prev.filter(cat => cat !== 'marketing')
                      : [...prev, 'marketing']
                  );
                }}
              />

              {/* Preferences Cookies */}
              <CookieCategory
                id="preferences"
                title="Preferenscookies"
                description="Lagrar dina preferenser och inställningar för att anpassa webbplatsen efter dina behov."
                checked={consent.preferences}
                onCheckedChange={(checked) => 
                  setConsentState(prev => ({ ...prev, preferences: !!checked }))
                }
                count={cookieCounts.preferences}
                cookies={getCookiesForCategory('preferences')}
                expanded={expandedCategories.includes('preferences')}
                onToggleExpanded={() => {
                  setExpandedCategories(prev => 
                    prev.includes('preferences') 
                      ? prev.filter(cat => cat !== 'preferences')
                      : [...prev, 'preferences']
                  );
                }}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Avbryt
              </Button>
              <Button onClick={handleSaveSettings}>
                Spara inställningar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface CookieCategoryProps {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  count: number;
  cookies: any[];
  expanded: boolean;
  onToggleExpanded: () => void;
  onCheckedChange?: (checked: boolean) => void;
}

function CookieCategory({
  id,
  title,
  description,
  checked,
  disabled = false,
  count,
  cookies,
  expanded,
  onToggleExpanded,
  onCheckedChange
}: CookieCategoryProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start space-x-3">
        <Checkbox 
          id={id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={onCheckedChange}
          className="mt-1"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label htmlFor={id} className="text-sm font-medium cursor-pointer">
                {title}
              </label>
              <Badge variant="secondary" className="text-xs">
                {count} cookies
              </Badge>
             </div>
             {count > 0 && (
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={onToggleExpanded}
                 className="h-8 w-8 p-0 z-10"
                 type="button"
                 aria-label={expanded ? "Dölj cookies" : "Visa cookies"}
               >
                 <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
               </Button>
             )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        </div>
      </div>

       {count > 0 && (
         <Collapsible open={expanded} onOpenChange={onToggleExpanded}>
           <CollapsibleContent className="space-y-2 overflow-hidden">
             <div className="pl-6 space-y-2 pt-2">
              {cookies.map((cookie, index) => (
                <div key={index} className="bg-muted/30 rounded p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{cookie.cookie_name}</span>
                    {(cookie.enhanced_provider || cookie.cookie_provider || cookie.provider_name) && (
                      <Badge variant="outline" className="text-xs">
                        {cookie.enhanced_provider || cookie.cookie_provider || cookie.provider_name}
                      </Badge>
                    )}
                  </div>
                  {/* Använd svenska beskrivning om tillgänglig */}
                  {(cookie.enhanced_description || cookie.description || cookie.cookie_purpose) && (
                    <p className="text-muted-foreground mb-1">
                      {cookie.enhanced_description || cookie.description || cookie.cookie_purpose}
                    </p>
                  )}
                  {/* Visa syfte om tillgängligt */}
                  {(cookie.enhanced_purpose || cookie.purpose) && (
                    <p className="text-muted-foreground mb-1 italic">
                      Syfte: {cookie.enhanced_purpose || cookie.purpose}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-muted-foreground">
                    {(cookie.enhanced_expiry || cookie.expiry || cookie.cookie_expiry) && (
                      <span>Utgår: {cookie.enhanced_expiry || cookie.expiry || cookie.cookie_expiry}</span>
                    )}
                    {cookie.is_third_party && (
                      <span className="flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Tredje part
                      </span>
                    )}
                  </div>
                </div>
              ))}
             </div>
           </CollapsibleContent>
         </Collapsible>
       )}
     </div>
   );
 }

 export default CookieConsentBanner;