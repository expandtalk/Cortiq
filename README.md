# CortIQ - Agentic Browser Analytics

<div align="center">

**Världens första analysplattform dedikerad för AI-agenter och Agentic Web**

[![License](https://img.shields.io/badge/license-Private-red.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com/)

[Website](https://cortiq.se) · [Dokumentation](./CLAUDE.md) · [Deployment](./DEPLOYMENT.md)

</div>

---

## 🚀 Om CortIQ

CortIQ är en avancerad webbanalysplattform som kombinerar traditionell analytics med **banbrytande AI-agent tracking** - första i sitt slag på marknaden. Plattformen hjälper företag att förstå och optimera för den nya eran av agentic web, där AI-agenter som ChatGPT Browser, Perplexity Comet och Claude Browser blir en allt större del av webbtrafiken.

### 🌟 Unika Fördelar

- **🤖 First-Mover Advantage**: Första plattformen med dedikerad AI-agent tracking
- **🔒 Cookie-Free Analytics**: 100% GDPR-compliant server-side tracking (PTS-godkänd)
- **🔌 WordPress Plugin**: Unik 1-click installation och djup integration
- **🎯 Nudging Technology**: Smart cookie banners för högre samtyckesfrekvens
- **📊 Comprehensive Solution**: Allt-i-ett plattform för modern webbanalys

---

## ✨ Huvudfunktioner

### 1. 🤖 Agentic Browser Analytics (World First!)

Spåra och analysera AI-agenter som besöker din webbplats:

- **Stödda AI-agenter**: ChatGPT Browser, Perplexity Comet, Claude Browser, Google Gemini, Microsoft Copilot, You.com, Phind
- **Agent-specifika dashboards**: Se hur AI-agenter interagerar med din webbplats
- **Session tracking**: Full resa från första request till konvertering
- **Browser-typ analys**: Visual browser vs headless vs text-based
- **Conversion attribution**: Mät ROI från AI-driven trafik
- **Journey funnel**: Visualisera var AI-agenter hoppar av

### 2. 🔒 Cookie-Free Server-Side Analytics

- Eliminera cookie banners helt för vissa användningsområden
- 100% GDPR-compliant tracking utan cookies
- Server-side processing utan personuppgifter i webbläsaren
- Bättre konvertering utan irriterande cookie-disruptioner
- PTS-godkänd lösning (Post- och telestyrelsen)

### 3. 🗺️ Visual Analytics (Heatmaps)

- **Click heatmaps**: Se exakt var användare klickar
- **Scroll heatmaps**: Förstå scroll-beteende
- **Attention maps**: Visualisera fokusområden
- **Device-specific views**: Separata heatmaps för desktop, tablet, mobile
- **AI agent heatmaps**: Visuell interaktion från AI-agenter

### 4. 🧪 A/B Testing & Optimization

- Multivariate testing med flera varianter
- Automatisk statistisk signifikansberäkning
- Audience segmentation
- ROI measurement
- Agent-specific testing för AI-trafik

### 5. 📝 Form Analytics

- Form funnel visualization
- Drop-off point identification
- Field-level analytics
- Completion rate tracking
- Conversion optimization

### 6. 🛡️ GDPR & Cookie Management (CMP)

- Nudging cookie banners med smart teknologi
- First-party cookie management
- Consent management platform
- Data retention policies
- IP-anonymisering
- GDPR-compliant data handling

### 7. 🔌 WordPress Integration

- 1-click installation via WordPress plugin
- Djup integration med WordPress
- Automatisk tracking utan konfiguration
- Dashboard direkt i WordPress admin
- **Huvudsaklig konkurrensfördel**

### 8. 📈 Advanced Analytics

- Real-time analytics med live-insikter
- Anpassningsbara KPI dashboards
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
- Server log import och analys
- E-commerce tracking

---

## 🏗️ Teknisk Stack

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
- **Database**: PostgreSQL (62 tabeller)
- **Edge Functions**: 51 Deno-baserade functions
- **Database Functions**: 43 PostgreSQL functions
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

### Deployment
- **Frontend**: cortiq.se (Apache/SPA)
- **Backend**: Supabase Cloud (redan i produktion)
- **Tracking Scripts**: CDN via cortiq.se

---

## 🚀 Kom igång

### Förutsättningar

- Node.js 18+ eller Bun
- npm eller bun package manager

### Installation

```bash
# Klona repository
git clone https://github.com/expandtalk/cortiq.git
cd cortiq

# Installera dependencies
npm install
# eller
bun install

# Kopiera environment-variabel mall
cp .env.example .env
# Redigera .env och fyll i dina Supabase-credentials

# Starta utvecklingsserver
npm run dev
# eller
bun run dev
```

Applikationen körs nu på `http://localhost:8080`

### Bygga för Produktion

```bash
# Bygg produktionsversion
npm run build

# Innehållet i dist/ är redo för deployment
```

---

## 📚 Dokumentation

- **[CLAUDE.md](./CLAUDE.md)** - Fullständig projektdokumentation och arkitektur
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment-instruktioner och troubleshooting
- **[INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md)** - Guide för externa integrationer
- **[PRIVACY-POLICY-GUIDE.md](./PRIVACY-POLICY-GUIDE.md)** - GDPR och integritetspolicy
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Felsökningsguide

---

## 🗂️ Projektstruktur

```
cortiq/
├── src/
│   ├── components/         # React-komponenter
│   │   ├── dashboard/      # Dashboard-komponenter (78 filer)
│   │   ├── gdpr/           # GDPR/CMP komponenter
│   │   └── ui/             # shadcn-ui komponenter
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Sidor (Index, Dashboard, Auth, etc.)
│   ├── lib/                # Utility functions
│   ├── integrations/
│   │   └── supabase/       # Supabase client och types
│   └── types/              # TypeScript type definitions
├── supabase/
│   ├── functions/          # 51 Edge Functions
│   └── migrations/         # 60 databasmigrations
├── public/
│   ├── spa-tracking.js     # Huvud tracking script
│   ├── ai-tracking-unified.js  # AI-agent tracking
│   └── ...                 # Andra tracking scripts
├── wordpress-plugin/       # WordPress plugin
└── dist/                   # Build output (genereras)
```

---

## 🔐 Säkerhet

- `.env` filen innehåller känsliga credentials och är **ALDRIG** inkluderad i git
- Använd `.env.example` som mall för nya installationer
- Supabase Row Level Security (RLS) aktiverad på alla tabeller
- IP-anonymisering som standard
- GDPR-compliant data handling

---

## 🤝 Contributing

Detta är ett privat repository. För frågor eller support, kontakta projektteamet.

---

## 📄 License

Proprietary - All rights reserved. Detta projekt är privat och confidential.

---

## 🌐 Production

- **Website**: https://cortiq.se
- **Status**: ✅ I produktion
- **Backend**: Supabase Cloud

---

## 📞 Support

För teknisk support eller frågor, vänligen kontakta utvecklingsteamet.

---

<div align="center">

**Byggt med ❤️ för Agentic Web**

CortIQ © 2025

</div>
