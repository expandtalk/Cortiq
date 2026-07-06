import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Zap, Eye } from "lucide-react";

// Classification is done ONCE at ingest by ai-bot-tracker (stored on
// ai_bot_traffic.request_type and surfaced here as bot.category), so this component no
// longer keeps its own bot-name lists — that duplication was the P2-9 drift source.
type BotCategory = "training" | "agentic" | "citation";

interface Props {
  botBreakdown: { name: string; count: number; percentage: number; category: string }[];
  totalTraffic: number;
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

export function BotTrafficClassification({ botBreakdown, totalTraffic }: Props) {
  // Aggregate counts per category using the category stored at ingest. Anything not
  // training/agentic (including 'unknown') falls into the citation/visibility bucket.
  const counts: Record<BotCategory, number> = { training: 0, agentic: 0, citation: 0 };
  for (const bot of botBreakdown) {
    const cat: BotCategory = bot.category === 'training' || bot.category === 'agentic' ? bot.category : 'citation';
    counts[cat] += bot.count;
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
