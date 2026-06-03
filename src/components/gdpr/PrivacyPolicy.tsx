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
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-lg text-muted-foreground">
          We care about your privacy and comply with GDPR legislation
        </p>
      </div>

      {/* Cookie Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Cookies and Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Necessary Cookies</h4>
              <p className="text-sm text-muted-foreground">
                Used for basic website functionality. These cookies are required and cannot be disabled.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold">Analytics Cookies</h4>
              <p className="text-sm text-muted-foreground">
                Helps us understand how visitors use the website by collecting anonymized information
                about page views, clicks, and user interactions. IP addresses are automatically anonymized.
              </p>
            </div>

            <div>
              <h4 className="font-semibold">Data collected:</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Anonymized IP addresses</li>
                <li>Browser information (type, version)</li>
                <li>Device information (screen size, device type)</li>
                <li>Page views and navigation patterns</li>
                <li>Click positions (for heatmap analysis)</li>
                <li>Form interactions (not content)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Basis */}
      <Card>
        <CardHeader>
          <CardTitle>Legal basis for processing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Consent (Art. 6.1.a GDPR)</h4>
              <p className="text-sm text-muted-foreground">
                Analytics cookies and tracking are based on your explicit consent, which you may withdraw at any time.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold">Legitimate interest (Art. 6.1.f GDPR)</h4>
              <p className="text-sm text-muted-foreground">
                Necessary cookies for website functionality are based on our legitimate interest
                in providing a working website.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Rights */}
      <Card>
        <CardHeader>
          <CardTitle>Your rights under GDPR</CardTitle>
          <CardDescription>
            You have the following rights regarding your personal data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold">Right to information</h4>
                <p className="text-sm text-muted-foreground">
                  You have the right to receive information about how we process your personal data.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold">Right to data portability</h4>
                <p className="text-sm text-muted-foreground">
                  You can request a copy of your personal data in a machine-readable format.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold">Right to erasure</h4>
                <p className="text-sm text-muted-foreground">
                  You can request that we delete your personal data ("the right to be forgotten").
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Request your data or deletion</CardTitle>
          <CardDescription>
            Use the forms below to exercise your GDPR rights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data Export */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export my data
              </h4>
              <form onSubmit={handleSubmit(handleDataRequest('export'))} className="space-y-3">
                <div>
                  <Label htmlFor="export-email">Email address</Label>
                  <Input
                    id="export-email"
                    type="email"
                    placeholder="your@email.com"
                    {...register('email', { required: true })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createRequest.isPending}>
                  <Download className="h-4 w-4 mr-2" />
                  Request data export
                </Button>
              </form>
            </div>

            {/* Data Deletion */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete my data
              </h4>
              <form onSubmit={handleSubmit(handleDataRequest('deletion'))} className="space-y-3">
                <div>
                  <Label htmlFor="delete-email">Email address</Label>
                  <Input
                    id="delete-email"
                    type="email"
                    placeholder="your@email.com"
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
                  Request deletion
                </Button>
              </form>
            </div>
          </div>

          <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
            <p className="font-semibold mb-2">Important to know:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Requests are processed within 30 days as required by GDPR</li>
              <li>You will receive a confirmation via email</li>
              <li>We may need to verify your identity before processing the request</li>
              <li>Certain data may need to be retained for legal reasons</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact us
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contactEmail && (
              <div>
                <h4 className="font-semibold">General enquiries</h4>
                <p className="text-sm text-muted-foreground">
                  <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">
                    {contactEmail}
                  </a>
                </p>
              </div>
            )}
            
            {dpoEmail && (
              <div>
                <h4 className="font-semibold">Data Protection Officer (DPO)</h4>
                <p className="text-sm text-muted-foreground">
                  For questions about data protection and GDPR:
                  <br />
                  <a href={`mailto:${dpoEmail}`} className="text-primary hover:underline">
                    {dpoEmail}
                  </a>
                </p>
              </div>
            )}
            
            <div>
              <h4 className="font-semibold">Supervisory authority</h4>
              <p className="text-sm text-muted-foreground">
                You have the right to lodge a complaint with your national data protection authority
                if you believe we are processing your personal data incorrectly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        <p>This privacy policy was last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}