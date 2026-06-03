import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Site {
  id: string;
  site_name: string;
  domain: string;
  tracking_id: string;
  is_active: boolean;
  created_at: string;
}

interface InstallationGuideProps {
  selectedSite: Site | null;
}

export function InstallationGuide({ selectedSite }: InstallationGuideProps) {
  if (!selectedSite) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🚀 Installation</CardTitle>
          <CardDescription>Add the tracking script to your website</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-50 rounded-md text-center">
            <h4 className="font-semibold text-yellow-900">⚠️ No website selected</h4>
            <p className="text-sm text-yellow-800 mt-2">
              Select or add a website to see installation instructions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🚀 Installation</CardTitle>
        <CardDescription>Add the tracking script to your website</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Complete Tracking (Recommended)</Label>
          <div className="bg-gray-100 p-4 rounded-md font-mono text-sm mt-2">
            {`<!-- Unified AI Tracking (Search + Bots + Citations + UTM/Paid Ads) -->
<script 
  src="${window.location.origin}/ai-tracking-unified.js"
  data-site-id="${selectedSite.id}"
  data-supabase-url="https://cxmkdtgfocgbfizawlwa.supabase.co"
  defer>
</script>

<!-- Standard Tracking (Heatmaps, Sessions, Page Views) -->
<script 
  src="${window.location.origin}/tracking-script.js" 
  data-tracking-id="${selectedSite.tracking_id}">
</script>`}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            ✅ GDPR-compliant • Cookie-free fingerprinting • Tracks AI search traffic (ChatGPT, Perplexity, Claude, Gemini) •
            Detects AI bots (GPTBot, ClaudeBot, PerplexityBot) • Tracks citations via UTM •
            <strong>Paid Ads tracking with UTM parameters</strong> (utm_source, utm_medium, utm_campaign, utm_term, utm_content)
          </p>
        </div>

        <div>
          <Label>WordPress Plugin</Label>
          <div className="space-y-2 mt-2">
            <p className="text-sm text-muted-foreground">
              For WordPress websites you can use our plugin which automatically adds the tracking code.
            </p>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Download the plugin from above</li>
              <li>Install the plugin on your WordPress website</li>
              <li>Go to Settings → CortIQ</li>
              <li>Enter your Tracking ID: <code className="bg-gray-100 px-1 rounded">{selectedSite.tracking_id}</code></li>
              <li>Enable GDPR compatibility if needed</li>
            </ol>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-md">
          <h4 className="font-semibold text-blue-900">💡 Tips</h4>
          <ul className="text-sm text-blue-800 mt-2 space-y-1">
            <li>• The script is only ~15KB and does not affect performance</li>
            <li>• GDPR-compliant with automatic consent handling</li>
            <li>• Tracks clicks, scrolls, and sessions anonymously</li>
            <li>• Data appears in real-time on this dashboard</li>
            <li>• <strong>Paid Ads:</strong> Use UTM parameters in your ad links (e.g. ?utm_source=google&utm_medium=cpc&utm_campaign=winter2025) to track campaign performance cookie-free!</li>
          </ul>
        </div>

      </CardContent>
    </Card>
  );
}