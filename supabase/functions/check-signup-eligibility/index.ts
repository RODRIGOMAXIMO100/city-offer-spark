import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, cpf, honeypot } = await req.json();
    const clientIp = getClientIp(req);

    console.log(`[check-signup-eligibility] Checking eligibility for email: ${email}, IP: ${clientIp}`);

    // 1. HONEYPOT CHECK - Se preenchido, é bot
    if (honeypot && honeypot.trim() !== '') {
      console.log(`[check-signup-eligibility] BLOCKED: Honeypot filled - bot detected`);
      return new Response(JSON.stringify({
        eligible: false,
        reason: 'bot_detected',
        message: 'Cadastro não permitido.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. CHECK BLACKLIST - Email
    const { data: emailBlacklist } = await supabase
      .from('fraud_blacklist')
      .select('id')
      .eq('type', 'email')
      .eq('value', email.toLowerCase())
      .maybeSingle();

    if (emailBlacklist) {
      console.log(`[check-signup-eligibility] BLOCKED: Email in blacklist`);
      
      // Criar alerta
      await supabase.from('fraud_alerts').insert({
        alert_type: 'BLACKLIST_SIGNUP_ATTEMPT',
        severity: 'high',
        title: 'Tentativa de cadastro com email na blacklist',
        description: `Email ${email} tentou se cadastrar mas está na blacklist.`,
        data: { email, ip: clientIp }
      });

      return new Response(JSON.stringify({
        eligible: false,
        reason: 'blacklisted',
        message: 'Este email não está autorizado a criar uma conta.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. CHECK BLACKLIST - CPF (se fornecido)
    if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, '');
      const { data: cpfBlacklist } = await supabase
        .from('fraud_blacklist')
        .select('id')
        .eq('type', 'cpf')
        .eq('value', cleanCpf)
        .maybeSingle();

      if (cpfBlacklist) {
        console.log(`[check-signup-eligibility] BLOCKED: CPF in blacklist`);
        
        await supabase.from('fraud_alerts').insert({
          alert_type: 'BLACKLIST_SIGNUP_ATTEMPT',
          severity: 'high',
          title: 'Tentativa de cadastro com CPF na blacklist',
          description: `CPF tentou se cadastrar mas está na blacklist.`,
          data: { cpf: cleanCpf, email, ip: clientIp }
        });

        return new Response(JSON.stringify({
          eligible: false,
          reason: 'blacklisted',
          message: 'Este CPF não está autorizado a criar uma conta.'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 4. CHECK BLACKLIST - IP
    const { data: ipBlacklist } = await supabase
      .from('fraud_blacklist')
      .select('id')
      .eq('type', 'ip')
      .eq('value', clientIp)
      .maybeSingle();

    if (ipBlacklist) {
      console.log(`[check-signup-eligibility] BLOCKED: IP in blacklist`);
      
      await supabase.from('fraud_alerts').insert({
        alert_type: 'BLACKLIST_SIGNUP_ATTEMPT',
        severity: 'high',
        title: 'Tentativa de cadastro de IP na blacklist',
        description: `IP ${clientIp} tentou se cadastrar mas está na blacklist.`,
        data: { email, ip: clientIp }
      });

      return new Response(JSON.stringify({
        eligible: false,
        reason: 'blacklisted',
        message: 'Cadastro não permitido a partir deste endereço.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. RATE LIMIT - Máximo 3 cadastros por IP em 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentSignups, error: countError } = await supabase
      .from('signup_rate_limits')
      .select('id')
      .eq('ip_address', clientIp)
      .gte('created_at', twentyFourHoursAgo);

    if (countError) {
      console.error('[check-signup-eligibility] Error checking rate limits:', countError);
    }

    const signupCount = recentSignups?.length || 0;
    console.log(`[check-signup-eligibility] IP ${clientIp} has ${signupCount} signups in last 24h`);

    if (signupCount >= 3) {
      console.log(`[check-signup-eligibility] BLOCKED: Rate limit exceeded for IP ${clientIp}`);
      
      // Criar alerta se for a 4ª tentativa
      if (signupCount === 3) {
        await supabase.from('fraud_alerts').insert({
          alert_type: 'SIGNUP_RATE_LIMIT',
          severity: 'medium',
          title: 'Rate limit de cadastro atingido',
          description: `IP ${clientIp} tentou criar mais de 3 contas em 24h.`,
          data: { ip: clientIp, email, attempts: signupCount + 1 }
        });
      }

      return new Response(JSON.stringify({
        eligible: false,
        reason: 'rate_limited',
        message: 'Muitas contas foram criadas recentemente. Tente novamente mais tarde.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 6. Registrar tentativa de cadastro para rate limiting
    await supabase.from('signup_rate_limits').insert({
      ip_address: clientIp,
      email: email.toLowerCase()
    });

    console.log(`[check-signup-eligibility] ELIGIBLE: Signup allowed for ${email}`);

    return new Response(JSON.stringify({
      eligible: true,
      message: 'Cadastro permitido.'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[check-signup-eligibility] Error:', error);
    return new Response(JSON.stringify({ 
      eligible: false,
      reason: 'error',
      message: 'Erro ao verificar elegibilidade.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
