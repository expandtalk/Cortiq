# CortIQ Production Monitoring & Alerts Setup

**Purpose**: Configure comprehensive monitoring and alerting for production deployment

**Priority**: 🔴 CRITICAL - Set up before public launch

---

## 📊 MONITORING ARCHITECTURE

### Three-Layer Monitoring Approach

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Supabase Built-in Monitoring (Free)              │
│  → Database performance, Edge Function metrics, API usage   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Uptime & Performance Monitoring (Free)           │
│  → UptimeRobot, Pingdom, StatusCake                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Error Tracking & Logging (Optional)              │
│  → Sentry, LogRocket, Datadog                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 LAYER 1: SUPABASE BUILT-IN MONITORING

### Access Supabase Dashboard

**URL**: `https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa`

### Metrics to Monitor

#### 1. Database Performance

**Location**: Dashboard → Database → Query Performance

**Key Metrics**:
- **Active Connections**: Should be < 80% of pool size
- **Slow Queries**: Any query > 1 second
- **Failed Queries**: Should be < 0.1%
- **Connection Pool**: Monitor for saturation

**Alert Thresholds**:
- 🔴 Critical: Active connections > 90%
- ⚠️ Warning: Slow queries > 5 per hour
- ⚠️ Warning: Failed queries > 1%

**Actions**:
```sql
-- Check slow queries
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000 -- over 1 second
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Check connection count
SELECT count(*) FROM pg_stat_activity;

-- Check table bloat
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
```

#### 2. Edge Functions Performance

**Location**: Dashboard → Edge Functions → Analytics

**Key Metrics**:
- **Invocations**: Calls per hour/day
- **Error Rate**: Should be < 1%
- **Execution Time**: Average < 500ms
- **Timeouts**: Should be 0

**Alert Thresholds**:
- 🔴 Critical: Error rate > 5%
- 🔴 Critical: Timeout rate > 1%
- ⚠️ Warning: Avg execution time > 1 second
- ⚠️ Warning: Error rate > 1%

**Critical Functions to Monitor**:
1. `track-event` - Most important!
2. `cookiefree-analytics`
3. `ai-bot-tracker`
4. `gdpr-compliant-tracking`
5. `ga4-import`

**View Function Logs**:
```bash
# Via Supabase CLI
supabase functions logs track-event

# Or in Dashboard: Functions → [Function Name] → Logs
```

#### 3. API Usage & Rate Limits

**Location**: Dashboard → Settings → API

**Key Metrics**:
- **API Requests**: Total requests per hour
- **Bandwidth**: Data transfer
- **Rate Limit Hits**: Should be minimal
- **Auth Success Rate**: Should be > 99%

**Alert Thresholds**:
- 🔴 Critical: Rate limit hits > 100/hour
- ⚠️ Warning: API requests approaching plan limit
- ⚠️ Warning: Auth failures > 1%

**Rate Limits** (Supabase Free Tier):
- API requests: 500,000/month
- Database: 500 MB
- Storage: 1 GB
- Edge Functions: 500,000 invocations/month

#### 4. Storage Usage

**Location**: Dashboard → Storage → Usage

**Key Metrics**:
- **Storage Used**: Current usage
- **Files Count**: Number of files
- **Bandwidth**: Transfer usage

**Alert Thresholds**:
- ⚠️ Warning: Storage > 80% of limit
- 🔴 Critical: Storage > 95% of limit

#### 5. Real-time Subscriptions

**Location**: Dashboard → Database → Realtime

**Key Metrics**:
- **Active Connections**: Concurrent subscriptions
- **Messages/Second**: Throughput
- **Errors**: Subscription failures

**Alert Thresholds**:
- ⚠️ Warning: Active connections > 100
- 🔴 Critical: Connection errors > 5%

### Configure Supabase Email Alerts

**Steps**:
1. Go to Settings → Notifications
2. Add email addresses for alerts
3. Configure alert thresholds:

**Recommended Alerts**:
- [ ] Database CPU > 80%
- [ ] Database Memory > 80%
- [ ] Disk space > 80%
- [ ] Edge Function errors > 5%
- [ ] API rate limit reached
- [ ] Backup failures

**Email Recipients**:
- Technical Lead: [email]
- On-Call Engineer: [email]
- Backup Contact: [email]

---

## 🔔 LAYER 2: UPTIME & PERFORMANCE MONITORING

### Option 1: UptimeRobot (Recommended - Free Tier)

**Why UptimeRobot**:
- ✓ Free tier: 50 monitors, 5-minute checks
- ✓ Simple setup
- ✓ Email/SMS/Slack notifications
- ✓ Status page
- ✓ No credit card required

