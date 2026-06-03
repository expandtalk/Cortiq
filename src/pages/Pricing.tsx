import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PublicNavigation from "@/components/PublicNavigation";
import { useSEO } from "@/hooks/useSEO";
import { Check, X, Mail, Building2, ArrowRight, Bot, Shield, Zap } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    monthly: 29,
    annual: 23,
    description: "For small sites that want to understand their traffic — including AI bots.",
    highlight: false,
    cta: "Get started",
    features: [
      { text: "1 website", included: true },
      { text: "100,000 events / month", included: true },
      { text: "Cookie-free analytics", included: true },
      { text: "AI bot classification (Training / Agentic / Citation)", included: true },
      { text: "Click heatmaps", included: true },
      { text: "GDPR cookie banner", included: true },
      { text: "Scroll depth heatmaps", included: false },
      { text: "Session recording", included: false },
      { text: "A/B testing", included: false },
      { text: "Data warehouse export", included: false },
    ],
  },
  {
    name: "Growth",
    monthly: 59,
    annual: 47,
    description: "Full visual analytics stack for growing teams. Replaces Plausible + Hotjar.",
    highlight: true,
    badge: "Most popular",
    cta: "Get started",
    features: [
      { text: "5 websites", included: true },
      { text: "1,000,000 events / month", included: true },
      { text: "Cookie-free analytics", included: true },
      { text: "AI bot classification (Training / Agentic / Citation)", included: true },
      { text: "Click heatmaps", included: true },
      { text: "GDPR cookie banner", included: true },
      { text: "Scroll depth heatmaps", included: true },
      { text: "Session recording", included: true },
      { text: "A/B testing", included: true },
      { text: "Data warehouse export", included: false },
    ],
  },
  {
    name: "Business",
    monthly: 149,
    annual: 119,
    description: "Multi-site teams needing full control, advanced analytics and priority support.",
    highlight: false,
    cta: "Get started",
    features: [
      { text: "20 websites", included: true },
      { text: "Unlimited events", included: true },
      { text: "Cookie-free analytics", included: true },
      { text: "AI bot classification (Training / Agentic / Citation)", included: true },
      { text: "Click heatmaps", included: true },
      { text: "GDPR cookie banner", included: true },
      { text: "Scroll depth heatmaps", included: true },
      { text: "Session recording", included: true },
      { text: "A/B testing", included: true },
      { text: "Data warehouse export (BigQuery, Snowflake, Redshift)", included: true },
    ],
  },
];

const COMPARISON_ROWS = [
  { label: "Websites", starter: "1", growth: "5", business: "20", enterprise: "Unlimited" },
  { label: "Events / month", starter: "100k", growth: "1M", business: "Unlimited", enterprise: "Unlimited" },
  { label: "Cookie-free analytics", starter: true, growth: true, business: true, enterprise: true },
  { label: "AI bot classification", starter: true, growth: true, business: true, enterprise: true },
  { label: "Click & scroll heatmaps", starter: "Click only", growth: true, business: true, enterprise: true },
  { label: "Session recording", starter: false, growth: true, business: true, enterprise: true },
  { label: "A/B testing", starter: false, growth: true, business: true, enterprise: true },
  { label: "Form analytics", starter: true, growth: true, business: true, enterprise: true },
  { label: "Data warehouse export", starter: false, growth: false, business: true, enterprise: true },
  { label: "White label", starter: false, growth: false, business: false, enterprise: true },
  { label: "SLA (99.9% uptime)", starter: false, growth: false, business: false, enterprise: true },
  { label: "Priority support", starter: false, growth: false, business: true, enterprise: true },
  { label: "Dedicated account manager", starter: false, growth: false, business: false, enterprise: true },
  { label: "Countersigned DPA", starter: false, growth: false, business: true, enterprise: true },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="h-4 w-4 text-primary mx-auto" />;
  if (value === false) return <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />;
  return <span className="text-xs text-muted-foreground">{value}</span>;
}

