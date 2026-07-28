// Inspect a URL's indexation state via Google Search Console
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY = 'https://connector-gateway.lovable.dev/google_search_console';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const GSC_KEY = Deno.env.get('GOOGLE_SEARCH_CONSOLE_API_KEY');
  if (!LOVABLE_API_KEY || !GSC_KEY) {
    return new Response(JSON.stringify({ error: 'Missing credentials' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { inspectionUrl, siteUrl, languageCode } = body ?? {};
    if (!inspectionUrl || !siteUrl) {
      return new Response(JSON.stringify({ error: 'inspectionUrl and siteUrl are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const r = await fetch(`${GATEWAY}/v1/urlInspection/index:inspect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': GSC_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inspectionUrl, siteUrl, languageCode: languageCode ?? 'pt-BR' }),
    });
    const text = await r.text();
    return new Response(text, { status: r.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
