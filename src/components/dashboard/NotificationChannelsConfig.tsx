import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Send, Plus, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Site } from '@/types/dashboard';

interface Channel {
  id: string;
  channel: string;
  label: string | null;
  config: { bot_token: string; chat_id: string };
  is_active: boolean;
  created_at: string;
}

interface Props {
  selectedSite: Site;
}

const ALERT_TYPES = [
  { emoji: '📈', label: 'Traffic Spike',       severity: 'high' },
  { emoji: '🤖', label: 'Scraping Activity',   severity: 'high' },
  { emoji: '🍯', label: 'Honeypot Triggered',  severity: 'critical' },
  { emoji: '🐦', label: 'Canary Detected',     severity: 'critical' },
  { emoji: '💢', label: 'Rage Clicks',          severity: 'medium' },
  { emoji: '📉', label: 'High Bounce Rate',    severity: 'medium' },
];

const SEVERITY_CLASS: Record<string, string> = {
  critical: 'border-red-500    text-red-500',
  high:     'border-orange-500 text-orange-500',
  medium:   'border-yellow-500 text-yellow-500',
};

export function NotificationChannelsConfig({ selectedSite }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ label: '', bot_token: '', chat_id: '' });
  const [testingId, setTestingId] = useState<string | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['notification-channels', selectedSite.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_channels')
        .select('*')
        .eq('site_id', selectedSite.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Channel[];
    },
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const addChannel = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from('notification_channels')
        .insert({
          site_id: selectedSite.id,
          channel: 'telegram',
          label:   form.label.trim() || null,
          config:  { bot_token: form.bot_token.trim(), chat_id: form.chat_id.trim() },
          is_active: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ label: '', bot_token: '', chat_id: '' });
      qc.invalidateQueries({ queryKey: ['notification-channels', selectedSite.id] });
      toast({ title: 'Channel added', description: 'Telegram alerts are now active.' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });

  const deleteChannel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('notification_channels')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-channels', selectedSite.id] });
      toast({ title: 'Channel removed' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });

  // ── Test ──────────────────────────────────────────────────────────────────

  async function testChannel(ch: Channel) {
    setTestingId(ch.id);
    try {
      const siteName = (selectedSite as any).name || (selectedSite as any).domain || selectedSite.id;
      const res = await fetch(
        `https://api.telegram.org/bot${ch.config.bot_token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id:    ch.config.chat_id,
            text:       `✅ *CortIQ Test Message*\nNotifications are working for site: ${siteName}`,
            parse_mode: 'Markdown',
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).description || `HTTP ${res.status}`);
      }
      toast({ title: 'Test sent!', description: 'Check your Telegram.' });
    } catch (e: any) {
      toast({ title: 'Test failed', description: e.message, variant: 'destructive' });
    } finally {
      setTestingId(null);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const canSubmit = form.bot_token.trim() && form.chat_id.trim();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notification Channels
        </h2>
        <p className="text-muted-foreground mt-1">
          Get real-time alerts from Cyber &amp; Analytics events sent directly to your Telegram.
        </p>
      </div>

      {/* Add Telegram channel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Telegram Channel
          </CardTitle>
          <CardDescription>
            Create a bot with{' '}
            <span className="font-mono text-xs bg-muted px-1 rounded">@BotFather</span>{' '}
            on Telegram, add it to your group or start a chat, then get your Chat ID from{' '}
            <span className="font-mono text-xs bg-muted px-1 rounded">
              api.telegram.org/bot&lt;TOKEN&gt;/getUpdates
            </span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Label <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                placeholder="Team Alerts"
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Bot Token <span className="text-destructive">*</span></Label>
              <Input
                placeholder="123456:ABCdef..."
                type="password"
                autoComplete="off"
                value={form.bot_token}
                onChange={e => setForm(f => ({ ...f, bot_token: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Chat ID <span className="text-destructive">*</span></Label>
              <Input
                placeholder="-100123456789"
                value={form.chat_id}
                onChange={e => setForm(f => ({ ...f, chat_id: e.target.value }))}
              />
            </div>
          </div>
          <Button
            onClick={() => addChannel.mutate()}
            disabled={!canSubmit || addChannel.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            {addChannel.isPending ? 'Adding...' : 'Add Channel'}
          </Button>
        </CardContent>
      </Card>

      {/* Existing channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Channels</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : channels.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No channels configured yet. Add one above to start receiving alerts.
            </p>
          ) : (
            <div className="space-y-3">
              {channels.map(ch => (
                <div
                  key={ch.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl leading-none">✈️</span>
                    <div>
                      <p className="font-medium text-sm flex items-center gap-1.5">
                        {ch.label || 'Telegram'}
                        <Badge variant="outline" className="text-xs">Telegram</Badge>
                        {ch.is_active && (
                          <Badge className="text-xs bg-green-500 hover:bg-green-500">Active</Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Chat ID: {ch.config.chat_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testChannel(ch)}
                      disabled={testingId === ch.id}
                    >
                      <Send className="mr-1.5 h-3 w-3" />
                      {testingId === ch.id ? 'Sending...' : 'Test'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteChannel.mutate(ch.id)}
                      disabled={deleteChannel.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert types reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">When will you be notified?</CardTitle>
          <CardDescription>
            A Telegram message is sent each time a behavioral incident is created — instantly for
            canary/honeypot events, or when the scheduled analysis detects a pattern.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ALERT_TYPES.map(item => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                <span>{item.emoji}</span>
                <span>{item.label}</span>
                <Badge
                  variant="outline"
                  className={`text-xs ml-auto ${SEVERITY_CLASS[item.severity]}`}
                >
                  {item.severity}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
