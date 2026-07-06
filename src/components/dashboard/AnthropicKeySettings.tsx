import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Brain, Eye, EyeOff, Save, Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Site } from '@/types/dashboard';

interface AnthropicKeySettingsProps {
  selectedSite: Site;
}

export function AnthropicKeySettings({ selectedSite }: AnthropicKeySettingsProps) {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: site } = await supabase
        .from('sites')
        .select('company_id')
        .eq('id', selectedSite.id)
        .maybeSingle();

      if (!site?.company_id) { setLoading(false); return; }
      setCompanyId(site.company_id);

      // The key is never returned to the browser — we only learn whether one
      // exists and its last 4 chars, via the service-role edge function.
      const { data, error } = await supabase.functions.invoke('anthropic-key', {
        body: { action: 'status', companyId: site.company_id },
      });
      if (!error && data?.hasKey) {
        setSaved(true);
        setKey('sk-ant-••••••••••••••••' + (data.last4 ?? ''));
      }
      setLoading(false);
    };
    load();
  }, [selectedSite.id]);

  const handleSave = async () => {
    const trimmed = key.trim();
    if (!trimmed.startsWith('sk-ant-')) {
      toast.error('Key must start with sk-ant-');
      return;
    }
    if (!companyId) {
      toast.error('No company found for this site.');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke('anthropic-key', {
      body: { action: 'save', companyId, key: trimmed },
    });

    setSaving(false);
    if (error || data?.error) {
      toast.error('Could not save key: ' + (data?.error ?? error?.message ?? 'unknown error'));
    } else {
      setSaved(true);
      setKey('sk-ant-••••••••••••••••' + (data?.last4 ?? ''));
      toast.success('Anthropic API key saved.');
    }
  };

  const handleRemove = async () => {
    if (!companyId) return;
    setSaving(true);
    const { data, error } = await supabase.functions.invoke('anthropic-key', {
      body: { action: 'remove', companyId },
    });

    setSaving(false);
    if (error || data?.error) {
      toast.error('Could not remove key.');
    } else {
      setKey('');
      setSaved(false);
      toast.success('Key removed. Platform shared key will be used.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Anthropic API Key (BYOK)</CardTitle>
          </div>
          {saved
            ? <Badge variant="outline" className="border-green-500 text-green-600 text-xs">Active — your own key</Badge>
            : <Badge variant="outline" className="text-muted-foreground text-xs">Using platform shared key</Badge>
          }
        </div>
        <CardDescription>
          Your own key is used for AI Insights and Q&amp;A. Without it, the platform's shared key is used.
          Get a key at{' '}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex items-center gap-0.5 hover:underline"
          >
            console.anthropic.com <ExternalLink className="h-3 w-3" />
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="h-9 bg-muted rounded animate-pulse" />
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="anthropic-key">API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="anthropic-key"
                    type={showKey ? 'text' : 'password'}
                    placeholder="sk-ant-api03-..."
                    value={key}
                    onChange={e => { setKey(e.target.value); setSaved(false); }}
                    className="pr-10 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button onClick={handleSave} disabled={saving || !key.trim()} size="sm">
                  <Save className="h-4 w-4 mr-1.5" />
                  {saving ? 'Saving…' : 'Save'}
                </Button>
                {saved && (
                  <Button onClick={handleRemove} disabled={saving} size="sm" variant="outline">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              The key is stored server-side, never sent back to your browser, and never shared with
              other tenants. It's only used for AI features within CortIQ.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