**Setup Steps**:

1. **Sign up**: https://uptimerobot.com/signUp

2. **Create Monitors**:

**Monitor 1: Homepage**
```
Monitor Type: HTTP(s)
Friendly Name: CortIQ Homepage
URL: https://cortiq.se
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
```

**Monitor 2: Dashboard**
```
Monitor Type: HTTP(s)
Friendly Name: CortIQ Dashboard
URL: https://cortiq.se/dashboard
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
```

**Monitor 3: Tracking Script**
```
Monitor Type: HTTP(s)
Friendly Name: Tracking Script
URL: https://cortiq.se/spa-tracking.js
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
Keyword: CortIQ
```

**Monitor 4: API Health**
```
Monitor Type: HTTP(s)
Friendly Name: Supabase API
URL: https://cxmkdtgfocgbfizawlwa.supabase.co/rest/v1/
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
```

**Monitor 5: Edge Function (track-event)**
```
Monitor Type: HTTP(s)
Friendly Name: Track Event Function
URL: https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/track-event
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
Method: POST
Headers: Authorization: Bearer YOUR_ANON_KEY
Body: {"event":"heartbeat","site_id":"monitor"}
```

3. **Configure Alerts**:
```
Alert Contacts:
- Email: [your-email]
- SMS: [optional, if critical]
- Slack: [webhook URL]

Alert When:
- Monitor is down
- Monitor is slow (> 5 seconds response time)

Don't alert when:
- False positives from a single location
```

4. **Create Status Page**:
```
Public Status Page: https://status.cortiq.se (or subdomain)
Show:
- All monitors
- Uptime percentage (30/60/90 days)
- Response time charts
- Incident history
```

### Option 2: Pingdom (Alternative)

**Free Trial**: 14 days

**Features**:
- More detailed performance metrics
- Real user monitoring (RUM)
- Transaction monitoring
- Detailed reports

**Setup**:
Same monitors as UptimeRobot, but with additional:
- Page speed monitoring
- User experience monitoring
- Detailed performance breakdown

### Option 3: StatusCake (Alternative)

**Free Tier**: 10 monitors, 5-minute checks

**Similar setup to UptimeRobot**

---

## 🚨 LAYER 3: ERROR TRACKING & LOGGING

### Option 1: Sentry (Recommended for Frontend Errors)

**Why Sentry**:
- ✓ Free tier: 5,000 errors/month
- ✓ Excellent React integration
- ✓ Source maps support
- ✓ Release tracking
- ✓ User feedback

**Setup Steps**:

1. **Install Sentry**:
```bash
npm install --save @sentry/react @sentry/vite-plugin
```

2. **Configure Vite** (`vite.config.ts`):
```typescript
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "cortiq",
      project: "cortiq-frontend",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  build: {
    sourcemap: true, // Enable source maps for Sentry
  },
});
```

3. **Initialize Sentry** (`src/main.tsx`):
```typescript
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: "YOUR_SENTRY_DSN",
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay(),
    ],
    tracesSampleRate: 0.1, // 10% of transactions
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of errors
    environment: "production",
    release: "cortiq@1.0.0",
  });
}
```

4. **Configure Alerts**:
```
Alert Rules:
- New error occurs (first seen)
- Error frequency > 10/hour
- Error affects > 5% of users
- Unresolved errors for > 24 hours

Notification Channels:
- Email: [technical team]
- Slack: #alerts channel
```

5. **Add User Context**:
```typescript
// When user logs in
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// Add custom context
Sentry.setContext("company", {
  id: company.id,
  name: company.name,
});
```

### Option 2: LogRocket (Alternative - Session Replay)

**Why LogRocket**:
- Session replay with DOM recording
- Network request logging
- Console log capture
- Redux/state logging

**Free Tier**: 1,000 sessions/month

**Setup**:
```bash
npm install --save logrocket
```

```typescript
import LogRocket from 'logrocket';

if (import.meta.env.PROD) {
  LogRocket.init('cortiq/cortiq-app');

  // Identify users
  LogRocket.identify(user.id, {
    name: user.name,
    email: user.email,
  });
}
```

### Option 3: Custom Logging to Supabase

**Create logging table**:
```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  level VARCHAR(20), -- error, warning, info
  message TEXT,
  stack_trace TEXT,
  user_id UUID,
  url TEXT,
  user_agent TEXT,
  metadata JSONB
);

CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX idx_error_logs_level ON error_logs(level);
```

