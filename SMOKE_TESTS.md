# CortIQ Production Smoke Tests

**Purpose**: Verify critical functionality after deployment to production.

**When to Run**: After every deployment, before announcing launch, and periodically to ensure system health.

**Duration**: ~15-20 minutes for complete suite

---

## 🔥 CRITICAL SMOKE TESTS (Must Pass)

These tests verify core functionality. If any fail, deployment should be rolled back.

### Test 1: Homepage Loads

**Objective**: Verify the main website is accessible and renders correctly.

**Steps**:
1. Open browser (Chrome/Firefox/Safari)
2. Navigate to `https://cortiq.se`
3. Wait for page to fully load (max 5 seconds)

**Expected Results**:
- ✅ Page loads without errors
- ✅ HTTPS lock icon visible in address bar
- ✅ No console errors (F12 → Console tab)
- ✅ Favicon displays correctly
- ✅ Hero section visible with CortIQ branding
- ✅ "Get Started" or "Sign Up" button visible

**Pass/Fail**: _____

---

### Test 2: User Signup Flow

**Objective**: New users can create accounts.

**Steps**:
1. Click "Sign Up" or "Get Started" button
2. Enter test email: `test+{timestamp}@cortiq.se`
3. Enter password: `TestPass123!`
4. Confirm password: `TestPass123!`
5. Click "Create Account" or "Sign Up"
6. Check email inbox for verification email

**Expected Results**:
- ✅ Signup form displays without errors
- ✅ Email and password validation works
- ✅ Account creation succeeds
- ✅ Verification email received within 60 seconds
- ✅ Email contains verification link
- ✅ Clicking link verifies account

**Pass/Fail**: _____

**Notes**: _________________________________________

---

### Test 3: User Login

**Objective**: Existing users can log in.

**Steps**:
1. Navigate to `https://cortiq.se/auth`
2. Enter email: `test@cortiq.se`
3. Enter password: `TestPass123!`
4. Click "Sign In"

**Expected Results**:
- ✅ Login form displays correctly
- ✅ Login succeeds without errors
- ✅ Redirected to dashboard
- ✅ User profile/avatar visible
- ✅ Session persists on page refresh

**Pass/Fail**: _____

**Notes**: _________________________________________

---

### Test 4: Dashboard Loads

**Objective**: Main analytics dashboard renders correctly.

**Steps**:
1. Log in to account
2. Navigate to main dashboard
3. Wait for dashboard to load (max 3 seconds)

**Expected Results**:
- ✅ Dashboard loads without errors
- ✅ Navigation menu visible
- ✅ Key metrics displayed (sessions, page views, etc.)
- ✅ Charts render correctly
- ✅ No "undefined" or "null" values
- ✅ Date range selector functional

**Pass/Fail**: _____

**Notes**: _________________________________________

---

### Test 5: Tracking Script Loads

**Objective**: External sites can load the tracking script.

**Steps**:
1. Open browser console
2. Navigate to `https://cortiq.se/spa-tracking.js`
3. Verify JavaScript file loads
4. Check file size and content

**Alternative Test**:
```html
<!-- Add to test HTML page -->
<script src="https://cortiq.se/spa-tracking.js"></script>
<script>
  console.log('CortIQ Tracking:', window.CortIQ);
</script>
```

**Expected Results**:
- ✅ Script file accessible (HTTP 200)
- ✅ Content-Type: `application/javascript`
- ✅ File size ~5-10 KB
- ✅ No syntax errors
- ✅ `window.CortIQ` object defined

**Pass/Fail**: _____

**Notes**: _________________________________________

---

### Test 6: Event Tracking Works

**Objective**: Page view events are tracked and stored.

