import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface DataRetentionConfig {
  retentionDays: number;
  tables: string[];
}

const DEFAULT_RETENTION_DAYS = 30; // GDPR default

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === 'POST') {
    try {
      const { retentionDays = DEFAULT_RETENTION_DAYS } = await req.json();
      
      console.log(`Starting data retention cleanup for ${retentionDays} days`);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      const cutoffISO = cutoffDate.toISOString();
      
      const results = {
        heatmap_data: 0,
        user_interactions: 0,
        page_views: 0,
        tracking_sessions: 0
      };

      // Delete old heatmap data
      const { count: heatmapCount } = await supabase
        .from('heatmap_data')
        .delete({ count: 'exact' })
        .lt('created_at', cutoffISO);
      
      results.heatmap_data = heatmapCount || 0;

      // Delete old user interactions
      const { count: interactionsCount } = await supabase
        .from('user_interactions')
        .delete({ count: 'exact' })
        .lt('created_at', cutoffISO);
      
      results.user_interactions = interactionsCount || 0;

      // Delete old page views
      const { count: pageViewsCount } = await supabase
        .from('page_views')
        .delete({ count: 'exact' })
        .lt('viewed_at', cutoffISO);
      
      results.page_views = pageViewsCount || 0;

      // Delete old tracking sessions
      const { count: sessionsCount } = await supabase
        .from('tracking_sessions')
        .delete({ count: 'exact' })
        .lt('started_at', cutoffISO);
      
      results.tracking_sessions = sessionsCount || 0;

      console.log('Data retention cleanup completed:', results);

      return new Response(JSON.stringify({ 
        success: true, 
        deletedRecords: results,
        cutoffDate: cutoffISO 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Data retention error:', error);
      return new Response(JSON.stringify({ error: 'Data retention failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
});