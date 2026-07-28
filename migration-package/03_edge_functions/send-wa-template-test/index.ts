import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const WA_TOKEN = Deno.env.get('WA_TOKEN')!;
const WA_PHONE_NUMBER_ID = Deno.env.get('WA_PHONE_NUMBER_ID')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function normalizePhone(input: string): string {
  const digits = (input || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid auth' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: userData.user.id, _role: 'ADMIN',
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Not admin' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!WA_TOKEN || !WA_PHONE_NUMBER_ID) {
      return new Response(JSON.stringify({ error: 'WA_TOKEN or WA_PHONE_NUMBER_ID missing' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const templateName: string = body.template;
    const to = normalizePhone(body.to || '');
    const variables: string[] = Array.isArray(body.variables) ? body.variables : [];

    if (!templateName || !to) {
      return new Response(JSON.stringify({ error: 'template and to are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const expected: Record<string, number> = {
      clilin_cupom: 4,
      clilin_resgate_confirmado: 1,
    };
    if (!(templateName in expected)) {
      return new Response(JSON.stringify({ error: 'Unknown template' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (variables.length !== expected[templateName]) {
      return new Response(JSON.stringify({
        error: `Template ${templateName} needs ${expected[templateName]} variables, got ${variables.length}`,
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'pt_BR' },
        components: [{
          type: 'body',
          parameters: variables.map((v) => ({ type: 'text', text: String(v) })),
        }],
      },
    };

    const resp = await fetch(`https://graph.facebook.com/v19.0/${WA_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const respBody = await resp.json();

    return new Response(JSON.stringify({
      ok: resp.ok,
      status: resp.status,
      sent_to: to,
      template: templateName,
      variables,
      response: respBody,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
