# CortIQ — AI Bot Intelligence & Analytics

<div align="center">

**Not all AI traffic is equal. CortIQ classifies training crawlers, agentic browsers, and citation bots — so you know which ones matter.**

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[🌐 Website](https://cortiq.se) · [🤖 Bot Intelligence](https://cortiq.se/bot-intelligence) · [📖 Integration Guide](./INTEGRATION-GUIDE.md) · [🔒 GDPR Guide](./GDPR.md) · [🚀 Deployment](./DEPLOYMENT.md)

</div>

---

## What is CortIQ?

1 in 31 web visits is now an AI bot — up from 1 in 200 at the start of 2025 (TollBit Q4 2025). But most analytics platforms either filter them out as noise or treat them as a binary block/allow decision. Neither helps you understand what they're worth.

CortIQ is the first platform that classifies AI traffic into three distinct categories:

| Type | Examples | Value |
|------|----------|-------|
| **Training Crawlers** | GPTBot, ClaudeBot, BLEXBot | Infrastructure cost — no referral traffic |
| **Agentic Browsers** | ChatGPT Browser, Perplexity Comet, Claude Browser | Real visitors acting on behalf of users |
| **Citation Crawlers** | PerplexityBot, Google-Extended, YouBot | AI search indexing — indirect visibility signal |

Beyond bot intelligence, CortIQ covers full human visitor analytics (heatmaps, sessions, forms, A/B tests) without relying on cookies. Server-side tracking means no consent banner is required for the base analytics layer.

---

## What you can measure

### AI agent traffic
- Which AI agents visit your site and how often
- Which pages they access, in what order, for how long
- Citation detection — when an LLM fetches a page to cite or quote it
- Training crawler identification (separate from browsing agents)
- Browser type classification: Visual / Headless / Text-based
- Conversion attribution — goals completed by visitors arriving from AI referrals

### Human visitor behaviour
- Page views, sessions, bounce rate, average time on site
- Traffic sources: organic, direct, referral, paid, social, UTM campaigns
- Click heatmaps — exact positions per page, filterable by device
- Form analytics — field-level completion and drop-off tracking
- Session recording — full replay with configurable data masking
- Navigation flow — how visitors move between pages

### Conversion & optimisation
- Conversion funnels — see where visitors drop off
- A/B testing — 2-variant tests with statistical significance
- Goal tracking and conversion attribution per traffic source

### Technical & performance
- Core Web Vitals (LCP, FID/INP, CLS) with historical trends
- Device, browser and geographic breakdowns
- Paid ads tracking (GA4 server-side, Google Ads)

---

## Unique selling points

### 1. AI bot intelligence — not just detection
Bot blockers tell you what to stop. CortIQ tells you what matters. Every AI visit is classified as a training crawler (infrastructure cost), agentic browser (real user intent), or citation crawler (visibility signal). You see counts, percentages, and journeys per category — not just a total bot number.

AI bot traffic grew 300% in 2025 (Akamai). Without classification, you cannot tell whether that growth is costing you server budget or sending you qualified visitors.

### 2. Cookie-free by default
CortIQ's server-side tracking collects no personal data in the browser and sets no cookies. Under GDPR, this is lawful under legitimate interest (Art. 6.1.f) — no consent banner needed for this layer. You see 100% of traffic instead of the 60–70% that accept cookies.

### 3. No dependency on Google Analytics
CortIQ is a standalone platform. You do not need GA4 to get traffic, heatmap or conversion data. GA4 is an optional add-on if you need it for paid ads reporting.

### 4. EU data residency
All data is stored in the EU (AWS eu-north-1 via Supabase). No data leaves the EU unless you configure an optional Google Analytics integration.

### 5. One-click WordPress integration
The CortIQ WordPress plugin handles script injection, cookie consent banner and GA4 Consent Mode v2 in a single install. No code required.

---

## GDPR compliance

CortIQ is built around two clearly separated tracking layers:

| Layer | Cookies | Legal basis | Consent required |
|-------|---------|-------------|-----------------|
| Cookie-free analytics | None | Legitimate interest (Art. 6.1.f GDPR) | No |
| Enhanced (heatmaps, sessions) | Session cookie | Consent (Art. 6.1.a GDPR) | Yes |

The cookie banner (included in the WordPress plugin and available as a standalone script) implements granular consent categories, no pre-ticked boxes, Consent ID logging and Google Consent Mode v2.

See [GDPR.md](./GDPR.md) for a full breakdown of data collected, sub-processors, retention policy and a ready-to-use privacy policy template.

---

## Getting started

### Prerequisites
- Node.js 18+, npm
- A Supabase project (EU region recommended)

### Local development
```bash
git clone https://github.com/expandtalk/cortiq.git
cd cortiq
npm install

# Copy the environment template and fill in your values
cp .env.example .env

npm run dev
# → http://localhost:8080
```

### WordPress
1. Download the plugin from `wordpress-plugin/cortiq-analytics.php`
2. Upload to `/wp-content/plugins/cortiq-analytics/`
3. Activate and enter your Site ID and Tracking ID from the CortIQ dashboard

### Any other site
Add one script tag before `</body>`:
```html
<script
  src="https://cortiq.se/spa-tracking.js"
  data-site-id="[YOUR_SITE_ID]"
  data-api-key="[YOUR_API_KEY]"
  defer
></script>
```
See [INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md) for platform-specific examples (React, Next.js, Astro, SaaS apps with consent flows).

---

## Tech stack

### Frontend
| | |
|--|--|
| React 18.3.1 | UI framework |
| TypeScript 5.5.3 | Type safety |
| Vite 5.4.1 | Build tool |
| Tailwind CSS 3.4.11 | Styling |
| shadcn/ui | Component library (Radix UI) |
| TanStack Query 5.56.2 | Data fetching |
| Recharts 2.12.7 | Charts |
| Leaflet.js 1.9.4 | Geolocation maps |
| rrweb 2.0 | Session recording |

### Backend (Supabase)
| | |
|--|--|
| PostgreSQL | Database — 62 tables |
| Deno Edge Functions | Serverless compute — 51 functions |
| Row Level Security | Per-company data isolation |
| Supabase Auth | Authentication |

---

## Dashboard

### Main tabs
```
Overview · Analytics · Ads (GA4) · Ads (Server-Side) · Cookie-Free
Heatmap · Forms · A/B Testing · AI Traffic · AI Agents
KPI Dashboard · KPI Catalog · Segments · Navigation · Alerts
```

### Settings
```
Setup → site configuration and tracking script
GDPR → consent management and data retention
External Integrations → GA4, Search Console, Bing
API Keys → API access for external tools
```

### Advanced
```
Tag Manager · Session Recording · Geolocation Maps
Data Warehouse · User LTV & Cohorts · Web Vitals & White Label
```

---

## What is not implemented

Being explicit about current limitations:

- **Scroll heatmaps** — click heatmaps only, no scroll depth tracking
- **Attention maps** — not available
- **Multivariate testing** — A/B testing supports 2 variants only
- **Visual editor** — not available
- **Mobile app** — not planned

---

## Project structure

```
cortiq/
├── src/
│   ├── components/dashboard/   # 80+ dashboard components
│   ├── hooks/                  # 40+ custom React hooks
│   ├── pages/                  # Routes: Index, Dashboard, Auth
│   ├── integrations/supabase/  # Supabase client & TypeScript types
│   └── types/                  # Shared type definitions
├── supabase/
│   ├── functions/              # 51 Edge Functions (Deno TypeScript)
│   └── migrations/             # 60+ database migrations
├── public/
│   └── spa-tracking.js         # Embeddable tracking script
├── wordpress-plugin/           # WordPress plugin
├── INTEGRATION-GUIDE.md        # Platform integration examples
├── GDPR.md                     # GDPR compliance documentation
└── DEPLOYMENT.md               # Deployment instructions
```

---

## Security

- No secrets committed to the repository
- `.env` files are gitignored
- Service role keys stored only in environment variables
- Client-side anon key is publishable by design (data access controlled by RLS)
- Row Level Security enabled on all database tables
- Input sanitisation in all Edge Functions
- Rate limiting on public tracking endpoints

---

## About

CortIQ is developed by [Expandtalk](https://expandtalk.se).

- **Founder:** [Daniel Larsson](https://www.linkedin.com/in/larssondaniel)
- **Website:** [cortiq.se](https://cortiq.se)
- **Location:** Sweden

---

## License

MIT — see [LICENSE](./LICENSE).
