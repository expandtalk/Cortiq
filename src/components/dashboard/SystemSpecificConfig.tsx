import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  Key, 
  Globe, 
  Settings, 
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SystemConfigProps {
  systemType: string;
  onConfigSave: (config: SystemConfig) => void;
}

interface SystemConfig {
  systemType: string;
  apiKey?: string;
  trackingCode?: string;
  formIds?: string[];
  webhookUrl?: string;
  customConfig?: Record<string, any>;
}

const systemConfigs = {
  hubspot: {
    name: 'HubSpot',
    fields: {
      portalId: { label: 'Portal ID', type: 'text', required: true, placeholder: '12345678' },
      apiKey: { label: 'API Key', type: 'password', required: true, placeholder: 'pat-eu1-...' },
      formId: { label: 'Form ID', type: 'text', required: false, placeholder: 'form-guid-here' },
      trackingCode: { label: 'Tracking Code', type: 'textarea', required: false, placeholder: 'HubSpot tracking script' }
    },
    instructions: [
      'Gå till HubSpot Settings → Integrations → API key',
      'Kopiera din Private App token eller API key',
      'Hitta ditt Portal ID i Account & Defaults',
      'För formulär: gå till Marketing → Forms och kopiera Form ID'
    ],
    webhookExample: 'https://your-site.com/api/hubspot-webhook'
  },
  salesforce: {
    name: 'Salesforce',
    fields: {
      orgId: { label: 'Organization ID', type: 'text', required: true, placeholder: '00D...' },
      apiKey: { label: 'API Key/Token', type: 'password', required: true, placeholder: 'Session ID eller OAuth token' },
      instanceUrl: { label: 'Instance URL', type: 'text', required: true, placeholder: 'https://yourorg.salesforce.com' },
      webToLeadUrl: { label: 'Web-to-Lead URL', type: 'text', required: false, placeholder: 'https://webto.salesforce.com/servlet/servlet.WebToLead' }
    },
    instructions: [
      'Logga in på Salesforce Setup',
      'Gå till Platform Tools → Objects and Fields → Object Manager',
      'För Web-to-Lead: Setup → Feature Settings → Marketing → Web-to-Lead',
      'För API: Apps → App Manager → New Connected App'
    ],
    webhookExample: 'https://your-site.com/api/salesforce-webhook'
  },
  eloqua: {
    name: 'Oracle Eloqua',
    fields: {
      siteName: { label: 'Site Name', type: 'text', required: true, placeholder: 'YourCompany' },
      username: { label: 'Username', type: 'text', required: true, placeholder: 'user@company.com' },
      password: { label: 'Password', type: 'password', required: true, placeholder: 'API password' },
      baseUrl: { label: 'Base URL', type: 'text', required: true, placeholder: 'https://secure.p01.eloqua.com' },
      formId: { label: 'Form ID', type: 'text', required: false, placeholder: 'Form ID från Eloqua' }
    },
    instructions: [
      'Gå till Eloqua Administration',
      'Security → Users → välj din användare',
      'Skapa API credentials under Security Settings',
      'Hitta din Base URL i System Settings'
    ],
    webhookExample: 'https://your-site.com/api/eloqua-webhook'
  },
  traffikboost: {
    name: 'Traffikboost',
    fields: {
      accountId: { label: 'Account ID', type: 'text', required: true, placeholder: 'tb_...' },
      apiKey: { label: 'API Key', type: 'password', required: true, placeholder: 'Traffikboost API key' },
      pixelId: { label: 'Pixel ID', type: 'text', required: false, placeholder: 'Tracking pixel ID' },
      conversionGoals: { label: 'Conversion Goals', type: 'textarea', required: false, placeholder: 'lead,purchase,signup (kommaseparerat)' }
    },
    instructions: [
      'Logga in på Traffikboost Dashboard',
      'Gå till Settings → API Settings',
      'Generera ny API key',
      'Kopiera Account ID från Dashboard header'
    ],
    webhookExample: 'https://your-site.com/api/traffikboost-webhook'
  },
  contact_form_7: {
    name: 'Contact Form 7',
    fields: {
      formId: { label: 'Form ID', type: 'text', required: true, placeholder: 'contact-form-1' },
      formTitle: { label: 'Form Title', type: 'text', required: false, placeholder: 'Kontaktformulär' },
      mailTags: { label: 'Mail Tags', type: 'textarea', required: false, placeholder: '[your-name], [your-email], [your-message]' },
      customCss: { label: 'Custom CSS Class', type: 'text', required: false, placeholder: 'custom-form-class' }
    },
    instructions: [
      'Gå till WordPress Admin → Contact → Contact Forms',
      'Välj formuläret du vill spåra',
      'Kopiera shortcode ID (t.ex. id="123")',
      'Notera mail tags för lead-spårning'
    ],
    webhookExample: 'https://your-site.com/wp-json/contact-form-7/v1/contact-forms'
  },
  gravity_forms: {
    name: 'Gravity Forms',
    fields: {
      formId: { label: 'Form ID', type: 'text', required: true, placeholder: '1' },
      apiKey: { label: 'API Key', type: 'password', required: false, placeholder: 'Gravity Forms API key' },
      webhookUrl: { label: 'Webhook URL', type: 'text', required: false, placeholder: 'https://your-site.com/gf-webhook' },
      notificationIds: { label: 'Notification IDs', type: 'text', required: false, placeholder: '1,2,3 (kommaseparerat)' }
    },
    instructions: [
      'Gå till WordPress Admin → Forms',
      'Välj formuläret och notera ID:t',
      'För API: Forms → Settings → REST API',
      'För webhooks: Form Settings → Notifications'
    ],
    webhookExample: 'https://your-site.com/wp-json/gf/v2/forms/{formId}/entries'
  }
};

