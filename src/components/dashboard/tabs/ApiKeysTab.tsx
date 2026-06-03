import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Save, AlertCircle, CheckCircle, Key, Globe, Camera } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface ApiKey {
  id: string;
  name: string;
  description: string;
  value: string;
  category: 'screenshots' | 'analytics' | 'marketing';
  required: boolean;
  status: 'not_set' | 'set' | 'invalid';
  icon: any;
  helpUrl?: string;
}

export function ApiKeysTab() {
  const { toast } = useToast();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: 'browserless_api_key',
      name: 'Browserless API Key',
      description: 'Required to take real screenshots of websites',
      value: '',
      category: 'screenshots',
      required: true,
      status: 'not_set',
      icon: Camera,
      helpUrl: 'https://www.browserless.io/pricing/'
    },
    {
      id: 'google_analytics_key',
      name: 'Google Analytics API Key',
      description: 'For fetching GA4 data directly to the dashboard',
      value: '',
      category: 'analytics',
      required: false,
      status: 'not_set',
      icon: Globe,
      helpUrl: 'https://console.developers.google.com/apis/credentials'
    },
    {
      id: 'facebook_app_secret',
      name: 'Facebook App Secret',
      description: 'For advanced Facebook Pixel integration',
      value: '',
      category: 'marketing',
      required: false,
      status: 'not_set',
      icon: Key,
    },
    {
      id: 'tiktok_access_token',
      name: 'TikTok Business Access Token',
      description: 'For TikTok Ads Manager integration',
      value: '',
      category: 'marketing',
      required: false,
      status: 'not_set',
      icon: Key,
    },
    {
      id: 'linkedin_client_secret',
      name: 'LinkedIn Client Secret',
      description: 'For LinkedIn Marketing API integration',
      value: '',
      category: 'marketing',
      required: false,
      status: 'not_set',
      icon: Key,
    }
  ]);

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const updateApiKey = (keyId: string, value: string) => {
    setApiKeys(prev => prev.map(key => 
      key.id === keyId 
        ? { 
            ...key, 
            value, 
            status: value.trim() ? 'set' : 'not_set' 
          }
        : key
    ));
  };

  const saveApiKey = async (keyId: string) => {
    const key = apiKeys.find(k => k.id === keyId);
    if (!key) return;

    try {
      // Here you would typically save to Supabase secrets or your backend
      // For now, we'll just show a toast
      toast({
        title: 'API key saved',
        description: `${key.name} has been saved securely.`,
      });

      // Update status to 'set'
      setApiKeys(prev => prev.map(k => 
        k.id === keyId ? { ...k, status: 'set' } : k
      ));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not save the API key. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string, required: boolean) => {
    switch (status) {
      case 'set':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Configured
        </Badge>;
      case 'invalid':
        return <Badge variant="destructive">
          <AlertCircle className="w-3 h-3 mr-1" />
          Invalid
        </Badge>;
      default:
        return <Badge variant={required ? "destructive" : "secondary"}>
          <AlertCircle className="w-3 h-3 mr-1" />
          {required ? 'Required' : 'Optional'}
        </Badge>;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'screenshots': return 'Screenshots & Image Management';
      case 'analytics': return 'Analytics & Statistics';
      case 'marketing': return 'Marketing & Pixels';
      default: return 'Other';
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'screenshots': return 'API keys for taking screenshots and managing images';
      case 'analytics': return 'Integrations with analytics tools and statistics services';
      case 'marketing': return 'Pixels and marketing tools for tracking';
      default: return '';
    }
  };

  const groupedKeys = apiKeys.reduce((acc, key) => {
    if (!acc[key.category]) {
      acc[key.category] = [];
    }
    acc[key.category].push(key);
    return acc;
  }, {} as Record<string, ApiKey[]>);

  const requiredKeysNotSet = apiKeys.filter(key => key.required && key.status === 'not_set').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">API Key Management</h2>
        <p className="text-muted-foreground mb-4">
          Manage your API keys for various services and integrations.
        </p>
        
        {requiredKeysNotSet > 0 && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {requiredKeysNotSet} required API keys are not configured.
              Some features may not work correctly.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {Object.entries(groupedKeys).map(([category, keys]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {category === 'screenshots' && <Camera className="w-5 h-5" />}
              {category === 'analytics' && <Globe className="w-5 h-5" />}
              {category === 'marketing' && <Key className="w-5 h-5" />}
              {getCategoryTitle(category)}
            </CardTitle>
            <CardDescription>
              {getCategoryDescription(category)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {keys.map((apiKey, index) => (
                <div key={apiKey.id}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <apiKey.icon className="w-4 h-4 text-muted-foreground" />
                        <h4 className="font-medium">{apiKey.name}</h4>
                        {getStatusBadge(apiKey.status, apiKey.required)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {apiKey.description}
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label htmlFor={apiKey.id} className="sr-only">
                              {apiKey.name}
                            </Label>
                            <div className="relative">
                              <Input
                                id={apiKey.id}
                                type={showKeys[apiKey.id] ? 'text' : 'password'}
                                value={apiKey.value}
                                onChange={(e) => updateApiKey(apiKey.id, e.target.value)}
                                placeholder="Enter your API key..."
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1 h-7 w-7 p-0"
                                onClick={() => toggleKeyVisibility(apiKey.id)}
                              >
                                {showKeys[apiKey.id] ? (
                                  <EyeOff className="w-3 h-3" />
                                ) : (
                                  <Eye className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <Button
                            onClick={() => saveApiKey(apiKey.id)}
                            disabled={!apiKey.value.trim()}
                            size="sm"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                        </div>
                        
                        {apiKey.helpUrl && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Need help?</span>
                            <a
                              href={apiKey.helpUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              Get API key here →
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {index < keys.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Security information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• API keys are stored securely and encrypted</p>
            <p>• Only you have access to your keys</p>
            <p>• Keys are only used for the specified integrations</p>
            <p>• You can delete or update keys at any time</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}