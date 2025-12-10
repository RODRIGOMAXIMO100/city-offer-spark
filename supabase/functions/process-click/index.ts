import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Business config
const CPC_COST_COMPANY = 5; // Créditos que a empresa paga
const CPC_PAYOUT_AFFILIATE = 3; // Créditos que o afiliado recebe
const CPC_PLATFORM_FEE = 2; // Lucro da plataforma

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { offerId, affiliateId, clientIp, userAgent, clickType = 'MAIN' } = await req.json();

    if (!offerId) {
      return new Response(
        JSON.stringify({ error: "Offer ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get offer details with company profile
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select(`
        id,
        company_id,
        link_destination,
        active,
        profiles!offers_company_id_fkey(id, balance, user_id, instagram_url)
      `)
      .eq("id", offerId)
      .single();

    if (offerError || !offer) {
      console.error("Offer not found:", offerError);
      return new Response(
        JSON.stringify({ error: "Oferta não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!offer.active) {
      return new Response(
        JSON.stringify({ error: "Oferta não está mais ativa" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const companyProfile = offer.profiles as any;

    // If it's an Instagram click, it's FREE - just record the click and return
    if (clickType === 'INSTAGRAM') {
      // Record click without charging
      await supabase.from("offer_clicks").insert({
        offer_id: offerId,
        affiliate_id: affiliateId || null,
        client_ip: clientIp,
        user_agent: userAgent,
        click_type: 'INSTAGRAM',
      });

      console.log(`Instagram click recorded for offer ${offerId} - FREE (no credits charged)`);

      return new Response(
        JSON.stringify({
          success: true,
          redirectUrl: companyProfile.instagram_url || offer.link_destination,
          clickType: 'INSTAGRAM',
          charged: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // MAIN click - charge credits
    // Check company balance
    if (companyProfile.balance < CPC_COST_COMPANY) {
      // Deactivate offer if no balance
      await supabase
        .from("offers")
        .update({ active: false })
        .eq("id", offerId);

      return new Response(
        JSON.stringify({ error: "Empresa sem créditos suficientes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Start transaction-like operations
    // 1. Debit company
    const { error: debitError } = await supabase
      .from("profiles")
      .update({ balance: companyProfile.balance - CPC_COST_COMPANY })
      .eq("id", companyProfile.id);

    if (debitError) {
      console.error("Error debiting company:", debitError);
      throw new Error("Erro ao processar pagamento");
    }

    // 2. Record company transaction
    await supabase.from("transactions").insert({
      user_id: companyProfile.id,
      amount: -CPC_COST_COMPANY,
      type: "CLICK_COST",
      description: `Clique na oferta`,
      offer_id: offerId,
    });

    // 3. Credit affiliate if present
    if (affiliateId) {
      const { data: affiliateProfile } = await supabase
        .from("profiles")
        .select("id, balance")
        .eq("id", affiliateId)
        .single();

      if (affiliateProfile) {
        await supabase
          .from("profiles")
          .update({ balance: affiliateProfile.balance + CPC_PAYOUT_AFFILIATE })
          .eq("id", affiliateProfile.id);

        await supabase.from("transactions").insert({
          user_id: affiliateProfile.id,
          amount: CPC_PAYOUT_AFFILIATE,
          type: "CLICK_EARNING",
          description: `Comissão por clique`,
          offer_id: offerId,
        });
      }
    }

    // 4. Record click
    await supabase.from("offer_clicks").insert({
      offer_id: offerId,
      affiliate_id: affiliateId || null,
      client_ip: clientIp,
      user_agent: userAgent,
      click_type: 'MAIN',
    });

    // 5. Increment click count
    await supabase.rpc("increment_offer_clicks", { offer_id: offerId });

    console.log(`Main click processed for offer ${offerId} - Company charged ${CPC_COST_COMPANY} credits`);

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: offer.link_destination,
        clickType: 'MAIN',
        charged: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in process-click:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
