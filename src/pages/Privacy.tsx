import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import PublicNavigation from "@/components/PublicNavigation";
import { useSEO } from "@/hooks/useSEO";
import { Shield, CheckCircle, Mail, FileText, Lock, Database, Users } from "lucide-react";

const Privacy = () => {
  useSEO({
    title: 'Privacy Policy — CortIQ',
    description: 'CortIQ privacy policy. GDPR-compliant data handling, EU data storage, data retention details and your rights as a data subject.',
  });
  return (
    <div className="min-h-screen bg-background">
      <PublicNavigation />
      
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-primary text-white">
            Privacy Policy
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-6 text-gradient-primary">
            We Respect Your Privacy
          </h1>
          <p className="text-xl text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <Card className="glass shadow-elegant">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <Shield className="h-6 w-6 text-primary" />
                <CardTitle>1. Introduction</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                CortIQ ("we", "us", "our") respects your privacy and is committed to protecting your personal data. 
                This privacy policy explains how we collect and use data when you use our analytics platform.
              </p>
            </CardContent>
          </Card>

          {/* Data Controller */}
          <Card className="glass shadow-elegant">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <FileText className="h-6 w-6 text-primary" />
                <CardTitle>2. Data Controller</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Legal entity:</strong> Expandtalk Corporation AB</p>
                <p><strong>Product:</strong> CortIQ</p>
                <p><strong>Company registration number:</strong> 559358-8824</p>
                <p><strong>Registered address:</strong> Parmmätaregatan 4B, 417 04 Göteborg, Sweden</p>
                <p><strong>Email:</strong> privacy@cortiq.se</p>
                <p className="text-sm mt-3">
                  For analytics data collected on our customers' websites, CortIQ acts as a
                  <strong> processor</strong> on behalf of the site operator (the controller). For our own
                  account, billing and platform data, CortIQ (Expandtalk Corporation AB) is the
                  <strong> controller</strong>.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security & Bot Detection */}
          <Card className="glass shadow-elegant border-primary/20">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <Shield className="h-6 w-6 text-primary" />
                <CardTitle>3A. Security & Bot Detection (NO cookie banner required)</CardTitle>
              </div>
              <Badge className="w-fit bg-gradient-accent text-white">Strictly necessary</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                To protect you and our platform, we collect security data:
              </p>
              <ul className="space-y-3">
                {[
                  'DDoS protection (identify malicious bots overloading websites)',
                  'Spy bots & scrapers (detect competitors stealing content/prices)',
                  'Fraud prevention (click-fraud, fake registrations)',
                  'AI agent tracking (ChatGPT Browser, Perplexity Comet, Claude Browser)',
                  'Bot signature analysis (User-Agent patterns, request frequency)',
                  'IP reputation (block known threat sources)'
                ].map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-primary/5 p-4 rounded-lg mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  <strong className="text-foreground">Why this is legal without a cookie banner:</strong>
                </p>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>✓ <strong>ePrivacy Art. 5.3:</strong> "Strictly necessary" for security does NOT require consent</li>
                  <li>✓ <strong>GDPR Art. 6.1.f:</strong> Legitimate interest to protect website and users from threats</li>
                  <li>✓ All security data is stored anonymized and aggregated</li>
                  <li>✓ Used ONLY for security - never marketing</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-3">
                  <strong className="text-foreground">AI Agent Tracking:</strong> We are first to market with tracking AI agents 
                  (ChatGPT Browser, Perplexity Comet, Claude Browser). This counts as bot detection and security since we 
                  identify agents via User-Agent strings - no personal data is collected from AI agents.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Server-Side Analytics Without Consent */}
          <Card className="glass shadow-elegant border-primary/20">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <Database className="h-6 w-6 text-primary" />
                <CardTitle>3B. Server-Side Analytics & Server Logs (NO cookie banner required)</CardTitle>
              </div>
              <Badge className="w-fit bg-gradient-accent text-white">100% banner-free</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                We collect <strong>only aggregated, anonymized data</strong> via server logs and server-side analytics:
              </p>
              
              <div className="bg-primary/10 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-foreground">📋 Server Log Files (Access Logs)</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Standard HTTP server logs for technical operation and security:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Timestamp:</strong> When the request was made</li>
                  <li>• <strong>HTTP Method & URL:</strong> GET /products/product-123</li>
                  <li>• <strong>HTTP Status Code:</strong> 200 OK, 404 Not Found, 500 Error</li>
                  <li>• <strong>User-Agent:</strong> Browser & device type (bot detection)</li>
                  <li>• <strong>Referrer:</strong> Where the visitor came from</li>
                  <li>• <strong>IP Address → Country:</strong> Immediate anonymization (192.168.1.123 → "US" → IP deleted)</li>
                  <li>• <strong>Load Time:</strong> Performance monitoring</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  <strong>Retention:</strong> 7-30 days for operations, 90 days for security logs, then automatically deleted.
                </p>
              </div>

              <p className="text-muted-foreground mt-4">
                <strong>Aggregated statistics we create from server logs:</strong>
              </p>
              <ul className="space-y-3">
                {[
                  'Page views per day/week (counts, no user IDs)',
                  'Most popular pages & products',
                  'Referrer sources (Google, Facebook, direct traffic)',
                  'Device type (mobile 45%, desktop 55%)',
                  'Browser type (Chrome 60%, Safari 25%, Firefox 15%)',
                  'Country/region distribution',
                  'Performance metrics (average load time)',
                  'Error frequency (404 errors, server errors)'
                ].map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-primary/5 p-4 rounded-lg mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  <strong className="text-foreground">Important - no personal tracking:</strong>
                </p>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>✓ No cookies are placed on your device in this banner-free mode</li>
                  <li>✓ IP addresses are anonymized immediately (→ country → IP deleted)</li>
                  <li>✓ No device fingerprinting for tracking in banner-free mode (only security fingerprinting for bot detection)</li>
                  <li>✓ No cross-visit visitor identification in banner-free mode</li>
                  <li>✓ Only aggregated, anonymous statistics (NO individual profiling)</li>
                  <li>✓ This banner-free, server-log data is not shared with advertising third parties. Consent-based features (see sections 5A–5C) do involve processors and, where applicable, international transfers — disclosed there.</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-3">
                  <strong className="text-foreground">Legal Basis:</strong> Legitimate interest (GDPR Art. 6.1.f) for technical operation & security monitoring + 
                  Strictly necessary (ePrivacy Art. 5.3) for system security. No cookie banner required because:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 mt-2">
                  <li>1. Server logs are technically necessary for operation</li>
                  <li>2. IP addresses are anonymized immediately (no personal identification)</li>
                  <li>3. No data is stored on the visitor's device</li>
                  <li>4. Used only for aggregated statistics & security</li>
                </ul>
              </div>

              <div className="bg-primary/5 p-4 rounded-lg mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  <strong className="text-foreground">Cookieless JavaScript audience measurement (optional banner-free mode):</strong>
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  When a site runs in cookieless mode, a lightweight script measures aggregate audience
                  statistics — page-view counts and referrer source — using a session identifier held only
                  in memory for the duration of the visit. Nothing is stored on your device, there is no
                  device fingerprinting, and there is no cross-visit or cross-site identification.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>✓ In-memory session id only — never written to cookies or device storage</li>
                  <li>✓ Aggregate page-view counts + referrer source</li>
                  <li>✓ No fingerprint, no returning-visitor profile, no cross-site tracking</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-3">
                  <strong className="text-foreground">Legal Basis:</strong> ePrivacy Art. 5.3 read with the
                  EDPB/CNIL audience-measurement exemption + legitimate interest (GDPR Art. 6.1.f). Because it
                  is strictly first-party, aggregate, and stores nothing on your device, no cookie banner is
                  required for this base measurement.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong className="text-foreground">Behavioural data always requires consent:</strong> clicks,
                  scroll depth, heatmaps and conversion capture (including a hashed email) are collected only
                  after you grant analytics consent (GDPR Art. 6.1.a) — in every mode, including cookieless.
                  See section 5.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* First-Party Data Collection */}
          <Card className="glass shadow-elegant border-primary/20">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <Users className="h-6 w-6 text-primary" />
                <CardTitle>4. First-Party Data from Logged-In Users</CardTitle>
              </div>
              <Badge className="w-fit bg-gradient-primary text-white">Contractual basis</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                For <strong>logged-in users</strong>, we collect data necessary to provide the service:
              </p>
              <ul className="space-y-3">
                {[
                  'Email address (from registration form)',
                  'CRM events (purchases, bookings, interactions)',
                  'User activity linked to your account',
                  'Data you consciously submit via forms',
                  'Platform usage to improve the service'
                ].map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-primary/5 p-4 rounded-lg mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong className="text-foreground">Legal Basis:</strong>
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Contractual basis</strong> (GDPR Art. 6.1.b) - Necessary to provide the service</li>
                  <li>• <strong>Legitimate interest</strong> (GDPR Art. 6.1.f) - Improve platform based on user activity</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong className="text-foreground">Important:</strong> This does NOT require a cookie banner because you actively create an account 
                  and data is used only for contractual purposes (not marketing/tracking without consent).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Analytics with Consent */}
          <Card className="glass shadow-elegant border-accent/20">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <Lock className="h-6 w-6 text-accent" />
                <CardTitle>5. Enhanced Analytics with Cookies (Requires consent)</CardTitle>
              </div>
              <Badge className="w-fit bg-gradient-primary text-white">With your approval</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                If you <strong>voluntarily accept cookies</strong>, we also collect:
              </p>
              <ul className="space-y-3">
                {[
                  'Session ID (to track your session)',
                  'Click data (which elements you click on)',
                  'Scroll depth (how far you scroll)',
                  'Heatmap data (aggregated click data)',
                  'Form interactions (NOT the content)'
                ].map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-accent/5 p-4 rounded-lg mt-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Legal Basis (GDPR):</strong> Consent (Art. 6.1.a GDPR)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Session Replay */}
          <Card className="glass shadow-elegant border-accent/20">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <Lock className="h-6 w-6 text-accent" />
                <CardTitle>5A. Session Replay (Requires consent)</CardTitle>
              </div>
              <Badge className="w-fit bg-gradient-primary text-white">With your approval</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                If the site operator enables session replay and you give consent, we record a
                reconstruction of your session (page structure, navigation, clicks and scrolling)
                using the rrweb library, so operators can understand usability issues.
              </p>
              <ul className="space-y-2 text-muted-foreground text-sm ml-4">
                <li>• Text input into form fields is masked by default.</li>
                <li>• On-screen text masking is enabled by default; operators may unmask non-sensitive pages.</li>
                <li>• Elements marked <code>.sensitive</code> or <code>[data-private]</code> are excluded from capture.</li>
                <li>• Recordings are retained according to the operator's configured period and then deleted.</li>
              </ul>
              <div className="bg-accent/5 p-4 rounded-lg mt-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Legal Basis:</strong> Consent (Art. 6.1.a GDPR / ePrivacy Art. 5.3). Session replay is never active without it.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Recipients */}
          <Card className="glass shadow-elegant border-accent/20">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <Users className="h-6 w-6 text-accent" />
                <CardTitle>5B. Third-Party Recipients & Processors</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                We use the following processors and, for consent-based advertising features, share
                data with the following recipients:
              </p>
              <ul className="space-y-3 text-muted-foreground text-sm ml-4">
                <li>• <strong>Supabase</strong> (infrastructure / database hosting, EU region) — processor for all analytics data.</li>
                <li>• <strong>Anthropic</strong> (AI assistant &amp; GEO analysis, USA) — when you use AI features, relevant analytics results are sent to the Claude API to generate answers.</li>
                <li>• <strong>Google Ads</strong> (Enhanced Conversions for Leads, USA) — when the operator enables conversion feedback and marketing consent was given, a SHA-256 hash of the email plus the ad click ID (gclid) and conversion value are uploaded. The raw email never leaves the browser.</li>
                <li>• <strong>HubSpot</strong> (CRM lead-quality feedback, USA/EU) — when the operator connects HubSpot, lead-quality signals are exchanged to enrich conversion measurement.</li>
                <li>• <strong>Cloudflare</strong> (edge web analytics &amp; geo lookup, USA — EU-US DPF certified) — when the operator enables the Cloudflare integration, Cloudflare processes visitor IP addresses at its edge to derive country and aggregate, cookie-free traffic statistics.</li>
              </ul>
              <div className="bg-accent/5 p-4 rounded-lg mt-4">
                <p className="text-sm text-muted-foreground">
                  Note: a SHA-256 hash of an email address is still considered personal data
                  (pseudonymised) under GDPR. Advertising uploads occur only where marketing consent
                  was given at capture time.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* International Transfers */}
          <Card className="glass shadow-elegant">
            <CardHeader>
              <CardTitle>5C. International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p className="leading-relaxed">
                Some recipients above (Anthropic, Google, HubSpot, Cloudflare) process data in the
                United States. Where personal data is transferred outside the EU/EEA, we rely on the
                European Commission's Standard Contractual Clauses (Art. 46 GDPR) and, where applicable,
                the recipient's certification under the EU–US Data Privacy Framework, together with
                supplementary measures such as pseudonymisation (hashing) and data minimisation.
              </p>
              <p className="text-sm">
                Core analytics infrastructure (Supabase) is hosted in the EU. AI, advertising and
                Cloudflare edge-analytics features that may involve US transfers are optional and
                consent- or operator-gated.
              </p>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card className="glass shadow-elegant">
            <CardHeader>
              <CardTitle>6. Cookies &amp; Local Storage We Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Necessary (Always active)</h4>
                <ul className="text-muted-foreground space-y-1 ml-4">
                  <li>• <code>site_cookie_consent</code> (localStorage) - Saves your cookie preferences (Lifetime: persistent)</li>
                  <li>• <code>site_consent</code> (cookie) - Mirror of your consent choices (Lifetime: 1 year)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Analytical (Requires consent)</h4>
                <ul className="text-muted-foreground space-y-1 ml-4">
                  <li>• <code>cortiq_session_id</code> (sessionStorage) - Per-session identifier (Lifetime: tab session)</li>
                  <li>• <code>cortiq_click_ids</code> (sessionStorage) - Ad click IDs, only with marketing consent (Lifetime: tab session)</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                CortIQ is cookie-free by default; the items above are the only client-side storage used,
                and analytical storage is written only after consent.
              </p>
            </CardContent>
          </Card>

          {/* User Rights */}
          <Card className="glass shadow-elegant">
            <CardHeader>
              <CardTitle>7. Your Rights Under GDPR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">You have the following rights:</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>✓ <strong>Right of access</strong> (Art. 15 GDPR) - Request a copy of your data</li>
                <li>✓ <strong>Right to erasure</strong> (Art. 17 GDPR) - Request deletion of your data</li>
                <li>✓ <strong>Right to rectification</strong> (Art. 16 GDPR) - Correct inaccurate data</li>
                <li>✓ <strong>Right to object</strong> (Art. 21 GDPR) - Object to processing</li>
                <li>✓ <strong>Right to data portability</strong> (Art. 20 GDPR) - Get your data in structured form</li>
              </ul>
              <div className="bg-muted/50 p-4 rounded-lg mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong className="text-foreground">How to exercise your rights:</strong>
                </p>
                <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>1. Send an email to: privacy@cortiq.se</li>
                  <li>2. Include: Your name, email, and which right you want to exercise</li>
                  <li>3. We will respond within 30 days</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card className="glass shadow-elegant">
            <CardHeader>
              <CardTitle>8. Data Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">We use the following security measures:</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>🔒 <strong>Encryption:</strong> All data is transferred via HTTPS/TLS</li>
                <li>🔒 <strong>IP anonymization:</strong> Automatic masking of IP addresses</li>
                <li>🔒 <strong>Access control:</strong> Only authorized personnel have access</li>
                <li>🔒 <strong>Supabase:</strong> Secure data storage in EU (GDPR-compliant)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card className="glass shadow-elegant">
            <CardHeader>
              <CardTitle>9. Data Retention & Automatic Deletion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/5 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-foreground">📋 Server Log Files</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Access logs (HTTP logs):</strong> 7-30 days</li>
                  <li>• <strong>Security logs (bot detection, DDoS):</strong> 90 days</li>
                  <li>• <strong>Error logs (debugging):</strong> 30 days</li>
                  <li>• <strong>IP addresses:</strong> Anonymized immediately at collection (never stored)</li>
                </ul>
              </div>

              <div className="bg-primary/5 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-foreground">📊 Aggregated Analytics</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Cookie-free data (server-side):</strong> 90 days</li>
                  <li>• <strong>Enhanced analytics (with cookies):</strong> 365 days</li>
                  <li>• <strong>Aggregated statistics (dashboards):</strong> 24 months (no personal data)</li>
                </ul>
              </div>

              <div className="bg-primary/5 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-foreground">🔒 Legal Records</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Cookie consent records:</strong> 2 years (legally required evidence per GDPR)</li>
                  <li>• <strong>Security incidents:</strong> 3 years (per security requirements)</li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                <strong className="text-foreground">Automatic deletion:</strong> All data is automatically deleted after these periods. 
                You can request immediate deletion at any time by contacting privacy@cortiq.se.
              </p>
            </CardContent>
          </Card>

          {/* What Does NOT Qualify */}
          <Card className="glass shadow-elegant border-destructive/20">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <Shield className="h-6 w-6 text-destructive" />
                <CardTitle>10. What Does NOT Qualify as Banner-Free</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                In <strong>banner-free mode</strong>, we do <strong>NOT</strong> use the following techniques
                that would require a cookie banner:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>❌ <strong>Google Analytics cookies</strong> (_ga, _gid, _gat)</li>
                <li>❌ <strong>Facebook Pixel cookies</strong> (_fbp, _fbc)</li>
                <li>❌ <strong>GA proxy with user identifiers</strong> (Client ID, IP storage)</li>
                <li>❌ <strong>Device fingerprinting</strong> (Canvas, WebGL, font detection)</li>
                <li>❌ <strong>Hash-based tracking</strong> (IP+UserAgent hash)</li>
              </ul>
              <div className="bg-destructive/5 p-4 rounded-lg mt-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Important:</strong> All these methods require prior consent under
                  the ePrivacy Directive, even if they run server-side or use your own domain.
                </p>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg mt-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Consent-based mode:</strong> if the site operator enables the
                  optional consent-based analytics script and you give explicit consent, additional techniques may be
                  used — canvas/WebGL fingerprinting, cross-visit visitor identification, and ad click-ID capture
                  (gclid, fbclid, etc.). These run only after your consent, which is exactly why they require it.
                  Without consent, none of them are used.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="glass shadow-elegant border-primary/20">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <Mail className="h-6 w-6 text-primary" />
                <CardTitle>11. Contact Us</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Email:</strong> privacy@cortiq.se</p>
                <p><strong>Support:</strong> support@cortiq.se</p>
              </div>
              <Link to="/auth">
                <Button className="bg-gradient-primary hover-scale hover-glow">
                  Start Using the Platform
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Comparison */}
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-center">Quick Guide: What's the Difference?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-background/80 p-6 rounded-lg">
                  <h4 className="font-bold mb-3 flex items-center">
                    <span className="text-2xl mr-2">❌</span>
                    WITHOUT Cookies (100% Banner-Free)
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">Server-side + Server logs - Always active</p>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• <strong>Server log files:</strong> Access logs, HTTP status, load times</li>
                    <li>• Aggregated statistics (server logs)</li>
                    <li>• Page views & most popular pages</li>
                    <li>• Referrers & traffic sources</li>
                    <li>• Device type & browser</li>
                    <li>• Bot security & AI agents</li>
                    <li>• Country/region (IP → country → IP deleted)</li>
                    <li className="font-semibold text-foreground">✓ No personal identification</li>
                    <li className="font-semibold text-foreground">✓ No cookie banner required</li>
                    <li className="font-semibold text-foreground">✓ GDPR Art. 6.1.f (Legitimate interest)</li>
                  </ul>
                </div>
                <div className="bg-background/80 p-6 rounded-lg">
                  <h4 className="font-bold mb-3 flex items-center">
                    <span className="text-2xl mr-2">✅</span>
                    WITH Cookies
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">Enhanced - After consent</p>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Everything from Cookie-free PLUS:</li>
                    <li>• Sessions (track users)</li>
                    <li>• Heatmaps (click data)</li>
                    <li>• Form interactions</li>
                    <li className="font-semibold text-foreground">✓ Still GDPR-safe</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back to home */}
        <div className="text-center mt-16">
          <Link to="/">
            <Button variant="outline" size="lg" className="glass">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
