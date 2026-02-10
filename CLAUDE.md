# CortIQ - Projektdokumentation

## Projektöversikt

**CortIQ** är en avancerad webbanalysplattform som är först på marknaden med dedikerad **Agentic Browser Analytics** - spårning och analys av AI-agenter som ChatGPT Browser, Perplexity Comet och Claude Browser. Plattformen kombinerar detta med cookie-free server-side tracking, GDPR-compliant CMP-lösningar, och en unik WordPress-integration.

**Produktions-URL**: https://cortiq.se  
**Projektnamn tidigare**: Web Focus Analyzer, Heatmap Analyzer  
**Nuvarande namn**: CortIQ

---

## Syfte och Vision

### Huvudsyfte
CortIQ är designad för att vara först på marknaden med analytics för "Agentic Web" - den nya era där AI-agenter blir en betydande del av webbtrafiken. Prognoser visar att 10-15% av all webbtrafik kommer från AI-agenter inom tre år.

### Unika Fördelar
1. **First-mover advantage**: Första plattformen med dedikerad AI-agent tracking
2. **WordPress-plugin**: Unik 1-click installation och djup integration
3. **Cookie-free analytics**: 100% GDPR-compliant server-side tracking (PTS-godkänd)
4. **Nudging-teknologi**: Smart cookie banners för högre samtyckesfrekvens
5. **Framtidssäkrad**: Redo för agentic web innan konkurrenter förstår det

---

## Huvudfunktioner - Implementation Status

### ✅ FULLY IMPLEMENTED & ACCESSIBLE

#### 1. Agentic Browser Analytics (World First!)
- ✅ **AI-agent tracking**: Spårar ChatGPT Browser, Perplexity Comet, Claude Browser och andra AI-agenter
- ✅ **Agent-specifika dashboards**: "AI Traffic" och "AI Agents" tabs i dashboard
- ✅ **Agent journey funnel**: Visualisera AI-agenter resa genom din webbplats
- ✅ **Agent conversion attribution**: Mät konverteringar från AI-driven trafik
- ✅ **Browser type detection**: Visual/Headless/Text-based browser detection
- ✅ **Citation tracking**: LLM citation requests och training crawlers

#### 2. Cookie-Free Server-Side Analytics
- ✅ **100% GDPR-compliant**: Server-side tracking utan personuppgifter
- ✅ **Cookiefri spårning**: Egen "Cookie-Free" tab i dashboard
- ✅ **GA4 Server-Side**: Server-side GA4 integration för paid ads

#### 3. Visual Analytics (Heatmaps)
- ✅ **Click heatmaps**: Fullt implementerat med data från clicks
- ✅ **Device-specific views**: Filter för desktop, tablet, mobile
- ✅ **Page selector**: Välj specifika sidor för heatmap-analys
- ✅ **Mobile insights**: Dedikerade mobile-specific insights

#### 4. A/B Testing & Optimization
- ✅ **A/B Testing tab**: Komplett A/B testing implementation
- ✅ **Test management**: Create, configure, and track A/B tests
- ✅ **Statistical analysis**: Built-in statistical significance calculations

#### 5. Form Analytics
- ✅ **Form Analytics tab**: Dedikerad tab för formuläranalys
- ✅ **Funnel visualization**: Visualisera användares väg genom formulär

#### 6. GDPR & CMP
- ✅ **GDPR tab**: Settings → GDPR för compliance management
- ✅ **Cookie consent**: Cookie consent management system
- ✅ **Data retention**: Konfigurerbar datalagring

#### 7. Core Analytics Features
- ✅ **Overview Dashboard**: Sammanfattning av all key metrics
- ✅ **Analytics tab**: Traffic sources, device breakdown, funnel analysis
- ✅ **Paid Ads (GA4)**: Google Analytics 4 paid ads data
- ✅ **Paid Ads (Server-Side)**: Server-side tracking för ads
- ✅ **KPI Dashboard**: Anpassningsbara KPI dashboards
- ✅ **KPI Catalog**: Fördefinierade KPIs att välja från
- ✅ **Segments**: Användar-segmentering
- ✅ **Navigation**: Navigation flow analysis
- ✅ **Alerts**: Behavioral alerts för anomali-detektering