**Steps**:
1. Log in to dashboard
2. Click "Add Site" or navigate to site settings
3. Copy tracking script
4. Create test HTML page:
```html
<!DOCTYPE html>
<html>
<head>
  <title>CortIQ Test Page</title>
  <script src="https://cortiq.se/spa-tracking.js"></script>
</head>
<body>
  <h1>Test Page</h1>
  <button id="testBtn">Click Me</button>
  <script>
    // Initialize tracking
    CortIQ.init({ siteId: 'YOUR_SITE_ID' });

    // Track page view
    CortIQ.trackPageView();

    // Track custom event
    document.getElementById('testBtn').addEventListener('click', () => {
      CortIQ.trackEvent('button_click', { button: 'testBtn' });
    });
  </script>
</body>
</html>
```
5. Open test page in browser
6. Wait 30 seconds
7. Return to dashboard and refresh
8. Check if page view appears

**Expected Results**:
- ✅ Page view tracked successfully
- ✅ Event appears in dashboard within 30-60 seconds
- ✅ Event data includes URL, timestamp, device info
- ✅ Real-time counter updates
- ✅ Event details viewable

**Pass/Fail**: _____

**Notes**: _________________________________________

---

### Test 7: Supabase Connection

**Objective**: Frontend can communicate with Supabase backend.

**Steps**:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Log in to dashboard
4. Filter requests by "supabase"
5. Verify API calls succeed

**Expected Results**:
- ✅ Supabase API calls return HTTP 200
- ✅ Authentication works (JWT token in headers)
- ✅ No CORS errors
- ✅ API response times < 500ms
- ✅ Data returns in expected format

**Pass/Fail**: _____

**Notes**: _________________________________________

---

## ⚡ IMPORTANT SMOKE TESTS (Should Pass)

These tests verify important features. If they fail, log as issues but don't necessarily rollback.

### Test 8: AI Agent Detection

**Objective**: AI agents are detected and tracked separately.

**Steps**:
1. Navigate to AI Agents tab in dashboard
2. Check if any AI agents are detected
3. If no AI traffic yet, this is expected

**Expected Results**:
- ✅ AI Agents tab loads without errors
- ✅ Dashboard displays "No AI traffic yet" or shows detected agents
- ✅ Agent types listed (ChatGPT, Perplexity, Claude, etc.)
- ✅ Agent-specific metrics available

**Pass/Fail**: _____

**Notes**: _________________________________________

---

### Test 9: Heatmap Visualization

**Objective**: Heatmaps render correctly.

**Steps**:
1. Navigate to Heatmaps tab
2. Select a page with traffic
3. Switch between Click/Scroll/Attention heatmaps
4. Change device filter (Desktop/Mobile/Tablet)

**Expected Results**:
- ✅ Heatmap tab loads without errors
- ✅ Heatmap overlay renders on page screenshot
- ✅ Color gradient visible (blue → green → yellow → red)
- ✅ Click positions accurate
- ✅ Device filtering works

**Pass/Fail**: _____

**Notes**: _________________________________________

---

### Test 10: Form Analytics

**Objective**: Form submissions are tracked.

**Steps**:
1. Navigate to Form Analytics tab
2. Check for tracked forms
3. View form funnel visualization

**Expected Results**:
- ✅ Form Analytics tab loads
- ✅ Forms list displayed (or "No forms tracked yet")
- ✅ Form fields and interactions visible
- ✅ Drop-off points identified
- ✅ Completion rates calculated

**Pass/Fail**: _____

**Notes**: _________________________________________

---

### Test 11: Date Range Filtering

**Objective**: Date filters work across all dashboards.

**Steps**:
1. Navigate to main dashboard
2. Click date range selector
3. Select "Last 7 days"
4. Verify data updates
5. Select "Last 30 days"
6. Verify data updates again

**Expected Results**:
- ✅ Date picker displays correctly
- ✅ Selecting date range updates all charts
- ✅ Metrics recalculate based on selected range
- ✅ No errors during date changes
- ✅ Charts re-render smoothly

**Pass/Fail**: _____

**Notes**: _________________________________________

---

### Test 12: Real-time Updates

**Objective**: Real-time analytics update automatically.

