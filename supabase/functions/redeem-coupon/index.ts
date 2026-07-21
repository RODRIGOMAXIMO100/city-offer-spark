// redeem-coupon v2 — mesma funcao do painel (deployada) + FINANCEIRO:
// agora o resgate pelo painel tambem debita a empresa (REDEMPTION_COST)
// e comissiona o divulgador (REDEMPTION_EARNING), igual ao wa-webhook.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Não autenticado" }, 401);
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "Sessão inválida" }, 401);
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const code = String(body?.code ?? "").trim().toUpperCase();
    if (!/^[A-Z0-9]{8}$/.test(code)) {
      return json({ error: "Código inválido" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: profile } = await admin
      .from("profiles")
      .select("id, telefone, name")
      .eq("user_id", userId)
      .maybeSingle();
    if (!profile) return json({ error: "Perfil não encontrado" }, 403);

    const { data: coupon, error: cErr } = await admin
      .from("coupons")
      .select("id, code, offer_id, company_id, customer_name, customer_phone, status, expires_at, redeemed_at")
      .eq("code", code)
      .maybeSingle();
    if (cErr || !coupon) return json({ error: "Cupom não encontrado" }, 404);

    if (coupon.company_id !== profile.id) {
      return json({ error: "Este cupom pertence a outra empresa" }, 403);
    }
    if (coupon.status === "REDEEMED") {
      return json({ error: "Cupom já resgatado", redeemed_at: coupon.redeemed_at }, 409);
    }
    if (new Date(coupon.expires_at) < new Date()) {
      await admin.from("coupons").update({ status: "EXPIRED" }).eq("id", coupon.id).eq("status", "ISSUED");
      return json({ error: "Cupom expirado" }, 410);
    }

    // Atomic update: so resgata se ainda ISSUED
    const { data: updated, error: uErr } = await admin
      .from("coupons")
      .update({
        status: "REDEEMED",
        redeemed_at: new Date().toISOString(),
        redeemed_by_whatsapp: profile.telefone ?? null,
      })
      .eq("id", coupon.id)
      .eq("status", "ISSUED")
      .select("id, code, customer_name, customer_phone, redeemed_at, offer_id, affiliate_id")
      .maybeSingle();

    if (uErr || !updated) {
      return json({ error: "Não foi possível resgatar. Tente novamente." }, 409);
    }

    // ---- NOVO: FINANCEIRO (identico ao wa-webhook / padrao process-click) ----
    const { data: pricing } = await admin
      .from("pricing_config")
      .select("redemption_cost, redemption_affiliate_share")
      .limit(1).maybeSingle();
    const cost = pricing?.redemption_cost ?? 300;
    const share = Number(pricing?.redemption_affiliate_share ?? 0.6);

    // debita a empresa (saldo pode negativar — cliente esta no balcao)
    const { data: companyProfile } = await admin
      .from("profiles").select("id, balance").eq("id", coupon.company_id).maybeSingle();
    if (companyProfile) {
      await admin.from("profiles")
        .update({ balance: (companyProfile.balance ?? 0) - cost }).eq("id", companyProfile.id);
      await admin.from("transactions").insert({
        user_id: companyProfile.id, amount: -cost, type: "REDEMPTION_COST",
        offer_id: updated.offer_id, description: `Resgate cupom ${updated.code}`,
      });
    }

    // comissiona o divulgador (se atribuido; respeita banned/balance_frozen e nivel)
    if (updated.affiliate_id) {
      const { data: aff } = await admin
        .from("profiles").select("id, balance, banned, balance_frozen")
        .eq("id", updated.affiliate_id).maybeSingle();
      if (aff && !aff.banned && !aff.balance_frozen) {
        let payout = Math.round(cost * share);
        const { data: mult } = await admin
          .rpc("get_commission_multiplier", { affiliate_profile_id: aff.id });
        if (typeof mult === "number" && mult > 0) payout = Math.round(payout * mult);
        await admin.from("profiles")
          .update({ balance: (aff.balance ?? 0) + payout }).eq("id", aff.id);
        await admin.from("transactions").insert({
          user_id: aff.id, amount: payout, type: "REDEMPTION_EARNING",
          offer_id: updated.offer_id, description: `Comissão resgate ${updated.code}`,
        });
      }
    }

    const { data: offer } = await admin
      .from("offers").select("title").eq("id", updated.offer_id).maybeSingle();

    return json({
      success: true,
      coupon: {
        code: updated.code,
        customer_name: updated.customer_name,
        customer_phone: updated.customer_phone,
        redeemed_at: updated.redeemed_at,
        offer_title: offer?.title ?? null,
      },
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