#### 8. Integrations
- ✅ **External Integrations tab**: Settings → External Integrations
- ✅ **Google Analytics 4**: GA4 integration
- ✅ **Google Search Console**: Search Console integration
- ✅ **API Keys**: Settings → API Keys för external access

#### 9. Setup & Configuration
- ✅ **Setup tab**: Settings → Setup för site configuration
- ✅ **Tracking script**: Installation instructions och tracking code

### ✅ ADVANCED FEATURES (Now Accessible via "Advanced" Dropdown!)

#### 10. Tag Manager
- ✅ **Tag Management**: Create/edit/delete tracking tags
- ✅ **Tag Templates**: Pre-built templates för popular platforms
- ✅ **Tag Types**: Event, Pixel, Script, HTML tags
- ✅ **Data Layer**: Custom data layer variables
- 📍 **Location**: Advanced → Tag Manager

#### 11. Session Recording
- ✅ **Recording List**: View all recorded sessions
- ✅ **Session Player**: Replay user sessions med rrweb
- ✅ **AI Agent Detection**: Filter på AI agents vs humans
- ✅ **Device Filters**: Filter på desktop/mobile/tablet
- ✅ **Search & Filters**: Sök efter URL, title, visitor hash
- 📍 **Location**: Advanced → Session Recording

#### 12. Geolocation Maps
- ✅ **Interactive Map**: Leaflet.js world map med clusters
- ✅ **Heatmap Layer**: Geographic density visualization
- ✅ **Country/Region/City**: Drill-down från country till city level
- ✅ **Location Metrics**: Sessions, visitors, bounce rate, conversions per location
- ✅ **Export**: Export geolocation data
- 📍 **Location**: Advanced → Geolocation Maps

#### 13. Data Warehouse Connectors
- ✅ **Warehouse Types**: BigQuery, Snowflake, Redshift, PostgreSQL, MySQL, Databricks
- ✅ **Connection Management**: Create/test/delete connectors
- ✅ **Sync Jobs**: Trigger incremental/full sync jobs
- ✅ **Job Tracking**: Monitor sync progress and status
- ✅ **Schema Configuration**: Configure schema names and table prefixes
- 📍 **Location**: Advanced → Data Warehouse

#### 14. User Lifetime Value (LTV) & Cohort Analysis
- ✅ **LTV Metrics**: Total users, revenue, average LTV
- ✅ **Cohort Analysis**: Users grouped by first visit month
- ✅ **Top Users**: Top 100 highest LTV users (anonymized)
- ✅ **Revenue Tracking**: Revenue per session calculations
- ✅ **GDPR-compliant**: Använder hashade user IDs
- 📍 **Location**: Advanced → User LTV & Cohorts

#### 15. Web Vitals & White Label
- ✅ **White Label Settings**: Custom branding, colors, logo
- ✅ **Web Vitals Tracking**: LCP, FID, CLS measurements
- ✅ **Performance Score**: Aggregated performance metrics
- ✅ **Web Vitals Trend**: Historical performance charts
- ✅ **SAML SSO**: Enterprise SSO configuration
- ✅ **Advanced Segmentation**: Custom user segments
- 📍 **Location**: Advanced → Web Vitals & White Label

### ⚠️ PARTIALLY IMPLEMENTED

- ⚠️ **Core Web Vitals**: Component exists men noterad som "Kommer implementeras" i Analytics tab
- ⚠️ **WordPress Plugin**: Planerad men inte testad/polished

### ❌ NOT IMPLEMENTED

