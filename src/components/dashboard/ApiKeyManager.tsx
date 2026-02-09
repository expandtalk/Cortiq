/**
 * API Key Manager Component
 * Task #5: Publikt REST API med dokumentation
 *
 * Allows users to create, view, and manage API keys for the Public REST API
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Copy, Eye, EyeOff, Key, Trash2, Plus, ExternalLink } from 'lucide-react';
import { ApiKey, generateApiKey, getKeyPrefix, hashApiKey } from '@/types/apiKeys';

interface Site {
  id: string;
  name: string;
  domain: string;
}

export default function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  // Form state
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [rateLimit, setRateLimit] = useState(1000);

  useEffect(() => {
    loadApiKeys();
    loadSites();
  }, []);

  async function loadSites() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('sites')
        .select('id, name, domain')
        .order('name');

      if (error) throw error;
      setSites(data || []);
    } catch (error) {
      console.error('Error loading sites:', error);
      toast.error('Failed to load sites');
    }
  }

  async function loadApiKeys() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }

  async function createApiKey() {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }

    if (!selectedSiteId) {
      toast.error('Please select a site');
      return;
    }

    try {
      setCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get company_id from site
      const { data: site } = await supabase
        .from('sites')
        .select('company_id')
        .eq('id', selectedSiteId)
        .single();

      if (!site) throw new Error('Site not found');

      // Generate new API key
      const apiKey = generateApiKey();
      const keyHash = await hashApiKey(apiKey);
      const keyPrefix = getKeyPrefix(apiKey);

      // Insert into database
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          company_id: site.company_id,
          site_id: selectedSiteId,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          name: newKeyName,
          permissions: ['read'],
          rate_limit: rateLimit,
          created_by: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Show the new API key (only time it will be visible!)
      setNewApiKey(apiKey);
      setShowNewKeyDialog(false);

      // Reset form
      setNewKeyName('');
      setSelectedSiteId('');
      setRateLimit(1000);

      // Reload keys
      await loadApiKeys();

      toast.success('API key created successfully!');
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Failed to create API key');
    } finally {
      setCreating(false);
    }
  }

  async function deleteApiKey(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete the API key "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('API key deleted');
      await loadApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    }
  }

  async function toggleKeyActive(id: string, currentlyActive: boolean) {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !currentlyActive })
        .eq('id', id);

      if (error) throw error;

      toast.success(currentlyActive ? 'API key disabled' : 'API key enabled');
      await loadApiKeys();
    } catch (error) {
      console.error('Error toggling API key:', error);
      toast.error('Failed to update API key');
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  function toggleKeyVisibility(keyId: string) {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  }

  const getSiteName = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    return site ? `${site.name} (${site.domain})` : siteId;
  };

  return (
    <div className="space-y-6">
      {/* New API Key Alert */}
      {newApiKey && (
        <Alert className="border-green-500 bg-green-50">
          <Key className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Your new API key has been created!</p>
              <p className="text-sm text-muted-foreground">
                Make sure to copy it now. You won't be able to see it again!
              </p>
              <div className="flex gap-2 items-center mt-2">
                <code className="flex-1 p-2 bg-white border rounded text-sm font-mono">
                  {newApiKey}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(newApiKey)}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setNewApiKey(null)}
                className="mt-2"
              >
                I've saved the key
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage API keys for accessing the CortIQ Public REST API
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/api/docs', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                API Documentation
              </Button>
              <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create API Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New API Key</DialogTitle>
                    <DialogDescription>
                      Generate a new API key for programmatic access to your analytics data.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="keyName">Key Name</Label>
                      <Input
                        id="keyName"
                        placeholder="e.g., Production Server, Analytics Dashboard"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="site">Site</Label>
                      <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a site" />
                        </SelectTrigger>
                        <SelectContent>
                          {sites.map((site) => (
                            <SelectItem key={site.id} value={site.id}>
                              {site.name} ({site.domain})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="rateLimit">Rate Limit (requests/hour)</Label>
                      <Input
                        id="rateLimit"
                        type="number"
                        min="100"
                        max="100000"
                        value={rateLimit}
                        onChange={(e) => setRateLimit(parseInt(e.target.value))}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Default: 1,000 requests per hour
                      </p>
                    </div>

                    <div className="flex gap-2 justify-end mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setShowNewKeyDialog(false)}
                        disabled={creating}
                      >
                        Cancel
                      </Button>
                      <Button onClick={createApiKey} disabled={creating}>
                        {creating ? 'Creating...' : 'Create API Key'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading API keys...
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No API keys yet</p>
              <p className="text-sm">Create your first API key to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Rate Limit</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getSiteName(key.site_id)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">
                          {visibleKeys.has(key.id) ? key.key_prefix : key.key_prefix}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(key.key_prefix)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{key.rate_limit}/hour</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {key.last_used_at
                        ? new Date(key.last_used_at).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={key.is_active ? 'default' : 'secondary'}>
                        {key.is_active ? 'Active' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleKeyActive(key.id, key.is_active)}
                        >
                          {key.is_active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteApiKey(key.id, key.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Documentation Card */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started with the API</CardTitle>
          <CardDescription>
            Use your API key to access CortIQ analytics data programmatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Authentication</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Include your API key in the Authorization header:
            </p>
            <code className="block p-3 bg-muted rounded text-sm">
              Authorization: Bearer ck_live_your_api_key_here
            </code>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Example Request</h4>
            <code className="block p-3 bg-muted rounded text-sm">
              curl https://cortiq.se/api/v1/sites \{'\n'}
              {'  '}-H "Authorization: Bearer ck_live_your_api_key_here"
            </code>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Available Endpoints</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• GET /api/v1/sites - List all sites</li>
              <li>• GET /api/v1/sites/{'{id}'}/visits - Get visits data</li>
              <li>• GET /api/v1/sites/{'{id}'}/pages - Get page views</li>
              <li>• GET /api/v1/sites/{'{id}'}/referrers - Get traffic sources</li>
              <li>• GET /api/v1/sites/{'{id}'}/events - Get events</li>
              <li>• GET /api/v1/sites/{'{id}'}/agents - Get AI agent traffic</li>
              <li>• GET /api/v1/sites/{'{id}'}/conversions - Get conversions</li>
              <li>• GET /api/v1/sites/{'{id}'}/heatmaps - Get heatmap data</li>
            </ul>
          </div>

          <Button variant="outline" className="w-full" onClick={() => window.open('/api/docs', '_blank')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View Full API Documentation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
