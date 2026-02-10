// Quick Deploy Script - Run with: node deploy-migrations.js
const fs = require('fs');
const https = require('https');

const PROJECT_REF = 'cxmkdtgfocgbfizawlwa';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

// You need to provide your service role key
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  console.log('\n💡 Get your service role key from:');
  console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/settings/api`);
  console.log('\nThen run:');
  console.log('   $env:SUPABASE_SERVICE_ROLE_KEY="your-key-here"');
  console.log('   node deploy-migrations.js');
  process.exit(1);
}

async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });

    const options = {
      hostname: `${PROJECT_REF}.supabase.co`,
      path: '/rest/v1/rpc/exec',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function deploy() {
  console.log('🚀 Deploying Unified Visitors Migrations...\n');

  try {
    // Read migration files
    console.log('📖 Reading migration files...');
    const migration1 = fs.readFileSync('supabase/migrations/20260210_unified_visitors.sql', 'utf8');
    const migration2 = fs.readFileSync('supabase/migrations/20260210_unified_visitors_functions.sql', 'utf8');

    // Execute migrations
    console.log('📊 Running Migration 1: unified_visitors schema...');
    await executeSql(migration1);
    console.log('   ✅ Migration 1 complete\n');

    console.log('⚙️  Running Migration 2: unified_visitors functions...');
    await executeSql(migration2);
    console.log('   ✅ Migration 2 complete\n');

    console.log('🎉 All migrations deployed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test visitor identification: npm run dev');
    console.log('   2. Verify in Supabase Dashboard');

  } catch (error) {
    console.error('❌ Error deploying migrations:', error.message);
    console.log('\n💡 Try deploying manually via Dashboard:');
    console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/editor`);
    process.exit(1);
  }
}

deploy();
