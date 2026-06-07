import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import PublicNavigation from "@/components/PublicNavigation";
import { useSEO } from "@/hooks/useSEO";
import {
  Bot,
  Activity,
  TrendingUp,
  Search,
  Eye,
  Cpu,
  Database,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: <Bot className="h-7 w-7" />,
    title: "AI Agent Detection",
    description: "World's first dedicated tracking for AI browsers — identify exactly which AI agent visited your site.",
    items: [
      "ChatGPT Browser",
      "Perplexity Comet",
      "Claude Browser",
      "Microsoft Copilot",
      "Google Gemini",
      "Grok / xAI",
      "Meta AI",
    ],
    highlight: true,
  },
  {
    icon: <Eye className="h-7 w-7" />,
    title: "Browser Type Classification",
    description: "Know how an agent interacts with your site — does it render CSS and JavaScript, or just read raw text?",
    items: [
      "Visual (renders full page)",
      "Headless (executes JS, no display)",
      "Text-based (raw HTTP only)",
      "Webdriver & automation signals",
    ],
  },
  {
    icon: <Activity className="h-7 w-7" />,
    title: "Agent Journey Funnel",
    description: "Visualize exactly how AI agents navigate your site — where they enter, what they read, where they stop.",
    items: [
      "Page-by-page journey",
      "Session depth tracking",
      "Entry & exit points",
      "Multi-session analysis",
    ],
  },
  {
    icon: <TrendingUp className="h-7 w-7" />,
    title: "AI Traffic Analytics",
    description: "Dedicated dashboards for AI-driven traffic — split cleanly from human visitor data.",
    items: [
      "AI vs human traffic split",
      "Conversion attribution from AI",
      "Traffic trend over time",
      "Agent-specific KPIs",
    ],
  },
  {
    icon: <Search className="h-7 w-7" />,
    title: "Citation & Crawler Tracking",
    description: "Know when LLMs are crawling your content for training or citations — and track it over time.",
    items: [
      "LLM citation requests",
      "Training crawler detection",
      "AI search traffic",
      "Content indexing signals",
    ],
  },
  {
    icon: <Database className="h-7 w-7" />,
    title: "Transparent AI Insights",
    description: "Every AI recommendation shows its work — see the exact tables, row counts, and model behind each insight. No black box.",
    items: [
      "Source trace per insight (tables + row counts)",
      "Model and token usage logged",
      "Full execution log for every agent job",
      "Timestamp and duration on each run",
    ],
  },
  {
    icon: <Cpu className="h-7 w-7" />,
    title: "Search Engine Bot Intelligence",
    description: "Full coverage of all major search and Microsoft crawlers — distinguish between them precisely.",
    items: [
      "Bingbot (desktop & mobile)",
      "AdIdxBot (Bing Ads crawler)",
      "BingPreview & MicrosoftPreview",
      "BingVideoPreview",
      "Googlebot",
      "GPTBot & OpenAI crawlers",
    ],
  },
];

const agentList = [
  { name: "ChatGPT Browser", vendor: "OpenAI", type: "Visual" },
  { name: "Perplexity Comet", vendor: "Perplexity", type: "Visual" },
  { name: "Claude Browser", vendor: "Anthropic", type: "Visual" },
  { name: "Microsoft Copilot", vendor: "Microsoft", type: "Visual" },
  { name: "Google Gemini", vendor: "Google", type: "Text-based" },
  { name: "Grok", vendor: "xAI", type: "Text-based" },
  { name: "Meta AI", vendor: "Meta", type: "Text-based" },
  { name: "GPTBot", vendor: "OpenAI", type: "Headless" },
  { name: "Bingbot", vendor: "Microsoft", type: "Headless" },
  { name: "AdIdxBot", vendor: "Microsoft", type: "Headless" },
  { name: "BingPreview", vendor: "Microsoft", type: "Headless" },
  { name: "MicrosoftPreview", vendor: "Microsoft", type: "Headless" },
  { name: "BingVideoPreview", vendor: "Microsoft", type: "Headless" },
  { name: "Googlebot", vendor: "Google", type: "Headless" },
  { name: "Common Crawl", vendor: "Common Crawl", type: "Headless" },
];

const typeColor: Record<string, string> = {
  Visual: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Headless: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  "Text-based": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

export default function FeaturesAI() {
  useSEO({
    title: 'AI Agent Analytics — CortIQ',
    description: 'Track and analyse traffic from ChatGPT Browser, Perplexity Comet, Claude Browser and other AI agents. Journey funnels, conversion attribution, citation tracking. First on the market.',
  });
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <PublicNavigation />
      <div className="container mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Intelligence
          </Badge>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            The web is filling up with AI agents. Track them.
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            AI browsers, search crawlers, and LLM training bots are becoming a significant slice of
            web traffic. CortIQ is the first platform built to understand them.
          </p>
        </div>

        {/* Features */}
        <section className="mb-20">
          <div className="grid lg:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <Card
                key={i}
                className={`hover:shadow-lg transition-shadow ${f.highlight ? "border-primary/40 bg-gradient-to-br from-primary/5 to-accent/5" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="text-primary mt-1">{f.icon}</div>
                    <div>
                      <CardTitle className="text-xl mb-1">{f.title}</CardTitle>
                      <CardDescription className="text-base">{f.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {f.items.map((item, idx) => (
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

        {/* Agent coverage table */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">Agent Coverage</h2>
            <p className="text-muted-foreground">Every major AI agent and crawler, tracked out of the box</p>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-6 py-3 font-semibold">Agent</th>
                      <th className="text-left px-6 py-3 font-semibold">Vendor</th>
                      <th className="text-left px-6 py-3 font-semibold">Browser Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentList.map((a, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3 font-medium">{a.name}</td>
                        <td className="px-6 py-3 text-muted-foreground">{a.vendor}</td>
                        <td className="px-6 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeColor[a.type]}`}>
                            {a.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <div className="text-center bg-primary/5 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-3">Ready for the agentic web?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            AI agents are already visiting your site. Start tracking them today — before your competitors do.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg">
              <Link to="/auth">
                Start Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/features">See All Features</Link>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
