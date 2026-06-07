# CLAUDE.md — CortIQ

CortIQ is an open-source web analytics platform focused on AI bot intelligence and cookie-free tracking, built by Expandtalk Corporation AB.

---

## Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend**: Supabase (PostgreSQL + Deno Edge Functions + RLS)
- **Charts**: Recharts, Leaflet.js
- **Session replay**: rrweb 2.0
- **Tracking script**: Vanilla JS, embeddable on any site

Key numbers: 62 DB tables · 51 Edge Functions · 60+ migrations · 80+ dashboard components

---

## Local development

```bash
npm install
cp .env.example .env   # fill in VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID
npm run dev            # → http://localhost:8080
```

The dev server connects to the Supabase cloud project. There is no local Supabase emulator setup.

---

## Project structure

```
src/
  components/dashboard/   # All dashboard UI — tabs, widgets, charts
  components/dashboard/tabs/  # One file per dashboard tab
  hooks/                  # Data fetching hooks (useAIBotTracking, useAnalytics, etc.)
  pages/                  # Public marketing pages + Dashboard + Auth
  integrations/supabase/  # Auto-generated client and TypeScript types

supabase/
  functions/              # Edge Functions — one folder per function
  migrations/             # Sequential SQL migrations

public/
  spa-tracking.js         # Embeddable tracking script for external sites
  ai-tracking-unified.js  # AI bot detection script
```

---

## Key conventions

### Dashboard tabs
Each tab in `src/components/dashboard/tabs/` is a self-contained component receiving `selectedSite` as a prop. Data fetching happens inside the tab via a dedicated hook in `src/hooks/`.

### Edge Functions
All Edge Functions live in `supabase/functions/`. They use `Deno.env.get()` for secrets — never hardcode. Public endpoints (tracking, consent) have `verify_jwt = false` in `supabase/config.toml`.

### Database
All tables have Row Level Security enabled. Company isolation is enforced at the DB level — never rely solely on application-layer filtering. Use `site_id` and `company_id` consistently.

### Environment variables
Frontend vars are prefixed `VITE_`. Only the anon/publishable key goes in the browser — the service role key is Edge Function only.

---

## AI bot classification

CortIQ classifies AI traffic into three categories — this is the core differentiator:

### Heatmaps
- **Click heatmaps** — tracked via `interaction_type: 'click'` events in `heatmap_data` table
- **Scroll depth heatmaps** — tracked via `interaction_type: 'scroll'` at 25/50/75/100% milestones. `ScrollDepthChart.tsx` renders the funnel visualization.

### AI bot classification

| Category | Examples | Interpretation |
|----------|----------|---------------|
| Training Crawlers | GPTBot, ClaudeBot, BLEXBot | Infrastructure cost, no referral value |
| Agentic Browsers | ChatGPT Browser, Perplexity Comet, Claude Browser | Real user intent, track and convert |
| Citation Crawlers | PerplexityBot, Google-Extended, YouBot | AI search indexing, visibility signal |

Classification logic lives in `src/components/dashboard/BotTrafficClassification.tsx` (frontend) and `supabase/functions/ai-bot-tracker/` (ingest).

---

## Deployment

```bash
npm run build                          # outputs to dist/
supabase functions deploy --all        # deploy edge functions
```

CI/CD is configured in `.github/workflows/` — see the workflow files for required secrets.

---

## Adding a new dashboard tab

1. Create `src/components/dashboard/tabs/MyTab.tsx` — accept `selectedSite` prop
2. Create `src/hooks/useMyFeature.ts` — fetch from Supabase, return typed data
3. Register the tab in `src/components/dashboard/DashboardTabs.tsx`
4. If it needs an Edge Function: add `supabase/functions/my-function/index.ts` and set `verify_jwt` in `config.toml`

---

## Language

- Code and comments: English
- UI copy: English (with some Swedish in older components — migrate to English on touch)
- This file: English
