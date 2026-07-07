// Geo scope check for banner gating. Returns the visitor's country (from Cloudflare's
// CF-IPCountry header, which Supabase Edge sits behind) and whether it's in the EEA/UK/CH
// consent zone. Fail-safe: unknown country => in scope (show the banner).
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EEA_UK_CH = new Set([
  'AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR','HU','IE','IT','LT',
  'LU','LV','MT','NL','PL','PT','RO','SE','SI','SK','IS','LI','NO','GB','CH',
]);

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const country = req.headers.get('cf-ipcountry');
  const unknown = !country || country === 'XX' || country === 'T1';
  const inScope = unknown ? true : EEA_UK_CH.has(country.toUpperCase());
  return new Response(
    JSON.stringify({ country: country || null, in_scope: inScope }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=300' } }
  );
});
