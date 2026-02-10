# Deployment Guide: Unified Visitor Profile System

Quick guide to deploy the Unified Visitor Profile system to production.

---

## ✅ Pre-Deployment Checklist

- [ ] Supabase CLI installed and configured
- [ ] Linked to production project (`cxmkdtgfocgbfizawlwa`)
- [ ] Backup database before running migrations
- [ ] Test in development environment first (optional)

---

## 🚀 Step-by-Step Deployment

### Step 1: Deploy Database Migrations

**Option A: Via Supabase CLI (Recommended)**

```bash
# Navigate to project root
cd C:\projects\cortiq

# Push migrations to production
supabase db push

# This will apply:
# - 20260210_unified_visitors.sql
# - 20260210_unified_visitors_functions.sql
```

**Option B: Via Supabase Dashboard**

1. Go to https://supabase.com/dashboard/project/cxmkdtgfocgbfizawlwa
2. Navigate to **SQL Editor**
3. Copy content from `supabase/migrations/20260210_unified_visitors.sql`
4. Execute SQL
5. Copy content from `supabase/migrations/20260210_unified_visitors_functions.sql`
6. Execute SQL

**Verify:**
```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('unified_visitors', 'visitor_session_links', 'visitor_events', 'visitor_segment_definitions');

-- Check if functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%visitor%';

-- Check default segments
SELECT segment_key, segment_name FROM visitor_segment_definitions;
```

---

### Step 2: Deploy Edge Function

```bash
# Deploy visitor-identification edge function
supabase functions deploy visitor-identification

# Expected output:
# Deploying visitor-identification (project ref: cxmkdtgfocgbfizawlwa)
# Function deployed successfully!
```

**Verify:**
```bash
# Test the edge function
curl -X POST https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/visitor-identification \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "00000000-0000-0000-0000-000000000000",
    "sessionId": "test-session",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "screenResolution": "1920x1080",
    "viewport": "1440x900",
    "timezone": -120,
    "language": "en-US",
    "platform": "MacIntel",
    "referrer": "https://google.com",
    "currentUrl": "https://test.com/"
  }'

# Expected response:
# {
#   "success": true,
#   "visitor": {
#     "visitorId": "uuid",
#     "visitorFingerprint": "fp_abc123",
#     "visitorType": "human",
#     ...
#   }
# }
```

**If CORS errors occur:**
```bash
# Check edge function logs
supabase functions logs visitor-identification

# Verify CORS headers are set in index.ts (they should be)
```

---

### Step 3: Update Tracking Script

**Option A: Deploy to cortiq.se (Production)**

```bash
# Upload spa-tracking.js to cortiq.se via FTP/SFTP
# Path: /public_html/spa-tracking.js

# Or use deployment script (if configured)
npm run deploy:tracking
```

**Option B: Test Locally First**

```bash
# Serve tracking script locally
cd public
python -m http.server 8000

# Test in browser console:
# <script>
#   window.cortiqConfig = { siteId: 'your-site-id' };
# </script>
# <script src="http://localhost:8000/spa-tracking.js"></script>
```

**Verify:**
```html
<!-- Test page -->
<!DOCTYPE html>
<html>
<head>
  <title>CortIQ Tracking Test</title>
</head>
<body>
  <h1>Tracking Test</h1>

  <script>
    window.cortiqConfig = {
      siteId: 'your-actual-site-id',
      apiUrl: 'https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1'
    };
  </script>
  <script src="https://cortiq.se/spa-tracking.js"></script>

  <script>
    // Check if visitor was identified
    window.addEventListener('cortiq:visitor-identified', (e) => {
      console.log('✅ Visitor identified:', e.detail);
    });

    setTimeout(() => {
      console.log('Visitor ID:', CortIQ.getVisitorId());
      console.log('Visitor Profile:', CortIQ.getVisitorProfile());
    }, 3000);
  </script>
</body>
</html>
```

---

### Step 4: Update Existing Sites (Optional)

If you have existing sites using the old tracking script:

**Old Configuration:**
```html
<script>
  window.wfaConfig = {
    companyId: 'uuid',
    apiKey: 'key',
    apiUrl: 'https://...',
    contentType: 'page',
    platform: 'web'
  };
</script>
<script src="/spa-tracking.js"></script>
```

**New Configuration (Recommended):**
```html
<script>
  window.cortiqConfig = {
    siteId: 'uuid'  // companyId → siteId
    // apiKey no longer needed for visitor identification
  };
</script>
<script src="https://cortiq.se/spa-tracking.js"></script>
```

**Note:** Old config is still supported (backwards compatible).

---

### Step 5: Verify End-to-End

**Test Flow:**

1. **Load test page** with tracking script
2. **Check browser console** for:
   ```
   CortIQ Tracking initialized
   Site ID: your-site-id
   Session ID: fp_abc123
   CortIQ Visitor identified: { id: uuid, type: 'human', isNew: false, ... }
   ```

