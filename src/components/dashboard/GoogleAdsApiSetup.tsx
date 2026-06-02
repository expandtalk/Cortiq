import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ShieldCheck, ShieldAlert, ChevronDown, ChevronUp, ExternalLink, Copy, Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GoogleAdsApiSetupProps {
  siteId: string;
  onConfigured?: () => void;
}

interface Credentials {
  developer_token: string;
  customer_id: string;
  client_id: string;
  client_secret: string;
  refresh_token: string;
  login_customer_id: string;
}

const EMPTY: Credentials = {
  developer_token: '',
  customer_id: '',
  client_id: '',
  client_secret: '',
  refresh_token: '',
  login_customer_id: '',
};

const OAUTH_SCOPE = 'https://www.googleapis.com/auth/adwords';

export function GoogleAdsApiSetup({ siteId, onConfigured }: GoogleAdsApiSetupProps) {
  const [open, setOpen] = useState(false);
  const [creds, setCreds] = useState<Credentials>(EMPTY);
  const [isConfigured, setIsConfigured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('site_integrations')
        .select('integration_config')
        .eq('site_id', siteId)
        .eq('integration_type', 'google_ads_api')
        .eq('is_active', true)
        .maybeSingle();

      if (data?.integration_config) {
        const cfg = data.integration_config as any;
        setCreds({
          developer_token: cfg.developer_token ?? '',
          customer_id: cfg.customer_id ?? '',
          client_id: cfg.client_id ?? '',
          client_secret: cfg.client_secret ?? '',
          refresh_token: cfg.refresh_token ?? '',
          login_customer_id: cfg.login_customer_id ?? '',
        });
        setIsConfigured(true);
      }
    };
    load();
  }, [siteId]);

  const handleSave = async () => {
    const required = ['developer_token', 'customer_id', 'client_id', 'client_secret', 'refresh_token'] as const;
    const missing = required.filter(k => !creds[k].trim());
    if (missing.length > 0) {
      setSaveError('Please fill in all required fields: ' + missing.join(', '));
      return;
    }

    setSaving(true);
    setSaveError(null);

    const { error } = await supabase
      .from('site_integrations')
      .upsert(
        {
          site_id: siteId,
          integration_type: 'google_ads_api',
          is_active: true,
          integration_config: {
            developer_token: creds.developer_token.trim(),
            customer_id: creds.customer_id.replace(/-/g, '').trim(),
            client_id: creds.client_id.trim(),
            client_secret: creds.client_secret.trim(),
            refresh_token: creds.refresh_token.trim(),
            login_customer_id: creds.login_customer_id.replace(/-/g, '').trim() || null,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'site_id,integration_type' }
      );

    setSaving(false);

    if (error) {
      setSaveError('Could not save: ' + error.message);
    } else {
      setIsConfigured(true);
      setOpen(false);
      onConfigured?.();
    }
  };

  const handleDisconnect = async () => {
    await supabase
      .from('site_integrations')
      .update({ is_active: false })
      .eq('site_id', siteId)
      .eq('integration_type', 'google_ads_api');

    setCreds(EMPTY);
    setIsConfigured(false);
  };

  const copyScope = () => {
    navigator.clipboard.writeText(OAUTH_SCOPE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className={isConfigured ? 'border-green-500/40' : 'border-dashed'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <ShieldCheck className="h-5 w-5 text-green-500" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            )}
            <CardTitle className="text-base">Google Ads API</CardTitle>
            {isConfigured ? (
              <Badge variant="default" className="bg-green-600 text-xs">Connected</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Not configured</Badge>
            )}
          </div>
          <div className="flex gap-2">
            {isConfigured && (
              <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-muted-foreground text-xs">
                Disconnect
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setOpen(v => !v)}>
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {isConfigured ? 'Edit' : 'Configure'}
            </Button>
          </div>
        </div>
        <CardDescription>
          {isConfigured
            ? 'Invalid click data is fetched from the Google Ads API and combined with your own bot analysis.'
            : 'Connect your Google Ads API to see Invalid Clicks per campaign directly in the fraud dashboard.'}
        </CardDescription>
      </CardHeader>

      <Collapsible open={open}>
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">

            {/* Step-by-step guide */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-4 text-sm">
              <p className="font-semibold text-foreground">Step-by-step — approx. 10 minutes</p>

              <div className="space-y-3">
                <Step n={1} title="Get Developer Token">
                  <p>Go to <ExtLink href="https://ads.google.com/aw/apicenter">Google Ads API Center</ExtLink> (Tools → API Center in Google Ads). If you don't have an API project, apply for Basic access — it's approved immediately for your own accounts.</p>
                  <p className="text-muted-foreground">Paste the token in the field below.</p>
                </Step>

                <Step n={2} title="Create OAuth app in Google Cloud Console">
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Open <ExtLink href="https://console.cloud.google.com/apis/credentials">Google Cloud Console → Credentials</ExtLink></li>
                    <li>Click <strong className="text-foreground">Create Credentials → OAuth client ID</strong></li>
                    <li>Select <strong className="text-foreground">Web application</strong></li>
                    <li>Add <code className="bg-muted px-1 rounded text-xs">https://developers.google.com/oauthplayground</code> as an Authorized redirect URI</li>
                    <li>Copy <strong className="text-foreground">Client ID</strong> and <strong className="text-foreground">Client Secret</strong></li>
                  </ol>
                  <p className="text-muted-foreground mt-1">Make sure the Google Ads API is enabled in <ExtLink href="https://console.cloud.google.com/apis/library/googleads.googleapis.com">API Library</ExtLink>.</p>
                </Step>

                <Step n={3} title="Generate Refresh Token via OAuth Playground">
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Open <ExtLink href="https://developers.google.com/oauthplayground">OAuth 2.0 Playground</ExtLink></li>
                    <li>Click the gear icon top right → enable <strong className="text-foreground">Use your own OAuth credentials</strong></li>
                    <li>Enter your Client ID and Client Secret</li>
                    <li>
                      In the "Input your own scopes" field, paste:
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-muted px-2 py-1 rounded text-xs flex-1 break-all">{OAUTH_SCOPE}</code>
                        <button onClick={copyScope} className="shrink-0 text-muted-foreground hover:text-foreground">
                          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </li>
                    <li>Click <strong className="text-foreground">Authorize APIs</strong> → sign in with your Google Ads account</li>
                    <li>Click <strong className="text-foreground">Exchange authorization code for tokens</strong></li>
                    <li>Copy the <strong className="text-foreground">Refresh token</strong></li>
                  </ol>
                </Step>

                <Step n={4} title="Customer ID">
                  <p className="text-muted-foreground">Found in the top right of the Google Ads interface, format: <code className="bg-muted px-1 rounded text-xs">123-456-7890</code>. Dashes not required — we strip them automatically.</p>
                  <p className="text-muted-foreground mt-1">If you use an MCC account (Manager Account): enter the client account ID in Customer ID, and the MCC account ID in Login Customer ID.</p>
                </Step>
              </div>
            </div>

            {/* Credential fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Developer Token <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="AbCd_EfGhIjKlMnOpQrSt"
                  type="password"
                  value={creds.developer_token}
                  onChange={e => setCreds(p => ({ ...p, developer_token: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Customer ID <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="123-456-7890"
                  value={creds.customer_id}
                  onChange={e => setCreds(p => ({ ...p, customer_id: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>OAuth Client ID <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="123456789-abc.apps.googleusercontent.com"
                  value={creds.client_id}
                  onChange={e => setCreds(p => ({ ...p, client_id: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>OAuth Client Secret <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="GOCSPX-..."
                  type="password"
                  value={creds.client_secret}
                  onChange={e => setCreds(p => ({ ...p, client_secret: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label>Refresh Token <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="1//0g..."
                  type="password"
                  value={creds.refresh_token}
                  onChange={e => setCreds(p => ({ ...p, refresh_token: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label>Login Customer ID <span className="text-muted-foreground text-xs">(optional — only for MCC/Manager accounts)</span></Label>
                <Input
                  placeholder="MCC account ID, e.g. 987-654-3210"
                  value={creds.login_customer_id}
                  onChange={e => setCreds(p => ({ ...p, login_customer_id: e.target.value }))}
                />
              </div>
            </div>

            {saveError && (
              <Alert variant="destructive">
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : isConfigured ? 'Update' : 'Save and connect'}
              </Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold mt-0.5">
        {n}
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        <div className="text-muted-foreground space-y-1">{children}</div>
      </div>
    </div>
  );
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-primary underline underline-offset-2">
      {children}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}