Features som INTE är implementerade (remove from marketing):
- ❌ **Scroll heatmaps**: Endast click heatmaps implementerat
- ❌ **Attention maps**: Inte implementerat
- ❌ **Multivariate testing**: Endast A/B testing (2 variants)
- ❌ **Visual Editor**: Inte implementerat
- ❌ **Custom Reports Builder**: Inte implementerat
- ❌ **Multi-language Support**: Endast svenska/engelska mixed
- ❌ **Mobile App**: Inte planerad

---

## Teknisk Arkitektur

### Frontend
- **Framework**: React 18.3.1
- **Build tool**: Vite 5.4.1
- **Language**: TypeScript 5.5.3
- **UI Library**: shadcn-ui (Radix UI komponenter)
- **Styling**: Tailwind CSS 3.4.11
- **Routing**: React Router 6.26.2
- **State Management**: TanStack Query (React Query) 5.56.2
- **Charts**: Recharts 2.12.7

### Backend
- **Platform**: Supabase (Expandtalk analytics)
- **Project ID**: `cxmkdtgfocgbfizawlwa`
- **URL**: `https://cxmkdtgfocgbfizawlwa.supabase.co`
- **Database**: PostgreSQL (62 tabeller)
- **Edge Functions**: 51 functions (Deno)
- **Database Functions**: 43 functions
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage

### Databasstruktur
- **62 tabeller** för olika datatyper:
  - Tracking events, sessions, page views
  - AI agent sessions, traffic, analysis
  - Heatmap data, form analytics
  - Cookie consents, GDPR settings
  - A/B tests, conversions
  - User interactions, behavioral data
  - Integrations, sites, companies
  - Och många fler...

### Edge Functions (51 functions)
- `track-event` - Huvudfunktion för event tracking
- `cookiefree-analytics` - Cookie-free analytics
- `ai-bot-tracker` - AI-agent tracking
- `ai-search-tracker` - AI search traffic tracking
- `heatmap-data` - Heatmap data processing
- `form-analytics` - Form analytics
- `ab-test-calculator` - A/B test beräkningar
- `ga4-import` - Google Analytics 4 import
- `gdpr-compliant-tracking` - GDPR-compliant tracking
- `behavioral-analysis` - Behavioral analysis
- Och många fler...

### Deployment
- **Frontend**: Deployas till cortiq.se (FTP/SFTP eller CI/CD)
- **Backend**: Redan i produktion på Supabase
- **Tracking Script**: `public/spa-tracking.js` deployas till cortiq.se

---

## Projektstruktur

```
cortiq/
├── src/
│   ├── components/
│   │   ├── dashboard/          # Dashboard-komponenter (78 filer)
│   │   │   ├── tabs/           # Dashboard tabs
│   │   │   └── integrations/  # Integration-komponenter
│   │   ├── gdpr/               # GDPR/CMP komponenter
│   │   ├── ui/                 # UI-komponenter (shadcn-ui)
│   │   └── ...
│   ├── hooks/                  # Custom React hooks
│   ├── pages/                  # Sidor (Index, Dashboard, Auth, etc.)
│   ├── integrations/
│   │   └── supabase/          # Supabase client och types
│   ├── lib/                    # Utility functions
│   └── types/                  # TypeScript types
├── supabase/
│   ├── functions/              # 51 Edge Functions
│   ├── migrations/             # 60 databasmigrations
│   └── config.toml             # Supabase konfiguration
├── public/
│   ├── spa-tracking.js         # Tracking script för externa sajter
│   └── ...                     # Andra statiska filer
├── wordpress-plugin/            # WordPress plugin
└── ...
```

---

## Dashboard Navigation

