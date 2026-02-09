# CortIQ Production Deployment Checklist

**Target URL**: https://cortiq.se
**Deployment Date**: TBD
**Version**: v1.0.0

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. Code & Build Verification

- [x] **Production build successful** - `npm run build` completes without errors
- [x] **Build size acceptable** - dist/ folder: 2.7 MB total
- [x] **No TypeScript errors** - All type checks pass
- [x] **ESLint passes** - No critical linting errors
- [ ] **Security audit complete** - `npm audit` shows no high/critical vulnerabilities
- [ ] **Dependencies up to date** - Review and update critical packages

### 2. Environment Configuration

- [ ] **Production .env configured** - All environment variables set correctly
- [ ] **Supabase URL verified** - `https://cxmkdtgfocgbfizawlwa.supabase.co`
- [ ] **Supabase keys secured** - Anon key and service role key ready
- [ ] **API rate limits configured** - 10,000 events/hour per company
- [ ] **CORS origins set** - Allow cortiq.se and www.cortiq.se
- [ ] **No hardcoded secrets** - Verify no secrets in code

### 3. Database & Backend

- [ ] **Database migrations complete** - All 74 migrations applied
- [ ] **RLS policies active** - All 50+ policies enabled
- [ ] **Edge Functions deployed** - All 51 functions live
- [ ] **Database indexes created** - 100+ indexes verified
- [ ] **Backup strategy confirmed** - Daily automated backups enabled
- [ ] **Connection pooling configured** - Optimized for production load

### 4. Frontend Assets

- [ ] **index.html generated** - Contains correct meta tags and base URL
- [ ] **Assets optimized** - Images compressed, CSS/JS minified
- [ ] **Tracking scripts ready** - spa-tracking.js, ai-bot-probe.js available
- [ ] **Favicon present** - favicon.ico and favicon.png
- [ ] **robots.txt configured** - SEO directives set
- [ ] **manifest.json ready** - PWA manifest configured

### 5. DNS & Hosting

- [ ] **DNS configured** - A/CNAME records point to hosting server
- [ ] **SSL certificate active** - HTTPS enabled for cortiq.se
- [ ] **WWW redirect configured** - www.cortiq.se → cortiq.se
- [ ] **Hosting provider ready** - FTP/SFTP credentials verified
- [ ] **Server requirements met** - Node.js, web server configured
- [ ] **CDN configured** (optional) - For faster asset delivery

### 6. Security

- [ ] **HTTPS enforced** - Redirect all HTTP to HTTPS
- [ ] **Security headers configured** - CSP, X-Frame-Options, HSTS
- [ ] **Rate limiting enabled** - API and tracking endpoints protected
- [ ] **SQL injection protected** - Parameterized queries only
- [ ] **XSS protection active** - React auto-escaping + CSP
- [ ] **CSRF tokens configured** - Supabase Auth handles this
- [ ] **IP anonymization enabled** - GDPR-compliant tracking

### 7. Testing & QA

- [ ] **Smoke tests prepared** - Critical user flows documented
- [ ] **Authentication tested** - Login, signup, password reset work
- [ ] **Tracking verified** - Event tracking sends data correctly
- [ ] **Dashboard loads** - All components render without errors
- [ ] **API endpoints respond** - Test key endpoints
- [ ] **Error handling works** - Graceful degradation on failures

### 8. Monitoring & Alerts

- [ ] **Supabase monitoring active** - Dashboard alerts configured
- [ ] **Error tracking setup** (optional) - Sentry or similar
- [ ] **Performance monitoring** - Response time tracking
- [ ] **Uptime monitoring** - External service pings cortiq.se
- [ ] **Email alerts configured** - Critical errors notify team
- [ ] **Log aggregation ready** - Centralized logging (optional)

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Final Build

```bash
# Clean previous build
rm -rf dist/

# Install dependencies
npm install

# Run production build
npm run build

# Verify build
ls -lh dist/
du -sh dist/
```

**Expected Output**: dist/ folder with ~2.7 MB, no build errors

### Step 2: Environment Variables

Create production `.env` file:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://cxmkdtgfocgbfizawlwa.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Production Settings
VITE_APP_ENV=production
VITE_API_URL=https://cortiq.se/api
VITE_APP_URL=https://cortiq.se

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_AI_TRACKING=true
VITE_ENABLE_HEATMAPS=true

# Rate Limiting
VITE_RATE_LIMIT_EVENTS=10000
VITE_RATE_LIMIT_WINDOW=3600000
```

### Step 3: Database Migration Verification

```bash
# Connect to Supabase
npm run supabase:link

# Check migration status
npm run supabase:db:status

# Apply any pending migrations
npm run supabase:db:push
```

### Step 4: Edge Functions Deployment

```bash
# Deploy all Edge Functions
npm run supabase:deploy

# Verify critical functions
# - track-event
# - cookiefree-analytics
# - ai-bot-tracker
# - heatmap-data
# - form-analytics
```

### Step 5: Upload to Production Server

#### Option A: FTP/SFTP Deployment

```bash
# Using SFTP
sftp user@cortiq.se
put -r dist/* /var/www/cortiq.se/

# Or using lftp for faster transfer
lftp -e "mirror -R dist/ /var/www/cortiq.se/ ; quit" sftp://user@cortiq.se
```

#### Option B: rsync Deployment

```bash
rsync -avz --delete dist/ user@cortiq.se:/var/www/cortiq.se/
```

#### Option C: CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - name: Deploy to server
        uses: SamKirkland/FTP-Deploy-Action@4.3.0
        with:
          server: cortiq.se
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./dist/
```

### Step 6: Web Server Configuration

#### Apache (.htaccess)

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # HTTPS redirect
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # SPA routing
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]

  # Security headers
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-XSS-Protection "1; mode=block"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"

  # HSTS
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

  # CSP
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cxmkdtgfocgbfizawlwa.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://cxmkdtgfocgbfizawlwa.supabase.co wss://cxmkdtgfocgbfizawlwa.supabase.co"
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name cortiq.se www.cortiq.se;
    return 301 https://cortiq.se$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.cortiq.se;
    ssl_certificate /etc/ssl/certs/cortiq.se.crt;
    ssl_certificate_key /etc/ssl/private/cortiq.se.key;
    return 301 https://cortiq.se$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cortiq.se;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/cortiq.se.crt;
    ssl_certificate_key /etc/ssl/private/cortiq.se.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/cortiq.se;
    index index.html;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # No cache for HTML
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
```

### Step 7: DNS Configuration

```
# A Record
cortiq.se.  IN  A  YOUR_SERVER_IP

# CNAME for www
www.cortiq.se.  IN  CNAME  cortiq.se.

# Optional: CAA record for SSL
cortiq.se.  IN  CAA  0 issue "letsencrypt.org"
```

---

## ✅ POST-DEPLOYMENT VERIFICATION

### 1. Site Accessibility

- [ ] **https://cortiq.se loads** - Homepage displays correctly
- [ ] **HTTPS active** - SSL certificate valid
- [ ] **WWW redirect works** - www.cortiq.se redirects to cortiq.se
- [ ] **Favicon displays** - Icon shows in browser tab
- [ ] **No console errors** - Browser console is clean

### 2. Authentication Flow

- [ ] **Signup works** - New user can create account
- [ ] **Login works** - Existing user can log in
- [ ] **Password reset works** - Email sent, link functions
- [ ] **Logout works** - User can sign out successfully
- [ ] **Session persistence** - User stays logged in on refresh

### 3. Core Analytics

- [ ] **Tracking script loads** - spa-tracking.js accessible
- [ ] **Events tracked** - Page views send to Supabase
- [ ] **Dashboard displays data** - Real-time data visible
- [ ] **Heatmaps render** - Click/scroll heatmaps work
- [ ] **Form analytics work** - Form submissions tracked

### 4. AI Agent Tracking

- [ ] **AI bot detection works** - ChatGPT Browser detected
- [ ] **Agent sessions logged** - AI traffic tracked separately
- [ ] **Agent dashboard shows data** - AI analytics visible
- [ ] **Agent journey tracking** - Multi-step paths recorded

### 5. Integrations

- [ ] **GA4 integration works** - Can connect Google Analytics 4
- [ ] **Search Console works** - GSC data imports successfully
- [ ] **WordPress plugin available** - Download link functional
- [ ] **API endpoints respond** - All REST APIs functional

### 6. Performance

- [ ] **Page load time < 3s** - Initial load is fast
- [ ] **API response time < 500ms** - Queries are quick
- [ ] **Charts render quickly** - Visualizations load fast
- [ ] **No memory leaks** - Browser memory stable over time

### 7. Security

- [ ] **HTTPS enforced** - No mixed content warnings
- [ ] **Security headers present** - CSP, HSTS, etc. active
- [ ] **Rate limiting works** - Excessive requests blocked
- [ ] **Authentication required** - Protected routes secured
- [ ] **RLS policies enforced** - Users see only their data

### 8. Mobile Responsiveness

- [ ] **Mobile layout works** - Responsive design functions
- [ ] **Touch interactions work** - Buttons/links clickable
- [ ] **Charts readable on mobile** - Visualizations scale properly

---

## 🚨 ROLLBACK PROCEDURE

If deployment fails or critical issues arise:

### Quick Rollback

1. **Restore previous dist/ backup**
   ```bash
   cp -r dist.backup/* dist/
   rsync -avz dist/ user@cortiq.se:/var/www/cortiq.se/
   ```

2. **Revert database migrations** (if needed)
   ```bash
   npm run supabase:db:reset
   # Apply migrations up to last known good state
   ```

3. **Redeploy previous Edge Functions**
   ```bash
   git checkout <previous-commit>
   npm run supabase:deploy
   ```

4. **Clear CDN cache** (if using CDN)
   - Purge cache for cortiq.se

5. **Notify users** (if downtime occurred)
   - Post status update
   - Email active users if needed

---

## 📊 SMOKE TEST SUITE

### Critical User Flows to Test

#### 1. New User Signup Flow
```
1. Visit https://cortiq.se
2. Click "Sign Up" or "Get Started"
3. Enter email and password
4. Verify email (check inbox)
5. Complete onboarding
6. Dashboard loads successfully
Expected: User can access dashboard
```

#### 2. Add Site and Start Tracking
```
1. Log in to dashboard
2. Click "Add Site"
3. Enter site URL
4. Copy tracking script
5. View installation instructions
6. Generate test event
7. Verify event appears in dashboard
Expected: Tracking data visible within 30 seconds
```

#### 3. View Analytics Dashboard
```
1. Navigate to Analytics tab
2. Select date range (Last 7 days)
3. View key metrics (sessions, page views, bounce rate)
4. Check charts render (line charts, bar charts)
5. Filter by device type
Expected: All data displays correctly
```

#### 4. AI Agent Tracking
```
1. Navigate to AI Agents tab
2. View detected AI agents list
3. Check agent-specific metrics
4. View agent journey visualization
Expected: AI traffic data visible (if any AI visits)
```

#### 5. Heatmap Visualization
```
1. Navigate to Heatmaps tab
2. Select page to analyze
3. Switch between Click/Scroll/Attention heatmaps
4. View device-specific heatmaps
Expected: Heatmap overlays render correctly
```

---

## 📞 SUPPORT & MONITORING

### Monitoring Setup

1. **Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa
   - Monitor: Database performance, Edge Function errors, Storage usage

2. **Uptime Monitoring** (Recommended Services)
   - UptimeRobot: https://uptimerobot.com
   - Pingdom: https://pingdom.com
   - Setup: Ping cortiq.se every 5 minutes

3. **Error Tracking** (Optional)
   - Sentry: https://sentry.io
   - LogRocket: https://logrocket.com

### Alert Configuration

**Critical Alerts** (Immediate Notification):
- Site down (HTTP 500/502/503)
- Database connection failure
- Edge Function errors >10/minute
- API response time >5 seconds

**Warning Alerts** (Daily Summary):
- High error rate (>1% of requests)
- Slow queries (>1 second)
- Storage approaching limit
- Rate limit hits

### Support Contacts

- **Technical Issues**: Check Supabase Dashboard first
- **DNS/Hosting**: Contact hosting provider
- **SSL Certificate**: Let's Encrypt auto-renewal or provider

---

## 📈 POST-LAUNCH TASKS

### Week 1

- [ ] **Monitor error logs daily** - Check for unexpected issues
- [ ] **Review performance metrics** - Ensure response times acceptable
- [ ] **User feedback collection** - Gather initial user impressions
- [ ] **Fix critical bugs** - Address any high-priority issues
- [ ] **Marketing launch** - Announce on social media, Product Hunt

### Week 2-4

- [ ] **Analytics review** - Understand user behavior
- [ ] **Performance optimization** - Address any bottlenecks
- [ ] **Feature requests** - Prioritize user-requested features
- [ ] **Security audit** - Conduct penetration testing
- [ ] **Documentation updates** - Improve based on user questions

### Ongoing

- [ ] **Weekly backups verification** - Ensure backups restorable
- [ ] **Monthly security updates** - Update dependencies
- [ ] **Quarterly performance review** - Optimize based on metrics
- [ ] **User interviews** - Understand pain points and needs

---

## ✅ FINAL SIGN-OFF

**Deployment Completed By**: ___________________
**Date**: ___________________
**Time**: ___________________

**Verified By**: ___________________
**Date**: ___________________

**Status**:
- [ ] ✅ Deployment Successful - All checks passed
- [ ] ⚠️ Deployment with Issues - Minor issues documented
- [ ] ❌ Deployment Failed - Rollback initiated

**Notes**:
___________________________________________________________________
___________________________________________________________________
___________________________________________________________________

---

**END OF DEPLOYMENT CHECKLIST**
