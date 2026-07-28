// Submit or check sitemap via Google Search Console
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

  const authHeaders = {
    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    'X-Connection-Api-Key': GSC_KEY,
  };

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') ?? 'list';

    // List verified properties
    if (action === 'sites') {
      const r = await fetch(`${GATEWAY}/webmasters/v3/sites`, { headers: authHeaders });
      const body = await r.text();
      return new Response(body, { status: r.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = req.method !== 'GET' ? await req.json().catch(() => ({})) : {};
    const siteUrl: string | undefined = body.siteUrl ?? url.searchParams.get('siteUrl') ?? undefined;
    const sitemapUrl: string | undefined = body.sitemapUrl ?? url.searchParams.get('sitemapUrl') ?? undefined;

    if (!siteUrl) {
      return new Response(JSON.stringify({ error: 'siteUrl is required (from /sites list)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const encSite = encodeURIComponent(siteUrl);

    // List sitemaps for a property
    if (action === 'list') {
      const r = await fetch(`${GATEWAY}/webmasters/v3/sites/${encSite}/sitemaps`, { headers: authHeaders });
      const text = await r.text();
      return new Response(text, { status: r.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!sitemapUrl) {
      return new Response(JSON.stringify({ error: 'sitemapUrl is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const encSitemap = encodeURIComponent(sitemapUrl);

    // Submit (or resubmit) sitemap
    if (action === 'submit') {
      const r = await fetch(`${GATEWAY}/webmasters/v3/sites/${encSite}/sitemaps/${encSitemap}`, {
        method: 'PUT', headers: authHeaders,
      });
      const text = await r.text();
      return new Response(text || JSON.stringify({ ok: r.ok, status: r.status }), {
        status: r.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete sitemap
    if (action === 'delete') {
      const r = await fetch(`${GATEWAY}/webmasters/v3/sites/${encSite}/sitemaps/${encSitemap}`, {
        method: 'DELETE', headers: authHeaders,
      });
      const text = await r.text();
      return new Response(text || JSON.stringify({ ok: r.ok, status: r.status }), {
        status: r.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get single sitemap status
    if (action === 'get') {
      const r = await fetch(`${GATEWAY}/webmasters/v3/sites/${encSite}/sitemaps/${encSitemap}`, { headers: authHeaders });
      const text = await r.text();
      return new Response(text, { status: r.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
