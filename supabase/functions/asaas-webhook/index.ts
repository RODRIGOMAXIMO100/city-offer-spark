import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
};

const CREDIT_VALUE_BRL = 0.10;

interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    customer: string;
    value: number;
    status: string;
    billingType: string;
  };
  transfer?: {
    id: string;
    value: number;
    status: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: AsaasWebhookPayload = await req.json();
    console.log('Asaas webhook received:', JSON.stringify(body, null, 2));

    const { event, payment, transfer } = body;

    // Eventos de pagamento (receber créditos)
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      if (!payment) {
        console.error('No payment data in webhook');
        return new Response(JSON.stringify({ error: 'No payment data' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      console.log(`Processing payment ${payment.id} with status ${payment.status}`);

      // Buscar pagamento no banco
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('payments')
        .select('*, profiles!inner(id, balance)')
        .eq('asaas_payment_id', payment.id)
        .single();

      if (paymentError || !paymentRecord) {
        console.error('Payment not found:', payment.id, paymentError);
        return new Response(JSON.stringify({ error: 'Payment not found' }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // Se já foi confirmado, ignorar
      if (paymentRecord.status === 'CONFIRMED') {
        console.log('Payment already confirmed, skipping');
        return new Response(JSON.stringify({ success: true, message: 'Already processed' }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // Atualizar status do pagamento
      const { error: updateError } = await supabase
        .from('payments')
        .update({ 
          status: 'CONFIRMED',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.id);

      if (updateError) {
        console.error('Error updating payment:', updateError);
        return new Response(JSON.stringify({ error: 'Error updating payment' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // Adicionar créditos ao saldo
      const newBalance = paymentRecord.profiles.balance + paymentRecord.amount_credits;
      
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', paymentRecord.profile_id);

      if (balanceError) {
        console.error('Error updating balance:', balanceError);
        return new Response(JSON.stringify({ error: 'Error updating balance' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // Registrar transação
      await supabase
        .from('transactions')
        .insert({
          user_id: paymentRecord.profile_id,
          amount: paymentRecord.amount_credits,
          type: 'DEPOSIT',
          description: `Depósito via ${paymentRecord.payment_method} - R$ ${paymentRecord.amount_brl.toFixed(2)}`,
        });

      // Criar notificação
      await supabase
        .from('notifications')
        .insert({
          user_id: paymentRecord.profile_id,
          type: 'PAYMENT_CONFIRMED',
          title: 'Pagamento confirmado! 💰',
          message: `Seus ${paymentRecord.amount_credits} créditos (R$ ${paymentRecord.amount_brl.toFixed(2)}) foram adicionados à sua conta.`,
          data: { payment_id: paymentRecord.id, amount_credits: paymentRecord.amount_credits }
        });

      console.log(`Payment ${payment.id} confirmed. Added ${paymentRecord.amount_credits} credits.`);

      return new Response(JSON.stringify({ success: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Evento de estorno
    if (event === 'PAYMENT_REFUNDED') {
      if (!payment) {
        return new Response(JSON.stringify({ error: 'No payment data' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      console.log(`Processing refund for payment ${payment.id}`);

      const { data: paymentRecord, error: paymentError } = await supabase
        .from('payments')
        .select('*, profiles!inner(id, balance)')
        .eq('asaas_payment_id', payment.id)
        .single();

      if (paymentError || !paymentRecord) {
        console.error('Payment not found for refund:', payment.id);
        return new Response(JSON.stringify({ error: 'Payment not found' }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // Atualizar status
      await supabase
        .from('payments')
        .update({ status: 'REFUNDED' })
        .eq('id', paymentRecord.id);

      // Remover créditos do saldo (se ainda tiver)
      const newBalance = Math.max(0, paymentRecord.profiles.balance - paymentRecord.amount_credits);
      
      await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', paymentRecord.profile_id);

      // Notificar usuário
      await supabase
        .from('notifications')
        .insert({
          user_id: paymentRecord.profile_id,
          type: 'PAYMENT_REFUNDED',
          title: 'Pagamento estornado',
          message: `O pagamento de R$ ${paymentRecord.amount_brl.toFixed(2)} foi estornado.`,
          data: { payment_id: paymentRecord.id }
        });

      console.log(`Refund processed for payment ${payment.id}`);

      return new Response(JSON.stringify({ success: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Evento de transferência concluída (saques)
    if (event === 'TRANSFER_COMPLETED') {
      if (!transfer) {
        return new Response(JSON.stringify({ error: 'No transfer data' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      console.log(`Processing transfer completion ${transfer.id}`);

      // Buscar saque pelo ID da transferência
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('asaas_transfer_id', transfer.id)
        .single();

      if (withdrawalError || !withdrawal) {
        console.error('Withdrawal not found for transfer:', transfer.id);
        return new Response(JSON.stringify({ error: 'Withdrawal not found' }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // Atualizar status do saque
      await supabase
        .from('withdrawals')
        .update({ 
          status: 'COMPLETED',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', withdrawal.id);

      // Notificar usuário
      await supabase
        .from('notifications')
        .insert({
          user_id: withdrawal.user_id,
          type: 'WITHDRAWAL_COMPLETED',
          title: 'Saque concluído! 🎉',
          message: `Seu saque de R$ ${withdrawal.amount_brl.toFixed(2)} foi transferido para sua conta PIX.`,
          data: { withdrawal_id: withdrawal.id }
        });

      console.log(`Transfer ${transfer.id} completed for withdrawal ${withdrawal.id}`);

      return new Response(JSON.stringify({ success: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Evento não tratado
    console.log('Unhandled event:', event);
    return new Response(JSON.stringify({ success: true, message: 'Event not handled' }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
