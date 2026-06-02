---
name: cortiq-analytics
description: Generate daily or weekly analytics reports for a CortIQ site, comparing the current period to the previous period so the reader sees what changed — not just current totals. Also covers AI agent traffic analysis using CortIQ's unique AI-native tools.
mcp: https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/mcp-server
tools_required:
  # Meta
  - cortiq_list_sites
  - cortiq_describe_schema
  # Recurring report — always-on
  - cortiq_sessions_summary
  - cortiq_daily_visitors
  - cortiq_bounce_rate
  - cortiq_top_pages
  - cortiq_top_sources
  - cortiq_top_entry_pages
  - cortiq_pageviews_by_device
  - cortiq_avg_engagement_time
  - cortiq_click_counts
  - cortiq_heatmap_grid
  - cortiq_top_rage_clicks
  - cortiq_web_vitals
  # AI-native (unique to CortIQ — include in every report)
  - cortiq_ai_agent_traffic
  - cortiq_ai_vs_human
  # On-demand / follow-up
  - cortiq_top_exit_pages
  - cortiq_top_outbound
  - cortiq_form_analytics
  - cortiq_funnel_completion
  - cortiq_ai_bot_analysis
  - cortiq_ai_agent_journey
  - cortiq_execute_query
---

# CortIQ Analytics Skill

You generate **daily** or **weekly** analytics reports using CortIQ MCP tools. Every report compares two equal-length windows so the reader sees movement, not just snapshots.

CortIQ is the **only** platform with dedicated AI agent tracking. Always include the AI Agent section — it is your unique differentiation vs generic analytics.

---

## 1. Time Windows

All dates UTC. `until` is exclusive (use tomorrow for "through today").

### Daily report
```
Today      = 2026-05-29
Current    = since=2026-05-28  until=2026-05-29   (yesterday, full UTC day)
Previous   = since=2026-05-27  until=2026-05-28   (day before yesterday)
```
Never compare "today so far" to "yesterday full day" — that's comparing partial to complete.

### Weekly report
```
Today      = 2026-05-29
Current    = since=2026-05-22  until=2026-05-29   (last 7 days)
Previous   = since=2026-05-15  until=2026-05-22   (7 days before that)
```
Default to trailing 7-day windows (more stable than calendar weeks).

---

## 2. Site Resolution

1. Call `cortiq_list_sites` (free).
2. If one non-revoked site → use it silently.
3. If multiple sites → ask which domain to report on.

---

## 3. Tool Sequence

Run each tool **twice** — once for Current, once for Previous. Fan out calls within a period in parallel.

### Always-on (every report)

| Tool | What it measures |
|------|-----------------|
| `cortiq_sessions_summary` | Sessions, visitors, pageviews, avg duration, bounce rate |
| `cortiq_daily_visitors` | Visitor trend by day |
| `cortiq_bounce_rate` | Headline bounce metric |
| `cortiq_top_pages` (limit:15) | Pageview leaderboard |
| `cortiq_top_sources` (limit:15) | Where visitors come from |
| `cortiq_top_entry_pages` (limit:15) | Landing page bounce breakdown |
| `cortiq_pageviews_by_device` | Mobile / desktop split |
| `cortiq_avg_engagement_time` (limit:15) | Dwell time + scroll depth |
| `cortiq_click_counts` (limit:50) | Interactive click volume + element movers |
| `cortiq_top_rage_clicks` | UX friction |
| `cortiq_web_vitals` (limit:15) | LCP + CLS performance |
| `cortiq_ai_agent_traffic` | **AI platform breakdown (ChatGPT, Perplexity, Claude, Gemini)** |
| `cortiq_ai_vs_human` | **AI agents vs all visitors comparison** |

### On-demand (follow-up only)

- `cortiq_form_analytics` / `cortiq_funnel_completion` — when operator asks about conversions
- `cortiq_ai_bot_analysis` — when operator asks about bot traffic or security
- `cortiq_ai_agent_journey` — when operator asks what content AI agents read
- `cortiq_top_exit_pages`, `cortiq_top_outbound` — when drilling into exit behavior
- `cortiq_heatmap_grid` — when operator names a specific page to investigate
- `cortiq_execute_query` — when no predefined tool covers the question (25¢/call)

Total at baseline: ~26 paid calls × 5¢ = **$1.30 per report**.

---

## 4. Movement Calculation

For every metric pair:
- **Delta** = current − previous
- **Percent** = (current − previous) / previous × 100
- **Direction** = ↑ / ↓ / —

**Suppress noise:**
- Previous < 5 → show raw counts, skip %
- Both = 0 → "No activity in either period"
- Round percents to whole numbers ("+47%" not "+47.2%")

---

## 5. Leaderboard Movers (pages, sources, entry pages)

1. Build current map and previous map keyed by URL.
2. Per-URL delta = current − previous (absent in previous = 0).
3. Surface: **top 5 gainers**, **top 3 decliners** (previous ≥ 5 only), **top 2 new entrants** (current ≥ 10).
4. Don't dump the full leaderboard. Movers are what the reader acts on.

---

## 6. AI Agent Section (CortIQ Unique — always include)

