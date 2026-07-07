import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, ShieldAlert, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Site } from '@/types/dashboard';

type DetectedScript = {
  id: string;
  script_name: string | null;
  provider: string | null;
  category: string | null;
  purpose: string | null;
  script_url: string | null;
  last_seen: string | null;
};

// Map a detected provider/name/url substring to a known Integration Hub tool so it can
// be consent-gated with one click. First match wins.
const PROVIDER_MAP: { match: string; label: string; enabledField: string; risk: 'low' | 'medium' | 'high' }[] = [
  { match: 'googletagmanager', label: 'Google Tag Manager', enabledField: 'gtm_enabled', risk: 'high' },
  { match: 'tag manager',      label: 'Google Tag Manager', enabledField: 'gtm_enabled', risk: 'high' },
  { match: 'gtm-',             label: 'Google Tag Manager', enabledField: 'gtm_enabled', risk: 'high' },
  { match: 'google analytics', label: 'Google Analytics', enabledField: 'ga_integration_enabled', risk: 'medium' },
  { match: 'gtag',             label: 'Google Analytics', enabledField: 'ga_integration_enabled', risk: 'medium' },
  { match: 'analytics.js',     label: 'Google Analytics', enabledField: 'ga_integration_enabled', risk: 'medium' },
  { match: 'facebook',         label: 'Facebook/Instagram Pixel', enabledField: 'facebook_pixel_enabled', risk: 'high' },
  { match: 'connect.facebook', label: 'Facebook/Instagram Pixel', enabledField: 'facebook_pixel_enabled', risk: 'high' },
  { match: 'fbevents',         label: 'Facebook/Instagram Pixel', enabledField: 'facebook_pixel_enabled', risk: 'high' },
  { match: 'meta pixel',       label: 'Facebook/Instagram Pixel', enabledField: 'facebook_pixel_enabled', risk: 'high' },
  { match: 'hotjar',           label: 'Hotjar', enabledField: 'hotjar_enabled', risk: 'medium' },
  { match: 'clarity',          label: 'Microsoft Clarity', enabledField: 'microsoft_clarity_enabled', risk: 'medium' },
  { match: 'tiktok',           label: 'TikTok Pixel', enabledField: 'tiktok_pixel_enabled', risk: 'high' },
  { match: 'linkedin',         label: 'LinkedIn Insight', enabledField: 'linkedin_insight_enabled', risk: 'medium' },
  { match: 'hubspot',          label: 'HubSpot', enabledField: 'hubspot_enabled', risk: 'medium' },
  { match: 'mixpanel',         label: 'Mixpanel', enabledField: 'mixpanel_enabled', risk: 'medium' },
];

const RISK: Record<'low' | 'medium' | 'high', string> = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-red-100 text-red-800 border-red-200',
};

function matchProvider(s: DetectedScript) {
  const hay = `${s.provider || ''} ${s.script_name || ''} ${s.script_url || ''}`.toLowerCase();
  return PROVIDER_MAP.find((p) => hay.includes(p.match)) || null;
}

export function DetectedTools({ selectedSite, siteData, onEnable }: {
  selectedSite: Site;
  siteData: any;
  onEnable: (enabledField: string, label: string) => void;
}) {
  const [scripts, setScripts] = useState<DetectedScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('detected_scripts')
      .select('id, script_name, provider, category, purpose, script_url, last_seen')
      .eq('site_id', selectedSite.id)
      .order('last_seen', { ascending: false });
    setScripts((data as DetectedScript[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSite.id]);

  const scan = async () => {
    setScanning(true);
    try {
      const url = selectedSite.domain?.startsWith('http') ? selectedSite.domain : `https://${selectedSite.domain}`;
      const { data, error } = await supabase.functions.invoke('cookie-scanner', {
        body: { site_id: selectedSite.id, url },
      });
      if (error) {
        toast.error('Scan failed: ' + error.message);
        return;
      }
      toast.success(`Scan complete — found ${data?.scripts_found ?? 0} scripts`);
      await load();
    } catch (e) {
      toast.error('Scan failed');
    } finally {
      setScanning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" /> Detected on your site
            </CardTitle>
            <CardDescription>
              Third-party tools CortIQ found in your live pages. Enable one to route it through the cookie banner.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={scan} disabled={scanning}>
            <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scanning…' : 'Scan now'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : scripts.length === 0 ? (
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              No third-party tools detected yet. Run a scan to check your live pages.
            </AlertDescription>
          </Alert>
        ) : (
          scripts.map((s) => {
            const m = matchProvider(s);
            const enabled = m ? !!siteData?.[m.enabledField] : false;
            return (
              <div key={s.id} className="flex items-center justify-between gap-3 p-3 border rounded-lg">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{s.provider || s.script_name || 'Unknown script'}</span>
                    {s.category && <Badge variant="outline" className="text-xs">{s.category}</Badge>}
                    {m && (
                      <Badge variant="outline" className={`text-xs ${RISK[m.risk]}`}>
                        {m.risk} risk
                      </Badge>
                    )}
                  </div>
                  {s.purpose && <p className="text-xs text-muted-foreground mt-1 truncate">{s.purpose}</p>}
                </div>
                {m ? (
                  enabled ? (
                    <Badge variant="secondary" className="shrink-0">Consent-gated ✓</Badge>
                  ) : (
                    <Button size="sm" className="shrink-0" onClick={() => onEnable(m.enabledField, m.label)}>
                      Enable
                    </Button>
                  )
                ) : (
                  <Badge variant="outline" className="shrink-0 text-xs">Not in hub</Badge>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export default DetectedTools;
