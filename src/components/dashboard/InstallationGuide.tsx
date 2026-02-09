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
          <CardDescription>Lägg till tracking-scriptet på din webbsida</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-50 rounded-md text-center">
            <h4 className="font-semibold text-yellow-900">⚠️ Ingen webbplats vald</h4>
            <p className="text-sm text-yellow-800 mt-2">
              Välj eller lägg till en webbplats för att se installationsinstruktioner.
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
        <CardDescription>Lägg till tracking-scriptet på din webbsida</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Komplett Tracking (Rekommenderas)</Label>
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
            ✅ GDPR-kompatibel • Cookiefritt fingerprinting • Spårar AI-söktrafik (ChatGPT, Perplexity, Claude, Gemini) • 
            Detekterar AI-bottar (GPTBot, ClaudeBot, PerplexityBot) • Spårar citeringar via UTM • 
            <strong>Paid Ads tracking med UTM-parametrar</strong> (utm_source, utm_medium, utm_campaign, utm_term, utm_content)
          </p>
        </div>

        <div>
          <Label>WordPress Plugin</Label>
          <div className="space-y-2 mt-2">
            <p className="text-sm text-muted-foreground">
              För WordPress-webbsidor kan du använda vårt plugin som automatiskt lägger till tracking-koden.
            </p>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Ladda ner pluginet från ovan</li>
              <li>Installera pluginet på din WordPress-webbsida</li>
              <li>Gå till Inställningar → CortIQ</li>
              <li>Ange ditt Tracking ID: <code className="bg-gray-100 px-1 rounded">{selectedSite.tracking_id}</code></li>
              <li>Aktivera GDPR-kompatibilitet om nödvändigt</li>
            </ol>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-md">
          <h4 className="font-semibold text-blue-900">💡 Tips</h4>
          <ul className="text-sm text-blue-800 mt-2 space-y-1">
            <li>• Scriptet är endast ~15KB och påverkar inte prestanda</li>
            <li>• GDPR-kompatibelt med automatisk consent-hantering</li>
            <li>• Spårar klick, scroll och sessioner anonymt</li>
            <li>• Data visas i realtid på denna dashboard</li>
            <li>• <strong>Paid Ads:</strong> Använd UTM-parametrar i dina annonslänkar (t.ex. ?utm_source=google&utm_medium=cpc&utm_campaign=winter2025) för att spåra kampanjprestanda cookiefritt!</li>
          </ul>
        </div>

      </CardContent>
    </Card>
  );
}