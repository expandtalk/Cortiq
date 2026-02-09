/**
 * Setup script to create company records for Daniel's sites
 * Run this once to initialize the tracking companies
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://cxmkdtgfocgbfizawlwa.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "YOUR_SERVICE_ROLE_KEY"; // Replace with actual key from Supabase

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
    name: 'TrafikBoost',
    consent_settings: {
      consent_mode: 'opt-out',
      data_retention_days: 730,
      anonymize_ip: true,
      allowed_event_types: ['view', 'click', 'conversion', 'submission'],
      gdpr_settings: {
        store_user_agent: true, // TrafikBoost kanske behöver mer data för analytics
        store_referrer: true,
        geographic_restrictions: []
      }
    }
  }
];

async function setupCompanies() {
  console.log('Creating company records...\n');

  for (const company of companies) {
    const { data, error } = await supabase
      .from('companies')
      .insert(company)
      .select()
      .single();

    if (error) {
      console.error(`Error creating ${company.name}:`, error);
    } else {
      console.log(`✅ ${data.name}`);
      console.log(`   Company ID: ${data.id}`);
      console.log(`   API Key: ${data.api_key}`);
      console.log('');
    }
  }
}

setupCompanies();