**Log errors**:
```typescript
// src/lib/logger.ts
export async function logError(error: Error, context?: Record<string, any>) {
  if (import.meta.env.PROD) {
    await supabase.from('error_logs').insert({
      level: 'error',
      message: error.message,
      stack_trace: error.stack,
      url: window.location.href,
      user_agent: navigator.userAgent,
      metadata: context,
    });
  }
}

// Usage
try {
  // code
} catch (error) {
  logError(error as Error, { component: 'Dashboard' });
}
```

---

## 📈 PERFORMANCE MONITORING

### Google PageSpeed Insights

**Automated Monitoring**:

```bash
# Install lighthouse CI
npm install -g @lhci/cli

# Run PageSpeed test
lhci autorun --url=https://cortiq.se

# Set up weekly automated tests
```

**Thresholds**:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 95

### Web Vitals Tracking

**Add to `src/main.tsx`**:
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to your analytics
  console.log(metric);

  // Track in CortIQ
  window.CortIQ?.trackEvent('web_vital', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
  });
}

if (import.meta.env.PROD) {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}
```

---

## 📊 CUSTOM DASHBOARDS

### Grafana Dashboard (Advanced)

**For advanced monitoring**:

1. **Install Grafana Cloud** (free tier)
2. **Connect to Supabase**:
   - Use PostgreSQL data source
   - Query performance metrics
3. **Create Dashboards**:
   - Database performance
   - API request rates
   - Error rates
   - User activity

**Example Queries**:
```sql
-- Active users per hour
SELECT
  date_trunc('hour', created_at) as hour,
  count(DISTINCT user_id) as active_users
FROM tracking_sessions
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;

-- Error rate per hour
SELECT
  date_trunc('hour', timestamp) as hour,
  count(*) as errors
FROM error_logs
WHERE level = 'error'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;
```

---

## 🔔 ALERT CONFIGURATION

### Alert Priority Levels

#### 🔴 P0 - CRITICAL (Immediate Response Required)

**Conditions**:
- Site down (HTTP 500/502/503)
- Database connection failure
- Edge Function error rate > 10%
- API completely unavailable
- Data loss detected

**Response Time**: < 15 minutes
**Notification**: Email + SMS + Phone call + Slack
**Escalation**: If not acknowledged in 15 min, call backup

#### 🟠 P1 - HIGH (Urgent, Same Day)

**Conditions**:
- Edge Function error rate > 5%
- API response time > 5 seconds
- Database CPU > 90%
- Storage > 95% full
- Rate limit exceeded

**Response Time**: < 2 hours
**Notification**: Email + Slack
**Escalation**: If not resolved in 4 hours, escalate to P0

#### 🟡 P2 - MEDIUM (Important, Next Business Day)

**Conditions**:
- Edge Function error rate > 1%
- API response time > 2 seconds
- Database CPU > 80%
- Storage > 80% full
- Slow queries detected

**Response Time**: < 24 hours
**Notification**: Email
**Escalation**: If not resolved in 48 hours, escalate to P1

#### 🟢 P3 - LOW (Monitor, Weekly Review)

**Conditions**:
- Minor UI bugs
- Non-critical feature issues
- Performance degradation < 20%
- Low-impact errors

**Response Time**: < 1 week
**Notification**: Weekly digest email
**Escalation**: None

### Alert Routing

**Email Notifications**:
```
P0: team@cortiq.se, oncall@cortiq.se
P1: team@cortiq.se
P2: support@cortiq.se
P3: monitoring@cortiq.se (weekly digest)
```

**Slack Notifications**:
```
P0: #critical-alerts
P1: #alerts
P2: #monitoring
P3: #weekly-digest
```

**SMS Notifications** (Optional):
```
P0 only: [on-call phone number]
```

---

## 🔧 ALERTING TOOLS SETUP

### Option 1: Slack Integration

**Setup Webhook**:

1. Create Slack App: https://api.slack.com/apps
2. Enable Incoming Webhooks
3. Copy webhook URL
4. Configure alerts to post to webhook

**Example Webhook Post**:
```bash
curl -X POST \
  -H 'Content-type: application/json' \
  --data '{
    "text": "🔴 CRITICAL: CortIQ is down!",
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*CortIQ Production Alert*\n\n*Status*: 🔴 DOWN\n*Service*: Homepage (cortiq.se)\n*Error*: HTTP 503 Service Unavailable\n*Duration*: 3 minutes\n*Action*: Investigating..."
        }
      }
    ]
  }' \
  https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Option 2: Discord Webhook (Alternative)

**Setup**:
1. Server Settings → Integrations → Webhooks
2. Create webhook for #alerts channel
3. Copy webhook URL