**Steps**:
1. Navigate to Real-time tab
2. Open a new browser tab
3. Navigate to a tracked site
4. Return to Real-time tab
5. Wait 5-10 seconds

**Expected Results**:
- ✅ Real-time tab displays current visitors
- ✅ New visitor appears in live feed
- ✅ Page view event shows in activity stream
- ✅ Metrics update automatically
- ✅ No manual refresh required

**Pass/Fail**: _____

**Notes**: _________________________________________

---

## 🔧 INTEGRATION SMOKE TESTS (Optional)

Test integrations if configured.

### Test 13: Google Analytics 4 Integration

**Objective**: GA4 data imports successfully.

**Prerequisites**: GA4 configured

**Steps**:
1. Navigate to Integrations → Google Analytics 4
2. Click "Connect"
3. Authenticate with Google
4. Select GA4 property
5. Trigger data sync

**Expected Results**:
- ✅ OAuth flow completes
- ✅ GA4 properties listed
- ✅ Connection successful
- ✅ Data sync starts
- ✅ GA4 metrics visible in dashboard

**Pass/Fail**: _____

**Notes**: _________________________________________

---

### Test 14: Google Search Console Integration

**Objective**: GSC data imports successfully.

**Prerequisites**: GSC configured

**Steps**:
1. Navigate to Integrations → Search Console
2. Click "Connect"
3. Authenticate with Google
4. Select GSC property
5. View search performance data

**Expected Results**:
- ✅ OAuth flow completes
- ✅ GSC properties listed
- ✅ Connection successful
- ✅ Search queries displayed
- ✅ Click-through rates shown

**Pass/Fail**: _____

**Notes**: _________________________________________

---

### Test 15: WordPress Plugin Download

**Objective**: WordPress plugin is downloadable.

**Steps**:
1. Navigate to Integrations → WordPress
2. Click "Download Plugin"
3. Verify ZIP file downloads

**Expected Results**:
- ✅ Download link works
- ✅ ZIP file downloads (~50-200 KB)
- ✅ ZIP contains plugin files
- ✅ Installation instructions visible

**Pass/Fail**: _____

**Notes**: _________________________________________

---

## 🎯 PERFORMANCE SMOKE TESTS

Verify performance meets targets.

### Test 16: Page Load Speed

**Objective**: Pages load within acceptable time.

**Steps**:
1. Open browser DevTools (F12) → Network tab
2. Clear cache (Ctrl+Shift+Del)
3. Navigate to `https://cortiq.se`
4. Note load time in Network tab
5. Repeat for dashboard

**Performance Targets**:
- Homepage: < 3 seconds
- Dashboard: < 3 seconds
- API calls: < 500ms

**Expected Results**:
- ✅ Homepage loads in < 3s
- ✅ Dashboard loads in < 3s
- ✅ No requests timeout
- ✅ All assets load successfully

**Pass/Fail**: _____

**Actual Load Times**:
- Homepage: _____ seconds
- Dashboard: _____ seconds

---

### Test 17: API Response Times

**Objective**: API endpoints respond quickly.

**Steps**:
1. Log in to dashboard
2. Open DevTools → Network tab
3. Filter by "XHR" or "Fetch"
4. Navigate between different tabs
5. Note API response times

**Expected Results**:
- ✅ Most API calls < 200ms
- ✅ No calls > 1 second
- ✅ No failed requests (HTTP 500/502/503)
- ✅ No timeout errors

**Pass/Fail**: _____

**Notes**: _________________________________________

---

### Test 18: Database Query Performance

**Objective**: Database queries execute efficiently.

**Steps**:
1. Navigate to Supabase Dashboard
2. Go to Database → Query Performance
3. Check slow queries (> 1 second)
4. Verify indexes are used

**Expected Results**:
- ✅ No queries > 1 second
- ✅ Indexes utilized properly
- ✅ Connection pool healthy
- ✅ No connection errors

**Pass/Fail**: _____

**Notes**: _________________________________________

---

## 🔒 SECURITY SMOKE TESTS

