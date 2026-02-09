import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Search, Key, CheckCircle, ArrowRight, Info, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BingWebmasterDashboard } from './integrations/BingWebmasterDashboard';
import { supabase } from '@/integrations/supabase/client';
import type { Site } from '@/types/dashboard';

interface BingWebmasterSetupProps {
  selectedSite: Site;
}

export function BingWebmasterSetup({ selectedSite }: BingWebmasterSetupProps) {
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
          .eq('integration_type', 'bing_webmaster')
          .eq('is_active', true)
          .maybeSingle();

        if (data && !error) {
          setApiKey(data.encrypted_credentials);
          setIsConnected(true);
        }
      } catch (err) {
        console.error('Failed to load Bing credentials:', err);
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
        description: "Enter your Bing Webmaster Tools API key to continue"
      });
      return;
    }

    setIsVerifying(true);
    
    try {
      // Test the API key by making a simple request
      const response = await fetch('https://ssl.bing.com/webmaster/api.svc/json/GetUrlsInfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `ApiKey ${apiKey}`,
        },
        body: JSON.stringify({
          siteUrl: selectedSite.domain
        })
      });

      if (response.ok) {
        // Save to database instead of localStorage
        const { error } = await supabase
          .from('site_integrations')
          .upsert({
            site_id: selectedSite.id,
            integration_type: 'bing_webmaster',
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
          description: "Bing Webmaster Tools API key verified and saved securely"
        });
      } else {
        throw new Error('Invalid API key or website not verified in Bing Webmaster Tools');
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
    return <BingWebmasterDashboard selectedSite={selectedSite} apiKey={apiKey} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Bing Webmaster Tools Integration
          </CardTitle>
          <CardDescription>
            Connect to Bing Webmaster Tools to get data on Bing searches, indexing, and website health
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Add & Verify Site */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">1</Badge>
              <h3 className="text-lg font-semibold">Add and verify your website</h3>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Before you can use the Bing Webmaster Tools API you must:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Add your website to Bing Webmaster Tools</li>
                  <li>• Verify ownership of the website</li>
                  <li>• Request API access and get an API key</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex-col"
                onClick={() => window.open('https://www.bing.com/webmasters', '_blank')}
              >
                <Globe className="h-5 w-5 mb-2" />
                <div className="font-medium">Bing Webmaster Tools</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Add your website and verify
                </div>
                <ExternalLink className="h-3 w-3 mt-2" />
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex-col"
                onClick={() => window.open('https://www.bing.com/webmasters/help/webmaster-api-2a7c8b13', '_blank')}
              >
                <Key className="h-5 w-5 mb-2" />
                <div className="font-medium">API Documentation</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Learn how to request API access
                </div>
                <ExternalLink className="h-3 w-3 mt-2" />
              </Button>
            </div>
          </div>

          {/* Step 2: Verification Methods */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">2</Badge>
              <h3 className="text-lg font-semibold">Verification methods</h3>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <div>
                <h4 className="font-semibold mb-2">🏷️ Meta Tag (Recommended):</h4>
                <ol className="text-sm space-y-2 ml-4">
                  <li>1. Log in to <strong>Bing Webmaster Tools</strong></li>
                  <li>2. Click <strong>"Add a site"</strong> and enter your website URL</li>
                  <li>3. Select <strong>"Meta tag"</strong> as verification method</li>
                  <li>4. Copy the meta tag and add it to your website &lt;head&gt;</li>
                  <li>5. Click <strong>"Verify"</strong> to complete</li>
                </ol>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">📄 XML file:</h4>
                <ol className="text-sm space-y-2 ml-4">
                  <li>1. Download the XML file from Bing Webmaster Tools</li>
                  <li>2. Upload the file to your website root folder</li>
                  <li>3. Verify the file is accessible via the web</li>
                  <li>4. Click <strong>"Verify"</strong> in Bing Webmaster Tools</li>
                </ol>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">🔗 CNAME Record:</h4>
                <ol className="text-sm space-y-2 ml-4">
                  <li>1. Add the CNAME record to your DNS configuration</li>
                  <li>2. Wait for DNS propagation (can take up to 24h)</li>
                  <li>3. Verify the CNAME record in Bing Webmaster Tools</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Step 3: Request API Access */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">3</Badge>
              <h3 className="text-lg font-semibold">Request API access</h3>
            </div>

            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                <strong>Bing Webmaster Tools API is currently in beta.</strong>
                <br />
                You need to request access by contacting Microsoft or using their API application form.
              </AlertDescription>
            </Alert>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg">
              <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">📝 API application process:</h4>
              <ol className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
                <li>1. <strong>Verify your website</strong> in Bing Webmaster Tools first</li>
                <li>2. <strong>Go to the API section</strong> in your Webmaster Tools dashboard</li>
                <li>3. <strong>Request API access</strong> by filling out the form</li>
                <li>4. <strong>Wait for approval</strong> from Microsoft (can take several days)</li>
                <li>5. <strong>Get your API key</strong> via email or dashboard</li>
              </ol>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.open('https://www.bing.com/webmasters/help/webmaster-api-2a7c8b13', '_blank')}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Learn more about API access
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
                <Label htmlFor="api-key">Bing Webmaster Tools API key</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Paste your Bing API key here..."
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
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">📊 What you get access to from Bing REST API:</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• <strong>Search performance:</strong> Clicks, impressions, CTR and position in Bing</li>
              <li>• <strong>Indexing status:</strong> How many pages are indexed</li>
              <li>• <strong>Crawling data:</strong> Crawl statistics and errors</li>
              <li>• <strong>Website health:</strong> Technical issues and SEO improvements</li>
              <li>• <strong>Top queries:</strong> Which keywords lead to your website</li>
              <li>• <strong>Link data:</strong> Inbound links and link popularity</li>
            </ul>
          </div>

          {/* Alternative */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Alternative:</strong> If API access is not available, you can export data manually from 
              Bing Webmaster Tools dashboard and import it in CSV format.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}