**Example Post**:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "content": "🔴 **CRITICAL ALERT**",
    "embeds": [{
      "title": "CortIQ Production Down",
      "description": "Homepage returning 503 errors",
      "color": 15158332,
      "fields": [
        {"name": "Service", "value": "cortiq.se", "inline": true},
        {"name": "Duration", "value": "3 minutes", "inline": true}
      ]
    }]
  }' \
  https://discord.com/api/webhooks/YOUR_WEBHOOK_URL
```

### Option 3: PagerDuty (For 24/7 On-Call)

**Why PagerDuty**:
- Professional on-call management
- Escalation policies
- Phone call alerts
- Incident management

**Free Tier**: 10 services

**Setup**:
1. Create PagerDuty account
2. Add service for CortIQ
3. Configure escalation policy
4. Integrate with monitoring tools

---

## 📊 MONITORING DASHBOARD CHECKLIST

Create a central monitoring dashboard:

### Key Metrics to Display

**System Health**:
- [ ] Site uptime (%)
- [ ] API response time (ms)
- [ ] Database connections
- [ ] Edge Function success rate (%)

**Business Metrics**:
- [ ] Active users (real-time)
- [ ] Events tracked per hour
- [ ] AI agent detections
- [ ] Conversion rate

**Performance Metrics**:
- [ ] Page load time (seconds)
- [ ] Web Vitals (LCP, FID, CLS)
- [ ] API latency (p50, p95, p99)
- [ ] Database query time

**Error Metrics**:
- [ ] Error rate (%)
- [ ] Critical errors (count)
- [ ] 5xx errors (count)
- [ ] Failed logins (count)

### Dashboard Tools

**Option 1**: Grafana (self-hosted or cloud)
**Option 2**: Datadog (paid)
**Option 3**: Custom dashboard in CortIQ admin panel
**Option 4**: Google Data Studio (free)

---

## ✅ MONITORING SETUP CHECKLIST

### Pre-Launch (Complete Before Going Live)

- [ ] **Supabase alerts configured** - Email notifications set
- [ ] **UptimeRobot monitors created** - 5+ monitors active
- [ ] **Slack webhook configured** - Alerts post to #alerts channel
- [ ] **Error tracking setup** - Sentry or equivalent installed
- [ ] **Log aggregation working** - Can view logs centrally
- [ ] **Status page created** - status.cortiq.se live
- [ ] **Alert routing defined** - Know who to call for P0
- [ ] **Runbook created** - Documented response procedures

### Week 1 After Launch

- [ ] **Review alert thresholds** - Adjust based on actual traffic
- [ ] **Test alert delivery** - Trigger test alerts
- [ ] **Verify on-call rotation** - Ensure coverage
- [ ] **Document incidents** - Start incident log
- [ ] **Review performance** - Check all metrics

### Ongoing

- [ ] **Weekly metrics review** - Team reviews dashboard
- [ ] **Monthly alert tuning** - Reduce false positives
- [ ] **Quarterly load testing** - Simulate high traffic
- [ ] **Annual disaster recovery test** - Test backups and recovery

---

## 🚨 INCIDENT RESPONSE RUNBOOK

### When Alert Fires

**Step 1: Acknowledge**
- Click "Acknowledge" in alert system
- Post in #incidents Slack channel
- Start timer for response time

**Step 2: Assess**
- Check Supabase Dashboard
- Review recent deployments
- Check UptimeRobot for site status
- Review error logs

**Step 3: Diagnose**
```bash
# Check site accessibility
curl -I https://cortiq.se

# Check API
curl https://cxmkdtgfocgbfizawlwa.supabase.co/rest/v1/

# Check Edge Function
curl https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/track-event

# Check database
psql [connection string] -c "SELECT version();"
```

**Step 4: Mitigate**
- If recent deployment: Consider rollback
- If database issue: Scale up resources
- If function error: Check logs and fix
- If external dependency: Wait and monitor

**Step 5: Resolve**
- Deploy fix if needed
- Verify fix with smoke tests
- Update status page
- Close incident in alert system

**Step 6: Post-Mortem**
- Document what happened
- Identify root cause
- List action items to prevent recurrence
- Share with team

---

## 📝 MONITORING SIGN-OFF

**Setup Completed By**: ___________________
**Date**: ___________________

**Verification**:
- [ ] All monitors active and reporting
- [ ] Alerts configured and tested
- [ ] Team trained on incident response
- [ ] Runbook reviewed and approved
- [ ] Status page live
- [ ] On-call rotation scheduled

**Signature**: ___________________

---

**END OF MONITORING SETUP GUIDE**

**Next Steps**:
1. ✅ Complete this monitoring setup
2. → Run production smoke tests
3. → Deploy frontend to cortiq.se
4. → Monitor for first 24 hours closely
5. → Announce launch! 🚀
