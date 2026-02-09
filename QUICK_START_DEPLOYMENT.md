# 🚀 CortIQ Quick Start Deployment Guide

**Goal**: Get CortIQ live on cortiq.se in **30 minutes**

**Current Status**: ✅ Code pushed to GitHub, ✅ Workflow created, → Ready for deployment!

---

## ⚡ OPTION 1: AUTOMATIC DEPLOYMENT (RECOMMENDED)

**Time**: 15 minutes setup, then automatic forever

This uses GitHub Actions to automatically deploy when you push to `main` branch.

### Step 1: Get FTP Credentials (5 min)

Contact your cortiq.se hosting provider and get:

- ✅ **FTP Server**: `ftp.cortiq.se` (or similar)
- ✅ **FTP Username**: Your FTP username
- ✅ **FTP Password**: Your FTP password
- ✅ **Target Directory**: `/public_html/` or `/var/www/cortiq.se/`

**Don't have FTP?** Check your hosting panel:
- cPanel: Home → FTP Accounts
- Plesk: Websites & Domains → FTP Access
- DirectAdmin: Account Manager → FTP Management

### Step 2: Get Supabase Keys (2 min)

1. Visit: https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa/settings/api
2. Copy these values:

   - ✅ **Project URL**: `https://cxmkdtgfocgbfizawlwa.supabase.co`
   - ✅ **anon public key**: `eyJhbGci...` (long string)

### Step 3: Add Secrets to GitHub (5 min)

1. Go to: https://github.com/expandtalk/cortiq/settings/secrets/actions
2. Click: "New repository secret" (green button)
3. Add these secrets one by one:

| Secret Name | Secret Value |
|------------|--------------|
| `VITE_SUPABASE_URL` | `https://cxmkdtgfocgbfizawlwa.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` (from Step 2) |
| `VITE_SUPABASE_PROJECT_ID` | `cxmkdtgfocgbfizawlwa` |
| `FTP_SERVER` | `ftp.cortiq.se` (from Step 1) |
| `FTP_USERNAME` | Your username (from Step 1) |
| `FTP_PASSWORD` | Your password (from Step 1) |
| `FTP_SERVER_DIR` | `/public_html/` (from Step 1) |

**For each secret**:
1. Click "New repository secret"
2. Name: Enter secret name (e.g., `FTP_SERVER`)
3. Value: Enter secret value
4. Click "Add secret"

### Step 4: Trigger Deployment (1 min)

**Option A - Push any change**:
```bash
# In your project directory
git pull  # Get latest changes
echo "Ready for production!" > READY.txt
git add READY.txt
git commit -m "chore: Trigger production deployment"
git push origin main
```

**Option B - Manual trigger**:
1. Go to: https://github.com/expandtalk/cortiq/actions
2. Click: "Deploy to Production" (left sidebar)
3. Click: "Run workflow" (blue button)
4. Click: "Run workflow" (confirm)

### Step 5: Monitor Deployment (3 min)

1. Watch: https://github.com/expandtalk/cortiq/actions
2. Wait for green checkmark ✅ (3-5 minutes)
3. Visit: https://cortiq.se

**Expected**:
- ✅ Site loads
- ✅ HTTPS active
- ✅ No console errors
- ✅ Can see homepage

**If deployment fails**:
- Click the failed workflow
- Check the error logs
- Common issues: Wrong FTP credentials, wrong directory path

### Step 6: Verify Deployment (5 min)

Run these quick tests:

```bash
# Test 1: Homepage loads
curl -I https://cortiq.se
# Expected: HTTP/2 200

# Test 2: Tracking script loads
curl -I https://cortiq.se/spa-tracking.js
# Expected: HTTP/2 200

# Test 3: Try logging in
# Visit https://cortiq.se and log in
```

**Full tests**: See `SMOKE_TESTS.md` for comprehensive testing

---

## 🔧 OPTION 2: MANUAL DEPLOYMENT (FALLBACK)

**Time**: 30 minutes

Use this if GitHub Actions isn't working or you prefer manual control.

### Step 1: Build Locally (5 min)

```bash
# Make sure you're in the project directory
cd C:\projects\cortiq

# Install dependencies (if not already done)
npm install

# Build production
npm run build
```

**Expected output**: `dist/` folder created (~2.7 MB)

### Step 2: Connect to FTP (5 min)