3. **Check Supabase Dashboard:**
   ```sql
   -- Verify visitor was created
   SELECT * FROM unified_visitors
   ORDER BY created_at DESC
   LIMIT 10;

   -- Check segments
   SELECT visitor_fingerprint, visitor_type, segments
   FROM unified_visitors
   ORDER BY created_at DESC
   LIMIT 10;
   ```

4. **Track a page view:**
   ```javascript
   CortIQ.trackView();
   ```

5. **Verify in database:**
   ```sql
   -- Check visitor_events
   SELECT * FROM visitor_events
   ORDER BY occurred_at DESC
   LIMIT 10;
   ```

---

## 🧪 Testing AI Agent Detection

### Test with Different User Agents

```bash
# Test ChatGPT Browser
curl -X POST https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/visitor-identification \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "00000000-0000-0000-0000-000000000000",
    "sessionId": "test-chatgpt",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ChatGPT Browser",
    "screenResolution": "1920x1080",
    "viewport": "1440x900",
    "timezone": 0,
    "language": "en-US",
    "platform": "Win32"
  }'

# Expected: visitorType: "ai_agent", aiAgentType: "chatgpt_browser"
```

```bash
# Test Perplexity
curl -X POST https://cxmkdtgfocgbfizawlwa.supabase.co/functions/v1/visitor-identification \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "00000000-0000-0000-0000-000000000000",
    "sessionId": "test-perplexity",
    "userAgent": "Mozilla/5.0 (compatible; Perplexity/1.0; +https://www.perplexity.ai)",
    "screenResolution": "1920x1080",
    "viewport": "1440x900",
    "timezone": 0,
    "language": "en-US",
    "platform": "Linux"
  }'

# Expected: visitorType: "ai_agent", aiAgentType: "perplexity_comet"
```

---

## 🔍 Monitoring & Debugging

### Check Edge Function Logs

```bash
# Real-time logs
supabase functions logs visitor-identification --tail

# Recent logs
supabase functions logs visitor-identification --limit 100
```

### Common Issues

**Issue 1: "Missing required fields" error**

**Solution:** Ensure all required fields are in the request:
- siteId
- sessionId
- userAgent
- screenResolution
- viewport
- timezone
- language
- platform

**Issue 2: Visitor not being created**

**Solution:** Check RLS policies:
```sql
-- Verify service role can insert
SELECT * FROM pg_policies
WHERE tablename = 'unified_visitors';

-- Test insert manually
INSERT INTO unified_visitors (site_id, visitor_fingerprint, visitor_type)
VALUES ('your-site-id'::UUID, 'test_fp', 'human');
```

**Issue 3: Segments not updating**

**Solution:** Manually trigger update:
```sql
SELECT update_visitor_metrics('visitor-uuid'::UUID);
```

---

## 📊 Performance Monitoring

### Check Query Performance

```sql
-- Visitor lookup performance (should be < 1ms)
EXPLAIN ANALYZE
SELECT * FROM unified_visitors
WHERE site_id = 'your-site-id'::UUID
AND visitor_fingerprint = 'fp_abc123';

-- Segment query performance (should be < 50ms)
EXPLAIN ANALYZE
SELECT * FROM get_segment_visitors(
  'your-site-id'::UUID,
  'high_intent',
  100,
  0
);
```

### Monitor Database Size

```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE '%visitor%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🎉 Deployment Complete!

You now have:
- ✅ Unified visitor profiles (humans + AI agents)
- ✅ Automatic segmentation
- ✅ Engagement scoring
- ✅ RFM analysis
- ✅ AI agent detection
- ✅ Enhanced tracking script

---

## 📈 Next Steps

1. **Monitor visitors** in Supabase Dashboard
2. **Create custom segments** for your use case
3. **Build dashboards** to visualize visitor data
4. **Phase 2:** Implement AI Analytics Assistant
5. **Phase 3:** Build Agentic Web Intelligence features

---

## 🆘 Rollback Plan

If something goes wrong:

```sql
-- Drop new tables (preserves existing data)
DROP TABLE IF EXISTS visitor_events CASCADE;
DROP TABLE IF EXISTS visitor_session_links CASCADE;
DROP TABLE IF EXISTS visitor_segment_definitions CASCADE;
DROP TABLE IF EXISTS unified_visitors CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS upsert_unified_visitor CASCADE;
DROP FUNCTION IF EXISTS calculate_engagement_score CASCADE;
DROP FUNCTION IF EXISTS calculate_rfm_scores CASCADE;
DROP FUNCTION IF EXISTS classify_visitor_segments CASCADE;
DROP FUNCTION IF EXISTS update_visitor_metrics CASCADE;
DROP FUNCTION IF EXISTS link_session_to_visitor CASCADE;
DROP FUNCTION IF EXISTS get_visitor_profile CASCADE;
DROP FUNCTION IF EXISTS get_segment_visitors CASCADE;
```

**Restore old tracking script:**
```bash
# Replace spa-tracking.js with backup
cp spa-tracking.js.backup public/spa-tracking.js
```

---

**Questions or issues? Check UNIFIED_VISITOR_PROFILE.md for detailed documentation.**
