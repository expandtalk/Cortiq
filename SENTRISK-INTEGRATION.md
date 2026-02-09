# Sentrisk + CortIQ Integration Guide

## Översikt
Guide för att integrera CortIQ (tidigare Web Focus Analyzer) i Sentrisk multi-tenant plattformen.

## Arkitektur

```
Sentrisk (Multi-tenant)
├── companies (tenant isolation)
├── wfa_sites (kopplar CortIQ-sites till companies)
└── API Proxy → CortIQ Edge Functions
```

## Steg 1: Databasschema för Sentrisk

### Migration: Lägg till WFA-integration

```sql
-- CortIQ sites table i Sentrisk (behåller wfa_sites för bakåtkompatibilitet)
CREATE TABLE public.wfa_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  site_name TEXT NOT NULL,
  domain TEXT NOT NULL,
  tracking_id TEXT NOT NULL UNIQUE DEFAULT ('wfa_' || replace(gen_random_uuid()::text, '-', '')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- CortIQ configuration
  wfa_config JSONB DEFAULT '{
    "anonymize_ip": true,
    "cookie_consent_enabled": true,
    "heatmap_enabled": true,
    "form_tracking_enabled": true,
    "ai_bot_tracking_enabled": true
  }'::jsonb,
  
  UNIQUE(company_id, domain)
);

-- RLS policies
ALTER TABLE public.wfa_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company WFA sites"
ON public.wfa_sites FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.company_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage their company WFA sites"
ON public.wfa_sites FOR ALL
TO authenticated
USING (
  company_id IN (
    SELECT cu.company_id FROM public.company_users cu
    WHERE cu.user_id = auth.uid() AND cu.role = 'admin'
  )
)
WITH CHECK (
  company_id IN (
    SELECT cu.company_id FROM public.company_users cu
    WHERE cu.user_id = auth.uid() AND cu.role = 'admin'
  )
);

-- Index for performance
CREATE INDEX idx_wfa_sites_company ON public.wfa_sites(company_id);
CREATE INDEX idx_wfa_sites_tracking_id ON public.wfa_sites(tracking_id);

-- Trigger för updated_at
CREATE TRIGGER update_wfa_sites_updated_at
  BEFORE UPDATE ON public.wfa_sites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

## Steg 2: API Proxy Edge Function

### `/supabase/functions/cortiq-proxy/index.ts` (eller behåll wfa-proxy för bakåtkompatibilitet)

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CORTIQ_SUPABASE_URL = 'https://cxmkdtgfocgbfizawlwa.supabase.co';
const CORTIQ_SUPABASE_KEY = Deno.env.get('CORTIQ_SUPABASE_ANON_KEY') || Deno.env.get('WFA_SUPABASE_ANON_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verifiera användare i Sentrisk
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { trackingId, endpoint, method, body } = await req.json();

    // Verifiera att tracking_id tillhör användarens företag
    const { data: wfaSite, error: siteError } = await supabaseClient
      .from('wfa_sites')
      .select('*, companies!inner(id)')
      .eq('tracking_id', trackingId)
      .single();

    if (siteError || !wfaSite) {
      throw new Error('Invalid tracking ID or unauthorized access');
    }

    // Proxy request till CortIQ
    const cortiqClient = createClient(CORTIQ_SUPABASE_URL, CORTIQ_SUPABASE_KEY);
    
    const response = await cortiqClient.functions.invoke(endpoint, {
      body: {
        ...body,
        site_id: trackingId, // Använd tracking_id som site_id i CortIQ
      },
    });

    if (response.error) throw response.error;

    return new Response(JSON.stringify(response.data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('CortIQ Proxy error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

## Steg 3: Sentrisk Frontend Integration

### Hook: `useCortIQAnalytics.tsx` (eller behåll useWFAAnalytics för bakåtkompatibilitet)

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WFAAnalyticsData {
  totalSessions: number;
  totalPageViews: number;
  averageSessionDuration: number;
  engagementRate: number;
  topPages: Array<{ url: string; views: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
}

export function useWFAAnalytics(trackingId: string | null, dateRange?: { from: Date; to: Date }) {
  const [analytics, setAnalytics] = useState<WFAAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trackingId) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('cortiq-proxy', {
          body: {
            trackingId,
            endpoint: 'cookiefree-analytics',
            method: 'POST',
            body: {
              startDate: dateRange?.from?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              endDate: dateRange?.to?.toISOString() || new Date().toISOString(),
            },
          },
        });

        if (error) throw error;
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching CortIQ analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [trackingId, dateRange]);

  return { analytics, loading };
}
```

### Komponent: `CortIQDashboard.tsx` (eller behåll WFADashboard för bakåtkompatibilitet)

