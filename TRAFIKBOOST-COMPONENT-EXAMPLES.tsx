/**
 * TrafikBoost Integration - Component Examples
 * Copy these components to your TrafikBoost project
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// 1. WFA Site Creator Component
// ============================================================================

interface WFASiteCreatorProps {
  companyId: string;
  onSuccess?: () => void;
}

export function WFASiteCreator({ companyId, onSuccess }: WFASiteCreatorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    siteName: '',
    domain: '',
    heatmapEnabled: true,
    formTrackingEnabled: true,
    aiBotTrackingEnabled: true,
    cookieConsentEnabled: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('wfa_sites')
        .insert({
          company_id: companyId,
          site_name: formData.siteName,
          domain: formData.domain,
          wfa_config: {
            heatmap_enabled: formData.heatmapEnabled,
            form_tracking_enabled: formData.formTrackingEnabled,
            ai_bot_tracking_enabled: formData.aiBotTrackingEnabled,
            cookie_consent_enabled: formData.cookieConsentEnabled,
          },
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✅ Site skapad',
        description: `Tracking ID: ${data.tracking_id}`,
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error creating WFA site:', error);
      toast({
        title: '❌ Fel',
        description: 'Kunde inte skapa site',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Lägg till Analytics Site</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="siteName">Site Namn</Label>
          <Input
            id="siteName"
            value={formData.siteName}
            onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
            placeholder="Min WordPress-sajt"
            required
          />
        </div>

        <div>
          <Label htmlFor="domain">Domän</Label>
          <Input
            id="domain"
            type="url"
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            placeholder="https://example.com"
            required
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="heatmap">Heatmap Tracking</Label>
            <Switch
              id="heatmap"
              checked={formData.heatmapEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, heatmapEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="forms">Formulär Analytics</Label>
            <Switch
              id="forms"
              checked={formData.formTrackingEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, formTrackingEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="aiBots">AI Bot Tracking</Label>
            <Switch
              id="aiBots"
              checked={formData.aiBotTrackingEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, aiBotTrackingEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="cookies">Cookie Consent</Label>
            <Switch
              id="cookies"
              checked={formData.cookieConsentEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, cookieConsentEnabled: checked })}
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Skapar...' : 'Skapa Site'}
        </Button>
      </form>
    </Card>
  );
}

// ============================================================================
// 2. WFA Site List Component
// ============================================================================

interface WFASite {
  id: string;
  site_name: string;
  domain: string;
  tracking_id: string;
  is_active: boolean;
  plugin_installed: boolean;
  last_data_received_at: string | null;
}

interface WFASiteListProps {
  companyId: string;
}

export function WFASiteList({ companyId }: WFASiteListProps) {
  const [sites, setSites] = useState<WFASite[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSites = async () => {
    try {
      const { data, error } = await supabase
        .from('wfa_sites')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSites(data || []);
    } catch (error) {
      console.error('Error loading WFA sites:', error);
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    loadSites();
  }, [companyId]);

  const downloadPlugin = async (trackingId: string) => {
    // Implementera download av WordPress plugin med pre-config
    window.open(`/api/download-wfa-plugin?tracking_id=${trackingId}`, '_blank');
  };

  const copyTrackingScript = async (siteId: string) => {
    const { data, error } = await supabase.rpc('get_wfa_tracking_script', {
      p_site_id: siteId,
    });

    if (!error && data) {
      navigator.clipboard.writeText(data);
      toast({ title: '✅ Script kopierat till urklipp' });
    }
  };

  if (loading) return <div>Laddar sites...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Dina Analytics Sites</h2>
      {sites.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          Inga sites än. Skapa din första site ovan.
        </Card>
      ) : (
        sites.map((site) => (
          <Card key={site.id} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{site.site_name}</h3>
                <p className="text-sm text-muted-foreground">{site.domain}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tracking ID: <code className="bg-muted px-1 rounded">{site.tracking_id}</code>
                </p>
                {site.last_data_received_at && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Data mottagen: {new Date(site.last_data_received_at).toLocaleString('sv-SE')}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyTrackingScript(site.id)}
                >
                  Kopiera Script
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadPlugin(site.tracking_id)}
                >
                  Ladda ner Plugin
                </Button>
                <Button
                  size="sm"
                  onClick={() => window.location.href = `/analytics?site=${site.id}`}
                >
                  Visa Analytics
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

// ============================================================================
// 3. WFA Quick Stats Component
// ============================================================================

interface WFAQuickStatsProps {
  trackingId: string;
  dateRange?: { from: Date; to: Date };
}

export function WFAQuickStats({ trackingId, dateRange }: WFAQuickStatsProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('wfa-proxy', {
          body: {
            trackingId,
            endpoint: 'cookiefree-analytics',
            method: 'POST',
            body: {
              startDate: dateRange?.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              endDate: dateRange?.to || new Date(),
            },
          },
        });

        if (error) throw error;
        setStats(data);
      } catch (error) {
        console.error('Error fetching WFA stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [trackingId, dateRange]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-24 mb-2" />
            <div className="h-8 bg-muted rounded w-16" />
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground">Besökare</h3>
        <p className="text-3xl font-bold">{stats.uniqueVisitors?.toLocaleString('sv-SE')}</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground">Sidvisningar</h3>
        <p className="text-3xl font-bold">{stats.totalPageViews?.toLocaleString('sv-SE')}</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground">Sessioner</h3>
        <p className="text-3xl font-bold">{stats.totalSessions?.toLocaleString('sv-SE')}</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground">Avg. Session</h3>
        <p className="text-3xl font-bold">
          {Math.round((stats.averageSessionDuration || 0) / 60)}m
        </p>
      </Card>
    </div>
  );
}

// ============================================================================
// 4. Complete Page Example
// ============================================================================

export function WFAAnalyticsPage() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">CortIQ</h1>
        <Button variant="outline" onClick={() => window.open('https://cortiq.se', '_blank')}>
          Dokumentation
        </Button>
      </div>

      {/* Site Creator */}
      <WFASiteCreator
        companyId={selectedCompanyId}
        onSuccess={() => {
          // Reload sites list
        }}
      />

      {/* Sites List */}
      <WFASiteList companyId={selectedCompanyId} />

      {/* Quick Stats - visas när en site är vald */}
      {selectedSiteId && (
        <WFAQuickStats trackingId={selectedSiteId} />
      )}
    </div>
  );
}
