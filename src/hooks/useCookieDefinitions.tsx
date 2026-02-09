import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CookieDefinition = {
  id: number;
  cookie_name: string;
  provider_name: string | null;
  provider_name_sv: string | null;
  category_key: string;
  detection_method: string;
  detection_confidence: string;
  purpose: string | null;
  purpose_sv: string | null;
  description: string | null;
  description_sv: string | null;
  expiry: string | null;
  data_stored: string | null;
  security_level: string | null;
  size_bytes: number | null;
  path: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function useCookieDefinitions() {
  return useQuery({
    queryKey: ['cookie-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cookie_definitions')
        .select('*')
        .eq('is_active', true)
        .order('cookie_name');

      if (error) throw error;
      return data as CookieDefinition[];
    },
  });
}

// Funktion för att enricha upptäckta cookies med definitioner
export function enrichCookieWithDefinition(
  cookieName: string,
  definitions: CookieDefinition[]
): CookieDefinition | null {
  // 1. Försök exakt matchning först
  let match = definitions.find(def => 
    def.detection_method === 'exact' && def.cookie_name === cookieName
  );
  
  if (match) return match;
  
  // 2. Försök pattern matchning (wildcards)
  match = definitions.find(def => {
    if (def.detection_method === 'pattern' && def.cookie_name.includes('*')) {
      const pattern = def.cookie_name.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`, 'i');
      return regex.test(cookieName);
    }
    return false;
  });
  
  if (match) return match;
  
  // 3. Försök prefix matchning
  match = definitions.find(def => {
    if (def.detection_method === 'prefix' && def.cookie_name.endsWith('*')) {
      const prefix = def.cookie_name.slice(0, -1);
      return cookieName.startsWith(prefix);
    }
    return false;
  });
  
  return match || null;
}

// Funktion för att få svenska kategorinamn
export function getCategoryDisplayName(categoryKey: string): string {
  const categoryMap: Record<string, string> = {
    'nödvändig': 'Nödvändiga cookies',
    'necessary': 'Nödvändiga cookies',
    'analys': 'Prestanda cookies (analys)', 
    'analytics': 'Prestanda cookies (analys)', 
    'funktionell': 'Funktionella cookies (personlig anpassning)',
    'preferences': 'Funktionella cookies (personlig anpassning)',
    'marknadsföring': 'Riktade cookies (marknadsföring)',
    'marketing': 'Riktade cookies (marknadsföring)',
    'externt innehåll': 'Externt innehåll',
    'social media': 'Sociala medier'
  };
  
  return categoryMap[categoryKey] || 'Övriga';
}

// Funktion för att få svenska beskrivning från cookie definition
export function getSwedishDescription(definition: CookieDefinition): string {
  return definition.description_sv || definition.description || '';
}

// Funktion för att få svenska syfte från cookie definition
export function getSwedishPurpose(definition: CookieDefinition): string {
  return definition.purpose_sv || definition.purpose || '';
}

// Funktion för att få svenska provider-namn från cookie definition
export function getSwedishProviderName(definition: CookieDefinition): string {
  return definition.provider_name_sv || definition.provider_name || '';
}

// Funktion för att sortera kategorier i rätt ordning
export function getCategorySortOrder(categoryKey: string): number {
  const sortOrder: Record<string, number> = {
    'nödvändig': 1,
    'analys': 2,
    'funktionell': 3,
    'marknadsföring': 4,
    'externt innehåll': 5,
    'social media': 6
  };
  
  return sortOrder[categoryKey] || 99;
}