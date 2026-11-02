import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const WA_TOKEN = Deno.env.get('WA_TOKEN')!;
const WABA_ID = Deno.env.get('WA_BUSINESS_ACCOUNT_ID')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const templates = [
  {
    // cupom para o cliente: os botões dizem como ele vai usar (a loja só é avisada nessa hora)
    name: 'clilin_cupom',
    language: 'pt_BR',
    category: 'UTILITY',
    components: [
      {
        type: 'BODY',
        text: 'Seu cupom da oferta *{{1}}* na *{{2}}*.\n\nCódigo: *{{3}}*\nVálido até: {{4}}\n\nNa hora de usar, toque em *Estou na loja* ou em *Pedir online*.',
        example: { body_text: [['Pizza grande + refri', 'Pizzaria do Bairro', 'CL8K4P2Q', '09/11 23:59']] },
      },
      {
        type: 'BUTTONS',
        buttons: [
          { type: 'QUICK_REPLY', text: 'Estou na loja' },
          { type: 'URL', text: 'Pedir online', url: 'https://clilin.com/pedir/{{1}}', example: ['https://clilin.com/pedir/7b0c3a52-0000-4000-8000-000000000000'] },
        ],
      },
    ],
  },
  {
    // para a loja: o cliente vai usar agora; o botão confirma o uso
    name: 'clilin_cliente_usando',
    language: 'pt_BR',
    category: 'UTILITY',
    components: [
      {
        type: 'BODY',
        text: '*{{1}}* {{2}} com o cupom *{{3}}*.\n\nCódigo: *{{4}}*\n\nQuando atender, toque em *Confirmar uso*.',
        example: { body_text: [['Maria S.', 'está na loja', 'Pizza grande + refri', 'CL8K4P2Q']] },
      },
      { type: 'BUTTONS', buttons: [{ type: 'QUICK_REPLY', text: 'Confirmar uso' }] },
    ],
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Verify admin
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

    if (!WA_TOKEN || !WABA_ID) {
      return new Response(JSON.stringify({ error: 'WA_TOKEN or WA_BUSINESS_ACCOUNT_ID missing' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: any[] = [];
    for (const tpl of templates) {
      const resp = await fetch(`https://graph.facebook.com/v19.0/${WABA_ID}/message_templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WA_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tpl),
      });
      const body = await resp.json();
      results.push({ name: tpl.name, ok: resp.ok, status: resp.status, response: body });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
