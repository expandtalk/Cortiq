# CortIQ - Analytics för Agentic Web

CortIQ är en avancerad webbanalysplattform med AI-agent tracking, cookie-free tracking och GDPR-compliant CMP-lösning för Agentic Web.

**Produktions-URL**: https://cortiq.se

## Arkitektur

Detta projekt använder **Supabase** som backend (redan i produktion):
- **Frontend**: React/Vite app 
  - Körs lokalt för utveckling (`npm run dev`)
  - Deployas till cortiq.se för produktion
- **Backend**: Supabase (Edge Functions + Database) - **Redan i produktion**
  - Project: **Expandtalk analytics**
  - Project ID: `cxmkdtgfocgbfizawlwa`
  - URL: `https://cxmkdtgfocgbfizawlwa.supabase.co`
  - Dashboard: https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa
  - **62 tabeller** och **43 database functions** är redan deployade
  - **51 Edge Functions** är redan deployade

## Lokal utveckling

Detta projekt är konfigurerat för lokal utveckling med Supabase som backend.

**Se [DEPLOYMENT.md](./DEPLOYMENT.md) för detaljerade instruktioner om deployment.**

### Snabbstart

```sh
# Installera dependencies
npm install
# eller
bun install

# Starta utvecklingsservern
npm run dev
# eller
bun run dev
```

Projektet körs på `http://localhost:8080`

### Supabase CLI-kommandon

**OBS**: Supabase-backend körs redan i produktion. Du behöver bara dessa kommandon om du gör ändringar i backend.

```sh
# Länka till Supabase-projektet (första gången)
npm run supabase:link

# Deploya alla Edge Functions (endast om du ändrar functions)
npm run supabase:deploy

# Pusha databasmigrations (endast om du har nya migrations)
npm run supabase:db:push

# Reset lokala migrations (för test lokalt)
npm run supabase:db:reset
```

**Viktigt**: 
- Backend körs redan i produktion på Supabase
- Du behöver bara deploya frontend till cortiq.se
- Se [Supabase Dashboard](https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa) för att se databasstrukturen

### Bygga för produktion

```sh
npm run build
```

Detta skapar en `dist/` mapp med optimerade filer.

## Teknologier

Detta projekt är byggt med:

- **Vite** - Build tool och dev server
- **TypeScript** - Typad JavaScript
- **React** - UI-bibliotek
- **shadcn-ui** - UI-komponenter
- **Tailwind CSS** - Styling
- **Supabase** - Backend och databas
- **React Router** - Routing

## Deployment

Se [DEPLOYMENT.md](./DEPLOYMENT.md) för detaljerade instruktioner om hur du deployer till cortiq.se.

## Dokumentation

- [Integration Guide](./INTEGRATION-GUIDE.md) - Guide för att integrera tracking på externa sajter
- [TrafikBoost Integration](./TRAFIKBOOST-INTEGRATION.md) - Guide för TrafikBoost-integration
- [Deployment Guide](./DEPLOYMENT.md) - Instruktioner för lokal utveckling och deployment

## Projektnamn

Detta projekt hette tidigare:
- **Web Focus Analyzer** (WFA)
- **Heatmap Analyzer**

Nu heter det **CortIQ**.