```typescript
import { Card } from '@/components/ui/card';
import { useWFAAnalytics } from '@/hooks/useWFAAnalytics';

interface WFADashboardProps {
  trackingId: string;
}

export function WFADashboard({ trackingId }: WFADashboardProps) {
  const { analytics, loading } = useWFAAnalytics(trackingId);

  if (loading) return <div>Laddar analytics...</div>;
  if (!analytics) return <div>Ingen data tillgänglig</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground">Totala Sessioner</h3>
        <p className="text-3xl font-bold">{analytics.totalSessions.toLocaleString('sv-SE')}</p>
      </Card>
      
      <Card className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground">Sidvisningar</h3>
        <p className="text-3xl font-bold">{analytics.totalPageViews.toLocaleString('sv-SE')}</p>
      </Card>
      
      <Card className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground">Snitt Sessionstid</h3>
        <p className="text-3xl font-bold">{Math.round(analytics.averageSessionDuration / 60)}m</p>
      </Card>
      
      <Card className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground">Engagemang</h3>
        <p className="text-3xl font-bold">{analytics.engagementRate.toFixed(1)}%</p>
      </Card>
    </div>
  );
}
```

## Steg 4: WordPress Plugin Distribution

### Sentrisk: Generera plugin-konfiguration

```typescript
// I Sentrisk när kund skapar CortIQ site
const generateCortIQPluginConfig = (wfaSite: WFASite) => {
  return {
    tracking_id: wfaSite.tracking_id,
    api_url: 'https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1',
    features: {
      heatmap: wfaSite.wfa_config.heatmap_enabled,
      formTracking: wfaSite.wfa_config.form_tracking_enabled,
      aiBotTracking: wfaSite.wfa_config.ai_bot_tracking_enabled,
      cookieConsent: wfaSite.wfa_config.cookie_consent_enabled,
    },
  };
};

// Download plugin med pre-config
const downloadConfiguredPlugin = async (wfaSiteId: string) => {
  const { data } = await supabase
    .from('wfa_sites')
    .select('*')
    .eq('id', wfaSiteId)
    .single();
    
  const config = generateCortIQPluginConfig(data);
  
  // Ladda ner CortIQ WordPress plugin med config.json inkluderad
  window.location.href = `/api/download-cortiq-plugin?config=${encodeURIComponent(JSON.stringify(config))}`;
};
```

## Steg 5: Navigation i Sentrisk

```typescript
// I Sentrisk LoggedInLayout
const navigation = [
  { name: 'Översikt', href: '/dashboard' },
  { name: 'Leads', href: '/leads' },
  { name: 'Företag', href: '/companies' },
  { 
    name: 'Analytics', 
    href: '/analytics',
    children: [
      { name: 'Översikt', href: '/analytics' },
      { name: 'AI Bot Traffic', href: '/analytics/ai-bots' },
      { name: 'Heatmaps', href: '/analytics/heatmaps' },
      { name: 'Formulär', href: '/analytics/forms' },
      { name: 'Inställningar', href: '/analytics/settings' },
    ]
  },
  { name: 'Trafikmätare', href: '/traffic-analyzer' },
  { name: 'Cookies', href: '/cookies' },
];
```

## Säkerhet & Performance

### API Rate Limiting
```typescript
// I wfa-proxy edge function
const RATE_LIMIT = 100; // requests per minute per company
const rateLimitKey = `rate_limit:${wfaSite.company_id}`;
// Implementera med Redis eller Supabase
```

### Caching Strategy
```typescript
// Cache WFA analytics i 5 minuter
const CACHE_TTL = 5 * 60 * 1000;

const getCachedAnalytics = async (trackingId: string) => {
  const cacheKey = `wfa_analytics:${trackingId}`;
  // Implementera med Redis eller localStorage för kortare cache
};
```

## Deployment Checklist

- [ ] Kör migration i Sentrisk Supabase
- [ ] Deploya `wfa-proxy` edge function
- [ ] Lägg till `CORTIQ_SUPABASE_ANON_KEY` (eller `WFA_SUPABASE_ANON_KEY` för bakåtkompatibilitet) i Sentrisk secrets
- [ ] Skapa `/analytics` route i Sentrisk
- [ ] Importera WFA komponenter till Sentrisk
- [ ] Testa med test-company och test-domain
- [ ] Konfigurera CORS i CortIQ för Sentrisk domain
- [ ] Dokumentera för kunder hur de aktiverar CortIQ

## Support & Troubleshooting

### Common Issues

**Problem:** "Invalid tracking ID"
- Kontrollera att tracking_id finns i wfa_sites
- Verifiera att användaren har access till company

**Problem:** "CORS error"
- Lägg till Sentrisk domain i WFA CORS-inställningar
- Kontrollera corsHeaders i edge functions

**Problem:** "No data showing"
- Kontrollera att WordPress plugin är installerat och aktiverat
- Verifiera att tracking_id är korrekt konfigurerat
- Kolla CortIQ edge function logs

## Kontakt
- CortIQ Team: [kontaktinfo]
- Sentrisk Team: [kontaktinfo]
