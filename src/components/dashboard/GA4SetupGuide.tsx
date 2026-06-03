import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Settings, Search, CheckCircle } from 'lucide-react';

export function GA4SetupGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Configure Search Term Analysis in GA4
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            Search term analysis requires specific configuration in Google Analytics 4 to work correctly.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">1</Badge>
              <h3 className="font-semibold">Enable Enhanced Ecommerce (if you have e-commerce)</h3>
            </div>
            <div className="ml-8 space-y-2">
              <p className="text-sm text-muted-foreground">
                Go to your GA4 property → <strong>Admin</strong> → <strong>Enhanced Ecommerce Settings</strong>
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-4">
                <li>Enable "Enable Enhanced Ecommerce Reporting"</li>
                <li>Configure product dimensions if you sell products</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">2</Badge>
              <h3 className="font-semibold">Configure Search Tracking</h3>
            </div>
            <div className="ml-8 space-y-2">
              <p className="text-sm text-muted-foreground">
                Go to <strong>Events</strong> → <strong>Conversions</strong> i GA4 Admin
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-4">
                <li>Create a new event for "view_search_results"</li>
                <li>Add the parameter "search_term" to capture search terms</li>
                <li>Mark the event as a conversion if relevant</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">3</Badge>
              <h3 className="font-semibold">Add to your website</h3>
            </div>
            <div className="ml-8 space-y-2">
              <p className="text-sm text-muted-foreground">
                Implement search tracking in your website code:
              </p>
              <div className="bg-muted p-3 rounded text-sm font-mono">
                <pre>{`// When user searches
gtag('event', 'view_search_results', {
  search_term: 'user search term',
  event_category: 'engagement',
  custom_parameter_1: 'additional_info'
});`}</pre>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">4</Badge>
              <h3 className="font-semibold">WordPress-specific configuration</h3>
            </div>
            <div className="ml-8 space-y-2">
              <p className="text-sm text-muted-foreground">
                If you use WordPress with a search plugin:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-4">
                <li><strong>SearchWP:</strong> Enable GA4-integration in plugin settings</li>
                <li><strong>Ajax Search Lite:</strong> Add custom tracking code</li>
                <li><strong>Standard WordPress-sök:</strong> Modifiera search.php för att skicka tracking</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">5</Badge>
              <h3 className="font-semibold">Check the configuration</h3>
            </div>
            <div className="ml-8 space-y-2">
              <p className="text-sm text-muted-foreground">
                Verify that everything works:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-4">
                <li>Go to <strong>Realtime</strong> → <strong>Events</strong> i GA4</li>
                <li>Search your website and verify that "view_search_results" loggas</li>
                <li>Check that "search_term" parametern innehåller rätt data</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-green-800">After configuration</h4>
          </div>
          <p className="text-sm text-green-700">
            Once you have set up search tracking, the search term analysis in this dashboard will automatically start showing data within 24-48 hours.
          </p>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Need help?</h4>
          <p className="text-sm text-blue-700 mb-3">
            Contact our support team or see detailed documentation:
          </p>
          <div className="flex flex-wrap gap-2">
            <a 
              href="https://support.google.com/analytics/answer/1032415" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
            >
              GA4 Search Tracking Guide <ExternalLink className="h-3 w-3" />
            </a>
            <a 
              href="https://developers.google.com/analytics/devguides/collection/ga4/events" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
            >
              GA4 Events Documentation <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}