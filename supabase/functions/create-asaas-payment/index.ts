import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASAAS_API_URL = Deno.env.get('ASAAS_SANDBOX') === 'true' 
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://api.asaas.com/api/v3';

const CREDIT_VALUE_BRL = 0.10;

interface PaymentRequest {
  amount_brl: number;
  payment_method: 'PIX' | 'CREDIT_CARD';
  // Para cartão de crédito
  card_holder_name?: string;
  card_number?: string;
  card_expiry_month?: string;
  card_expiry_year?: string;
  card_cvv?: string;
  installments?: number;
  // Dados do cliente para criar no Asaas
  customer_name?: string;
  customer_email?: string;
  customer_cpf_cnpj?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');
    if (!ASAAS_API_KEY) {
      console.error('ASAAS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Serviço de pagamento não configurado. Entre em contato com o suporte.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, name, email, cpf, cnpj, asaas_customer_id, balance')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Perfil não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: PaymentRequest = await req.json();
    const { amount_brl, payment_method, installments = 1 } = body;

    // Validações
    if (!amount_brl || amount_brl < 100) {
      return new Response(
        JSON.stringify({ error: 'Valor mínimo é R$ 100,00' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['PIX', 'CREDIT_CARD'].includes(payment_method)) {
      return new Response(
        JSON.stringify({ error: 'Método de pagamento inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar ou buscar cliente no Asaas
    let asaasCustomerId = profile.asaas_customer_id;
    
    if (!asaasCustomerId) {
      console.log('Creating new Asaas customer...');
      
      const customerData = {
        name: body.customer_name || profile.name,
        email: body.customer_email || profile.email || user.email,
        cpfCnpj: body.customer_cpf_cnpj || profile.cnpj || profile.cpf,
      };

      if (!customerData.cpfCnpj) {
        return new Response(
          JSON.stringify({ error: 'CPF ou CNPJ é obrigatório para criar pagamento' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const customerResponse = await fetch(`${ASAAS_API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY,
        },
        body: JSON.stringify(customerData),
      });

      const customerResult = await customerResponse.json();
      
      if (!customerResponse.ok) {
        console.error('Asaas customer creation failed:', customerResult);
        return new Response(
          JSON.stringify({ error: customerResult.errors?.[0]?.description || 'Erro ao criar cliente no Asaas' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      asaasCustomerId = customerResult.id;
      
      // Salvar ID do cliente no perfil usando service role
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabaseAdmin
        .from('profiles')
        .update({ asaas_customer_id: asaasCustomerId })
        .eq('id', profile.id);
    }

    // Calcular créditos
    const amount_credits = Math.floor(amount_brl / CREDIT_VALUE_BRL);

    // Criar cobrança no Asaas
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1); // Vencimento em 1 dia

    const paymentData: Record<string, unknown> = {
      customer: asaasCustomerId,
      billingType: payment_method === 'PIX' ? 'PIX' : 'CREDIT_CARD',
      value: amount_brl,
      dueDate: dueDate.toISOString().split('T')[0],
      description: `Créditos Clilin - ${amount_credits} créditos`,
    };

    // Se for cartão de crédito, adicionar dados do cartão
    if (payment_method === 'CREDIT_CARD') {
      if (!body.card_number || !body.card_holder_name || !body.card_expiry_month || 
          !body.card_expiry_year || !body.card_cvv) {
        return new Response(
          JSON.stringify({ error: 'Dados do cartão incompletos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      paymentData.creditCard = {
        holderName: body.card_holder_name,
        number: body.card_number.replace(/\s/g, ''),
        expiryMonth: body.card_expiry_month,
        expiryYear: body.card_expiry_year,
        ccv: body.card_cvv,
      };

      paymentData.creditCardHolderInfo = {
        name: body.card_holder_name,
        email: profile.email || user.email,
        cpfCnpj: body.customer_cpf_cnpj || profile.cnpj || profile.cpf,
        postalCode: '00000000', // Placeholder se não tiver
        addressNumber: '0',
        phone: '00000000000',
      };

      if (installments > 1) {
        paymentData.installmentCount = installments;
        paymentData.installmentValue = Math.ceil((amount_brl / installments) * 100) / 100;
      }
    }

    console.log('Creating Asaas payment:', { billingType: paymentData.billingType, value: paymentData.value });

    const paymentResponse = await fetch(`${ASAAS_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
      },
      body: JSON.stringify(paymentData),
    });

    const paymentResult = await paymentResponse.json();

    if (!paymentResponse.ok) {
      console.error('Asaas payment creation failed:', paymentResult);
      return new Response(
        JSON.stringify({ error: paymentResult.errors?.[0]?.description || 'Erro ao criar pagamento' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Asaas payment created:', paymentResult.id);

    // Para PIX, buscar QR Code
    let pixQrCode = null;
    let pixCode = null;

    if (payment_method === 'PIX') {
      const pixResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentResult.id}/pixQrCode`, {
        headers: {
          'access_token': ASAAS_API_KEY,
        },
      });

      if (pixResponse.ok) {
        const pixData = await pixResponse.json();
        pixQrCode = pixData.encodedImage;
        pixCode = pixData.payload;
      }
    }

    // Salvar pagamento no banco
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // Expira em 30 minutos

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        profile_id: profile.id,
        asaas_payment_id: paymentResult.id,
        amount_brl,
        amount_credits,
        payment_method,
        status: payment_method === 'CREDIT_CARD' && paymentResult.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING',
        pix_qr_code: pixQrCode,
        pix_code: pixCode,
        installments,
        expires_at: payment_method === 'PIX' ? expiresAt.toISOString() : null,
        confirmed_at: paymentResult.status === 'CONFIRMED' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error saving payment:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar pagamento' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se cartão foi confirmado imediatamente, adicionar créditos
    if (payment_method === 'CREDIT_CARD' && paymentResult.status === 'CONFIRMED') {
      await supabaseAdmin
        .from('profiles')
        .update({ balance: profile.balance + amount_credits })
        .eq('id', profile.id);

      await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: profile.id,
          amount: amount_credits,
          type: 'DEPOSIT',
          description: `Depósito via Cartão de Crédito - R$ ${amount_brl.toFixed(2)}`,
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: payment.id,
        asaas_payment_id: paymentResult.id,
        status: payment.status,
        amount_brl,
        amount_credits,
        payment_method,
        pix_qr_code: pixQrCode,
        pix_code: pixCode,
        expires_at: payment.expires_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
