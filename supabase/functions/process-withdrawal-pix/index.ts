import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASAAS_API_URL = Deno.env.get('ASAAS_SANDBOX') === 'true' 
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://api.asaas.com/api/v3';

interface WithdrawalRequest {
  withdrawal_id: string;
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
        JSON.stringify({ error: 'Serviço de pagamento não configurado' }),
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

    // Verificar se é admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'ADMIN') {
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem processar saques' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: WithdrawalRequest = await req.json();
    const { withdrawal_id } = body;

    if (!withdrawal_id) {
      return new Response(
        JSON.stringify({ error: 'ID do saque é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar saque com service role para ter acesso completo
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: withdrawal, error: withdrawalError } = await supabaseAdmin
      .from('withdrawals')
      .select('*, profiles!withdrawals_user_id_fkey(id, name, email)')
      .eq('id', withdrawal_id)
      .single();

    if (withdrawalError || !withdrawal) {
      console.error('Withdrawal not found:', withdrawal_id, withdrawalError);
      return new Response(
        JSON.stringify({ error: 'Saque não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se saque está aprovado
    if (withdrawal.status !== 'APPROVED') {
      return new Response(
        JSON.stringify({ error: `Saque precisa estar aprovado. Status atual: ${withdrawal.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já tem transferência
    if (withdrawal.asaas_transfer_id) {
      return new Response(
        JSON.stringify({ error: 'Este saque já foi processado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing withdrawal:', withdrawal_id, 'Amount:', withdrawal.amount_brl);

    // Criar transferência PIX no Asaas
    const transferData = {
      value: withdrawal.amount_brl,
      pixAddressKey: withdrawal.pix_key,
      pixAddressKeyType: mapPixType(withdrawal.pix_tipo),
      description: `Saque Clilin - ${withdrawal.nome_completo}`,
    };

    console.log('Creating Asaas transfer:', transferData);

    const transferResponse = await fetch(`${ASAAS_API_URL}/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
      },
      body: JSON.stringify(transferData),
    });

    const transferResult = await transferResponse.json();

    if (!transferResponse.ok) {
      console.error('Asaas transfer failed:', transferResult);
      return new Response(
        JSON.stringify({ 
          error: transferResult.errors?.[0]?.description || 'Erro ao criar transferência PIX',
          details: transferResult
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Asaas transfer created:', transferResult.id);

    // Atualizar saque com ID da transferência e status
    const { error: updateError } = await supabaseAdmin
      .from('withdrawals')
      .update({ 
        asaas_transfer_id: transferResult.id,
        status: 'PROCESSING',
        reviewed_at: new Date().toISOString(),
        reviewed_by: (await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()).data?.id
      })
      .eq('id', withdrawal_id);

    if (updateError) {
      console.error('Error updating withdrawal:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar saque' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Notificar usuário
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: withdrawal.user_id,
        type: 'WITHDRAWAL_PROCESSING',
        title: 'Saque em processamento 🏦',
        message: `Seu saque de R$ ${withdrawal.amount_brl.toFixed(2)} está sendo transferido para sua conta PIX.`,
        data: { withdrawal_id: withdrawal.id }
      });

    return new Response(
      JSON.stringify({
        success: true,
        transfer_id: transferResult.id,
        status: 'PROCESSING',
        message: 'Transferência PIX iniciada com sucesso'
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

function mapPixType(pixTipo: string): string {
  const mapping: Record<string, string> = {
    'cpf': 'CPF',
    'cnpj': 'CNPJ',
    'email': 'EMAIL',
    'telefone': 'PHONE',
    'celular': 'PHONE',
    'aleatoria': 'EVP',
    'chave_aleatoria': 'EVP',
  };
  return mapping[pixTipo?.toLowerCase()] || 'EVP';
}
