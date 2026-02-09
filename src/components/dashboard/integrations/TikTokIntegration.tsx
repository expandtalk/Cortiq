import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertTriangle, 
  Shield, 
  Globe, 
  Clock, 
  Users, 
  ExternalLink,
  Eye,
  FileText
} from 'lucide-react';

interface TikTokIntegrationProps {
  isEnabled?: boolean;
  pixelId?: string;
  onToggle?: (enabled: boolean) => void;
  onConfigChange?: (config: any) => void;
}

export function TikTokIntegration({ 
  isEnabled = false, 
  pixelId = '',
  onToggle,
  onConfigChange 
}: TikTokIntegrationProps) {
  const [config, setConfig] = useState({
    pixelId: pixelId,
    enableAdvancedMatching: false,
    enableAutomaticEvents: false,
    ageVerificationEnabled: true,
    chinaTransferConsent: false,
    dataRetentionDays: 395, // 13 months
    testMode: false
  });

  const handleConfigUpdate = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  const riskLevel = "HIGH";
  const complianceScore = isEnabled ? (config.ageVerificationEnabled && config.chinaTransferConsent ? 85 : 45) : 100;

  return (
    <Card className="border-orange-200 bg-orange-50/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">TT</span>
              </div>
              <CardTitle>TikTok Pixel</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {riskLevel} RISK
              </Badge>
              <Badge variant={complianceScore >= 80 ? 'default' : 'secondary'}>
                Compliance: {complianceScore}%
              </Badge>
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={onToggle}
          />
        </div>
        <CardDescription>
          TikTok Pixel för konverteringsspårning och publik-building. <strong>Kräver enhanced GDPR compliance.</strong>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Critical Compliance Alert */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>€530M böter 2025:</strong> TikTok har högsta regulatory risk. Kräver explicit consent för Kina-överföringar, 
            åldersverifiering och enhanced blocking. <a href="#" className="underline">Läs compliance guide</a>
          </AlertDescription>
        </Alert>

        {/* Configuration */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pixelId" className="flex items-center gap-2">
              Pixel ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pixelId"
              placeholder="C9XXXXXXXXXXXXX"
              value={config.pixelId}
              onChange={(e) => handleConfigUpdate('pixelId', e.target.value)}
              disabled={!isEnabled}
            />
            <p className="text-xs text-muted-foreground">
              Hittas i TikTok Ads Manager → Events → Manage
            </p>
          </div>

          <Separator />

          {/* GDPR Enhanced Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <Label className="font-medium">Enhanced GDPR Settings</Label>
            </div>

            <div className="space-y-3 pl-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ageVerification"
                  checked={config.ageVerificationEnabled}
                  onCheckedChange={(checked) => handleConfigUpdate('ageVerificationEnabled', checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="ageVerification" className="text-sm font-medium">
                    Åldersverifiering (Artikel 8 GDPR) <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Blockerar TikTok för användare under 16 år. Kräver parental consent.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="chinaTransfer"
                  checked={config.chinaTransferConsent}
                  onCheckedChange={(checked) => handleConfigUpdate('chinaTransferConsent', checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="chinaTransfer" className="text-sm font-medium">
                    Separata Kina-överföring consent <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Explicit disclosure för dataöverföringar till Kina enligt DPC-krav.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Technical Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <Label className="font-medium">Tracking Settings</Label>
            </div>

            <div className="space-y-3 pl-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="advancedMatching"
                  checked={config.enableAdvancedMatching}
                  onCheckedChange={(checked) => handleConfigUpdate('enableAdvancedMatching', checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="advancedMatching" className="text-sm font-medium">
                    Advanced Matching
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Hash:ar email och telefon för bättre attribution. Höjer privacy risk.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="automaticEvents"
                  checked={config.enableAutomaticEvents}
                  onCheckedChange={(checked) => handleConfigUpdate('enableAutomaticEvents', checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="automaticEvents" className="text-sm font-medium">
                    Automatic Events
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Page view, click, scroll tracking. Standard för most implementations.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="testMode"
                  checked={config.testMode}
                  onCheckedChange={(checked) => handleConfigUpdate('testMode', checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="testMode" className="text-sm font-medium">
                    Test Mode
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Events skickas till Test Events i stället för live data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk & Compliance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-sm font-medium">Cookie Duration</p>
              <p className="text-xs text-muted-foreground">13 månader (längst)</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-sm font-medium">Data Location</p>
              <p className="text-xs text-muted-foreground">Kina + Singapore</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium">Target Audience</p>
              <p className="text-xs text-muted-foreground">13-34 år (Gen Z)</p>
            </div>
          </div>
        </div>

        {/* Implementation Notes */}
        {isEnabled && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>Implementation notes:</strong>
              <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                <li>Pixel blockeras tills explicit marketing consent</li>
                <li>Separata consent för Kina-överföringar krävs</li>
                <li>Åldersverifiering körs före pixel-loading</li>
                <li>13-månaders cookie kräver renewal consent</li>
                <li>Manual blocking implementation (ej native API)</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="https://ads.tiktok.com/business/pixelhelper" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Pixel Helper
            </a>
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <a href="https://business-api.tiktok.com/portal/docs?id=1739584855420929" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Events API
            </a>
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <a href="/gdpr/tiktok-compliance" target="_blank">
              <Shield className="h-4 w-4 mr-2" />
              GDPR Guide
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}