Verify security features work.

### Test 19: HTTPS Enforcement

**Objective**: HTTP redirects to HTTPS.

**Steps**:
1. Navigate to `http://cortiq.se` (HTTP, not HTTPS)
2. Verify automatic redirect to HTTPS

**Expected Results**:
- ✅ Redirects to `https://cortiq.se`
- ✅ SSL certificate valid
- ✅ No certificate warnings
- ✅ No mixed content warnings

**Pass/Fail**: _____

**Notes**: _________________________________________

---

### Test 20: Authentication Required

**Objective**: Protected routes require authentication.

**Steps**:
1. Log out (if logged in)
2. Try to access `https://cortiq.se/dashboard` directly
3. Verify redirect to login page

**Expected Results**:
- ✅ Cannot access dashboard without login
- ✅ Redirected to login page
- ✅ After login, redirected back to dashboard
- ✅ Session persists across page refreshes

**Pass/Fail**: _____

**Notes**: _________________________________________

---

### Test 21: Rate Limiting

**Objective**: Rate limiting prevents abuse.

**Steps**:
1. Open DevTools console
2. Run rapid API calls:
```javascript
for (let i = 0; i < 100; i++) {
  fetch('https://cortiq.se/api/track', {
    method: 'POST',
    body: JSON.stringify({ event: 'test' })
  });
}
```
3. Verify some requests are rate-limited

**Expected Results**:
- ✅ After threshold, requests return HTTP 429
- ✅ Rate limit message in response
- ✅ Normal requests still work after cooldown

**Pass/Fail**: _____

**Notes**: _________________________________________

---

### Test 22: XSS Protection

**Objective**: User input is sanitized.

**Steps**:
1. Try to inject script in any input field:
   `<script>alert('XSS')</script>`
2. Submit form
3. Verify script doesn't execute

**Expected Results**:
- ✅ Script tags escaped or removed
- ✅ No alert() popup
- ✅ Input displayed as plain text
- ✅ No JavaScript execution

**Pass/Fail**: _____

**Notes**: _________________________________________

---

## 📱 MOBILE SMOKE TESTS

Test on mobile devices.

### Test 23: Mobile Responsive Design

**Objective**: Site works on mobile devices.

**Steps**:
1. Open DevTools (F12) → Toggle device toolbar
2. Select iPhone or Android device
3. Navigate through site
4. Test key interactions

**Expected Results**:
- ✅ Layout adapts to mobile viewport
- ✅ Navigation menu accessible (hamburger)
- ✅ Buttons/links tappable (not too small)
- ✅ Charts render correctly on mobile
- ✅ Text readable without zooming

**Pass/Fail**: _____

**Tested Devices**: _______________________________

---

### Test 24: Touch Interactions

**Objective**: Touch gestures work correctly.

**Steps**:
1. Use real mobile device (or emulator)
2. Test scrolling, swiping, tapping
3. Verify charts support pinch-to-zoom
4. Test form inputs on mobile

**Expected Results**:
- ✅ Smooth scrolling
- ✅ Taps register correctly
- ✅ No accidental clicks
- ✅ Keyboard appears for inputs
- ✅ Date picker mobile-friendly

**Pass/Fail**: _____

**Notes**: _________________________________________

---

## 🌍 CROSS-BROWSER SMOKE TESTS

Test on multiple browsers.

### Test 25: Chrome/Chromium

**Browser**: Chrome (latest version)

**Steps**:
1. Open https://cortiq.se in Chrome
2. Run Tests 1-7 (Critical Smoke Tests)

**Expected Results**:
- ✅ All critical tests pass
- ✅ No browser-specific errors
- ✅ Consistent UI rendering

**Pass/Fail**: _____

---

### Test 26: Firefox

**Browser**: Firefox (latest version)

**Steps**:
1. Open https://cortiq.se in Firefox
2. Run Tests 1-7 (Critical Smoke Tests)

**Expected Results**:
- ✅ All critical tests pass
- ✅ No browser-specific errors
- ✅ Consistent UI rendering

