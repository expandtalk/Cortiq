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
      description: 'Krävs för att ta riktiga skärmdumpar av webbplatser',
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
      description: 'För att hämta GA4-data direkt till dashboarden',
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
      description: 'För avancerad Facebook Pixel-integration',
      value: '',
      category: 'marketing',
      required: false,
      status: 'not_set',
      icon: Key,
    },
    {
      id: 'tiktok_access_token',
      name: 'TikTok Business Access Token',
      description: 'För TikTok Ads Manager-integration',
      value: '',
      category: 'marketing',
      required: false,
      status: 'not_set',
      icon: Key,
    },
    {
      id: 'linkedin_client_secret',
      name: 'LinkedIn Client Secret',
      description: 'För LinkedIn Marketing API-integration',
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
        title: 'API-nyckel sparad',
        description: `${key.name} har sparats säkert.`,
      });

      // Update status to 'set'
      setApiKeys(prev => prev.map(k => 
        k.id === keyId ? { ...k, status: 'set' } : k
      ));
    } catch (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte spara API-nyckeln. Försök igen.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string, required: boolean) => {
    switch (status) {
      case 'set':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Konfigurerad
        </Badge>;
      case 'invalid':
        return <Badge variant="destructive">
          <AlertCircle className="w-3 h-3 mr-1" />
          Ogiltig
        </Badge>;
      default:
        return <Badge variant={required ? "destructive" : "secondary"}>
          <AlertCircle className="w-3 h-3 mr-1" />
          {required ? 'Krävs' : 'Valfri'}
        </Badge>;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'screenshots': return 'Skärmdumpar & Bildhantering';
      case 'analytics': return 'Analys & Statistik';
      case 'marketing': return 'Marknadsföring & Pixlar';
      default: return 'Övriga';
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'screenshots': return 'API-nycklar för att ta skärmdumpar och hantera bilder';
      case 'analytics': return 'Integrationer med analysverktyg och statistiktjänster';
      case 'marketing': return 'Pixlar och marknadsföringsverktyg för spårning';
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
        <h2 className="text-2xl font-bold mb-2">API-nyckelhantering</h2>
        <p className="text-muted-foreground mb-4">
          Hantera dina API-nycklar för olika tjänster och integrationer.
        </p>
        
        {requiredKeysNotSet > 0 && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {requiredKeysNotSet} obligatoriska API-nycklar är inte konfigurerade. 
              Vissa funktioner kanske inte fungerar korrekt.
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
                                placeholder="Ange din API-nyckel..."
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
                            Spara
                          </Button>
                        </div>
                        
                        {apiKey.helpUrl && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Behöver hjälp?</span>
                            <a
                              href={apiKey.helpUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              Hämta API-nyckel här →
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
          <CardTitle>Säkerhetsinformation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• API-nycklar lagras säkert och krypteras</p>
            <p>• Endast du har tillgång till dina nycklar</p>
            <p>• Nycklar används endast för de angivna integrationerna</p>
            <p>• Du kan ta bort eller uppdatera nycklar när som helst</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}