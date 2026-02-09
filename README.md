# CortIQ - Agentic Browser Analytics

<div align="center">

**World's first analytics platform dedicated to AI agents and the Agentic Web**

[![License](https://img.shields.io/badge/license-Private-red.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com/)

[Website](https://cortiq.se) · [Documentation](./CLAUDE.md) · [Deployment](./DEPLOYMENT.md)

</div>

---

## 🚀 About CortIQ

CortIQ is an advanced web analytics platform that combines traditional analytics with **groundbreaking AI-agent tracking** - the first of its kind on the market. The platform helps businesses understand and optimize for the new era of agentic web, where AI agents like ChatGPT Browser, Perplexity Comet, and Claude Browser are becoming an increasingly significant part of web traffic.

### 🌟 Unique Advantages

- **🤖 First-Mover Advantage**: First platform with dedicated AI-agent tracking
- **🔒 Cookie-Free Analytics**: 100% GDPR-compliant server-side tracking (PTS-approved)
- **🔌 WordPress Plugin**: Unique 1-click installation and deep integration
- **🎯 Nudging Technology**: Smart cookie banners for higher consent rates
- **📊 Comprehensive Solution**: All-in-one platform for modern web analytics

---

## ✨ Key Features

### 1. 🤖 Agentic Browser Analytics (World First!)

Track and analyze AI agents visiting your website:

- **Supported AI Agents**: ChatGPT Browser, Perplexity Comet, Claude Browser, Google Gemini, Microsoft Copilot, You.com, Phind
- **Agent-specific dashboards**: See how AI agents interact with your website
- **Session tracking**: Complete journey from first request to conversion
- **Browser-type analysis**: Visual browser vs headless vs text-based
- **Conversion attribution**: Measure ROI from AI-driven traffic
- **Journey funnel**: Visualize where AI agents drop off

### 2. 🔒 Cookie-Free Server-Side Analytics

- Eliminate cookie banners completely for certain use cases
- 100% GDPR-compliant tracking without cookies
- Server-side processing without personal data in the browser
- Better conversion rates without intrusive cookie disruptions
- PTS-approved solution (Swedish Post and Telecom Authority)

### 3. 🗺️ Visual Analytics (Heatmaps)

- **Click heatmaps**: See exactly where users click
- **Scroll heatmaps**: Understand scroll behavior
- **Attention maps**: Visualize focus areas
- **Device-specific views**: Separate heatmaps for desktop, tablet, mobile
- **AI agent heatmaps**: Visual interaction from AI agents

### 4. 🧪 A/B Testing & Optimization

- Multivariate testing with multiple variants
- Automatic statistical significance calculation
- Audience segmentation
- ROI measurement
- Agent-specific testing for AI traffic

### 5. 📝 Form Analytics

- Form funnel visualization
- Drop-off point identification
- Field-level analytics
- Completion rate tracking
- Conversion optimization

### 6. 🛡️ GDPR & Cookie Management (CMP)

- Nudging cookie banners with smart technology
- First-party cookie management
- Consent management platform
- Data retention policies
- IP anonymization
- GDPR-compliant data handling

### 7. 🔌 WordPress Integration

- 1-click installation via WordPress plugin
- Deep integration with WordPress
- Automatic tracking without configuration
- Dashboard directly in WordPress admin
- **Primary competitive advantage**

### 8. 📈 Advanced Analytics

- Real-time analytics with live insights
- Customizable KPI dashboards
- Traffic source analysis
- Conversion tracking
- User journey analysis
- Navigation flow analytics
- Behavioral alerts

### 9. 🔗 External Integrations

- Google Analytics 4 (GA4)
- Google Search Console
- Google SiteKit
- Bing Webmaster Tools
- Server log import and analysis
- E-commerce tracking

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.1
- **Language**: TypeScript 5.5.3
- **UI Library**: shadcn-ui (Radix UI)
- **Styling**: Tailwind CSS 3.4.11
- **Routing**: React Router 6.26.2
- **State Management**: TanStack Query (React Query) 5.56.2
- **Charts**: Recharts 2.12.7

### Backend
- **Platform**: Supabase
- **Database**: PostgreSQL (62 tables)
- **Edge Functions**: 51 Deno-based functions
- **Database Functions**: 43 PostgreSQL functions
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

### Deployment
- **Frontend**: cortiq.se (Apache/SPA)
- **Backend**: Supabase Cloud (already in production)
- **Tracking Scripts**: CDN via cortiq.se

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm or bun package manager

### Installation

```bash
# Clone repository
git clone https://github.com/expandtalk/cortiq.git
cd cortiq

# Install dependencies
npm install
# or
bun install

# Copy environment variable template
cp .env.example .env
# Edit .env and fill in your Supabase credentials

# Start development server
npm run dev
# or
bun run dev
```

The application now runs on `http://localhost:8080`

### Build for Production

```bash
# Build production version
npm run build

# Contents of dist/ are ready for deployment
```

---

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Complete project documentation and architecture
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment instructions and troubleshooting
- **[INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md)** - Guide for external integrations
- **[SENTRISK-INTEGRATION.md](./SENTRISK-INTEGRATION.md)** - Sentrisk integration guide
- **[PRIVACY-POLICY-GUIDE.md](./PRIVACY-POLICY-GUIDE.md)** - GDPR and privacy policy
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Troubleshooting guide

---

## 🗂️ Project Structure

```
cortiq/
├── src/
│   ├── components/         # React components
│   │   ├── dashboard/      # Dashboard components (78 files)
│   │   ├── gdpr/           # GDPR/CMP components
│   │   └── ui/             # shadcn-ui components
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Pages (Index, Dashboard, Auth, etc.)
│   ├── lib/                # Utility functions
│   ├── integrations/
│   │   └── supabase/       # Supabase client and types
│   └── types/              # TypeScript type definitions
├── supabase/
│   ├── functions/          # 51 Edge Functions
│   └── migrations/         # 60 database migrations
├── public/
│   ├── spa-tracking.js     # Main tracking script
│   ├── ai-tracking-unified.js  # AI-agent tracking
│   └── ...                 # Other tracking scripts
├── wordpress-plugin/       # WordPress plugin
└── dist/                   # Build output (generated)
```

---

## 🔐 Security

- `.env` file contains sensitive credentials and is **NEVER** included in git
- Use `.env.example` as a template for new installations
- Supabase Row Level Security (RLS) enabled on all tables
- IP anonymization by default
- GDPR-compliant data handling

---

## 🤝 Contributing

This is a private repository. For questions or support, contact the project team.

---

## 📄 License

Proprietary - All rights reserved. This project is private and confidential.

---

## 🌐 Production

- **Website**: https://cortiq.se
- **Status**: ✅ In production
- **Backend**: Supabase Cloud

---

## 📞 Support

For technical support or questions, please contact the development team.

---

<div align="center">

**Built with ❤️ for the Agentic Web**

CortIQ © 2025

</div>
