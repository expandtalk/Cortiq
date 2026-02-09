# Supabase Edge Functions Verification Guide

**Total Functions**: 56 Edge Functions
**Deployment Target**: Supabase Project `cxmkdtgfocgbfizawlwa`

---

## 📋 EDGE FUNCTIONS INVENTORY

### Critical Functions (Must be deployed and working)

These functions are essential for core platform functionality:

#### 1. **track-event**
- **Purpose**: Main event tracking endpoint
- **Priority**: 🔴 CRITICAL
- **Test**: `POST /functions/v1/track-event`
- **Expected**: HTTP 200, event stored in database
- **Usage**: Most important function, handles all tracking events

#### 2. **cookiefree-analytics**
- **Purpose**: Cookie-free server-side analytics
- **Priority**: 🔴 CRITICAL
- **Test**: `POST /functions/v1/cookiefree-analytics`
- **Expected**: HTTP 200, analytics data returned

#### 3. **ai-bot-tracker**
- **Purpose**: AI agent detection and tracking
- **Priority**: 🔴 CRITICAL (Unique feature!)
- **Test**: `POST /functions/v1/ai-bot-tracker`
- **Expected**: HTTP 200, AI agent identified

#### 4. **gdpr-compliant-tracking**
- **Purpose**: GDPR-compliant tracking implementation
- **Priority**: 🔴 CRITICAL
- **Test**: `POST /functions/v1/gdpr-compliant-tracking`
- **Expected**: HTTP 200, compliant tracking

---

## 🔵 HIGH PRIORITY FUNCTIONS

### Analytics & Tracking

- **ai-search-tracker** - Track AI search traffic
- **analytics-content** - Content analytics
- **behavioral-analysis** - User behavior analysis
- **behavioral-monitor** - Behavioral monitoring
- **event-debugger** - Debug tracking events
- **funnel-analyzer** - Funnel analysis
- **pixel-tracking** - Pixel-based tracking

### Google Analytics 4 Integration

- **ga4-import** - Import GA4 data
- **ga4-ai-traffic** - GA4 AI traffic analysis
- **ga4-conversion-sync** - Sync GA4 conversions
- **ga4-kpi-dashboard** - GA4 KPI dashboard
- **ga4-monthly-kpi** - Monthly KPI aggregation
- **ga4-search-terms** - GA4 search terms
- **ga4-segment-data** - GA4 segment data
- **ga4-traffic-sources** - GA4 traffic sources

### A/B Testing & Experiments

- **ab-test-calculator** - A/B test statistical calculations

### Form & Ecommerce

- **form-detector** - Detect forms on pages
- **ecommerce-tracking** - E-commerce conversion tracking

### Heatmaps & Session Recording

*Note: Heatmap data processed via track-event function*

---

## 🟢 STANDARD PRIORITY FUNCTIONS

### Integrations

- **bing-webmaster-data** - Bing Webmaster Tools data
- **google-sitekit-data** - Google SiteKit integration
- **sitekit-sync** - SiteKit data synchronization
- **import-server-logs** - Server log import
- **server-log-import** - Alternative server log import

### Cookie Management & GDPR

- **active-cookies** - Track active cookies
- **consent-check** - Check user consent
- **cookie-importer** - Import cookies from scanner
- **cookie-scanner** - Scan websites for cookies
- **store-consent** - Store user consent
- **supabase-detected-cookies** - Detected cookies list
- **gdpr-data-cleanup** - GDPR data retention cleanup
- **data-retention** - Data retention policies

### User Management & Billing

- **check-subscription** - Check user subscription status
- **create-checkout** - Create Stripe checkout session
- **setup-companies** - Setup company accounts

### Dashboard & Insights

- **generate-dashboard-insights** - AI-powered insights
- **ga4-kpi-dashboard-debug** - Debug GA4 KPI issues
- **ga4-search-terms-debug** - Debug GA4 search terms

### Navigation & UX

- **navigation-sync** - Sync navigation events
- **track-navigation** - Track navigation patterns
- **take-screenshot** - Take page screenshots

### Marketing & Ads

- **paid-ads-analytics** - Paid advertising analytics
- **user-lifetime-value** - Calculate user LTV

### API & Communication

- **public-api** - Public REST API
- **send-export-email** - Send data export emails
- **enterprise-contact** - Handle enterprise inquiries

### Advanced Features

- **geolocation-lookup** - Geolocation IP lookup
- **media-analytics** - Video/audio analytics
- **warehouse-connector** - Data warehouse integration
- **content-tracking** - Advanced content tracking