**Using FileZilla** (Download: https://filezilla-project.org/):

1. Open FileZilla
2. Enter:
   - Host: `ftp.cortiq.se`
   - Username: [Your FTP username]
   - Password: [Your FTP password]
   - Port: 21
3. Click "Quickconnect"

**Expected**: Connected to server, can see files

### Step 3: Upload Files (10 min)

1. In FileZilla:
   - **Left panel**: Navigate to `C:\projects\cortiq\dist\`
   - **Right panel**: Navigate to `/public_html/` (or your web root)

2. Select all files in `dist/` folder
3. Right-click → Upload
4. Wait for upload to complete (~2-5 minutes)

**Expected**: All files uploaded successfully

### Step 4: Configure Web Server (5 min)

Create `.htaccess` file in web root (if using Apache):

**Via FileZilla**:
1. Right-click in right panel → Create file
2. Name: `.htaccess`
3. Right-click → Edit
4. Paste this content:

```apache
# HTTPS redirect
RewriteEngine On
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
Header always set Strict-Transport-Security "max-age=31536000"

# Compression
AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
```

5. Save and close

### Step 5: Test (5 min)

Visit https://cortiq.se and verify:
- ✅ Site loads
- ✅ HTTPS active
- ✅ Can navigate pages
- ✅ No console errors

---

## ✅ POST-DEPLOYMENT CHECKLIST

After deployment (either method), complete these:

### Immediate (Do Now)

- [ ] **Site accessible**: https://cortiq.se loads
- [ ] **HTTPS working**: Green lock in browser
- [ ] **No console errors**: Open DevTools (F12), check console
- [ ] **Can log in**: Test authentication
- [ ] **Tracking works**: Test event tracking

### Within 1 Hour

- [ ] **Run smoke tests**: See `SMOKE_TESTS.md` (at least critical tests)
- [ ] **Set up monitoring**: UptimeRobot (see `MONITORING_SETUP.md`)
- [ ] **Check Supabase**: Verify Edge Functions responding
- [ ] **Monitor errors**: Check for any errors in logs

### Within 24 Hours

- [ ] **Complete smoke tests**: All 28 tests in `SMOKE_TESTS.md`
- [ ] **Setup Sentry**: Error tracking (see `MONITORING_SETUP.md`)
- [ ] **Configure alerts**: Email/Slack notifications
- [ ] **Backup verification**: Ensure Supabase backups active
- [ ] **Performance check**: Run PageSpeed Insights

### Week 1

- [ ] **Monitor daily**: Check error rates and performance
- [ ] **User testing**: Invite beta users
- [ ] **Fix critical bugs**: Address any high-priority issues
- [ ] **Marketing prep**: Prepare Product Hunt launch

---

## 🚨 TROUBLESHOOTING

### Issue: Site shows 404

**Cause**: Files not in correct directory or .htaccess missing

**Fix**:
1. Verify files are in web root (not subfolder)
2. Check `.htaccess` file exists
3. Check Apache `AllowOverride All` is set

### Issue: Site shows old version

**Cause**: Browser cache or CDN cache

**Fix**:
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Try incognito/private window
4. Clear CDN cache if using CDN

### Issue: JavaScript errors in console

**Cause**: Environment variables not set correctly

**Fix**:
1. Check `.env.production` file has correct Supabase URL/keys
2. Rebuild: `npm run build`
3. Re-upload files

### Issue: Can't log in

**Cause**: Supabase URL/keys incorrect or CORS issues

**Fix**:
1. Check Network tab in DevTools
2. Verify Supabase URL in requests
3. Check CORS is allowed for cortiq.se in Supabase Dashboard

### Issue: Tracking not working

**Cause**: Tracking script not loading or CORS issues

**Fix**:
1. Check `https://cortiq.se/spa-tracking.js` loads
2. Verify Content-Type is `application/javascript`
3. Check console for errors

### Issue: GitHub Actions deployment fails

**Cause**: Usually FTP credentials or path issues

**Fix**:
1. Check workflow logs in GitHub Actions
2. Verify all secrets are set correctly
3. Test FTP connection manually with FileZilla
4. Check `FTP_SERVER_DIR` ends with `/`

---

## 📞 NEED HELP?

### Quick Checks

```bash
# Check if site is up
curl -I https://cortiq.se

# Check tracking script
curl -I https://cortiq.se/spa-tracking.js

# Check Supabase API
curl -I https://cxmkdtgfocgbfizawlwa.supabase.co/rest/v1/

# Check specific Edge Function
curl -X POST https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/track-event \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"event":"test"}'
```

### Resources

- **Deployment Checklist**: `DEPLOYMENT_CHECKLIST.md`
- **Smoke Tests**: `SMOKE_TESTS.md`
- **Monitoring Setup**: `MONITORING_SETUP.md`
- **GitHub Actions Guide**: `.github/workflows/README.md`
- **Edge Functions Guide**: `EDGE_FUNCTIONS_VERIFICATION.md`

### Common Commands

```bash
# Rebuild locally
npm run build

# Check build size
du -sh dist/

# List files in build
ls -lh dist/

# Test TypeScript
npm run type-check

# Test linting
npm run lint

# View git status
git status

# Push to GitHub (triggers auto-deploy)
git push origin main

# View GitHub Actions
# Visit: https://github.com/expandtalk/cortiq/actions
```

---

## 🎉 SUCCESS CRITERIA

Your deployment is successful when:

✅ **Site Accessibility**
- https://cortiq.se loads without errors
- HTTPS green lock visible
- All pages accessible

✅ **Functionality**
- Can sign up new account
- Can log in
- Dashboard loads
- Tracking works
- Charts render

✅ **Performance**
- Page load < 3 seconds
- No console errors
- API calls < 500ms

✅ **Monitoring**
- UptimeRobot monitoring active
- Error tracking configured
- Alerts set up

**When all criteria met**: 🎉 You're live! Time to launch!

---

## 🚀 NEXT: LAUNCH!

After successful deployment:

1. **Day 1**: Monitor closely, fix any critical issues
2. **Day 2-3**: Run full smoke tests, invite beta users
3. **Day 4-5**: Marketing prep (see `LAUNCH_MATERIALS.md`)
4. **Week 2**: Launch on Product Hunt
5. **Week 3**: Social media campaign
6. **Week 4**: Press release distribution

See `LAUNCH_MATERIALS.md` for complete launch plan!

---

**🎯 YOUR CURRENT STATUS**:

- ✅ Code ready
- ✅ Build successful
- ✅ Pushed to GitHub
- ✅ GitHub Actions workflow created
- → **NEXT**: Add FTP secrets to GitHub (Step 1-3 above)
- → **THEN**: Trigger deployment (Step 4)
- → **FINALLY**: Verify and celebrate! 🎉

**Estimated time to live**: 15-30 minutes from now!

---

**Ready? Let's go! Start with Step 1 above** ☝️
