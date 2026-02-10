# Migration Status Report

Generated: 2026-02-10

## Latest Migrations

### New Migrations (Not Yet Applied)
These migrations need to be deployed to production:

1. **20260210_unified_visitors.sql** ⏳ PENDING
   - Creates unified visitor profile system
   - Tables: unified_visitors, visitor_session_links, visitor_events, visitor_segment_definitions
   - Indexes and RLS policies
   - Default segment definitions

2. **20260210_unified_visitors_functions.sql** ⏳ PENDING
   - Database functions for visitor profiling
   - Functions: upsert_unified_visitor, calculate_engagement_score, calculate_rfm_scores, etc.
   - Required for visitor identification to work

### Previous Migrations (Already Applied)
These migrations are already in production:

- 20260209180000_final_fas3_features.sql ✅
- 20260209170000_tag_manager.sql ✅
- 20260209160000_content_tracking_advanced.sql ✅
- 20260209150000_data_warehouse_connectors.sql ✅
- 20260209140000_media_analytics.sql ✅
- 20260209130000_geolocation_mapping.sql ✅
- 20260209121000_utm_tracking.sql ✅
- 20260209120000_scheduled_reports.sql ✅
- ... and 68 more migrations

## Total Migrations
- **Total migration files:** 76
- **Pending:** 2
- **Applied:** 74

## Deployment Instructions

To apply the pending migrations:

```bash
# Method 1: Via Supabase CLI (Recommended)
supabase db push

# Method 2: Via Supabase Dashboard
# 1. Go to SQL Editor
# 2. Copy content from each migration file
# 3. Execute SQL
```

## Dependencies

The new migrations depend on existing tables:
- `sites` (from 20250708081922)
- `tracking_sessions` (from 20250708081922)
- `ai_agent_sessions` (from 20251216062912)
- `companies` (from 20251101175149)

All dependencies are already in production ✅

## Edge Functions Status

### New Edge Function (Not Yet Deployed)
- **visitor-identification** ⏳ PENDING
  - Location: supabase/functions/visitor-identification/index.ts
  - Purpose: Visitor identification and profiling
  - Deploy: `supabase functions deploy visitor-identification`

### Existing Edge Functions
- track-event ✅
- cookiefree-analytics ✅
- ai-bot-tracker ✅
- heatmap-data ✅
- form-analytics ✅
- ... and 46 more functions

## Tracking Script Status

### Updated Script (Not Yet Deployed)
- **public/spa-tracking.js** ⏳ PENDING
  - Enhanced visitor identification
  - AI agent detection
  - UTM parameter extraction
  - Deploy to: https://cortiq.se/spa-tracking.js

## Next Steps

1. ✅ Review migrations (done)
2. ⏳ Deploy migrations to production
3. ⏳ Deploy visitor-identification edge function
4. ⏳ Deploy updated tracking script
5. ⏳ Test end-to-end

## Notes

- Migrations are safe to run (CREATE TABLE IF NOT EXISTS)
- No breaking changes to existing functionality
- New features are additive only
- Backwards compatible with existing tracking

---

**Status:** Ready for deployment 🚀
