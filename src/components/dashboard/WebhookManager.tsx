import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Send, Plus, Webhook, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Site } from '@/types/dashboard';

interface WebhookChannel {
  id: string;
  label: string | null;
  config: { url: string; secret?: string };
  is_active: boolean;
  created_at: string;
}

interface Delivery {
  id: string;
  event_type: string;
  status: 'pending' | 'success' | 'failed';
  http_status: number | null;
  delivered_at: string;
}

interface Props {
  selectedSite: Site;
}

const EVENT_EXAMPLES = [
  { type: 'traffic_spike',     label: 'Traffic Spike' },
  { type: 'ai_agent_detected', label: 'AI Agent Detected' },
  { type: 'honeypot_triggered', label: 'Honeypot Triggered' },
  { type: 'conversion',        label: 'Conversion' },
];

function statusIcon(status: Delivery['status']) {
  if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === 'failed')  return <XCircle      className="h-4 w-4 text-red-500" />;
  return <Clock className="h-4 w-4 text-yellow-500" />;
}

export function WebhookManager({ selectedSite }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ label: '', url: '', secret: '' });
  const [testingId, setTestingId] = useState<string | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['webhook-channels', selectedSite.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_channels')
        .select('id, label, config, is_active, created_at')
        .eq('site_id', selectedSite.id)
        .eq('channel', 'webhook')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WebhookChannel[];
    },
  });

  const { data: deliveries = [] } = useQuery({
    queryKey: ['webhook-deliveries', selectedSite.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('id, event_type, status, http_status, delivered_at')
        .eq('site_id', selectedSite.id)
        .order('delivered_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Delivery[];
    },
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('notification_channels').insert({
        site_id: selectedSite.id,
        channel: 'webhook',
        label: form.label || null,
        config: { url: form.url, secret: form.secret || undefined },
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhook-channels', selectedSite.id] });
      setForm({ label: '', url: '', secret: '' });
      toast({ title: 'Webhook added' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notification_channels')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhook-channels', selectedSite.id] });
      toast({ title: 'Webhook removed' });
    },
  });

  // ── Test dispatch ─────────────────────────────────────────────────────────

  async function sendTest(webhook: WebhookChannel) {
    setTestingId(webhook.id);
    try {
      const payload = {
        event: 'test',
        severity: 'low',
        site_id: selectedSite.id,
        timestamp: new Date().toISOString(),
        details: { message: 'Test delivery from CortIQ' },
      };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const body = JSON.stringify(payload);

      if (webhook.config.secret) {
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw', enc.encode(webhook.config.secret),
          { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
        );
        const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
        headers['X-CortIQ-Signature'] = 'sha256=' + Array.from(new Uint8Array(sig))
          .map(b => b.toString(16).padStart(2, '0')).join('');
      }

      const res = await fetch(webhook.config.url, { method: 'POST', headers, body });

      await supabase.from('webhook_deliveries').insert({
        channel_id: webhook.id,
        site_id: selectedSite.id,
        event_type: 'test',
        payload,
        status: res.ok ? 'success' : 'failed',
        http_status: res.status,
        response_body: null,
      });

      qc.invalidateQueries({ queryKey: ['webhook-deliveries', selectedSite.id] });
      toast({
        title: res.ok ? `Test sent — HTTP ${res.status}` : `Test failed — HTTP ${res.status}`,
        variant: res.ok ? 'default' : 'destructive',
      });
    } catch (err: any) {
      toast({ title: 'Test failed', description: err.message, variant: 'destructive' });
    } finally {
      setTestingId(null);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Add webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Add Webhook Endpoint
          </CardTitle>
          <CardDescription>
            CortIQ will POST a signed JSON payload to your URL when an alert fires.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Label (optional)</Label>
              <Input
                placeholder="My Slack relay"
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Endpoint URL *</Label>
              <Input
                placeholder="https://example.com/hooks/cortiq"
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Secret (optional — used for HMAC-SHA256 signature)</Label>
              <Input
                type="password"
                placeholder="Shared secret for X-CortIQ-Signature header"
                value={form.secret}
                onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
              />
            </div>
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!form.url || createMutation.isPending}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add webhook
          </Button>
        </CardContent>
      </Card>

      {/* Payload reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Payload format</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted rounded p-3 text-xs overflow-x-auto">{JSON.stringify({
            event: 'traffic_spike',
            severity: 'high',
            site_id: '<uuid>',
            timestamp: '2026-05-28T10:00:00.000Z',
            details: { threshold: 500, current_value: 823 },
          }, null, 2)}</pre>
          <p className="text-xs text-muted-foreground mt-2">
            When a secret is set, verify the <code>X-CortIQ-Signature</code> header
            (<code>sha256=&lt;hmac&gt;</code>) against the raw request body.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {EVENT_EXAMPLES.map(e => (
              <Badge key={e.type} variant="secondary" className="text-xs font-mono">{e.type}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Existing webhooks */}
      {!isLoading && webhooks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active endpoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {webhooks.map(wh => (
              <div key={wh.id} className="flex items-center justify-between p-3 border rounded-lg gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{wh.label ?? wh.config.url}</p>
                  {wh.label && (
                    <p className="text-xs text-muted-foreground truncate">{wh.config.url}</p>
                  )}
                  <div className="flex gap-2 mt-1">
                    <Badge variant={wh.is_active ? 'default' : 'outline'} className="text-xs">
                      {wh.is_active ? 'Active' : 'Paused'}
                    </Badge>
                    {wh.config.secret && (
                      <Badge variant="secondary" className="text-xs">Signed</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={testingId === wh.id}
                    onClick={() => sendTest(wh)}
                    className="gap-1"
                  >
                    <Send className="h-3 w-3" />
                    Test
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(wh.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Delivery log */}
      {deliveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent deliveries (last 20)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {deliveries.map(d => (
                <div key={d.id} className="flex items-center gap-3 py-1.5 border-b last:border-0 text-sm">
                  {statusIcon(d.status)}
                  <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">
                    {d.http_status ?? '—'}
                  </span>
                  <span className="flex-1 truncate">{d.event_type}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(d.delivered_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
