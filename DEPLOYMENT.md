# CortIQ - Deployment Guide

**Viktigt**: Detta projekt använder Supabase som backend. Alla Edge Functions och databasen körs redan i molnet på Supabase.

## Arkitektur

- **Frontend**: React/Vite app (körs lokalt för utveckling, deployas till cortiq.se för produktion)
- **Backend**: Supabase (Edge Functions + Database) - **Redan i produktion**
  - Project: **Expandtalk analytics**
  - Project ID: `cxmkdtgfocgbfizawlwa`
  - URL: `https://cxmkdtgfocgbfizawlwa.supabase.co`
  - Dashboard: https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa

## Lokal utveckling

### Förutsättningar
- Node.js 18+ installerat
- npm eller bun installerat
- Git installerat
- Supabase CLI (för Edge Functions deployment)

### Installation

1. **Klona projektet** (om du inte redan har det lokalt):
```bash
git clone <your-repo-url>
cd cortiq
```

2. **Installera dependencies**:
```bash
npm install
# eller
bun install
```

3. **Konfigurera miljövariabler** (om nödvändigt):
Skapa en `.env` fil i root-mappen om du behöver överrida Supabase-inställningar:
```env
VITE_SUPABASE_URL=https://cxmkdtgfocgbfizawlwa.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. **Starta utvecklingsservern**:
```bash
npm run dev
# eller
bun run dev
```

Projektet körs nu på `http://localhost:8080`

### Bygga för produktion

```bash
npm run build
# eller
bun run build
```

Detta skapar en `dist/` mapp med optimerade filer för produktion.

**VIKTIGT**: `.htaccess` filen kopieras automatiskt till `dist/` vid build. Denna fil är nödvändig för att Apache ska hantera SPA routing korrekt.

---

## Deployment till Supabase (Backend)

**OBS**: Supabase-backend körs redan i produktion. Du behöver bara deploya om du gör ändringar i Edge Functions eller databasen.

### Edge Functions

Supabase Edge Functions finns i `supabase/functions/` och deployas när du gör ändringar:

```bash
# Installera Supabase CLI (om du inte redan har det)
npm install -g supabase

# Logga in på Supabase
supabase login

# Länka till ditt projekt (om första gången)
npm run supabase:link
# eller
supabase link --project-ref cxmkdtgfocgbfizawlwa

# Deploya alla Edge Functions
npm run supabase:deploy
# eller
supabase functions deploy

# Eller deploya en specifik function
supabase functions deploy track-event
```

### Migrations

Databasmigrations finns i `supabase/migrations/`. **62 tabeller** och **43 functions** är redan deployade.

```bash
# Applicera migrations lokalt (för test)
npm run supabase:db:reset

# Pusha migrations till produktion (endast om du har nya migrations)
npm run supabase:db:push
# eller
supabase db push
```

**Viktigt**: 
- Migrations körs vanligtvis automatiskt via Supabase Dashboard
- Du kan också köra dem via CLI om du har nya migrations
- Se databasstrukturen i [Supabase Dashboard](https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa)

---

## Deployment till cortiq.se (Frontend)

### Metod 1: FTP/SFTP (Rekommenderat för enkelhet)

1. **Bygg projektet**:
```bash
npm run build
```

2. **Ladda upp filer**:
   - Anslut till din server via FTP/SFTP (t.ex. med FileZilla, WinSCP, eller VS Code FTP-extension)
   - Ladda upp **alla filer** från `dist/` mappen till din webbservers root-mapp (t.ex. `/public_html/` eller `/var/www/cortiq.se/`)
   - **VIKTIGT**: Se till att `.htaccess` filen också laddas upp (den kan vara dold)

3. **Verifiera .htaccess**:
   - Kontrollera att `.htaccess` filen finns i root-mappen på servern
   - Om den inte finns, ladda upp den manuellt från `dist/.htaccess`
   - Apache behöver denna fil för SPA routing

4. **Verifiera tracking-script**:
   Kontrollera att `spa-tracking.js` är tillgängligt på:
   `https://cortiq.se/spa-tracking.js`

### Metod 2: Git + Server Hook

1. **Sätt upp Git repository på servern**:
```bash
# På servern
cd /var/www/cortiq.se
git init
git remote add origin <your-repo-url>
```

2. **Skapa deployment script** (`deploy.sh`):
```bash
#!/bin/bash
git pull origin main
npm install
npm run build
# Kopiera dist/ till webbservers root
cp -r dist/* /var/www/cortiq.se/public_html/
# Se till att .htaccess kopieras
cp dist/.htaccess /var/www/cortiq.se/public_html/.htaccess
```

3. **Kör deployment**:
```bash
chmod +x deploy.sh
./deploy.sh
```

### Metod 3: CI/CD med GitHub Actions

Skapa `.github/workflows/deploy.yml`:

```yaml
name: Deploy to cortiq.se

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy via FTP
        uses: SamKirkland/FTP-Deploy-Action@4.3.0
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./dist/
          exclude: |
            **/.git*
            **/.git*/**
            **/node_modules/**
```

---

## Supabase Auth Configuration

**VIKTIGT**: För att lösa 404-problem med `/auth` routes, kontrollera följande i Supabase Dashboard:

1. **Site URL**: Sätt till `https://cortiq.se/`
2. **Redirect URLs**: Lägg till:
   - `https://cortiq.se/**` (wildcard för alla routes)
   - `https://cortiq.se/auth`
   - `https://cortiq.se/auth?type=recovery`
   - `https://cortiq.se/dashboard`

Gå till: https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa/auth/url-configuration

---

## Post-deployment checklist

### Frontend (cortiq.se)
- [ ] Verifiera att `https://cortiq.se` laddar korrekt
- [ ] Kontrollera att `https://cortiq.se/spa-tracking.js` är tillgängligt
- [ ] **VIKTIGT**: Verifiera att `.htaccess` finns i root-mappen
- [ ] Testa att `/auth` route fungerar (ska inte ge 404)
- [ ] Testa password recovery flow (ska fungera utan 404)
- [ ] Testa att tracking fungerar (öppna browser console)
- [ ] Verifiera att alla routes fungerar (t.ex. `/dashboard`, `/cmp`)
- [ ] Kontrollera att Supabase-anslutningen fungerar
- [ ] Testa autentisering och inloggning
- [ ] Verifiera att bilder och assets laddas korrekt

### Backend (Supabase) - Redan i produktion
- [x] Supabase-projektet körs redan: [Expandtalk analytics](https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa)
- [x] 62 tabeller är deployade
- [x] 43 database functions är deployade
- [x] 51 Edge Functions är deployade
- [ ] **VIKTIGT**: Verifiera Site URL och Redirect URLs i Auth settings
- [ ] Testa Edge Functions via Supabase Dashboard (om du gör ändringar)
- [ ] Verifiera RLS (Row Level Security) policies (om du ändrar dem)
- [ ] Testa API-endpoints från frontend

---

## Troubleshooting

### Problem: 404 på alla routes utom `/`
**Lösning**: 
- Kontrollera att `.htaccess` filen finns i root-mappen på servern
- Verifiera att Apache har `mod_rewrite` aktiverat
- Kontrollera att `.htaccess` filen har rätt innehåll (se `public/.htaccess`)

### Problem: 404 på `/auth` när Supabase redirectar
**Lösning**:
- Kontrollera att `.htaccess` filen finns och är korrekt
- Verifiera Site URL och Redirect URLs i Supabase Auth settings
- Se till att Redirect URLs inkluderar `https://cortiq.se/**`

### Problem: Tracking-script laddas inte
**Lösning**: 
- Kontrollera att `spa-tracking.js` finns i `dist/` efter build
- Verifiera att filen är tillgänglig via webbservern
- Kontrollera CORS-inställningar om scriptet laddas från annan domän

### Problem: Supabase-anslutning fungerar inte
**Lösning**:
- Kontrollera att miljövariabler är korrekt konfigurerade
- Verifiera att Supabase URL och keys är korrekta i `src/integrations/supabase/client.ts`
- Kontrollera nätverksanslutning och brandvägg
- Verifiera att Supabase-projektet är aktivt: https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa

### Problem: Edge Functions fungerar inte
**Lösning**:
- Kontrollera att functions är deployade: `supabase functions list`
- Kolla logs i Supabase Dashboard: Project → Edge Functions → [function name] → Logs
- Verifiera att `verify_jwt` är korrekt konfigurerad i `supabase/config.toml`

### Problem: Password recovery ger 404
**Lösning**:
- Kontrollera att `.htaccess` filen finns på servern
- Verifiera Redirect URLs i Supabase Auth settings inkluderar `https://cortiq.se/auth?type=recovery`
- Kontrollera att Auth-sidan hanterar recovery tokens korrekt (se `src/pages/Auth.tsx`)

---

## Miljövariabler för produktion

Om du behöver olika inställningar för produktion, skapa en `.env.production`:

```env
VITE_SUPABASE_URL=https://cxmkdtgfocgbfizawlwa.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-key
```

Vite använder automatiskt `.env.production` när du kör `npm run build`.

---

## Supabase Dashboard

- **Project Dashboard**: https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa
- **Database Editor**: https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa/editor
- **Edge Functions**: https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa/functions
- **API Settings**: https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa/settings/api
- **Auth URL Configuration**: https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa/auth/url-configuration

---

## Support

För frågor eller problem, kontakta:
- Projekt: CortIQ
- Repository: [din-repo-url]
- Dokumentation: https://cortiq.se
- Supabase Project: https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa
