import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, Mail, Download, Trash2, Info } from 'lucide-react';
import { useCreateDataRequest } from '@/hooks/useGDPR';
import { useForm } from 'react-hook-form';

interface PrivacyPolicyProps {
  siteId: string;
  siteName: string;
  contactEmail?: string;
  dpoEmail?: string;
}

export function PrivacyPolicy({ siteId, siteName, contactEmail, dpoEmail }: PrivacyPolicyProps) {
  const createRequest = useCreateDataRequest();
  const { register, handleSubmit, reset } = useForm<{ email: string }>();

  const handleDataRequest = (type: 'export' | 'deletion') => (data: { email: string }) => {
    createRequest.mutate({
      site_id: siteId,
      email: data.email,
      request_type: type
    }, {
      onSuccess: () => reset()
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Integritetspolicy</h1>
        <p className="text-lg text-muted-foreground">
          Vi värnar om din integritet och följer GDPR-lagstiftningen
        </p>
      </div>

      {/* Cookie Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Cookies och Spårning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Nödvändiga Cookies</h4>
              <p className="text-sm text-muted-foreground">
                Används för grundläggande funktionalitet på webbplatsen. Dessa cookies är nödvändiga 
                och kan inte inaktiveras.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold">Analytiska Cookies</h4>
              <p className="text-sm text-muted-foreground">
                Hjälper oss att förstå hur besökare använder webbplatsen genom att samla in anonymiserad 
                information om sidvisningar, klick och användarinteraktioner. IP-adresser anonymiseras 
                automatiskt.
              </p>
            </div>

            <div>
              <h4 className="font-semibold">Data som samlas in:</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Anonymiserade IP-adresser</li>
                <li>Webbläsarinformation (typ, version)</li>
                <li>Enhetsinformation (skärmstorlek, enhetstyp)</li>
                <li>Sidvisningar och navigeringsmönster</li>
                <li>Klickpositioner (för heatmap-analys)</li>
                <li>Formulärinteraktioner (ej innehåll)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Basis */}
      <Card>
        <CardHeader>
          <CardTitle>Rättslig grund för behandling</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Samtycke (Art. 6.1.a GDPR)</h4>
              <p className="text-sm text-muted-foreground">
                Analytiska cookies och spårning baseras på ditt uttryckliga samtycke som du kan 
                återkalla när som helst.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold">Berättigat intresse (Art. 6.1.f GDPR)</h4>
              <p className="text-sm text-muted-foreground">
                Nödvändiga cookies för webbplatsens funktionalitet baseras på vårt berättigade 
                intresse av att tillhandahålla en fungerande webbplats.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Rights */}
      <Card>
        <CardHeader>
          <CardTitle>Dina rättigheter enligt GDPR</CardTitle>
          <CardDescription>
            Du har följande rättigheter gällande dina personuppgifter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold">Rätt till information</h4>
                <p className="text-sm text-muted-foreground">
                  Du har rätt att få information om hur vi behandlar dina personuppgifter.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold">Rätt till dataportabilitet</h4>
                <p className="text-sm text-muted-foreground">
                  Du kan begära att få ut dina personuppgifter i ett maskinläsbart format.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold">Rätt till radering</h4>
                <p className="text-sm text-muted-foreground">
                  Du kan begära att vi raderar dina personuppgifter ("rätten att bli glömd").
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Begär dina data eller radering</CardTitle>
          <CardDescription>
            Använd formulären nedan för att utöva dina GDPR-rättigheter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data Export */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportera mina data
              </h4>
              <form onSubmit={handleSubmit(handleDataRequest('export'))} className="space-y-3">
                <div>
                  <Label htmlFor="export-email">Email-adress</Label>
                  <Input
                    id="export-email"
                    type="email"
                    placeholder="din@email.com"
                    {...register('email', { required: true })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createRequest.isPending}>
                  <Download className="h-4 w-4 mr-2" />
                  Begär dataexport
                </Button>
              </form>
            </div>

            {/* Data Deletion */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Radera mina data
              </h4>
              <form onSubmit={handleSubmit(handleDataRequest('deletion'))} className="space-y-3">
                <div>
                  <Label htmlFor="delete-email">Email-adress</Label>
                  <Input
                    id="delete-email"
                    type="email"
                    placeholder="din@email.com"
                    {...register('email', { required: true })}
                  />
                </div>
                <Button 
                  type="submit" 
                  variant="destructive" 
                  className="w-full"
                  disabled={createRequest.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Begär radering
                </Button>
              </form>
            </div>
          </div>

          <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
            <p className="font-semibold mb-2">Viktigt att veta:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Begäranden behandlas inom 30 dagar enligt GDPR</li>
              <li>Du kommer att få en bekräftelse via email</li>
              <li>Vi kan behöva verifiera din identitet innan vi behandlar begäran</li>
              <li>Vissa data kan behöva bevaras av juridiska skäl</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Kontakta oss
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contactEmail && (
              <div>
                <h4 className="font-semibold">Allmänna frågor</h4>
                <p className="text-sm text-muted-foreground">
                  <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">
                    {contactEmail}
                  </a>
                </p>
              </div>
            )}
            
            {dpoEmail && (
              <div>
                <h4 className="font-semibold">Dataskyddsombud (DPO)</h4>
                <p className="text-sm text-muted-foreground">
                  För frågor om dataskydd och GDPR:
                  <br />
                  <a href={`mailto:${dpoEmail}`} className="text-primary hover:underline">
                    {dpoEmail}
                  </a>
                </p>
              </div>
            )}
            
            <div>
              <h4 className="font-semibold">Tillsynsmyndighet</h4>
              <p className="text-sm text-muted-foreground">
                Du har rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY) om du 
                anser att vi behandlar dina personuppgifter felaktigt.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Denna integritetspolicy uppdaterades senast: {new Date().toLocaleDateString('sv-SE')}</p>
      </div>
    </div>
  );
}