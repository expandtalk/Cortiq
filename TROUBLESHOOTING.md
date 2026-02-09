# Troubleshooting Guide - CortIQ

## Internal Server Error (500)

Om du får "Internal Server Error" från Apache, kan det bero på flera saker:

### Problem 1: .htaccess syntax error

**Symptom**: Internal Server Error när du försöker komma åt sajten

**Lösning 1**: Använd minimal `.htaccess`
Om den nuvarande `.htaccess` orsakar problem, använd den minimala versionen:

1. Ta bort nuvarande `.htaccess` från servern
2. Ladda upp `public/.htaccess.minimal` som `.htaccess`

**Lösning 2**: Kontrollera Apache error logs
Kontakta din hosting-provider och be dem kolla Apache error logs för att se exakt felmeddelande.

**Lösning 3**: Verifiera att mod_rewrite är aktiverat
Kontakta din hosting-provider och be dem verifiera att `mod_rewrite` är aktiverat.

### Problem 2: mod_rewrite inte aktiverat

**Symptom**: 404 på alla routes utom `/`

**Lösning**: 
- Kontakta din hosting-provider
- Be dem aktivera `mod_rewrite` för din domän
- Eller be dem konfigurera Apache direkt i `httpd.conf` istället för `.htaccess`

### Problem 3: Behörighetsproblem

**Symptom**: Internal Server Error eller 403 Forbidden

**Lösning**:
- Kontrollera att `.htaccess` har rätt behörigheter (644 eller 644)
- Kontrollera att filen inte är korrupt
- Försök ta bort och ladda upp igen

### Problem 4: Alternativ utan .htaccess

Om `.htaccess` inte fungerar, kan du be din hosting-provider att konfigurera Apache direkt:

**För Apache VirtualHost**:
```apache
<VirtualHost *:80>
    ServerName cortiq.se
    DocumentRoot /path/to/cortiq/dist
    
    <Directory /path/to/cortiq/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteBase /
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^ index.html [L]
    </Directory>
</VirtualHost>
```

## 404 på /auth route

**Symptom**: 404 när Supabase redirectar till `/auth?type=recovery`

**Lösning**:
1. Kontrollera att `.htaccess` finns på servern
2. Verifiera Supabase Auth URL Configuration:
   - Site URL: `https://cortiq.se/`
   - Redirect URLs: Lägg till `https://cortiq.se/**`

## Password recovery ger 404

**Symptom**: Password recovery länkar ger 404

**Lösning**:
1. Kontrollera att `.htaccess` fungerar (testa `/auth` route)
2. Verifiera Redirect URLs i Supabase:
   - `https://cortiq.se/auth?type=recovery`
   - `https://cortiq.se/**`

## Tracking script laddas inte

**Symptom**: `spa-tracking.js` ger 404 eller CORS error

**Lösning**:
1. Kontrollera att `spa-tracking.js` finns i `dist/` efter build
2. Verifiera att filen laddats upp till servern
3. Testa direkt: `https://cortiq.se/spa-tracking.js`

## Supabase connection error

**Symptom**: "Failed to fetch" eller connection errors

**Lösning**:
1. Kontrollera att Supabase URL är korrekt i `src/integrations/supabase/client.ts`
2. Verifiera att Supabase-projektet är aktivt
3. Kontrollera nätverksanslutning och brandvägg

## Build errors

**Symptom**: `npm run build` ger fel

**Lösning**:
1. Ta bort `node_modules` och `package-lock.json`
2. Kör `npm install` igen
3. Kör `npm run build` igen

## Deployment checklist

För att undvika problem vid deployment:

- [ ] Bygg projektet: `npm run build`
- [ ] Kontrollera att `dist/` mappen innehåller alla filer
- [ ] Verifiera att `.htaccess` finns i `dist/`
- [ ] Ladda upp ALLA filer från `dist/` till servern
- [ ] Kontrollera att `.htaccess` laddats upp (kan vara dold)
- [ ] Testa att `https://cortiq.se` laddar
- [ ] Testa att `https://cortiq.se/auth` fungerar (ska inte ge 404)
- [ ] Verifiera Supabase Auth URL Configuration

## Kontakt support

Om problemet kvarstår:
1. Kontrollera Apache error logs (via hosting-provider)
2. Kontakta hosting-provider för support
3. Testa med minimal `.htaccess` version

