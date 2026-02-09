import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Generate dashboard insights function started');
    
    const requestData = await req.json();
    console.log('Request data:', requestData);
    
    const { siteId } = requestData;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      console.error('❌ OpenAI API key not configured');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured',
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating insights for site:', siteId);

    // Fetch recent analytics data
    const [analyticsData, heatmapData, formData, trafficData] = await Promise.all([
      // Page views last 7 days
      supabase
        .from('page_views')
        .select('url, title, viewed_at')
        .eq('site_id', siteId)
        .gte('viewed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(100),
      
      // Heatmap interactions
      supabase
        .from('heatmap_data')
        .select('url, interaction_type, device_type')
        .eq('site_id', siteId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(50),
      
      // Form analytics
      supabase
        .from('form_analytics')
        .select('form_name, total_starts, total_completions, conversion_rate')
        .eq('site_id', siteId)
        .limit(10),
      
      // Traffic sessions
      supabase
        .from('tracking_sessions')
        .select('device_type, browser, started_at, page_views')
        .eq('site_id', siteId)
        .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(50)
    ]);

    // Prepare data summary for AI
    const dataSummary = {
      totalPageViews: analyticsData.data?.length || 0,
      topPages: analyticsData.data?.reduce((acc, pv) => {
        acc[pv.url] = (acc[pv.url] || 0) + 1;
        return acc;
      }, {}) || {},
      deviceBreakdown: trafficData.data?.reduce((acc, session) => {
        acc[session.device_type] = (acc[session.device_type] || 0) + 1;
        return acc;
      }, {}) || {},
      formPerformance: formData.data?.map(f => ({
        name: f.form_name,
        conversionRate: f.conversion_rate
      })) || [],
      heatmapInteractions: heatmapData.data?.length || 0
    };

    console.log('Data summary:', dataSummary);

    // Generate AI insights
    const prompt = `Analyze this website analytics data and provide actionable insights:

Data Summary:
- Total page views (last 7 days): ${dataSummary.totalPageViews}
- Top pages: ${JSON.stringify(dataSummary.topPages)}
- Device breakdown: ${JSON.stringify(dataSummary.deviceBreakdown)}
- Form performance: ${JSON.stringify(dataSummary.formPerformance)}
- Heatmap interactions: ${dataSummary.heatmapInteractions}

Generate 3-5 specific, actionable insights in Swedish. Each insight should include:
1. A clear title (max 50 characters)
2. A description explaining the finding
3. Specific action items to improve performance
4. A priority level (high/medium/low)
5. A confidence score (0-100)

Return JSON format:
{
  "insights": [
    {
      "title": "Title",
      "description": "Description", 
      "actionItems": ["Action 1", "Action 2"],
      "priority": "high|medium|low",
      "confidence": 85,
      "type": "traffic|conversion|usability|performance"
    }
  ]
}`;

    console.log('Making OpenAI request...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Du är en expert på webbanalys som ger praktiska råd på svenska.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    console.log('OpenAI response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error details:', errorText);
      
      if (response.status === 429) {
        // Rate limit handling - return cached insights or basic fallback
        console.log('Rate limited, providing fallback insights');
        const fallbackInsights = {
          insights: [
            {
              title: "Webbanalys behöver mer data",
              description: "För att ge bättre insights behöver vi mer trafik och interaktionsdata.",
              actionItems: ["Öka marknadsföring för mer trafik", "Implementera fler tracking events"],
              priority: "medium",
              confidence: 70,
              type: "traffic"
            }
          ]
        };
        
        // Store fallback insights
        for (const insight of fallbackInsights.insights) {
          await supabase
            .from('dashboard_insights')
            .insert({
              site_id: siteId,
              insight_type: insight.type,
              title: insight.title,
              description: insight.description,
              action_items: insight.actionItems,
              priority: insight.priority,
              confidence_score: insight.confidence,
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          insights: fallbackInsights.insights,
          dataPoints: {
            pageViews: dataSummary.totalPageViews,
            heatmapInteractions: dataSummary.heatmapInteractions,
            formsTracked: formData.data?.length || 0
          },
          note: "Begränsad AI-analys på grund av API-gränser"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();
    const insightsText = aiResponse.choices[0].message.content;
    
    let insights;
    try {
      insights = JSON.parse(insightsText);
    } catch (e) {
      console.error('Failed to parse AI response:', insightsText);
      throw new Error('Failed to parse AI insights');
    }

    // Store insights in database
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    for (const insight of insights.insights) {
      await supabase
        .from('dashboard_insights')
        .insert({
          site_id: siteId,
          insight_type: insight.type,
          title: insight.title,
          description: insight.description,
          action_items: insight.actionItems,
          priority: insight.priority,
          confidence_score: insight.confidence,
          expires_at: expiresAt.toISOString()
        });
    }

    console.log('Generated and stored insights:', insights.insights.length);

    return new Response(JSON.stringify({ 
      success: true, 
      insights: insights.insights,
      dataPoints: {
        pageViews: dataSummary.totalPageViews,
        heatmapInteractions: dataSummary.heatmapInteractions,
        formsTracked: formData.data?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});