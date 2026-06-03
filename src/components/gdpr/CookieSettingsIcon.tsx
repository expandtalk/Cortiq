import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Cookie } from 'lucide-react';
import { useCookieConsent } from '@/hooks/useGDPR';

interface CookieSettingsIconProps {
  siteId: string;
  onOpenSettings: () => void;
  className?: string;
}

export function CookieSettingsIcon({ siteId, onOpenSettings, className = '' }: CookieSettingsIconProps) {
  const [hasConsent, setHasConsent] = useState(false);
  const [needsAttention, setNeedsAttention] = useState(false);
  const { getConsent } = useCookieConsent();

  useEffect(() => {
    const consent = getConsent(siteId);
    if (consent) {
      setHasConsent(true);
      // Check if user has denied optional cookies
      const hasOptionalCookies = consent.analytics || consent.marketing || consent.preferences;
      setNeedsAttention(!hasOptionalCookies);
    } else {
      setHasConsent(false);
      setNeedsAttention(true);
    }
  }, [siteId, getConsent]);

  return (
    <Button
      onClick={onOpenSettings}
      className={`fixed bottom-6 left-6 h-12 w-12 p-0 rounded-full shadow-lg z-50 transition-all duration-300 ${
        needsAttention 
          ? 'bg-orange-500 hover:bg-orange-600 animate-pulse' 
          : hasConsent 
            ? 'bg-gray-500 hover:bg-gray-600' 
            : 'bg-primary hover:bg-primary/90'
      } ${className}`}
      title="Cookie settings"
      aria-label="Open cookie settings"
    >
      {needsAttention ? (
        <Cookie className="h-5 w-5 text-white" />
      ) : (
        <Settings className="h-5 w-5 text-white" />
      )}
    </Button>
  );
}