### Proxy & Privacy

- **first-party-proxy** - First-party cookie proxy
- **analyze-website** - Website structure analysis

---

## ✅ VERIFICATION CHECKLIST

### Pre-Deployment Verification

```bash
# 1. Check Supabase CLI installation
supabase --version

# 2. Login to Supabase
supabase login

# 3. Link to project
supabase link --project-ref cxmkdtgfocgbfizawlwa

# 4. Check function status
supabase functions list
```

### Deployment Commands

```bash
# Deploy all functions at once
supabase functions deploy

# Or deploy specific critical functions
supabase functions deploy track-event
supabase functions deploy cookiefree-analytics
supabase functions deploy ai-bot-tracker
supabase functions deploy gdpr-compliant-tracking
```

### Post-Deployment Verification

#### 1. Check Supabase Dashboard

Visit: `https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa/functions`

**Verify**:
- [ ] All 56 functions listed
- [ ] Status shows "Active" (green)
- [ ] No deployment errors
- [ ] Recent invocations visible

#### 2. Test Critical Functions

**Test track-event**:
```bash
curl -X POST \
  https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/track-event \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "event": "page_view",
    "url": "https://test.com",
    "site_id": "test-site-id"
  }'
```

Expected: `{"success": true, "event_id": "..."}`

**Test cookiefree-analytics**:
```bash
curl -X POST \
  https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/cookiefree-analytics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "site_id": "test-site-id",
    "start_date": "2025-02-01",
    "end_date": "2025-02-09"
  }'
```

Expected: Analytics data JSON

**Test ai-bot-tracker**:
```bash
curl -X POST \
  https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/ai-bot-tracker \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "User-Agent: ChatGPT-User/1.0" \
  -d '{
    "site_id": "test-site-id",
    "url": "https://test.com"
  }'
```

Expected: `{"is_ai_agent": true, "agent_type": "ChatGPT"}`

#### 3. Check Function Logs

In Supabase Dashboard → Functions → Select function → Logs

**Look for**:
- [ ] No errors in recent logs
- [ ] Successful invocations
- [ ] Response times < 1 second
- [ ] No timeout errors

#### 4. Monitor Function Performance

**Metrics to track**:
- **Invocations**: Number of calls per hour
- **Errors**: Error rate should be < 1%
- **Duration**: Average execution time < 500ms
- **Timeouts**: Should be 0

**Access metrics**: Supabase Dashboard → Functions → Analytics

---

## 🔧 TROUBLESHOOTING

### Common Issues

#### Issue: Function not deployed
**Symptoms**: Function not visible in dashboard
**Solution**:
```bash
cd supabase/functions/[function-name]
supabase functions deploy [function-name]
```

#### Issue: Function returns 500 error
**Symptoms**: HTTP 500 on invocation
**Solution**:
1. Check logs in Supabase Dashboard
2. Verify environment variables set
3. Check database connection
4. Verify RLS policies don't block function

#### Issue: Function timeout
**Symptoms**: Request times out after 20 seconds
**Solution**:
1. Optimize database queries
2. Add indexes to slow queries
3. Reduce payload size
4. Consider splitting into multiple functions

#### Issue: CORS errors
**Symptoms**: Browser shows CORS error
**Solution**:
Add CORS headers to function response:
```typescript
return new Response(JSON.stringify(data), {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Or specific domain
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
})
```

#### Issue: Authentication failed
**Symptoms**: HTTP 401 Unauthorized
**Solution**:
1. Verify anon key in Authorization header
2. Check RLS policies allow function access
3. Verify JWT token not expired

---

## 📊 MONITORING & ALERTS

### Supabase Dashboard Monitoring

**URL**: `https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa`

**Monitor**:
1. **Functions** → Check deployment status
2. **Logs** → Review error logs
3. **Database** → Monitor query performance
4. **API** → Check API usage

### Recommended Alerts

Set up alerts for:

**Critical Alerts** (immediate notification):
- Function error rate > 5%
- Function timeout rate > 1%
- Database connection failures
- API rate limit exceeded

**Warning Alerts** (daily digest):
- Function response time > 2 seconds
- Error rate > 1%
- Unusual traffic patterns
- Storage approaching limit

### Alert Configuration

Via Supabase Dashboard:
1. Go to Settings → Notifications
2. Configure email/webhook alerts
3. Set thresholds for each metric
4. Test alert delivery