export function SystemSpecificConfig({ systemType, onConfigSave }: SystemConfigProps) {
  const [config, setConfig] = useState<SystemConfig>({ systemType });
  const [activeTab, setActiveTab] = useState('config');
  const { toast } = useToast();
  
  const systemConfig = systemConfigs[systemType as keyof typeof systemConfigs];
  
  if (!systemConfig) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Okänt system</h3>
          <p className="text-muted-foreground">Systemtyp "{systemType}" stöds inte än.</p>
        </CardContent>
      </Card>
    );
  }

  const handleFieldChange = (fieldName: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      customConfig: {
        ...prev.customConfig,
        [fieldName]: value
      }
    }));
  };

  const handleSave = () => {
    // Validera required fields
    const requiredFields = Object.entries(systemConfig.fields)
      .filter(([_, field]) => field.required)
      .map(([name, _]) => name);
    
    const missingFields = requiredFields.filter(field => 
      !config.customConfig?.[field] || config.customConfig[field].trim() === ''
    );
    
    if (missingFields.length > 0) {
      toast({
        title: "Saknade fält",
        description: `Följande fält måste fyllas i: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    onConfigSave(config);
    toast({
      title: "Konfiguration sparad",
      description: `${systemConfig.name} har konfigurerats successfully`,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopierat",
      description: "Texten har kopierats till urklipp",
    });
  };

  const generateTrackingScript = () => {
    switch (systemType) {
      case 'hubspot':
        return `<!-- HubSpot Tracking Code -->
<script type="text/javascript" id="hs-script-loader" async defer src="//js.hs-scripts.com/${config.customConfig?.portalId}.js"></script>

<!-- HubSpot Form Embed -->
<script charset="utf-8" type="text/javascript" src="//js.hsforms.net/forms/v2.js"></script>
<script>
  hbspt.forms.create({
    region: "eu1",
    portalId: "${config.customConfig?.portalId}",
    formId: "${config.customConfig?.formId}"
  });
</script>`;

      case 'salesforce':
        return `<!-- Salesforce Web-to-Lead -->
<form action="${config.customConfig?.webToLeadUrl}" method="POST">
  <input type="hidden" name="oid" value="${config.customConfig?.orgId}">
  <input type="hidden" name="retURL" value="https://your-site.com/thank-you">
  
  <!-- Add your form fields here -->
  <input type="text" name="first_name" placeholder="Förnamn" required>
  <input type="text" name="last_name" placeholder="Efternamn" required>
  <input type="email" name="email" placeholder="E-post" required>
  
  <input type="submit" value="Skicka">
</form>`;

      case 'contact_form_7':
        return `<!-- Contact Form 7 Shortcode -->
[contact-form-7 id="${config.customConfig?.formId}" title="${config.customConfig?.formTitle || 'Kontaktformulär'}"]

<!-- För tracking, lägg till i functions.php -->
add_action('wpcf7_mail_sent', function($contact_form) {
    // Send data to analytics
    $form_id = $contact_form->id();
    // Add your tracking code here
});`;

      default:
        return `<!-- ${systemConfig.name} integration code will be generated based on your configuration -->`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">{systemConfig.name} Konfiguration</h2>
          <p className="text-muted-foreground">
            Konfigurera din {systemConfig.name} integration för formulärspårning
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">Konfiguration</TabsTrigger>
          <TabsTrigger value="instructions">Instruktioner</TabsTrigger>
          <TabsTrigger value="code">Tracking Code</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API & Konfiguration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(systemConfig.fields).map(([fieldName, field]) => (
                <div key={fieldName}>
                  <Label htmlFor={fieldName} className="flex items-center gap-2">
                    {field.label}
                    {field.required && <Badge variant="destructive" className="text-xs">Krävs</Badge>}
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={fieldName}
                      placeholder={field.placeholder}
                      value={config.customConfig?.[fieldName] || ''}
                      onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <Input
                      id={fieldName}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={config.customConfig?.[fieldName] || ''}
                      onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                      className="mt-1"
                    />
                  )}
                </div>
              ))}
              
              <div className="pt-4">
                <Button onClick={handleSave} className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Spara Konfiguration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instructions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Steg-för-steg Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {systemConfig.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">{index + 1}</Badge>
                    <p className="text-sm">{instruction}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Webhook URL (valfri)</h4>
                <div className="flex items-center gap-2">
                  <Input 
                    value={systemConfig.webhookExample} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(systemConfig.webhookExample)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Använd denna URL för att ta emot webhooks från {systemConfig.name}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Genererad Tracking Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{generateTrackingScript()}</code>
                  </pre>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(generateTrackingScript())}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>Koden genereras baserat på din konfiguration. Fyll i API-informationen först.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}