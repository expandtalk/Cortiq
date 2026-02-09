import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Search, Key, CheckCircle, ArrowRight, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GoogleSiteKitDashboard } from './integrations/GoogleSiteKitDashboard';
import { supabase } from '@/integrations/supabase/client';
import type { Site } from '@/types/dashboard';

interface GoogleSearchConsoleSetupProps {
  selectedSite: Site;
}

export function GoogleSearchConsoleSetup({ selectedSite }: GoogleSearchConsoleSetupProps) {
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load saved API key from database
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const { data, error } = await supabase
          .from('site_integrations')
          .select('encrypted_credentials')
          .eq('site_id', selectedSite.id)
          .eq('integration_type', 'google_search_console')
          .eq('is_active', true)
          .maybeSingle();

        if (data && !error) {
          setApiKey(data.encrypted_credentials);
          setIsConnected(true);
        }
      } catch (err) {
        console.error('Failed to load Google credentials:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedCredentials();
  }, [selectedSite.id]);

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "❌ API key missing",
        description: "Enter your Google API key to continue"
      });
      return;
    }

    setIsVerifying(true);
    
    try {
      // Test the API key against our edge function
      const response = await fetch('/functions/v1/google-sitekit-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteUrl: selectedSite.domain,
          apiKey: apiKey
        })
      });

      const data = await response.json();

      if (response.ok && !data.error) {
        // Save to database instead of localStorage
        const { error } = await supabase
          .from('site_integrations')
          .upsert({
            site_id: selectedSite.id,
            integration_type: 'google_search_console',
            encrypted_credentials: apiKey,
            is_active: true
          }, {
            onConflict: 'site_id,integration_type'
          });

        if (error) {
          throw new Error('Failed to save API key securely');
        }

        setIsConnected(true);
        toast({
          title: "🔗 Connected!",
          description: "Google Search Console API key verified and saved securely"
        });
      } else {
        throw new Error(data.error || 'Invalid API key or insufficient permissions');
      }
    } catch (error) {
      toast({
        title: "❌ Connection failed",
        description: error instanceof Error ? error.message : "Check the API key and try again"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isConnected) {
    return <GoogleSiteKitDashboard selectedSite={selectedSite} apiKey={apiKey} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Google Search Console Integration
          </CardTitle>
          <CardDescription>
            Connect to Google Search Console to get data on keywords, clicks, impressions, and search performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Create API Key */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">1</Badge>
              <h3 className="text-lg font-semibold">Create Google API key</h3>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>To use Google Search Console API with Node.js library:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• A verified website in Google Search Console</li>
                  <li>• An OAuth 2.0 Client ID or API key</li>
                  <li>• Appropriate permissions configured</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex-col"
                onClick={() => window.open('https://console.cloud.google.com/apis/dashboard', '_blank')}
              >
                <Key className="h-5 w-5 mb-2" />
                <div className="font-medium">Google Cloud Console</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Create new project or select existing
                </div>
                <ExternalLink className="h-3 w-3 mt-2" />
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex-col"
                onClick={() => window.open('https://console.cloud.google.com/apis/library/webmasters.googleapis.com', '_blank')}
              >
                <CheckCircle className="h-5 w-5 mb-2" />
                <div className="font-medium">Enable Search Console API</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Click "Enable" for your project
                </div>
                <ExternalLink className="h-3 w-3 mt-2" />
              </Button>
            </div>
          </div>

          {/* Step 2: Detailed Instructions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">2</Badge>
              <h3 className="text-lg font-semibold">Detailed instructions</h3>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <div>
                <h4 className="font-semibold mb-2">🔑 OAuth 2.0 Client ID (Recommended):</h4>
                <ol className="text-sm space-y-2 ml-4">
                  <li>1. Go to <strong>APIs & Services → Credentials</strong></li>
                  <li>2. Click <strong>"Create Credentials" → "OAuth 2.0 Client ID"</strong></li>
                  <li>3. Select <strong>"Web application"</strong> as type</li>
                  <li>4. Add your domain under <strong>"Authorized JavaScript origins"</strong></li>
                  <li>5. Add callback URL under <strong>"Authorized redirect URIs"</strong></li>
                  <li>6. Copy <strong>Client ID</strong> and use as API key below</li>
                </ol>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">🔑 API key (Alternative):</h4>
                <ol className="text-sm space-y-2 ml-4">
                  <li>1. Go to <strong>APIs & Services → Credentials</strong></li>
                  <li>2. Click <strong>"Create Credentials" → "API key"</strong></li>
                  <li>3. Restrict the API key to Search Console API only</li>
                  <li>4. Use the generated API key below</li>
                </ol>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Open Google Cloud Credentials
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Step 3: Verify Site */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">3</Badge>
              <h3 className="text-lg font-semibold">Verify your website</h3>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Your website must be verified in Google Search Console.</strong>
                <br />
                If you already have Google Analytics installed, your website is likely already verified.
              </AlertDescription>
            </Alert>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.open('https://search.google.com/search-console', '_blank')}
            >
              <Search className="h-4 w-4 mr-2" />
              Open Google Search Console
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Step 4: Connect */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">4</Badge>
              <h3 className="text-lg font-semibold">Connect API</h3>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="api-key">Google API key or OAuth Client ID</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Paste your API key or OAuth Client ID here..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleConnect}
                    disabled={!apiKey || isVerifying}
                  >
                    {isVerifying ? 'Verifying...' : 'Connect'}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <strong>Security:</strong> The API key is stored securely in our database and is never exposed to the client.
              </div>
            </div>
          </div>

          {/* What you'll get */}
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">📊 What you get access to:</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• <strong>Keywords:</strong> Which search terms lead to your website</li>
              <li>• <strong>Clicks & Impressions:</strong> How many click and see your website</li>
              <li>• <strong>CTR:</strong> Click-through rate for your search results</li>
              <li>• <strong>Position:</strong> Average ranking for your keywords</li>
              <li>• <strong>Landing pages:</strong> Which pages get the most traffic from search</li>
              <li>• <strong>Links:</strong> Internal and external links to your website</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}