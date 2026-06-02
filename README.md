# CortIQ - Agentic Browser Analytics Platform

<div align="center">

**World's first analytics platform with dedicated AI agent tracking**

[![License](https://img.shields.io/badge/license-Private-red.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com/)

[🌐 Website](https://cortiq.se) · [📖 Integration Guide](./INTEGRATION-GUIDE.md) · [🚀 Deployment Guide](./DEPLOYMENT.md)

</div>

---

## 📋 Table of Contents

- [About CortIQ](#-about-cortiq)
- [Key Features](#-key-features)
- [Dashboard Overview](#-dashboard-overview)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Development](#-development)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [Project Structure](#-project-structure)

---

## 🚀 About CortIQ

CortIQ is an advanced web analytics platform designed for the **Agentic Web** - the new era where AI agents (ChatGPT Browser, Perplexity, Claude, etc.) are becoming a significant portion of web traffic. Industry forecasts predict that 10-15% of all web traffic will come from AI agents within three years.

### 🎯 Mission

Be the first platform to help businesses understand, optimize for, and capitalize on AI-driven web traffic.

### 🌟 Unique Value Propositions

| Feature | Benefit |
|---------|---------|
| 🤖 **AI Agent Analytics** | First-mover advantage with dedicated AI agent tracking |
| 🔒 **Cookie-Free Tracking** | 100% GDPR-compliant server-side analytics (PTS-approved) |
| 🔌 **WordPress Plugin** | Unique 1-click installation with deep integration |
| 📊 **Comprehensive Platform** | All-in-one solution: heatmaps, A/B tests, forms, sessions |
| 🎯 **Advanced Features** | Tag Manager, Session Recording, Data Warehouse, LTV/Cohorts |

### 📈 Production Status

- **Live Production**: https://cortiq.se
- **Backend**: Supabase (Expandtalk Analytics)
- **Database**: 62 tables, 43 database functions
- **Edge Functions**: 51 serverless functions
- **Frontend Build**: 2.4 MB optimized bundle

---

## ✨ Key Features

### 🤖 Agentic Browser Analytics (World First!)

**The industry's first dedicated AI agent analytics:**

- Track ChatGPT Browser, Perplexity Comet, Claude Browser, Gemini, and more
- AI agent journey funnels (see where agents drop off)
- Browser type detection (Visual vs Headless vs Text-based)
- Citation tracking and training crawler identification
- Agent-specific conversion attribution
- Agent conversion rate optimization

**Accessible via:** `AI Traffic` and `AI Agents` tabs

---

### 🎯 Core Analytics

**Standard analytics done right:**

- Real-time visitor dashboard
- Traffic sources & UTM tracking
- Device & browser analytics
- Geographic analytics
- User journey analysis
- Conversion funnel tracking
- KPI dashboards with customization
- Behavioral alerts & anomaly detection

**Accessible via:** `Overview`, `Analytics`, `KPI Dashboard`, `Segments`, `Navigation`, `Alerts` tabs

---

### 🔒 Privacy-First Analytics

**GDPR-compliant tracking without compromise:**

- **Cookie-Free Analytics**: Server-side tracking without browser cookies
- **GDPR Compliance**: PTS-approved, no personal data in browser
- **Cookie Consent Management (CMP)**: Smart nudging technology
- **IP Anonymization**: Automatic IP address anonymization
- **Data Retention**: Configurable per-site (default: 730 days)

**Accessible via:** `Cookie-Free` tab, Settings → `GDPR`

---

### 🎨 Visual Analytics

**See what users see:**

- **Click Heatmaps**: Exact click positions with density visualization
- **Device-Specific Views**: Separate heatmaps for desktop/tablet/mobile
- **Session Recording**: Full session replay with rrweb player
- **AI Agent Recording**: Record AI agent interactions

**Accessible via:** `Heatmap` tab, Advanced → `Session Recording`

---

### 🧪 Optimization Tools

**Test, optimize, convert:**

- **A/B Testing**: Statistical significance calculations
- **Form Analytics**: Field-level drop-off analysis
- **Conversion Funnels**: Multi-step funnel visualization
- **Page Performance**: Landing page optimization

**Accessible via:** `A/B Testing`, `Forms` tabs

---

### ⚡ Advanced Features (Advanced Dropdown)

Professional-grade features for power users:

| Feature | Description | Status |
|---------|-------------|--------|
| **Tag Manager** | Manage tracking tags without code | ✅ Production |
| **Session Recording** | Full session replay with rrweb | ✅ Production |
| **Geolocation Maps** | Interactive Leaflet.js world map | ✅ Production |
| **Data Warehouse** | Sync to BigQuery, Snowflake, Redshift | ✅ Production |
| **User LTV & Cohorts** | Lifetime value + cohort analysis | ✅ Production |
| **Web Vitals** | Core Web Vitals (LCP, FID, CLS) | ✅ Production |
| **White Label** | Custom branding & colors | ✅ Production |

**Accessible via:** Advanced dropdown (⚡ button in dashboard)

---

### 🔌 Integrations

**Connect with your existing tools:**

- Google Analytics 4 (full API integration)
- Google Search Console (keyword tracking)
- Google SiteKit (WordPress integration)
- Bing Webmaster Tools
- Server log import
- E-commerce tracking

**Accessible via:** Settings → `External Integrations`

---

## 📊 Dashboard Overview

### Main Navigation (15 Tabs)

```
┌─ Overview          → Dashboard summary
├─ Analytics         → Traffic sources, devices, funnels
├─ Ads (GA4)         → Google Analytics paid ads
├─ Ads (Server)      → Server-side ad tracking
├─ Cookie-Free       → Cookieless analytics
├─ Heatmap           → Click heatmaps
├─ Forms             → Form analytics
├─ A/B Testing       → Experiments & tests
├─ AI Traffic        → AI agent analytics
├─ AI Agents         → AI bot intelligence
├─ KPI Dashboard     → Custom KPIs
├─ KPI Catalog       → Predefined KPIs
├─ Segments          → User segmentation
├─ Navigation        → Navigation flow
└─ Alerts            → Behavioral alerts
```

### Settings Dropdown (4 Options)

```
⚙️ Settings
├─ Setup              → Site configuration
├─ GDPR               → Privacy & compliance
├─ External Integrations → GA4, Search Console
└─ API Keys           → API access management
```

### Advanced Dropdown (6 Options)

```
⚡ Advanced
├─ Tag Manager        → Manage tracking tags
├─ Session Recording  → Session replay
├─ Geolocation Maps   → Geographic analytics
├─ Data Warehouse     → Data sync
├─ User LTV & Cohorts → Lifetime value
└─ Web Vitals         → Performance metrics
```

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.5.3 | Type safety |
| **Vite** | 5.4.1 | Build tool |
| **Tailwind CSS** | 3.4.11 | Styling |
| **shadcn/ui** | Latest | UI components (Radix UI) |
| **TanStack Query** | 5.56.2 | Data fetching & caching |
| **React Router** | 6.26.2 | Routing |
| **Recharts** | 2.12.7 | Data visualization |
| **Leaflet.js** | 1.9.4 | Map visualization |
| **rrweb** | 2.0.0-alpha.11 | Session recording |

### Backend

| Technology | Purpose |
|------------|---------|
| **Supabase** | Backend-as-a-Service |
| **PostgreSQL** | Database (62 tables) |
| **Edge Functions** | Serverless compute (51 functions) |
| **Row Level Security** | Data access control |
| **Supabase Auth** | Authentication |
| **Supabase Storage** | File storage |

### Infrastructure

- **Production URL**: https://cortiq.se
- **Supabase Project**: `cxmkdtgfocgbfizawlwa`
- **Database Functions**: 43 custom PL/pgSQL functions
- **Edge Functions**: 51 Deno TypeScript functions

---

## 🚀 Getting Started

### Prerequisites

```bash
Node.js >= 18.x
npm >= 9.x
Git
```

### Installation

```bash
# Clone repository (private)
git clone https://github.com/expandtalk/cortiq.git
cd cortiq

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Environment Setup

The project uses Supabase in production. Environment variables are handled automatically via Vite:

```env
VITE_SUPABASE_URL="https://cxmkdtgfocgbfizawlwa.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..." # Client-side anon key
```

**Note**: The `.env` file is gitignored. Service role keys are NEVER committed to the repository.

---

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (http://localhost:8080)
npm run build            # Build for production
npm run preview          # Preview production build

# Supabase
npm run supabase:link    # Link to Supabase project
npm run supabase:deploy  # Deploy edge functions
npm run supabase:db:push # Push database migrations

# Code Quality
npm run lint             # Run ESLint
```

### Development Workflow

1. **Make changes** in `src/` directory
2. **Test locally** with `npm run dev`
3. **Build** with `npm run build` to verify
4. **Commit** changes with descriptive messages
5. **Push** to GitHub

### Code Style

- TypeScript strict mode enabled
- ESLint + Security plugin configured
- Prettier for formatting
- Component structure: shadcn/ui conventions

---

## 🚀 Deployment

### Frontend Deployment

```bash
# 1. Build production bundle
npm run build

# 2. Output: dist/ directory (2.4 MB optimized)

# 3. Deploy to cortiq.se via FTP/SFTP or CI/CD
```

### Backend (Supabase)

Backend is already in production. For updates:

```bash
# Deploy edge functions
npm run supabase:deploy

# Run database migrations (manual via Dashboard)
# See DEPLOYMENT.md for detailed instructions
```

**Full deployment guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📚 Documentation

### Core Documentation

| Document | Description |
|----------|-------------|
| **[CLAUDE.md](./CLAUDE.md)** | Complete project documentation (Swedish) |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Production deployment guide |
| **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** | System architecture & design |

### Feature Guides

| Guide | Topic |
|-------|-------|
| **[DATA_WAREHOUSE_GUIDE.md](./DATA_WAREHOUSE_GUIDE.md)** | Data warehouse connectors |
| **[GEOLOCATION_GUIDE.md](./GEOLOCATION_GUIDE.md)** | Geolocation analytics |
| **[CONTENT_TRACKING_ADVANCED_GUIDE.md](./CONTENT_TRACKING_ADVANCED_GUIDE.md)** | Content tracking |
| **[MEDIA_ANALYTICS_GUIDE.md](./MEDIA_ANALYTICS_GUIDE.md)** | Video/audio analytics |

### Integration Guides

| Guide | Topic |
|-------|-------|
| **[INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md)** | External integrations |
| **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** | API reference |

### Operational

| Document | Purpose |
|----------|---------|
| **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** | Pre-deployment checklist |
| **[MONITORING_SETUP.md](./MONITORING_SETUP.md)** | Monitoring & alerts |
| **[QA_ACTION_ITEMS.md](./QA_ACTION_ITEMS.md)** | Quality assurance |

**Full documentation index**: [docs/INDEX.md](./docs/INDEX.md)

---

## 📁 Project Structure

```
cortiq/
├── src/
│   ├── components/
│   │   ├── dashboard/          # Dashboard components (80+ files)
│   │   │   ├── tabs/           # Main dashboard tabs
│   │   │   ├── TagManager.tsx  # Advanced: Tag Manager
│   │   │   ├── SessionRecordingList.tsx  # Advanced: Session Recording
│   │   │   ├── GeolocationDashboard.tsx  # Advanced: Geolocation
│   │   │   ├── WarehouseConnectorManager.tsx  # Advanced: Data Warehouse
│   │   │   └── ...
│   │   ├── gdpr/               # GDPR/CMP components
│   │   ├── ui/                 # shadcn/ui components
│   │   └── ...
│   ├── hooks/                  # Custom React hooks (40+ hooks)
│   ├── pages/                  # Main pages (Index, Dashboard, Auth, etc.)
│   ├── integrations/
│   │   └── supabase/          # Supabase client & types
│   ├── lib/                    # Utility functions
│   └── types/                  # TypeScript type definitions
│
├── supabase/
│   ├── functions/              # 51 Edge Functions (Deno TypeScript)
│   │   ├── visitor-identification/
│   │   ├── track-event/
│   │   ├── ai-bot-tracker/
│   │   └── ...
│   ├── migrations/             # 60+ database migrations
│   └── config.toml             # Supabase configuration
│
├── public/
│   ├── spa-tracking.js         # External tracking script
│   └── ...                     # Static assets
│
├── docs/                       # Additional documentation
├── wordpress-plugin/           # WordPress plugin (planned)
│
├── package.json                # NPM dependencies
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite build configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── README.md                   # This file
```

---

## 🔐 Security

### Repository Status

**This is a PRIVATE repository.**

- ✅ No secrets committed to git
- ✅ `.env` files are gitignored
- ✅ Service role keys only in environment variables
- ✅ Client-side anon key is public by design (RLS protects data)

### Best Practices

- Row Level Security (RLS) enabled on all tables
- Input sanitization in edge functions
- Rate limiting on public endpoints
- CORS properly configured
- XSS protection throughout

---

## 📄 License

**Private/Proprietary** - All rights reserved by Expandtalk.

This repository is private and not open source. Unauthorized access, use, or distribution is prohibited.

---

## 👥 Team

**CortIQ** is developed by [Expandtalk](https://expandtalk.se)

- **Founder & CEO**: Daniel Larsson
- **Location**: Sweden
- **Contact**: https://expandtalk.se/kontakt/

---

## 🎯 Roadmap

### Current Status: Production (v1.0)

- ✅ Core analytics platform
- ✅ AI agent tracking
- ✅ 25 dashboard features (15 main + 4 settings + 6 advanced)
- ✅ Full documentation
- ✅ Security hardened

### Coming Soon

- 🔄 WordPress Plugin (production-ready)
- 🔄 Core Web Vitals completion
- 🔄 Scroll heatmaps (currently only click)
- 🔄 Enhanced mobile app support

### Future Considerations

- Advanced ML-based predictions
- Multi-language UI support
- White-label reseller program
- API rate limiting dashboard

---

## 📞 Support

For questions or issues:

1. Check [CLAUDE.md](./CLAUDE.md) for full documentation
2. Review specific guides in [docs/](./docs/)
3. Contact: https://expandtalk.se/kontakt/

---

<div align="center">

**Built with ❤️ by [Expandtalk](https://expandtalk.se)**

First platform for the Agentic Web 🤖

[Website](https://cortiq.se) · [Documentation](./CLAUDE.md) · [Deployment](./DEPLOYMENT.md)

</div>
