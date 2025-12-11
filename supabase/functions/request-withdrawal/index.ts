import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Business config - valores em centavos
const MIN_WITHDRAW_CENTS = 10000; // R$ 100 em centavos
const MIN_ACCOUNT_AGE_DAYS = 3; // Minimum account age for withdrawals

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile error:", profileError);
      return new Response(
        JSON.stringify({ error: "Perfil não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request body - amount já em centavos
    const { amount } = await req.json();

    // Validation: minimum withdrawal (amount já está em centavos)
    if (amount < MIN_WITHDRAW_CENTS) {
      return new Response(
        JSON.stringify({ error: `Mínimo para saque: R$ ${(MIN_WITHDRAW_CENTS / 100).toFixed(2)}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validation: sufficient balance (ambos em centavos)
    if (profile.balance < amount) {
      return new Response(
        JSON.stringify({ error: "Saldo insuficiente" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validation: payment data complete
    if (!profile.cpf || !profile.pix_key || !profile.nome_completo) {
      return new Response(
        JSON.stringify({ error: "Complete seus dados de pagamento antes de solicitar um saque" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for pending withdrawals
    const { data: pendingWithdrawals } = await supabase
      .from("withdrawals")
      .select("id")
      .eq("user_id", profile.id)
      .in("status", ["PENDING", "PROCESSING"])
      .limit(1);

    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
      return new Response(
        JSON.stringify({ error: "Você já tem um saque pendente. Aguarde a aprovação." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Converter centavos para reais para Asaas e exibição
    const amountBrl = amount / 100;

    // ========== FRAUD SCORE CALCULATION ==========
    let fraudScore = 0;
    const fraudReasons: string[] = [];

    // 1. Account age check
    const accountAge = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24));
    if (accountAge < MIN_ACCOUNT_AGE_DAYS) {
      fraudScore += 25;
      fraudReasons.push(`Conta com menos de ${MIN_ACCOUNT_AGE_DAYS} dias (${accountAge}d)`);
    } else if (accountAge < 7) {
      fraudScore += 10;
      fraudReasons.push(`Conta relativamente nova (${accountAge} dias)`);
    }

    // 2. Click concentration per offer
    const { data: clickStats } = await supabase
      .from("offer_clicks")
      .select("offer_id")
      .eq("affiliate_id", profile.id)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (clickStats && clickStats.length > 0) {
      const offerCounts = clickStats.reduce((acc, click) => {
        acc[click.offer_id] = (acc[click.offer_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const maxClicksPerOffer = Math.max(...Object.values(offerCounts));
      const concentration = maxClicksPerOffer / clickStats.length;

      if (concentration > 0.8) {
        fraudScore += 30;
        fraudReasons.push(`Alta concentração de cliques em uma oferta (${(concentration * 100).toFixed(0)}%)`);
      } else if (concentration > 0.5) {
        fraudScore += 15;
        fraudReasons.push(`Concentração moderada de cliques (${(concentration * 100).toFixed(0)}%)`);
      }
    }

    // 3. IP pattern analysis
    const { data: ipData } = await supabase
      .from("offer_clicks")
      .select("client_ip")
      .eq("affiliate_id", profile.id)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (ipData && ipData.length > 10) {
      const ipCounts = ipData.reduce((acc, click) => {
        acc[click.client_ip] = (acc[click.client_ip] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const uniqueIps = Object.keys(ipCounts).length;
      const ipConcentration = Math.max(...Object.values(ipCounts)) / ipData.length;

      if (uniqueIps < 3) {
        fraudScore += 25;
        fraudReasons.push(`Poucos IPs únicos (${uniqueIps} IPs)`);
      } else if (ipConcentration > 0.5) {
        fraudScore += 15;
        fraudReasons.push(`IP dominante nos cliques (${(ipConcentration * 100).toFixed(0)}%)`);
      }
    }

    // 4. Click velocity analysis
    const { data: recentClicks } = await supabase
      .from("offer_clicks")
      .select("created_at")
      .eq("affiliate_id", profile.id)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: true });

    if (recentClicks && recentClicks.length > 5) {
      // Check for suspiciously regular intervals (bot-like behavior)
      const intervals: number[] = [];
      for (let i = 1; i < recentClicks.length; i++) {
        intervals.push(
          new Date(recentClicks[i].created_at).getTime() - 
          new Date(recentClicks[i-1].created_at).getTime()
        );
      }

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((acc, i) => acc + Math.pow(i - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);

      // Low standard deviation = suspiciously regular intervals
      if (stdDev < avgInterval * 0.1 && intervals.length > 5) {
        fraudScore += 20;
        fraudReasons.push("Padrão de cliques muito regular (possível automação)");
      }
    }

    // 5. First withdrawal bonus fraud check
    const { data: previousWithdrawals } = await supabase
      .from("withdrawals")
      .select("id")
      .eq("user_id", profile.id)
      .eq("status", "COMPLETED");

    if (!previousWithdrawals || previousWithdrawals.length === 0) {
      // First withdrawal - extra scrutiny
      if (amountBrl > 100) {
        fraudScore += 10;
        fraudReasons.push("Primeiro saque com valor alto");
      }
    }

    // ========== CREATE WITHDRAWAL REQUEST ==========

    // Deduct balance immediately (em centavos)
    const { error: balanceError } = await supabase
      .from("profiles")
      .update({ balance: profile.balance - amount })
      .eq("id", profile.id);

    if (balanceError) {
      console.error("Error deducting balance:", balanceError);
      throw new Error("Erro ao processar saque");
    }

    // Record withdrawal transaction (em centavos)
    await supabase.from("transactions").insert({
      user_id: profile.id,
      amount: -amount,
      type: "WITHDRAW",
      description: `Solicitação de saque PIX - R$ ${amountBrl.toFixed(2)}`,
    });

    // Create withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from("withdrawals")
      .insert({
        user_id: profile.id,
        amount: amount, // em centavos
        amount_brl: amountBrl, // em reais
        pix_key: profile.pix_key,
        pix_tipo: profile.pix_tipo || "CPF",
        cpf: profile.cpf,
        nome_completo: profile.nome_completo,
        fraud_score: fraudScore,
        fraud_reasons: fraudReasons,
        status: "PENDING",
      })
      .select()
      .single();

    if (withdrawalError) {
      console.error("Error creating withdrawal:", withdrawalError);
      // Rollback balance
      await supabase
        .from("profiles")
        .update({ balance: profile.balance })
        .eq("id", profile.id);
      throw new Error("Erro ao criar solicitação de saque");
    }

    console.log(`Withdrawal request created - User: ${profile.id}, Amount: R$ ${amountBrl.toFixed(2)}, Fraud Score: ${fraudScore}`);

    return new Response(
      JSON.stringify({
        success: true,
        withdrawal: {
          id: withdrawal.id,
          amount_brl: amountBrl,
          status: "PENDING",
          fraud_score: fraudScore,
        },
        message: "Saque solicitado com sucesso! Aguarde a análise (até 24h úteis)."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in request-withdrawal:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});