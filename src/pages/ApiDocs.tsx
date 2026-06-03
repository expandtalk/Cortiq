/**
 * API Documentation Landing Page
 * Task #5: Publikt REST API med dokumentation
 */

import { Link } from 'react-router-dom';
import PublicNavigation from '@/components/PublicNavigation';
import { useSEO } from '@/hooks/useSEO';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Code,
  Key,
  ExternalLink,
  BookOpen,
  Zap,
  Shield,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Bot,
} from 'lucide-react';

export default function ApiDocs() {
  useSEO({
    title: 'API Documentation — CortIQ',
    description: 'CortIQ REST API reference. Track events, query analytics, heatmaps, A/B tests and more. OpenAPI-compatible with API key authentication.',
  });
  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Fast & Reliable',
      description: 'Built on Supabase Edge Functions with global CDN for low latency',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Secure',
      description: 'API key authentication with rate limiting and usage tracking',
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Scalable',
      description: 'Handles millions of requests with automatic scaling',
    },
    {
      icon: <Bot className="h-6 w-6" />,
      title: 'AI Agent Analytics',
      description: 'Unique endpoint for tracking ChatGPT Browser, Perplexity, Claude',
    },
  ];

  const endpoints = [
    { method: 'GET', path: '/api/v1/sites', description: 'List all sites' },
    { method: 'GET', path: '/api/v1/sites/{id}/visits', description: 'Get visit data' },
    { method: 'GET', path: '/api/v1/sites/{id}/pages', description: 'Get page views' },
    { method: 'GET', path: '/api/v1/sites/{id}/referrers', description: 'Get traffic sources' },
    { method: 'GET', path: '/api/v1/sites/{id}/events', description: 'Get custom events' },
    { method: 'GET', path: '/api/v1/sites/{id}/agents', description: 'Get AI agent traffic 🤖' },
    { method: 'GET', path: '/api/v1/sites/{id}/conversions', description: 'Get conversions' },
    { method: 'GET', path: '/api/v1/sites/{id}/heatmaps', description: 'Get heatmap data' },
  ];

  const codeExample = `curl https://cortiq.se/api/v1/sites/abc123/visits \\
  -H "Authorization: Bearer ck_live_your_api_key_here" \\
  -G --data-urlencode "date_from=2024-01-01" \\
     --data-urlencode "date_to=2024-01-31" \\
     --data-urlencode "format=json"`;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <PublicNavigation />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 px-4 py-2 text-base">
              <Code className="h-4 w-4 mr-2" />
              Public REST API
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gradient-primary mb-6">
              CortIQ Developer API
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Powerful REST API for accessing your analytics data programmatically.
              Build custom dashboards, automate reports, and integrate with your tools.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <a href="/api-docs/index.html" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-gradient-primary hover-scale hover-glow">
                <BookOpen className="mr-2 h-5 w-5" />
                View API Documentation
              </Button>
            </a>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="hover-lift">
                <Key className="mr-2 h-5 w-5" />
                Get API Key
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover-lift glass">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-muted-foreground">
              Simple authentication, comprehensive data access
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Authentication */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  1. Authentication
                </CardTitle>
                <CardDescription>
                  Get your API key from the dashboard and include it in your requests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">HTTP Header:</p>
                  <code className="block p-3 bg-muted rounded text-sm font-mono">
                    Authorization: Bearer ck_live_your_api_key
                  </code>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    API keys are managed in your dashboard under Settings → API Keys
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Example Request */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  2. Make a Request
                </CardTitle>
                <CardDescription>
                  Simple REST API with JSON or CSV responses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Example cURL:</p>
                  <pre className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto">
                    {codeExample}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Available Endpoints
            </h2>
            <p className="text-xl text-muted-foreground">
              8 endpoints covering all your analytics needs
            </p>
          </div>

          <Card className="glass">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {endpoints.map((endpoint, index) => (
                  <div
                    key={index}
                    className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="font-mono font-bold">
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm font-mono text-primary">
                        {endpoint.path}
                      </code>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {endpoint.description}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <a href="/api-docs/index.html" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="hover-lift">
                View Full API Reference
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Highlight */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why CortIQ API?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">First with AI Agent Analytics</h3>
                    <p className="text-muted-foreground">
                      Track ChatGPT Browser, Perplexity Comet, Claude Browser - data no other platform provides
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Cookie-Free Data</h3>
                    <p className="text-muted-foreground">
                      100% GDPR-compliant server-side tracking without cookies
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Export Formats</h3>
                    <p className="text-muted-foreground">
                      JSON and CSV support on all endpoints for easy integration
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Rate Limiting</h3>
                    <p className="text-muted-foreground">
                      Configurable rate limits (default 1,000 requests/hour)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Usage Analytics</h3>
                    <p className="text-muted-foreground">
                      Track API usage, response times, and errors in real-time
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="glass p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">
                Ready to Build?
              </h3>
              <div className="space-y-4">
                <Link to="/auth" className="block">
                  <Button className="w-full bg-gradient-primary hover-scale hover-glow" size="lg">
                    Get Your API Key
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a
                  href="/api-docs/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" className="w-full hover-lift" size="lg">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Read Documentation
                  </Button>
                </a>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Need help? <Link to="/#contact" className="text-primary hover:underline">Contact our team</Link>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