export default function Pricing() {
  useSEO({
    title: "Pricing — CortIQ",
    description:
      "Simple pricing for AI bot intelligence and cookie-free analytics. From €29/month. Includes AI bot classification, heatmaps, session recording, GDPR banner and more.",
  });

  const { toast } = useToast();
  const [annual, setAnnual] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", company: "", phone: "", message: "" });

  const handleEnterpriseContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.from("waitlist").insert({
        email: contactForm.email,
        name: contactForm.name,
        company: contactForm.company,
        phone: contactForm.phone,
        message: contactForm.message,
      });
      if (error && error.code !== "23505") throw error;
      toast({ title: "Request sent", description: "We will get back to you within 24 hours." });
      setContactForm({ name: "", email: "", company: "", phone: "", message: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not send request.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicNavigation />

      {/* Header */}
      <section className="pt-20 pb-12 px-4 text-center">
        <Badge variant="outline" className="mb-4 text-xs">Pricing</Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Analytics that pays for itself
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Replaces Plausible + Hotjar at a lower combined cost — and adds AI bot intelligence that neither offers.
        </p>

        {/* Annual toggle */}
        <div className="inline-flex items-center gap-3 bg-muted rounded-full px-4 py-2 text-sm">
          <button
            onClick={() => setAnnual(false)}
            className={`px-3 py-1 rounded-full transition-colors ${!annual ? "bg-background shadow font-medium" : "text-muted-foreground"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-3 py-1 rounded-full transition-colors ${annual ? "bg-background shadow font-medium" : "text-muted-foreground"}`}
          >
            Annual
            <span className="ml-1.5 text-xs text-green-500 font-medium">−20%</span>
          </button>
        </div>
      </section>

      {/* Plan cards */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${plan.highlight ? "border-primary shadow-lg shadow-primary/10" : "border-border"}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs px-3">{plan.badge}</Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground leading-snug">{plan.description}</p>
                <div className="pt-2">
                  <span className="text-4xl font-bold">€{annual ? plan.annual : plan.monthly}</span>
                  <span className="text-muted-foreground text-sm"> /month</span>
                  {annual && (
                    <p className="text-xs text-muted-foreground mt-0.5">billed €{plan.annual * 12}/year</p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f.text} className={`flex items-start gap-2 text-sm ${!f.included ? "text-muted-foreground/50" : ""}`}>
                      {f.included
                        ? <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        : <X className="h-4 w-4 text-muted-foreground/30 flex-shrink-0 mt-0.5" />
                      }
                      {f.text}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={`w-full ${plan.highlight ? "bg-primary" : ""}`}
                  variant={plan.highlight ? "default" : "outline"}
                >
                  <Link to="/auth">
                    {plan.cta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enterprise callout */}
        <div className="max-w-5xl mx-auto mt-6">
          <Card className="border-border/60 bg-muted/30">
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-5 px-6">
              <div>
                <p className="font-semibold">Enterprise — from €500/month</p>
                <p className="text-sm text-muted-foreground">Unlimited sites, white label, SLA, dedicated support, custom integrations, on-premise option.</p>
              </div>
              <Button
                variant="outline"
                className="shrink-0"
                onClick={() => document.getElementById("enterprise-form")?.scrollIntoView({ behavior: "smooth" })}
              >
                Contact us
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Why CortIQ */}
      <section className="py-16 px-4 bg-muted/20 border-y border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">What you're replacing</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="p-3 bg-primary/10 rounded-xl w-fit mx-auto">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium">AI Bot Intelligence</p>
              <p className="text-sm text-muted-foreground">No competitor classifies Training Crawlers, Agentic Browsers and Citation Crawlers. This is unique to CortIQ.</p>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-primary/10 rounded-xl w-fit mx-auto">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium">Plausible + Hotjar in one</p>
              <p className="text-sm text-muted-foreground">Cookie-free analytics + heatmaps + scroll depth + session recording. Combined cost elsewhere: €50–100/month.</p>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-primary/10 rounded-xl w-fit mx-auto">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium">GDPR by default</p>
              <p className="text-sm text-muted-foreground">EU-hosted, cookie-free base layer, built-in consent banner, countersigned DPA available. No compliance work required.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Full comparison table */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Full comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 pr-4 text-muted-foreground font-medium w-48">Feature</th>
                  {["Starter", "Growth", "Business", "Enterprise"].map((h) => (
                    <th key={h} className="text-center py-3 px-2 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-3 pr-4 text-muted-foreground font-medium">Price / month</td>
                  <td className="text-center py-3 px-2">€{annual ? 23 : 29}</td>
                  <td className="text-center py-3 px-2 text-primary font-medium">€{annual ? 47 : 59}</td>
                  <td className="text-center py-3 px-2">€{annual ? 119 : 149}</td>
                  <td className="text-center py-3 px-2 text-muted-foreground">Custom</td>
                </tr>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-border/30 last:border-0">
                    <td className="py-2.5 pr-4 text-muted-foreground">{row.label}</td>
                    <td className="text-center py-2.5 px-2"><Cell value={row.starter} /></td>
                    <td className="text-center py-2.5 px-2 bg-primary/5"><Cell value={row.growth} /></td>
                    <td className="text-center py-2.5 px-2"><Cell value={row.business} /></td>
                    <td className="text-center py-2.5 px-2"><Cell value={row.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Enterprise form */}
      <section id="enterprise-form" className="py-16 px-4 bg-muted/20 border-t border-border">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Enterprise enquiry</h2>
          <p className="text-muted-foreground text-center mb-8 text-sm">Tell us about your needs and we'll get back within 24 hours.</p>
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleEnterpriseContact} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" value={contactForm.name} onChange={(e) => setContactForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={contactForm.email} onChange={(e) => setContactForm(p => ({ ...p, email: e.target.value }))} required />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" value={contactForm.company} onChange={(e) => setContactForm(p => ({ ...p, company: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={contactForm.phone} onChange={(e) => setContactForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="message">Tell us about your needs *</Label>
                  <Textarea id="message" rows={4} value={contactForm.message} onChange={(e) => setContactForm(p => ({ ...p, message: e.target.value }))} required placeholder="Number of sites, page views, specific features needed..." />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full" size="lg">
                  {isLoading ? "Sending..." : "Send enquiry"}
                </Button>
              </form>
            </CardContent>
          </Card>
          <div className="flex justify-center gap-8 mt-8 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>daniel@expandtalk.se</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Expandtalk Corporation AB</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
