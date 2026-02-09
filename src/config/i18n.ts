/**
 * i18n Configuration
 * Task #18: Flerspråksstöd (i18n)
 *
 * Internationalization setup for Swedish and English
 */

export type Language = 'sv' | 'en';

export const LANGUAGES: Record<Language, string> = {
  sv: 'Svenska',
  en: 'English'
};

export const translations: Record<Language, Record<string, string>> = {
  sv: {
    // Common
    'common.loading': 'Laddar...',
    'common.error': 'Fel',
    'common.success': 'Framgång',
    'common.cancel': 'Avbryt',
    'common.save': 'Spara',
    'common.delete': 'Ta bort',
    'common.edit': 'Redigera',
    'common.search': 'Sök',
    'common.close': 'Stäng',
    'common.back': 'Tillbaka',
    'common.next': 'Nästa',
    'common.previous': 'Föregående',

    // Navigation
    'nav.home': 'Hem',
    'nav.dashboard': 'Dashboard',
    'nav.analytics': 'Analys',
    'nav.reports': 'Rapporter',
    'nav.settings': 'Inställningar',
    'nav.logout': 'Logga ut',

    // Dashboard
    'dashboard.overview': 'Översikt',
    'dashboard.visits': 'Besök',
    'dashboard.pageviews': 'Sidvisningar',
    'dashboard.bounce_rate': 'Studsfrekvens',
    'dashboard.avg_duration': 'Genomsnittlig varaktighet',
    'dashboard.conversions': 'Konverteringar',
    'dashboard.traffic_sources': 'Trafikällor',
    'dashboard.top_pages': 'Toppade sidor',
    'dashboard.real_time': 'Realtid',

    // AI Agents
    'dashboard.ai_agents': 'AI-agenter',
    'dashboard.ai_agent_traffic': 'AI-agent trafik',
    'dashboard.chatgpt_browser': 'ChatGPT Browser',
    'dashboard.perplexity_comet': 'Perplexity Comet',
    'dashboard.claude_browser': 'Claude Browser',

    // Reports
    'reports.custom_reports': 'Egna rapporter',
    'reports.export': 'Exportera',
    'reports.schedule': 'Schemalägg',
    'reports.share': 'Dela',
    'reports.csv': 'CSV',
    'reports.json': 'JSON',
    'reports.excel': 'Excel',
    'reports.pdf': 'PDF',

    // Campaigns
    'campaigns.campaigns': 'Kampanjer',
    'campaigns.utm_source': 'Källa',
    'campaigns.utm_medium': 'Medium',
    'campaigns.utm_campaign': 'Kampanj',
    'campaigns.conversion_rate': 'Konverteringsfrekvens',

    // Error Messages
    'error.not_found': 'Inte hittad',
    'error.unauthorized': 'Obehörig',
    'error.something_went_wrong': 'Något gick fel',
    'error.try_again': 'Försök igen',
  },

  en: {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.search': 'Search',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',

    // Navigation
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.analytics': 'Analytics',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',

    // Dashboard
    'dashboard.overview': 'Overview',
    'dashboard.visits': 'Visits',
    'dashboard.pageviews': 'Pageviews',
    'dashboard.bounce_rate': 'Bounce Rate',
    'dashboard.avg_duration': 'Average Duration',
    'dashboard.conversions': 'Conversions',
    'dashboard.traffic_sources': 'Traffic Sources',
    'dashboard.top_pages': 'Top Pages',
    'dashboard.real_time': 'Real-time',

    // AI Agents
    'dashboard.ai_agents': 'AI Agents',
    'dashboard.ai_agent_traffic': 'AI Agent Traffic',
    'dashboard.chatgpt_browser': 'ChatGPT Browser',
    'dashboard.perplexity_comet': 'Perplexity Comet',
    'dashboard.claude_browser': 'Claude Browser',

    // Reports
    'reports.custom_reports': 'Custom Reports',
    'reports.export': 'Export',
    'reports.schedule': 'Schedule',
    'reports.share': 'Share',
    'reports.csv': 'CSV',
    'reports.json': 'JSON',
    'reports.excel': 'Excel',
    'reports.pdf': 'PDF',

    // Campaigns
    'campaigns.campaigns': 'Campaigns',
    'campaigns.utm_source': 'Source',
    'campaigns.utm_medium': 'Medium',
    'campaigns.utm_campaign': 'Campaign',
    'campaigns.conversion_rate': 'Conversion Rate',

    // Error Messages
    'error.not_found': 'Not Found',
    'error.unauthorized': 'Unauthorized',
    'error.something_went_wrong': 'Something went wrong',
    'error.try_again': 'Try again',
  }
};

/**
 * Get translation for a key
 */
export function t(language: Language, key: string, fallback?: string): string {
  return translations[language][key] || fallback || key;
}

/**
 * Get all translations for a language
 */
export function getTranslations(language: Language): Record<string, string> {
  return translations[language];
}