### Main Tabs (Synliga direkt i tabbar)
- **Overview** - Sammanfattning av all metrics
- **Analytics** - Traffic sources, device breakdown, funnel
- **Ads (GA4)** - Google Analytics 4 paid ads data
- **Ads (Server-Side)** - Server-side tracking för ads
- **Cookie-Free** - Cookiefri tracking analytics
- **Heatmap** - Click heatmaps med device filters
- **Forms** - Formuläranalys och funnel
- **A/B Testing** - A/B test management och results
- **AI Traffic** - AI-agent tracking (cookiefree + GA4)
- **AI Agents** - LLM bot intelligence och journey funnel
- **KPI Dashboard** - Anpassningsbara KPI dashboards
- **KPI Catalog** - Fördefinierade KPIs
- **Segments** - User segmentation
- **Navigation** - Navigation flow analysis
- **Alerts** - Behavioral alerts

### Settings Dropdown
- **Setup** - Site configuration och tracking script
- **GDPR** - GDPR compliance och cookie consent
- **External Integrations** - GA4, Search Console, etc.
- **API Keys** - API access management

### Advanced Dropdown (NYA!)
- **Tag Manager** - Manage tracking tags utan code
- **Session Recording** - Spela in och replay user sessions
- **Geolocation Maps** - Interactive world map med visitor data
- **Data Warehouse** - Sync data till BigQuery, Snowflake, etc.
- **User LTV & Cohorts** - Lifetime value och cohort analysis
- **Web Vitals & White Label** - Performance metrics och custom branding

---

## Scope och Begränsningar

### Vad som faktiskt är implementerat
✅ **Agentic Browser Analytics** - Fully implemented
✅ **Cookie-Free Analytics** - Fully implemented
✅ **Click Heatmaps** - Fully implemented (NOT scroll/attention)
✅ **A/B Testing** - Basic A/B testing (NOT multivariate)
✅ **Form Analytics** - Fully implemented
✅ **GDPR & CMP** - Fully implemented
✅ **Tag Manager** - Fully implemented (Advanced dropdown)
✅ **Session Recording** - Fully implemented (Advanced dropdown)
✅ **Geolocation Maps** - Fully implemented (Advanced dropdown)
✅ **Data Warehouse Connectors** - Fully implemented (Advanced dropdown)
✅ **User LTV & Cohorts** - Fully implemented (Advanced dropdown)
✅ **Web Vitals** - Fully implemented (Advanced dropdown)
✅ **White Label** - Fully implemented (Advanced dropdown)
✅ **SAML SSO** - UI implemented (Advanced dropdown)
✅ **External Integrations** - GA4, Search Console, etc.

### Vad som INTE är implementerat
❌ **Scroll heatmaps** - Endast click heatmaps
❌ **Attention maps** - Inte implementerat
❌ **Multivariate testing** - Endast 2-variant A/B testing
❌ **Visual Editor** - Inte implementerat
❌ **WordPress Plugin** - Planerad men inte production-ready
❌ **Mobile App** - Inte planerad

### Begränsningar
⚠️ **Plattform**
- WordPress plugin är planerad men inte production-ready
- Tracking script kan användas på alla CMS:er

⚠️ **Språk**
- Mixed svenska/engelska i UI
- Teknisk dokumentation på svenska och engelska

⚠️ **Skalning**
- Supabase backend har rate limits
- Per company: 10,000 tracking events/timme
- Per company: 1,000 analytics requests/timme

⚠️ **Data Retention**
- Standard: 730 dagar
- Konfigurerbar per site

---

## Konkurrensfördelar

1. **First-Mover Advantage**
   - Första plattformen med dedikerad AI-agent tracking
   - Redo för agentic web innan konkurrenter

2. **WordPress Plugin**
   - Unik 1-click installation
   - Djup integration med WordPress
   - Huvudsaklig konkurrensfördel

3. **Cookie-Free Analytics**
   - 100% GDPR-compliant
   - PTS-godkänd server-side tracking
   - Inga cookie banners

4. **Nudging Technology**
   - Smart cookie banners
   - Högre samtyckesfrekvens
   - Bättre konvertering

5. **Comprehensive Solution**
   - Allt-i-ett plattform
   - Heatmaps, A/B testing, form analytics
   - AI-agent analytics

