// redeem-coupon v3 — resgate pelo painel.
// FASE 2: o financeiro saiu daqui e virou o RPC settle_redemption (atomico +
// idempotente), compartilhado com o wa-webhook. Ele respeita o billing_mode
// da empresa: PRE debita na hora com desconto pre-pago; POS acumula em fatura.
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
      .select("id, code, customer_name, customer_phone, redeemed_at, offer_id, affiliate_id, fee_cents")
      .maybeSingle();

    if (uErr || !updated) {
      return json({ error: "Não foi possível resgatar. Tente novamente." }, 409);
    }

    // ---- FINANCEIRO — FASE 2: liquidacao centralizada no banco ----
    // settle_redemption e atomico e idempotente. Ele decide pelo billing_mode
    // da empresa: PRE debita com desconto pre-pago e libera a comissao na hora;
    // POS nao debita e deixa custo + comissao PENDING, presos ao coupon_id,
    // ate um ADMIN dar baixa na fatura (mark_invoice_paid).
    const { data: settle, error: sErr } = await admin
      .rpc("settle_redemption", { p_coupon_id: updated.id });
    if (sErr) {
      // o cupom JA foi resgatado (cliente atendido). Nao derruba a resposta:
      // loga alto pro financeiro reconciliar depois.
      console.error("settle_redemption FALHOU", { code: updated.code, coupon_id: updated.id, err: sErr });
    }
    const billing = (settle && typeof settle === "object") ? settle as Record<string, unknown> : null;

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
      // como esse resgate foi cobrado (o painel usa pra dizer
      // "debitado do saldo" x "vai na sua proxima fatura")
      billing: billing ? {
        mode: billing.billing_mode ?? null,
        charged_cents: billing.charged_cents ?? null,
        gross_cents: billing.gross_cents ?? null,
      } : null,
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
