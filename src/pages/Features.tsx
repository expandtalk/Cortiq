import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import PublicNavigation from "@/components/PublicNavigation";
import { useSEO } from "@/hooks/useSEO";
import { 
  MousePointer, 
  BarChart3, 
  FormInput, 
  TestTube, 
  Shield, 
  Cookie,
  Users,
  Globe,
  Zap,
  Eye,
  TrendingUp,
  Settings,
  Database,
  Lock,
  Smartphone,
  Monitor,
  Navigation,
  Target,
  FileText,
  Search,
  Layers,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

export default function Features() {
  useSEO({
    title: 'Features — CortIQ Analytics Platform',
    description: 'Full feature overview: AI agent tracking, click heatmaps, A/B testing, form analytics, session recording, data warehouse export and GDPR-compliant CMP. All in one platform.',
  });
  const coreFeatures = [
    {
      icon: <MousePointer className="h-8 w-8" />,
      title: "Visual Analytics",
      description: "Visualize exactly where users click, scroll, and interact on your website",
      features: ["Click heatmaps", "Scroll heatmaps", "Move heatmaps", "Device-specific views"]
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Real-Time Analysis",
      description: "Get real-time insights about your visitors and their behavior",
      features: ["Live users", "Session data", "Conversion statistics", "Traffic flows"]
    },
    {
      icon: <FormInput className="h-8 w-8" />,
      title: "Form Analytics",
      description: "Understand how users interact with your forms and optimize conversions",
      features: ["Form funnel", "Drop-off points", "Field analysis", "Completion rate"]
    },
    {
      icon: <TestTube className="h-8 w-8" />,
      title: "A/B Testing",
      description: "Test different variants of your website to optimize performance",
      features: ["Multivariate tests", "Statistical significance", "Audience segmentation", "ROI measurement"]
    }
  ];

  const cmpFeatures = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "GDPR Compliance",
      description: "Automatic GDPR compliance with intelligent cookie management",
      features: ["Automatic categorization", "Legal security", "Data handling", "User rights"]
    },
    {
      icon: <Cookie className="h-8 w-8" />,
      title: "Cookie Management",
      description: "Professional cookie management with user-friendly consent banner",
      features: ["Automatic cookie detection", "Categorization", "Consent tracking", "Banner customization"]
    },
    {
      icon: <Eye className="h-8 w-8" />,
      title: "Transparency & Control",
      description: "Give users full control over their data and cookie preferences",
      features: ["Cookie settings", "Data portability", "Deletion requests", "Activity log"]
    },
    {
      icon: <Lock className="h-8 w-8" />,
      title: "Data Security",
      description: "Secure handling and storage of all user data according to EU regulations",
      features: ["Encryption", "Anonymization", "Secure storage", "Data retention"]
    }
  ];

  const integrationFeatures = [
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Google Analytics 4",
      description: "Seamless integration with GA4 for extended data collection",
      features: ["GA4 import", "Conversion sync", "Segment analysis", "KPI dashboard"]
    },
    {
      icon: <Search className="h-8 w-8" />,
      title: "Search Console",
      description: "Integrate SEO data from Google Search Console",
      features: ["Keyword analysis", "Performance data", "Indexing status", "Click-through rates"]
    },
    {
      icon: <Layers className="h-8 w-8" />,
      title: "Tag Manager",
      description: "Works perfectly with Google Tag Manager and other CMPs",
      features: ["GTM compatibility", "OneTrust support", "Cookiebot integration", "Custom triggers"]
    },
    {
      icon: <Database className="h-8 w-8" />,
      title: "WordPress Plugin",
      description: "Complete WordPress integration with 1-click installation",
      features: ["Easy installation", "Automatic configuration", "Theme compatibility", "Plugin sync"]
    }
  ];

  const deviceFeatures = [
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "Mobile Optimized",
      description: "Full tracking and analysis for all device types",
      features: ["Touch tracking", "Responsive design", "Mobile-specific metrics", "App-like UX"]
    },
    {
      icon: <Monitor className="h-8 w-8" />,
      title: "Cross-Device Tracking",
      description: "Follow user journeys across different devices and sessions",
      features: ["Device sync", "Session linking", "User journey mapping", "Attribution modeling"]
    },
    {
      icon: <Navigation className="h-8 w-8" />,
      title: "Navigation Analytics",
      description: "Analyze how users navigate through your website",
      features: ["Menu click analysis", "Navigation flows", "Exit points", "Path optimization"]
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Segmentation",
      description: "Advanced segmentation for deeper user insights",
      features: ["Demographics", "Behavior segments", "Traffic sources", "Conversion groups"]
    }
  ];

  const advancedFeatures = [
    {
      icon: <AlertTriangle className="h-8 w-8" />,
      title: "Behavioral Alert Tracking",
      description: "Automatic detection of abnormal user behavior with smart alerts",
      features: ["Rage clicks detection", "Bounce rate spikes", "Form abandonment alerts", "Session anomalies"]
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "KPI Dashboard",
      description: "Customizable KPI dashboards to track your most important metrics",
      features: ["Custom KPIs", "Real-time data", "Trend analysis", "Goal tracking"]
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Cookie-Free Analytics",
      description: "Complete analytics even without cookies - GDPR-safe",
      features: ["Privacy-first tracking", "Cookie-free sessions", "Unique visitors", "Estimated data loss"]
    },
    {
      icon: <Settings className="h-8 w-8" />,
      title: "AI-Powered Insights",
      description: "Get automatic recommendations and insights from AI",
      features: ["Automatic analysis", "Performance recommendations", "Trend predictions", "Actionable insights"]
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Traffic Sources & UTM",
      description: "Detailed analysis of all traffic streams and campaign performance",
      features: ["UTM tracking", "Referral analysis", "Campaign attribution", "Channel performance"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <PublicNavigation />
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="text-sm font-medium mb-4">
            <BarChart3 className="h-4 w-4 mr-2" />
            Complete Feature Overview
          </Badge>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Powerful Features for Modern Web Analytics
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A complete platform that combines heatmap analysis, GDPR compliance, and 
            third-party integrations in a single solution.
          </p>
        </div>

        {/* Core Analytics Features */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">📊 Core Analytics Features</h2>
            <p className="text-lg text-muted-foreground">
              Advanced analytics tools to understand your users
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            {coreFeatures.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="text-primary">
                      {feature.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CMP Features */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">🛡️ Cookie Management Platform (CMP)</h2>
            <p className="text-lg text-muted-foreground">
              Full GDPR compliance and cookie management
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            {cmpFeatures.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="text-primary">
                      {feature.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Integration Features */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">🔗 Integrations & Compatibility</h2>
            <p className="text-lg text-muted-foreground">
              Works with your existing tools and platforms
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            {integrationFeatures.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="text-primary">
                      {feature.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Google Consent Mode v2 */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">🔐 Google Consent Mode v2 (GCM v2)</h2>
            <p className="text-lg text-muted-foreground">
              Advanced integration with Google's consent framework for optimal balance between marketing and privacy
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="text-orange-600">
                    <Shield className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-xl mb-2">Optional & Secure Implementation</CardTitle>
                    <CardDescription className="text-base">
                      GCM v2 is disabled by default and can only be activated after legal review
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    <span className="text-sm">Disabled by default for legal security</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    <span className="text-sm">Clear warnings about "ping" functionality</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    <span className="text-sm">Full control over activation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    <span className="text-sm">Compatible with WordPress and external integration</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="text-blue-600">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-xl mb-2">Marketing Benefits</CardTitle>
                    <CardDescription className="text-base">
                      Maximize Google Ads performance and conversion tracking with consent-based data
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm">Improved Google Ads optimization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm">Better conversion tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm">Remarketing with consent-based data</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm">Smart Bidding improvements</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-blue-50 dark:from-orange-950/20 dark:to-blue-950/20 p-6 rounded-lg border border-orange-200 dark:border-orange-900">
            <div className="flex items-start gap-4">
              <div className="text-orange-600 mt-1">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 text-orange-800 dark:text-orange-200">Important Information About GCM v2</h3>
                <div className="text-sm text-orange-700 dark:text-orange-300 space-y-2">
                  <p>
                    <strong>Legal Warning:</strong> GCM v2 sends "pings" to Google even when users deny consent for marketing. 
                    Some legal departments do not approve this due to GDPR uncertainty.
                  </p>
                  <p>
                    <strong>Our Recommendation:</strong> Always consult your legal department before activating GCM v2. 
                    The system works excellently without GCM v2 for full GDPR compliance.
                  </p>
                  <p>
                    <strong>Transparency:</strong> We always clearly inform about what happens when GCM v2 is activated, 
                    so you can make an informed decision.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hybrid Cookie Tracking */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">🍪 Hybrid Cookie Tracking Solution</h2>
            <p className="text-lg text-muted-foreground">
              Unique combination of 1st and 3rd party cookies for optimal tracking and GDPR compliance
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="text-primary">
                    <Database className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-xl mb-2">1st Party Cookies</CardTitle>
                    <CardDescription className="text-base">
                      Secure tracking from your own domain for maximum data quality
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">No blocking by ad-blockers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">100% data accuracy</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">Longer session lifetime</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">GDPR-friendly implementation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="text-primary">
                    <Globe className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-xl mb-2">3rd Party Cookies</CardTitle>
                    <CardDescription className="text-base">
                      Cross-domain tracking for complete user journey analysis
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">Cross-domain tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">Attribution modeling</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">Remarketing capabilities</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">Consent-based activation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-primary/20">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="text-primary">
                    <Zap className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-xl mb-2">Hybrid Solution</CardTitle>
                    <CardDescription className="text-base">
                      Automatic switching between cookie types based on consent
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">Intelligent cookie routing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">Automatic fallback</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">Maximum data collection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">Future-proof architecture</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              How Our Hybrid Solution Works
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Before Consent</h4>
                <p className="text-sm text-muted-foreground">
                  Only necessary 1st party cookies are used for basic functionality. 
                  No personal data is collected without consent.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">After Consent</h4>
                <p className="text-sm text-muted-foreground">
                  The system activates 3rd party cookies for extended analysis while 
                  1st party cookies continue for optimal data quality.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Advanced Features */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">⚡ Advanced Features</h2>
            <p className="text-lg text-muted-foreground">
              Powerful tools for professional web analytics
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            {deviceFeatures.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="text-primary">
                      {feature.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Professional Analytics Features */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">🎯 Professional Analytics Features</h2>
            <p className="text-lg text-muted-foreground">
              Advanced tools for data-driven optimization
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            {advancedFeatures.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="text-primary">
                      {feature.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <div className="text-center bg-primary/5 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">
            Ready to Discover the Power of Professional Web Analytics?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Get started today and access all features. No commitment, 
            cancel anytime.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg">
              <Link to="/auth">Join Waitlist</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/cmp">Learn More About CMP</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
