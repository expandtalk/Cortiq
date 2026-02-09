/**
 * Language Hook
 * Task #18: Flerspråksstöd (i18n)
 */

import { useState, useEffect } from 'react';
import type { Language } from '@/config/i18n';
import { t } from '@/config/i18n';

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    // Check localStorage first
    const saved = localStorage.getItem('language');
    if (saved === 'sv' || saved === 'en') {
      return saved;
    }

    // Fall back to browser language
    const browserLang = navigator.language.startsWith('sv') ? 'sv' : 'en';
    return browserLang;
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  function translate(key: string, fallback?: string): string {
    return t(language, key, fallback);
  }

  return {
    language,
    setLanguage,
    t: translate
  };
}
