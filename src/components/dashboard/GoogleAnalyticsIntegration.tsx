import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, TrendingUp, BarChart3, Users, Target, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Site {
  id: string;
  site_name: string;
  domain: string;
  tracking_id: string;
  is_active: boolean;
  created_at: string;
  ga_measurement_id?: string;
  ga_property_id?: string;
  ga_integration_enabled?: boolean;
  ga_sync_events?: string[];
  ga_enhanced_ecommerce?: boolean;
}

interface GoogleAnalyticsIntegrationProps {
  selectedSite: Site;
}

interface GAData {
  sessions: number;
  users: number;
  pageviews: number;
  bounce_rate: number;
  avg_session_duration: number;
  top_sources: Array<{ source: string; sessions: number; percentage: number }>;
}

export function GoogleAnalyticsIntegration({ selectedSite }: GoogleAnalyticsIntegrationProps) {
  const [gaEnabled, setGaEnabled] = useState(selectedSite.ga_integration_enabled || false);
  const [measurementId, setMeasurementId] = useState(selectedSite.ga_measurement_id || '');
  const [propertyId, setPropertyId] = useState(selectedSite.ga_property_id || '');
  const [isConnected, setIsConnected] = useState(!!selectedSite.ga_measurement_id && !!selectedSite.ga_property_id);
  const [gaData, setGaData] = useState<GAData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Update state when selectedSite changes
  React.useEffect(() => {
    setGaEnabled(selectedSite.ga_integration_enabled || false);
    setMeasurementId(selectedSite.ga_measurement_id || '');
    setPropertyId(selectedSite.ga_property_id || '');
    setIsConnected(!!selectedSite.ga_measurement_id && !!selectedSite.ga_property_id);
    setGaData(null); // Reset GA data when site changes
  }, [selectedSite.id, selectedSite.ga_integration_enabled, selectedSite.ga_measurement_id, selectedSite.ga_property_id]);

  const handleConnect = async () => {
    if (!measurementId.startsWith('G-')) {
      toast({
        title: "❌ Invalid Measurement ID",
        description: "Google Analytics Measurement ID must start with 'G-'"
      });
      return;
    }

    if (!propertyId || isNaN(Number(propertyId))) {
      toast({
        title: "❌ Invalid Property ID",
        description: "Google Analytics Property ID must be numeric (e.g. 123456789)"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Update site with GA configuration
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { error } = await supabase
        .from('sites')
        .update({
          ga_measurement_id: measurementId,
          ga_property_id: propertyId,
          ga_integration_enabled: gaEnabled,
          ga_sync_events: ['clicks', 'scrolls', 'sessions'],
          ga_enhanced_ecommerce: false
        })
        .eq('id', selectedSite.id);
        
      if (error) throw error;
      
      setIsConnected(true);

      toast({
        title: "🔗 GA Configured!",
        description: `Measurement ID ${measurementId} saved. Heatmap data will now be sent to Google Analytics when the tracking script loads on your website.`
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Could not save GA configuration. Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testGA4Integration = async () => {
    if (!selectedSite.id || !measurementId) {
      toast({
        title: "❌ Fel",
        description: "Site ID eller Measurement ID saknas"
      });
      return;
    }

    setIsSaving(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      console.log('Testing GA4 integration with:', { siteId: selectedSite.id, startDate, endDate, measurementId });
      
      const { data, error } = await supabase.functions.invoke('ga4-import', {
        body: {
          siteId: selectedSite.id,
          startDate,
          endDate
        }
      });

      if (error) {
        console.error('GA4 test error:', error);
        let errorMessage = error.message || 'Unknown error';

        // Provide specific guidance for permission errors
        if (errorMessage.includes('permission') || errorMessage.includes('403')) {
          errorMessage = `❌ Missing access to GA4 Property ${propertyId || measurementId}.

🔧 Solution:
1. Go to Google Analytics → Admin → Property Access Management
2. Add the Service Account (found in Supabase settings)
3. Grant "Viewer" rights

This is why the same data appears for both sites.`;
        }

        toast({
          variant: "destructive",
          title: "❌ Test failed",
          description: errorMessage
        });
        return;
      }

      console.log('GA4 test result:', data);

      if (data.success) {
        toast({
          title: "✅ Test complete!",
          description: `GA4 data fetched: ${data.data.sessions} sessions, ${data.data.events} events, ${data.data.conversions} conversions`
        });
      } else {
        toast({
          variant: "destructive",
          title: "❌ Test failed",
          description: data.error || 'Unknown error from GA4 API'
        });
      }

    } catch (error) {
      console.error('GA4 test error:', error);
      toast({
        variant: "destructive",
        title: "❌ Test failed",
        description: error.message || 'Could not call GA4 import function'
      });
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Google Analytics Integration
        </CardTitle>
        <CardDescription>
          Combine traditional analytics with detailed heatmap data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Setup */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ga-enabled">Enable GA Integration</Label>
              <p className="text-sm text-muted-foreground">
                Sync heatmap data with Google Analytics
              </p>
            </div>
            <Switch
              id="ga-enabled"
              checked={gaEnabled}
              onCheckedChange={setGaEnabled}
            />
          </div>

          {gaEnabled && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="measurement-id">GA4 Measurement ID</Label>
                <p className="text-xs text-muted-foreground mb-1">For tracking on your website (starts with G-)</p>
                <Input
                  id="measurement-id"
                  placeholder="G-XXXXXXXXXX"
                  value={measurementId}
                  onChange={(e) => setMeasurementId(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="property-id">GA4 Property ID</Label>
                <p className="text-xs text-muted-foreground mb-1">Numeric ID for the Analytics Data API</p>
                <Input
                  id="property-id"
                  placeholder="123456789"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleConnect}
                disabled={!measurementId || !propertyId || isSaving}
                className="w-full"
              >
                {isSaving ? 'Saving...' : isConnected ? 'Update' : 'Connect'}
              </Button>

              {isConnected && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700">
                    Connected to Google Analytics
                  </span>
                  <Badge variant="secondary">Live</Badge>
                </div>
              )}
            </div>
          )}
        </div>

        {isConnected && (
          <>
            <Separator />
            
            {/* Integration Status */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Integration Status
              </h3>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">✅ Integration active</h4>
                <div className="text-sm text-green-800 space-y-2">
                  <p><strong>Measurement ID:</strong> {measurementId}</p>
                  <p><strong>Status:</strong> Tracking script working — data is being collected and synced</p>
                  <p><strong>Events synced:</strong> Clicks, scrolling, sessions</p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                <h4 className="font-semibold text-amber-900 mb-2">📋 Next steps</h4>
                <div className="text-sm text-amber-800 space-y-1">
                  <p>1. Install the WordPress plugin on your website</p>
                  <p>2. Enable GA integration in the plugin settings</p>
                  <p>3. Wait for data to start appearing in Google Analytics</p>
                  <p>4. Check "Real-time" in GA to see live events</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Export & Sync Options */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                Google Analytics
              </h3>
              
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex-col"
                  onClick={() => window.open(
                    propertyId 
                      ? `https://analytics.google.com/analytics/web/#/p${propertyId}/`
                      : 'https://analytics.google.com', 
                    '_blank'
                  )}
                >
                  <ExternalLink className="h-4 w-4 mb-1" />
                  <div className="font-medium">Open Google Analytics</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Go to Real-time to see heatmap events
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex-col"
                  onClick={() => window.open(
                    propertyId 
                      ? `https://analytics.google.com/analytics/web/#/p${propertyId}/reports/realtime`
                      : 'https://analytics.google.com', 
                    '_blank'
                  )}
                >
                  <BarChart3 className="h-4 w-4 mb-1" />
                  <div className="font-medium">Real-time report</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    View heatmap events live
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex-col"
                  onClick={testGA4Integration}
                  disabled={isSaving}
                >
                  <TestTube className="h-4 w-4 mb-1" />
                  <div className="font-medium">
                    {isSaving ? 'Testing...' : 'Test Configuration'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Verify GA4 settings
                  </div>
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Setup Instructions & GDPR Guide */}
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-md">
            <h4 className="font-semibold text-blue-900 mb-2">🔧 Setup Guide</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. <strong>Create GA4 account:</strong> Go to <a href="https://analytics.google.com" target="_blank" rel="noopener" className="underline">analytics.google.com</a></li>
              <li>2. <strong>Find Measurement ID:</strong> Data stream → Web data stream → G-XXXXXXXXXX</li>
              <li>3. <strong>Find Property ID:</strong> Settings → Property ID (numeric)</li>
              <li>4. <strong>Enter IDs:</strong> Fill in the form above</li>
              <li>5. <strong>Install plugin:</strong> Download and install the WordPress plugin</li>
            </ul>
          </div>

          <div className="p-4 bg-amber-50 rounded-md">
            <h4 className="font-semibold text-amber-900 mb-3">⚠️ Important GDPR documents to review</h4>
            <p className="text-sm text-amber-800 mb-3">
              When creating your GA4 account you must agree to several documents. Here are our GDPR compliance recommendations:
            </p>

            <div className="space-y-3 text-sm">
              <div className="bg-green-100 p-3 rounded border-l-4 border-green-500">
                <h5 className="font-semibold text-green-900 mb-1">✅ Recommended to accept:</h5>
                <ul className="text-green-800 space-y-1">
                  <li>• <strong>Technical support</strong> - Required for troubleshooting</li>
                  <li>• <strong>Google Ads Data Processing Terms</strong> - GDPR-compliant agreement</li>
                </ul>
              </div>

              <div className="bg-red-100 p-3 rounded border-l-4 border-red-500">
                <h5 className="font-semibold text-red-900 mb-1">🚫 Not recommended:</h5>
                <ul className="text-red-800 space-y-1">
                  <li>• <strong>Recommendations for your business</strong> - Broad data usage</li>
                  <li>• <strong>Modeling contributions</strong> - Data used for Google's algorithms</li>
                </ul>
                <p className="text-xs text-red-700 mt-2">
                  These can be enabled later if truly needed.
                </p>
              </div>

              <div className="bg-blue-100 p-3 rounded border-l-4 border-blue-500">
                <h5 className="font-semibold text-blue-900 mb-1">🤔 Consider carefully:</h5>
                <ul className="text-blue-800 space-y-1">
                  <li>• <strong>Google products and services</strong> - Useful if you use multiple Google services</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-md">
            <h4 className="font-semibold text-purple-900 mb-2">📋 Next steps after GA4 setup</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>1. <strong>Enable IP anonymization</strong> in GA4 settings</li>
              <li>2. <strong>Update privacy policy</strong> to include Google Analytics</li>
              <li>3. <strong>Configure cookie banner</strong> for consent (our system handles this)</li>
              <li>4. <strong>Test the integration</strong> with the "Test Configuration" button above</li>
              <li>5. <strong>Check Real-time</strong> in GA4 to see heatmap events</li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 rounded-md">
            <h4 className="font-semibold text-gray-900 mb-2">🎯 What is sent to Google Analytics?</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-gray-900 mb-1">Heatmap Events:</h5>
                <ul className="text-gray-700 space-y-1">
                  <li>• Click positions and intensity</li>
                  <li>• Scroll depth and behavior</li>
                  <li>• Mouse tracking data</li>
                  <li>• Session length and engagement</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-1">Custom Parameters:</h5>
                <ul className="text-gray-700 space-y-1">
                  <li>• <code>heatmap_zone</code> - Page area</li>
                  <li>• <code>click_intensity</code> - Click data</li>
                  <li>• <code>scroll_depth</code> - Scroll percentage</li>
                  <li>• <code>session_id</code> - Session link</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}