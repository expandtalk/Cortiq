import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Zap, Eye } from "lucide-react";

// Known bot name patterns → category
const TRAINING_PATTERNS = [
  "gptbot", "claudebot", "google-extended", "amazonbot", "diffbot",
  "blexbot", "ccbot", "petalbot", "dataforseobot", "training",
];
const AGENTIC_PATTERNS = [
  "chatgpt-user", "chatgpt browser", "claude browser", "claude-ai",
  "perplexity comet", "copilot", "gemini", "agentic",
];

type BotCategory = "training" | "agentic" | "citation";

function classifyBot(name: string): BotCategory {
  const lower = name.toLowerCase();
  if (TRAINING_PATTERNS.some((p) => lower.includes(p))) return "training";
  if (AGENTIC_PATTERNS.some((p) => lower.includes(p))) return "agentic";
  return "citation";
}

interface Props {
  botBreakdown: { name: string; count: number; percentage: number }[];
  totalTraffic: number;
  trainingCrawlers: number;
}

const CATEGORIES = [
  {
    key: "training" as BotCategory,
    label: "Training Crawlers",
    sublabel: "Infrastructure cost",
    description: "Crawl for model training. No referral value.",
    icon: <AlertTriangle className="h-5 w-5 text-red-400" />,
    textColor: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    badgeBg: "bg-red-500/20 text-red-400",
  },
  {
    key: "agentic" as BotCategory,
    label: "Agentic Browsers",
    sublabel: "Real user intent",
    description: "Act on behalf of users. Track like humans.",
    icon: <Zap className="h-5 w-5 text-green-400" />,
    textColor: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    badgeBg: "bg-green-500/20 text-green-400",
  },
  {
    key: "citation" as BotCategory,
    label: "Citation / Search AI",
    sublabel: "Visibility signal",
    description: "Index content for AI-powered search results.",
    icon: <Eye className="h-5 w-5 text-blue-400" />,
    textColor: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    badgeBg: "bg-blue-500/20 text-blue-400",
  },
];

export function BotTrafficClassification({ botBreakdown, totalTraffic, trainingCrawlers }: Props) {
  // Aggregate counts per category from botBreakdown names
  const counts: Record<BotCategory, number> = { training: 0, agentic: 0, citation: 0 };
  for (const bot of botBreakdown) {
    counts[classifyBot(bot.name)] += bot.count;
  }

  // Prefer the hook's pre-calculated trainingCrawlers count if higher (more accurate, uses request_type)
  if (trainingCrawlers > counts.training) {
    const diff = trainingCrawlers - counts.training;
    counts.training = trainingCrawlers;
    // Move overflow from citation bucket (most unclassified bots are crawlers)
    counts.citation = Math.max(0, counts.citation - diff);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {CATEGORIES.map((cat) => {
        const count = counts[cat.key];
        const pct = totalTraffic > 0 ? Math.round((count / totalTraffic) * 100) : 0;
        return (
          <Card key={cat.key} className={`border ${cat.border} ${cat.bg}`}>
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center justify-between">
                {cat.icon}
                <Badge className={`text-xs border-0 ${cat.badgeBg}`}>{cat.sublabel}</Badge>
              </div>
              <div>
                <div className={`text-3xl font-bold ${cat.textColor}`}>{count.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{pct}% of AI traffic</div>
              </div>
              <div>
                <p className="text-sm font-medium">{cat.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
