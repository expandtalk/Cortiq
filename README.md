# CortIQ — AI Bot Intelligence & Analytics

<div align="center">

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)
[![Deploy](https://img.shields.io/badge/Live-cortiq.se-blue?logo=vercel)](https://cortiq.se)

**Bot blockers tell you what to stop. CortIQ tells you what matters.**

[🌐 Live Demo](https://cortiq.se) · [🤖 Bot Intelligence](https://cortiq.se/bot-intelligence) · [📖 Docs](./INTEGRATION-GUIDE.md) · [🔒 GDPR Guide](./GDPR.md) · [📄 DPA](./DPA.md)

</div>

---

![CortIQ Analytics Dashboard](src/assets/analytics-dashboard-hero.jpg)

---

## Why CortIQ?

1 in 31 web visits is now an AI bot — up from 1 in 200 at the start of 2025. But every existing platform treats them as noise to filter out or a binary block/allow decision.

CortIQ is the **first open-source platform** that classifies AI traffic into three distinct categories:

| Type | Examples | Meaning |
|------|----------|---------|
| 🔴 **Training Crawlers** | GPTBot, ClaudeBot, BLEXBot | Infrastructure cost — no referral value |
| 🟢 **Agentic Browsers** | ChatGPT Browser, Perplexity Comet, Claude Browser | Real users with intent — track and convert |
| 🔵 **Citation Crawlers** | PerplexityBot, Google-Extended, YouBot | AI search indexing — visibility signal |

On top of bot intelligence, CortIQ covers **full human analytics** — heatmaps, sessions, A/B testing, forms — with no cookies and no consent banner required for the base layer.

---

## Quick start

```bash
git clone https://github.com/expandtalk/cortiq.git
cd cortiq
cp .env.example .env        # add your Supabase keys
npm install && npm run dev  # → http://localhost:8080
```

> Full self-hosting guide (Supabase setup, edge functions, deployment) → [below](#self-hosting)

---

## Features

### 🤖 AI Bot Intelligence
- Classify every AI visit: training crawler, agentic browser, or citation crawler
- Track agentic browser journeys page-by-page (ChatGPT Browser, Perplexity Comet, Claude Browser)
- Citation request detection — know when LLMs index your content
- Browser type breakdown: Visual / Headless / Text-based
- Conversion attribution from AI-referred traffic

### 📊 Human Visitor Analytics
- Page views, sessions, bounce rate, traffic sources
- Click heatmaps by device (desktop / tablet / mobile)
- Session recording with configurable data masking
- Form analytics — field-level completion and drop-off
- Navigation flow analysis

### 🧪 Optimisation
- A/B testing with statistical significance
- Conversion funnels
- KPI dashboards — build your own or pick from a catalog
- Segments and behavioral alerts

### 🔒 Privacy & Compliance
- **Cookie-free by default** — server-side tracking, no personal data in the browser
- No consent banner required for base analytics (GDPR Art. 6.1.f legitimate interest)
- Two-layer model: cookiefree baseline + optional opt-in enhanced tracking
- EU data residency (Supabase, AWS eu-north-1)

### 🔍 Transparent AI Insights
- Every AI recommendation shows its source: tables queried, row counts, model, token usage, duration
- Full execution log for every agent job — no black box
- Insight provenance stored per run and browsable in the dashboard

### ⚙️ Integrations & Advanced
- Google Analytics 4 (server-side, cookiefree)
- Google Search Console
- Tag Manager (no-code event tracking)
- Data Warehouse connectors (BigQuery, Snowflake, Redshift, PostgreSQL)
- Geolocation maps
- User LTV & cohort analysis
- Web Vitals tracking (LCP, INP, CLS)
- White label / custom branding
- WordPress plugin (1-click install)
- REST API with API key auth

---

## Screenshots

> 📸 **Dashboard screenshots coming soon.** [Star this repo](https://github.com/expandtalk/cortiq) to get notified when we add them.
>
> In the meantime: [live demo at cortiq.se](https://cortiq.se) · [bot intelligence explainer](https://cortiq.se/bot-intelligence)

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Charts | Recharts, Leaflet.js |
| Session replay | rrweb 2.0 |
| Backend | Supabase (PostgreSQL + Deno Edge Functions) |
| Auth | Supabase Auth with Row Level Security |
| Tracking script | Vanilla JS, ~8 kB gzipped |

**Scale:** 62 database tables · 51 Edge Functions · 60+ migrations

---

## Self-hosting

### Prerequisites
- Node.js 18+, npm
- [Supabase CLI](https://supabase.com/docs/guides/cli) — `npm install -g supabase`
- A Supabase project (EU region recommended)

### 1. Clone and configure

```bash
git clone https://github.com/expandtalk/cortiq.git
cd cortiq
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### 2. Replace the hardcoded project reference

Search for the placeholder project ID in the codebase and replace it with your own:

```bash
# macOS / Linux
find src/ supabase/ public/ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.toml" \) \
  -exec sed -i '' 's/PLACEHOLDER_PROJECT_ID/YOUR_PROJECT_ID/g' {} +

# Windows PowerShell
Get-ChildItem -Recurse -Include "*.ts","*.tsx","*.js","*.toml" src,supabase,public |
  ForEach-Object { (Get-Content $_.FullName) -replace 'PLACEHOLDER_PROJECT_ID','YOUR_PROJECT_ID' | Set-Content $_.FullName }
```

### 3. Push the database schema

```bash
supabase link --project-ref YOUR_PROJECT_ID  # find this in Supabase Dashboard → Settings → General
supabase db push --include-all
```

Creates all 62 tables, indexes, RLS policies and database functions.

### 4. Set edge function secrets

In [Supabase Dashboard](https://supabase.com/dashboard) → Edge Functions → Manage secrets:

| Secret | Required | Description |
|--------|----------|-------------|
| `SUPABASE_URL` | ✅ | `https://YOUR_PROJECT_ID.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Your service role key |
| `ANTHROPIC_API_KEY` | Optional | AI citability analysis in GEO audits |
| `GOOGLE_CLIENT_ID` | Optional | Google Search Console integration |
| `GOOGLE_CLIENT_SECRET` | Optional | Google Search Console integration |
| `GA4_SERVICE_ACCOUNT_KEY` | Optional | GA4 server-side import |

### 5. Deploy edge functions

```bash
supabase functions deploy --all
```

### 6. Build and deploy

```bash
npm run build
# Upload dist/ to your web host — configure server to serve index.html for all routes

# Or deploy to Vercel:
npx vercel --prod
```

Set the same `VITE_*` environment variables in your hosting dashboard.

### WordPress

1. Upload `wordpress-plugin/cortiq-analytics.php` to `/wp-content/plugins/cortiq-analytics/`
2. Activate and enter your Site ID from the CortIQ dashboard

### Any other site

```html
<script
  src="https://YOUR_DOMAIN/spa-tracking.js"
  data-site-id="YOUR_SITE_ID"
  data-api-key="YOUR_API_KEY"
  defer
></script>
```

See [INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md) for React, Next.js, Astro and more.

---

## GitHub Actions CI/CD

The included workflow (`.github/workflows/deploy-production.yml`) builds and FTP-deploys on every push to `main`.

Required secrets in your repository settings:

| Secret | Value |
|--------|-------|
| `VITE_SUPABASE_URL` | Your Supabase URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your anon key |
| `VITE_SUPABASE_PROJECT_ID` | Your project ID |

Add deployment-specific secrets depending on your host (FTP, Vercel, Cloudflare Pages, etc.).

---

## Project structure

```
cortiq/
├── src/
│   ├── components/dashboard/   # 80+ dashboard components
│   ├── hooks/                  # 40+ custom React hooks
│   ├── pages/                  # Public pages + Dashboard
│   └── integrations/supabase/  # Client & TypeScript types
├── supabase/
│   ├── functions/              # 51 Edge Functions (Deno)
│   └── migrations/             # 60+ database migrations
├── public/
│   └── spa-tracking.js         # Embeddable tracking script
└── wordpress-plugin/           # WordPress plugin
```

---

## Known limitations

| Feature | Status |
|---------|--------|
| Scroll heatmaps | ✅ Depth funnel (25/50/75/100%) |
| Multivariate testing | ❌ A/B (2 variants) only |
| Attention maps | ❌ Not implemented |
| Mobile app | ❌ Not planned |

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Open a pull request

For major changes, open an issue first.

---

## Security

- No secrets in the repository
- `.env` files are gitignored
- Row Level Security on all database tables
- Rate limiting on all public tracking endpoints
- Input sanitisation in all Edge Functions
- Anon key is publishable by design (RLS controls data access)

---

## About

Built by [Expandtalk](https://expandtalk.se) · Sweden

- **Founder:** [Daniel Larsson](https://www.linkedin.com/in/larssondaniel)
- **Website:** [cortiq.se](https://cortiq.se)
- **Report:** [AI Bot Traffic Intelligence](https://cortiq.se/bot-intelligence)

---

## License

AGPL-3.0 — see [LICENSE](./LICENSE)

If you run a modified version as a network service, you must release your changes under the same license. Self-hosting for internal use is unrestricted.
