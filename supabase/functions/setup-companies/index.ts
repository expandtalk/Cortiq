import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const companies = [
      {
        name: 'Ekonom.biz',
        consent_settings: {
          consent_mode: 'opt-out',
          data_retention_days: 730,
          anonymize_ip: true,
          allowed_event_types: ['view', 'click', 'conversion', 'submission'],
          gdpr_settings: {
            store_user_agent: false,
            store_referrer: true,
            geographic_restrictions: ['EU']
          }
        }
      },
      {
        name: 'AI Search Optimization',
        consent_settings: {
          consent_mode: 'opt-out',
          data_retention_days: 730,
          anonymize_ip: true,
          allowed_event_types: ['view', 'click', 'conversion', 'submission'],
          gdpr_settings: {
            store_user_agent: false,
            store_referrer: true,
            geographic_restrictions: ['EU']
          }
        }
      },
      {
        name: 'Sentrisk',
        consent_settings: {
          consent_mode: 'opt-out',
          data_retention_days: 730,
          anonymize_ip: true,
          allowed_event_types: ['view', 'click', 'conversion', 'submission'],
          gdpr_settings: {
            store_user_agent: true,
            store_referrer: true,
            geographic_restrictions: []
          }
        }
      }
    ];

    const results = [];

    for (const company of companies) {
      // Check if company already exists
      const { data: existing } = await supabase
        .from('companies')
        .select('id, name, api_key')
        .eq('name', company.name)
        .single();

      if (existing) {
        console.log(`Company ${company.name} already exists`);
        results.push({
          name: existing.name,
          company_id: existing.id,
          api_key: existing.api_key,
          status: 'already_exists'
        });
      } else {
        // Create new company
        const { data, error } = await supabase
          .from('companies')
          .insert(company)
          .select('id, name, api_key')
          .single();

        if (error) {
          console.error(`Error creating ${company.name}:`, error);
          results.push({
            name: company.name,
            error: error.message,
            status: 'error'
          });
        } else {
          console.log(`✅ Created ${data.name}`);
          results.push({
            name: data.name,
            company_id: data.id,
            api_key: data.api_key,
            status: 'created'
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        companies: results,
        instructions: {
          ekonom_biz: {
            url: 'https://ekonom.biz',
            company_id: results.find(r => r.name === 'Ekonom.biz')?.company_id,
            api_key: results.find(r => r.name === 'Ekonom.biz')?.api_key,
            platform: 'ekonom-biz'
          },
          ai_search_optimization: {
            url: 'https://ai-search-optimization.lovable.app',
            company_id: results.find(r => r.name === 'AI Search Optimization')?.company_id,
            api_key: results.find(r => r.name === 'AI Search Optimization')?.api_key,
            platform: 'ai-search-opt'
          },
          sentrisk: {
            url: 'https://sentrisk.lovable.app',
            company_id: results.find(r => r.name === 'Sentrisk')?.company_id,
            api_key: results.find(r => r.name === 'Sentrisk')?.api_key,
            platform: 'sentrisk'
          }
        },
        next_steps: [
          '1. Kopiera company_id och api_key för varje sajt',
          '2. Lägg till tracking-scriptet enligt INTEGRATION-GUIDE.md',
          '3. Publicera web-focus-analyzer projektet så spa-tracking.js blir tillgängligt',
          '4. Testa tracking genom att öppna browser console'
        ]
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in setup-companies function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
