import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tag, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { Site } from '@/types/dashboard';

interface Props {
  selectedSite: Site;
}

export function BrandKeywordsSettings({ selectedSite }: Props) {
  const [credentialId, setCredentialId] = useState<string | null>(null);
  const [keywords, setKeywords] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('site_google_credentials')
        .select('id, brand_keywords')
        .eq('site_id', selectedSite.id)
        .eq('is_active', true)
        .maybeSingle();
      if (data) {
        setCredentialId(data.id);
        setKeywords(data.brand_keywords ?? '');
        setSaved(data.brand_keywords ?? '');
      }
      setLoading(false);
    }
    load();
  }, [selectedSite.id]);

  async function handleSave() {
    if (!credentialId) return;
    setSaving(true);
    const { error } = await supabase
      .from('site_google_credentials')
      .update({ brand_keywords: keywords.trim() || null })
      .eq('id', credentialId);
    setSaving(false);
    if (error) {
      toast.error('Could not save brand keywords');
    } else {
      setSaved(keywords.trim());
      toast.success('Brand keywords saved');
    }
  }

  const terms = saved.split(',').map(t => t.trim()).filter(Boolean);

  if (loading) return null;

  if (!credentialId) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-sm text-muted-foreground text-center">
          Connect Google Search Console above to configure brand keywords.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Tag className="h-4 w-4" /> Brand keywords
        </CardTitle>
        <CardDescription>
          Comma-separated terms used to split branded vs. non-branded clicks in the GSC dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="brand-kw">Terms (comma-separated)</Label>
          <div className="flex gap-2">
            <Input
              id="brand-kw"
              placeholder="e.g. cortiq, expandtalk, sentrisk"
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !saving && handleSave()}
            />
            <Button onClick={handleSave} disabled={saving || keywords.trim() === saved} size="sm" className="shrink-0">
              <Save className="h-4 w-4 mr-1.5" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
        {terms.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {terms.map(t => (
              <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
