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

## Huvudfunktioner

### 1. Agentic Browser Analytics (World First!)
- **AI-agent tracking**: Spårar ChatGPT Browser, Perplexity Comet, Claude Browser och andra AI-agenter
- **Agent-specifika dashboards**: Se hur AI-agenter interagerar med din webbplats
- **Structured data analysis**: Förstå hur väl din sajt är förberedd för agentic web
- **Agent conversion attribution**: Mät konverteringar från AI-driven trafik
- **Agent journey funnel**: Visualisera AI-agenter resa genom din webbplats

### 2. Cookie-Free Server-Side Analytics
- **Inga cookie banners**: Eliminera cookie-disruptioner helt
- **100% GDPR-compliant**: Server-side tracking utan personuppgifter i webbläsaren
- **Bättre konvertering**: Inga irriterande banners som sänker konverteringsfrekvensen
- **Komplett data**: All analytics du behöver utan cookies
- **GA4 Server-Side**: Kör Google Analytics server-side om du vill behålla det

### 3. Visual Analytics (Heatmaps)
- **Click heatmaps**: Se exakt var användare klickar
- **Scroll heatmaps**: Förstå scroll-beteende
- **Attention maps**: Visualisera var användare fokuserar
- **Device-specific views**: Separata heatmaps för desktop, tablet, mobile
- **AI agent heatmaps**: Se hur AI-agenter interagerar visuellt

### 4. A/B Testing & Optimization
- **Multivariate testing**: Testa flera varianter samtidigt
- **Statistical significance**: Automatisk statistisk signifikansberäkning
- **Audience segmentation**: Segmentera testgrupper
- **ROI measurement**: Mät ROI för olika varianter
- **Agent-specific testing**: Testa optimeringar specifikt för AI-agenter

### 5. Form Analytics
- **Form funnel**: Visualisera användares resa genom formulär
- **Drop-off points**: Identifiera var användare hoppar av
- **Field analysis**: Analysera interaktioner per fält
- **Completion rate**: Mät formulärkompletteringsfrekvens
- **Conversion optimization**: Optimera formulär för bättre konvertering

### 6. GDPR & Cookie Management (CMP)
- **Nudging cookie banners**: Smart teknologi för högre samtyckesfrekvens
- **1st party cookies**: Exakt data med first-party cookies
- **GDPR-compliant**: Fullt GDPR-kompatibel lösning
- **Consent management**: Hantera användarsamtycke
- **Data retention**: Konfigurerbar datalagring
- **IP-anonymisering**: Automatisk IP-anonymisering

### 7. WordPress Integration
- **1-click installation**: Enkel installation via WordPress plugin
- **Djup integration**: Fullständig integration med WordPress
- **Automatisk tracking**: Automatisk spårning utan konfiguration
- **Plugin dashboard**: Dashboard direkt i WordPress
- **Konkurrensfördel**: Huvudsaklig konkurrensfördel

### 8. Advanced Analytics
- **Real-time analytics**: Live-insikter om besökare
- **KPI dashboards**: Anpassningsbara KPI-dashboards
- **Traffic analysis**: Analys av trafikkällor
- **Conversion tracking**: Spårning av konverteringar
- **User journey analysis**: Analysera användares resa
- **Navigation analytics**: Analysera navigationsbeteende

### 9. Integrations
- **Google Analytics 4**: Integration med GA4
- **Google Search Console**: Integration med Search Console
- **Google SiteKit**: Integration med SiteKit
- **Bing Webmaster**: Integration med Bing Webmaster
- **Server log import**: Importera server-loggar för analys
- **E-commerce tracking**: Spårning av e-handelstransaktioner

### 10. Behavioral Analytics
- **Behavioral alerts**: Varningar för ovanligt beteende
- **Security monitoring**: Säkerhetsövervakning
- **User lifetime value**: Beräkna användares livstidsvärde
- **Custom segments**: Skapa anpassade segment
- **Priority segments**: Prioritera viktiga segment

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

## Scope och Begränsningar

### Inom Scope
✅ **Agentic Browser Analytics**
- Tracking av AI-agenter (ChatGPT Browser, Perplexity, Claude)
- Agent-specifika dashboards och insights
- Agent journey analysis

✅ **Cookie-Free Analytics**
- Server-side tracking
- GDPR-compliant implementation
- IP-anonymisering

✅ **Visual Analytics**
- Heatmaps (click, scroll, attention)
- Device-specific views
- Real-time visualization

✅ **A/B Testing**
- Multivariate testing
- Statistical analysis
- Conversion optimization

✅ **Form Analytics**
- Form funnel analysis
- Field-level analytics
- Drop-off identification

✅ **GDPR & CMP**
- Cookie consent management
- Nudging technology
- Data retention policies

✅ **WordPress Integration**
- Plugin development
- Deep WordPress integration
- 1-click installation

✅ **Integrations**
- Google Analytics 4
- Google Search Console
- Bing Webmaster
- Server log import

### Begränsningar
⚠️ **Plattform**
- Primärt fokus på WordPress (plugin)
- Andra CMS:er kan integreras via tracking script

⚠️ **Språk**
- Primärt svenska för användargränssnitt
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