**Pass/Fail**: _____

---

### Test 27: Safari

**Browser**: Safari (latest version)

**Steps**:
1. Open https://cortiq.se in Safari
2. Run Tests 1-7 (Critical Smoke Tests)

**Expected Results**:
- ✅ All critical tests pass
- ✅ No browser-specific errors
- ✅ Consistent UI rendering

**Pass/Fail**: _____

---

### Test 28: Edge

**Browser**: Microsoft Edge (latest version)

**Steps**:
1. Open https://cortiq.se in Edge
2. Run Tests 1-7 (Critical Smoke Tests)

**Expected Results**:
- ✅ All critical tests pass
- ✅ No browser-specific errors
- ✅ Consistent UI rendering

**Pass/Fail**: _____

---

## 📊 SMOKE TEST SUMMARY

**Test Date**: ___________________
**Tested By**: ___________________
**Environment**: Production (cortiq.se)

### Results Overview

| Category | Total Tests | Passed | Failed | Skipped |
|----------|------------|--------|--------|---------|
| Critical | 7 | ___ | ___ | ___ |
| Important | 5 | ___ | ___ | ___ |
| Integration | 3 | ___ | ___ | ___ |
| Performance | 3 | ___ | ___ | ___ |
| Security | 4 | ___ | ___ | ___ |
| Mobile | 2 | ___ | ___ | ___ |
| Cross-Browser | 4 | ___ | ___ | ___ |
| **TOTAL** | **28** | ___ | ___ | ___ |

### Overall Status

- [ ] ✅ **PASS** - All critical tests passed, deployment successful
- [ ] ⚠️ **PASS WITH WARNINGS** - Minor issues found, log and monitor
- [ ] ❌ **FAIL** - Critical issues found, rollback recommended

### Critical Issues Found

1. _______________________________________________________________
2. _______________________________________________________________
3. _______________________________________________________________

### Non-Critical Issues Found

1. _______________________________________________________________
2. _______________________________________________________________
3. _______________________________________________________________

### Action Items

- [ ] Fix critical issue #1: _______________________________________
- [ ] Fix critical issue #2: _______________________________________
- [ ] Monitor warning: ___________________________________________
- [ ] Schedule fix for non-critical: ______________________________

### Sign-Off

**Tester Name**: ___________________
**Signature**: ___________________
**Date**: ___________________

**Approved for Production**:
- [ ] Yes
- [ ] No - Rollback required

---

## 🛠️ AUTOMATED SMOKE TEST SCRIPT

For faster testing, use this JavaScript snippet in DevTools console:

```javascript
// CortIQ Smoke Test Runner
const smokeTests = {
  async testHomepage() {
    console.log('Testing homepage...');
    const response = await fetch('https://cortiq.se');
    return response.ok && response.status === 200;
  },

  async testTrackingScript() {
    console.log('Testing tracking script...');
    const response = await fetch('https://cortiq.se/spa-tracking.js');
    return response.ok && response.headers.get('content-type').includes('javascript');
  },

  async testSupabaseConnection() {
    console.log('Testing Supabase connection...');
    const response = await fetch('https://cxmkdtgfocgbfizawlwa.supabase.co/rest/v1/');
    return response.status === 401 || response.status === 200; // Auth required or OK
  },

  async runAll() {
    console.log('🔥 Running CortIQ Smoke Tests...\n');
    const results = {};

    for (const [name, test] of Object.entries(this)) {
      if (name === 'runAll') continue;
      try {
        results[name] = await test();
        console.log(`${results[name] ? '✅' : '❌'} ${name}`);
      } catch (error) {
        results[name] = false;
        console.log(`❌ ${name} - Error: ${error.message}`);
      }
    }

    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;

    console.log(`\n📊 Results: ${passed}/${total} tests passed`);
    return results;
  }
};

// Run all tests
smokeTests.runAll();
```

---

**END OF SMOKE TESTS**
