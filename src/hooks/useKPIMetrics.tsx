import { useState, useMemo } from 'react';
import { KPIMetric } from '@/types/kpi';

const defaultKPIMetrics: KPIMetric[] = [
  {
    id: 'ai-bot-traffic',
    title: 'AI Bot Trafik',
    description: 'Mäter besök från AI-botar som GPTBot, CCBot, Perplexity och andra LLM crawlers som indexerar ditt innehåll.',
    businessValue: 'Visar vilka AI-system som aktivt crawlar din webbplats. Högre trafik från AI-botar indikerar att ditt innehåll upptäcks och indexeras för AI-svar.',
    status: 'activated',
    category: 'critical',
    priority: 'critical',
    dataSources: ['Server logs', 'Custom tracking'],
    integrations: ['Internal tracking'],
    order: 1,
    enabled: true,
    hasLiveData: true,
  },
  {
    id: 'ai-citations',
    title: 'AI Citations',
    description: 'Spårar när ditt innehåll citeras eller refereras av AI-system i deras svar till användare.',
    businessValue: 'Direkt mått på hur ofta AI-plattformar rekommenderar ditt innehåll. Högre citations = större synlighet och trovärdighet.',
    status: 'activated',
    category: 'critical',
    priority: 'critical',
    dataSources: ['Citation tracking', 'Referral data'],
    integrations: ['Internal tracking'],
    order: 2,
    enabled: true,
    hasLiveData: true,
  },
  {
    id: 'ai-traffic-sources',
    title: 'Top AI Traffic Sources',
    description: 'Identifierar vilka AI-plattformar (ChatGPT, Perplexity, Gemini, etc.) som skickar mest trafik till din webbplats.',
    businessValue: 'Hjälper dig prioritera optimering för de AI-plattformar som ger mest affärsvärde.',
    status: 'activated',
    category: 'live-data',
    priority: 'high',
    dataSources: ['Google Analytics 4', 'Custom tracking'],
    integrations: ['Internal tracking'],
    order: 3,
    enabled: true,
    hasLiveData: true,
  },
  {
    id: 'ai-bot-detection',
    title: 'AI Bot Detection & Monitoring',
    description: 'Realtidsövervakning och säkerhetskontroll av AI-bot aktivitet på din webbplats.',
    businessValue: 'Säkerställer att AI-botar beter sig korrekt och identifierar potentiella skadliga crawlers.',
    status: 'activated',
    category: 'live-data',
    priority: 'high',
    dataSources: ['Server logs', 'Bot signatures'],
    integrations: ['Internal tracking'],
    order: 4,
    enabled: true,
    hasLiveData: true,
  },
  {
    id: 'google-search-console',
    title: 'Google Search Console Performance',
    description: 'Visar vilka sökord du rankar för och hur mycket trafik du får från Google. Starkt samband mellan Google-ranking och AI-citations.',
    businessValue: 'Ger konkreta data om vilka topics och keywords du är stark inom, vilket hjälper förstå var du bör förvänta AI-citations.',
    status: 'partial',
    category: 'live-data',
    priority: 'high',
    dataSources: ['Google Search Console', 'Google Analytics 4'],
    integrations: ['Google Search Console', 'GA4'],
    order: 5,
    enabled: false,
    hasLiveData: true,
  },
  {
    id: 'bing-webmaster',
    title: 'Bing Webmaster Tools Performance',
    description: 'Bing ägs av Microsoft som utvecklar ChatGPT. Innehåll som rankar bra i Bing har högre chans att citeras i ChatGPT.',
    businessValue: 'Kritiskt för ChatGPT-optimering eftersom ChatGPT använder Bing som datakälla. Bing rapporterar även IndexNow adoption.',
    status: 'partial',
    category: 'live-data',
    priority: 'high',
    dataSources: ['Bing Webmaster Tools', 'IndexNow'],
    integrations: ['Bing Webmaster Tools'],
    order: 6,
    enabled: false,
    hasLiveData: true,
  },
];

export const useKPIMetrics = () => {
  const [metrics, setMetrics] = useState<KPIMetric[]>(defaultKPIMetrics);

  const toggleMetric = (metricId: string) => {
    setMetrics(prev => 
      prev.map(m => 
        m.id === metricId ? { ...m, enabled: !m.enabled } : m
      )
    );
  };

  const criticalMetrics = useMemo(
    () => metrics.filter(m => m.category === 'critical').sort((a, b) => a.order - b.order),
    [metrics]
  );

  const liveDataMetrics = useMemo(
    () => metrics.filter(m => m.category === 'live-data').sort((a, b) => a.order - b.order),
    [metrics]
  );

  return {
    metrics,
    criticalMetrics,
    liveDataMetrics,
    toggleMetric,
  };
};