---

## 🧪 PRODUCTION SMOKE TESTS

Run these after deployment:

### Test Suite 1: Core Tracking

```bash
# Test 1: Track page view
curl -X POST https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/track-event \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"event":"page_view","url":"https://test.com","site_id":"test"}'

# Test 2: Cookie-free analytics
curl -X POST https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/cookiefree-analytics \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"site_id":"test","start_date":"2025-02-01","end_date":"2025-02-09"}'

# Test 3: AI bot detection
curl -X POST https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/ai-bot-tracker \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "User-Agent: ChatGPT-User" \
  -H "Content-Type: application/json" \
  -d '{"site_id":"test","url":"https://test.com"}'
```

### Test Suite 2: Integrations

```bash
# Test 4: GA4 import
curl https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/ga4-import \
  -H "Authorization: Bearer $ANON_KEY"

# Test 5: Server log import
curl -X POST https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/server-log-import \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"logs":[]}'
```

### Test Suite 3: GDPR & Privacy

```bash
# Test 6: GDPR tracking
curl -X POST https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/gdpr-compliant-tracking \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"event":"page_view","anonymize_ip":true}'

# Test 7: Consent check
curl -X POST https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/consent-check \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"visitor_id":"test-visitor"}'
```

---

## 📈 PERFORMANCE BENCHMARKS

### Expected Performance

| Function | Expected Duration | Max Duration | Error Rate |
|----------|------------------|--------------|------------|
| track-event | < 100ms | 500ms | < 0.1% |
| cookiefree-analytics | < 200ms | 1000ms | < 0.5% |
| ai-bot-tracker | < 50ms | 200ms | < 0.1% |
| ga4-import | < 2000ms | 10000ms | < 2% |
| funnel-analyzer | < 300ms | 1500ms | < 1% |

### Optimization Tips

**If functions are slow**:
1. Add database indexes
2. Use connection pooling
3. Cache frequent queries
4. Reduce payload size
5. Use prepared statements

**If error rate is high**:
1. Check input validation
2. Add error handling
3. Verify database schema
4. Check RLS policies
5. Review logs for patterns

---

## ✅ VERIFICATION SIGN-OFF

**Verification Date**: ___________________
**Verified By**: ___________________

### Deployment Status

- [ ] All 56 functions deployed successfully
- [ ] Critical functions tested (track-event, cookiefree-analytics, ai-bot-tracker)
- [ ] No errors in recent logs
- [ ] Performance within acceptable ranges
- [ ] CORS headers configured correctly
- [ ] Authentication working properly

### Test Results

| Function | Status | Response Time | Notes |
|----------|--------|---------------|-------|
| track-event | ⬜ Pass / ⬜ Fail | _____ms | ____________ |
| cookiefree-analytics | ⬜ Pass / ⬜ Fail | _____ms | ____________ |
| ai-bot-tracker | ⬜ Pass / ⬜ Fail | _____ms | ____________ |
| gdpr-compliant-tracking | ⬜ Pass / ⬜ Fail | _____ms | ____________ |

### Overall Status

- [ ] ✅ **VERIFIED** - All functions operational
- [ ] ⚠️ **PARTIAL** - Some functions have issues (document below)
- [ ] ❌ **FAILED** - Critical functions not working

**Issues Found**:
1. _______________________________________________________________
2. _______________________________________________________________
3. _______________________________________________________________

**Signature**: ___________________

---

## 📝 FUNCTION-SPECIFIC NOTES

### track-event
- Handles all tracking events (page views, clicks, custom events)
- Rate limited to 10,000 events/hour per site
- Returns event_id for tracking

### ai-bot-tracker
- Detects AI agents via User-Agent string
- Supported: ChatGPT, Perplexity, Claude, Gemini, Copilot, You.com, Phind
- Returns agent type and confidence score

### cookiefree-analytics
- Server-side analytics aggregation
- No cookies required
- GDPR-compliant by design

### ga4-import
- Requires GA4 API credentials
- Syncs data every 24 hours
- Handles pagination for large datasets

### gdpr-compliant-tracking
- Implements GDPR requirements
- IP anonymization enabled
- Respects DNT headers

---

**END OF VERIFICATION GUIDE**

**Next Steps After Verification**:
1. ✅ Mark Task #3 as complete
2. → Proceed to Task #4: Setup monitoring and alerts
3. → Run production smoke tests (SMOKE_TESTS.md)
4. → Deploy frontend to cortiq.se