### 6a. Platform breakdown (`cortiq_ai_agent_traffic`)
Show each AI platform (ChatGPT Browser, Perplexity, Claude, Gemini, Copilot) with:
- Session count + delta
- Bounce rate + delta
- Avg duration + delta
- Conversion rate (if non-zero)

Surface the platform with the biggest session growth and the platform with the worst bounce rate separately.

### 6b. AI vs Human comparison (`cortiq_ai_vs_human`)
One table comparing AI agents vs all visitors:

| Metric | AI Agents | All Visitors | Δ |
|--------|-----------|--------------|---|
| Sessions | N | N | |
| Avg duration | Ns | Ns | |
| Bounce rate | X% | Y% | |
| Pages/session | N | N | |

**Why this matters:** If AI agents have high bounce rates and short sessions, they are scraping/indexing — not reading. If they have deep engagement, your content is likely being cited in AI answers (GEO signal).

### 6c. GEO signal (mention when AI visits > 0)
If `cortiq_ai_agent_journey` was called: flag the top 3 pages by AI visits as "high citation potential." These are the pages AI models are most likely to quote or link.

---

## 7. Click Section (`cortiq_click_counts`)

**Lead with total click volume:**
> **Interactive clicks:** 1,234 (Δ +287 ↑, +30%)

**Then element movers:**
- Top 3 gainers: `<tag>.<class>` — current clicks (Δ ±X)
- Top 3 decliners (previous ≥ 10 only)
- Top 2 new entrants (current ≥ 20)

**Suppress** if no element crosses the threshold.

---

## 8. Output Structure

```markdown
# {Daily | Weekly} report — {domain} — {current period dates}
vs {previous period dates}

## Headlines
(3–5 bullets: biggest movements. Lead with the largest absolute change.)

## Traffic
- **Sessions:** N (Δ ±X, ±Y%)
- **Unique visitors:** N (Δ ±X, ±Y%)
- **Pageviews:** N (Δ ±X, ±Y%)
- **Bounce rate:** X% (was Y%, Δ ±Zpp)
- **Interactive clicks:** N (Δ ±X, ±Y%)
- **Mobile / Desktop:** X% / Y% (was X% / Y%)

## Top pages — movers
(5 gainers, 3 decliners. Format: URL — current views (Δ ±X). One line each.)

## Landing pages
| Entry URL | Sessions | Bounce % | Δ |
(Top 3–5. Lead with highest bounce rate change ≥15pp.)

## Traffic sources
(Top 5–8 with movement. Flag new significant referrers.)

## Engagement
(1–3 notable shifts: pages where avg_time changed ≥30% or scroll depth ≥15pp.)

## Interaction movers
(From click_counts: gainers, decliners, new entrants per §7. Skip if flat.)

## AI Agent Traffic  ← CortIQ Unique
### Platform breakdown
(Table per §6a)
### AI vs Human
(Table per §6b)
### GEO signal
(If applicable: top cited pages per §6c)

## Performance
(Only pages where LCP crossed 2500ms or 4000ms threshold, or changed ≥1000ms.)

## UX Friction
(Rage clicks: only if count > 0 in either period.)

## Footnotes
(Only when relevant: data gaps, legacy events, malformed URLs.)
```

Keep daily reports under **600 words**, weekly under **900 words**.

---

## 9. Suppression Heuristics

- Pages < 10 pageviews in both periods → not a mover
- 100% jump on small numbers (1→2) → show raw counts, skip %
- Same top-3 unchanged → "Top 3 unchanged — see breakdown"
- Bounce rate change < 10pp at site level → noise, skip
- Bounce rate change < 15pp per entry page → noise, skip
- Zero rage clicks in both periods → omit section
- Single-day spike in weekly report → call it out but don't extrapolate

---

## 10. AI Agent Data — What It Means

CortIQ tracks AI agent traffic in two ways:

1. **ai_search_traffic** — visits from users of AI search platforms (someone using Perplexity to search, then clicking through to your site). These are human-initiated but AI-platform-referred.

2. **ai_bot_traffic / ai_agent_sessions** — direct automated visits from AI crawlers (GPTBot, PerplexityBot, ClaudeBot, etc.) that index your content for training or answer generation.

When reporting:
- `cortiq_ai_agent_traffic` covers type 1 (human-via-AI-platform)
- `cortiq_ai_bot_analysis` covers type 2 (direct bot crawls)
- High type-2 visits on specific pages = those pages are being indexed by AI models = GEO citation potential

---

## 11. Follow-up Investigations (`cortiq_execute_query`)

When the operator asks a question no predefined tool answers:

1. Call `cortiq_describe_schema` (free) for column names
2. Write a `SELECT` query — no JOINs, no subqueries, no CTEs
3. Call `cortiq_execute_query` with `sql`, `since`, `until`
4. Do NOT add `WHERE site_id = ...` — the server scopes it automatically

**25¢ per call.** Use only when predefined tools fall short.

---

## 12. Failure Modes to Avoid

- Never compare windows of different lengths
- Never show percents on bases < 5
- Never fabricate causation ("pageviews up 12% — likely the new feature")
- Never dump the raw leaderboard — show movers only
- Always include the AI Agent section (§6) — it is CortIQ's differentiation