---

## Teknisk Stack - Detaljerad

### Frontend Dependencies
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.26.2",
  "@tanstack/react-query": "^5.56.2",
  "@supabase/supabase-js": "^2.50.3",
  "recharts": "^2.12.7",
  "lucide-react": "^0.462.0",
  "tailwindcss": "^3.4.11",
  "zod": "^3.23.8",
  "react-hook-form": "^7.53.0"
}
```

### Development Tools
- **Vite**: Build tool och dev server
- **TypeScript**: Typad JavaScript
- **ESLint**: Code linting
- **PostCSS**: CSS processing
- **Tailwind CSS**: Utility-first CSS

### Backend (Supabase)
- **PostgreSQL**: Relational database
- **Deno**: Edge Functions runtime
- **Supabase Auth**: Authentication
- **Row Level Security (RLS)**: Data security
- **Realtime**: Real-time subscriptions

---

## Deployment och Hosting

### Frontend Deployment
1. **Build**: `npm run build` skapar `dist/` mapp
2. **Deploy**: Ladda upp `dist/` till cortiq.se via FTP/SFTP
3. **Web Server**: Konfigurerad för SPA (Single Page Application)

### Backend (Supabase)
- **Status**: Redan i produktion
- **Edge Functions**: Deployas via Supabase CLI
- **Migrations**: Körs via Supabase Dashboard eller CLI
- **Monitoring**: Via Supabase Dashboard

### Tracking Script
- **Location**: `public/spa-tracking.js`
- **Deploy**: Tillgängligt på `https://cortiq.se/spa-tracking.js`
- **Usage**: Externa sajter kan ladda scriptet för tracking

---

## Utvecklingsprocess

### Lokal Utveckling
```bash
# Installera dependencies
npm install

# Starta dev server
npm run dev

# Frontend körs på http://localhost:8080
# Ansluter automatiskt till Supabase backend i molnet
```

### Supabase CLI
```bash
# Länka till projekt
npm run supabase:link

# Deploya Edge Functions
npm run supabase:deploy

# Pusha migrations
npm run supabase:db:push
```

### Build för Produktion
```bash
# Bygg frontend
npm run build

# dist/ mappen innehåller optimerade filer
# Ladda upp till cortiq.se
```

---

## Dokumentation

### Huvuddokumentation
- **README.md**: Översikt och snabbstart
- **DEPLOYMENT.md**: Deployment-instruktioner
- **INTEGRATION-GUIDE.md**: Guide för externa integrationer
- **SENTRISK-INTEGRATION.md**: Sentrisk-integration
- **claude.md**: Denna fil - projektöversikt

### WordPress Plugin
- **wordpress-plugin/readme.txt**: Plugin-dokumentation
- Installation och konfiguration

---

## Framtida Utveckling

### Planerade Features
- Ytterligare AI-agent support (nya agenter)
- Fler integrations (fler plattformar)
- Avancerad machine learning för behavioral analysis
- Enhanced A/B testing features
- Mobile app för analytics

### Tekniska Förbättringar
- Performance optimization
- Ytterligare caching strategies
- Enhanced real-time capabilities
- Mer avancerad data visualization

---

## Support och Kontakt

- **Produktions-URL**: https://cortiq.se
- **Supabase Dashboard**: https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa
- **Projektnamn tidigare**: Web Focus Analyzer, Heatmap Analyzer
- **Nuvarande namn**: CortIQ

---

## Viktiga Noteringar

1. **Backend körs redan i produktion** - Supabase-projektet "Expandtalk analytics" är aktivt
2. **Frontend deployas separat** - Till cortiq.se
3. **WordPress plugin är konkurrensfördel** - Unik integration
4. **First-mover advantage** - Första med AI-agent tracking
5. **GDPR-compliant** - Cookie-free tracking, PTS-godkänd

---

*Dokumentation uppdaterad: 2025-12-16*

