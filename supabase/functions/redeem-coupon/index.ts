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
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const code = String(body?.code ?? "").trim().toUpperCase();
    if (!/^[A-Z0-9]{8}$/.test(code)) {
      return new Response(JSON.stringify({ error: "Código inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Get caller's profile id
    const { data: profile } = await admin
      .from("profiles")
      .select("id, telefone, name")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Perfil não encontrado" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch coupon
    const { data: coupon, error: cErr } = await admin
      .from("coupons")
      .select("id, code, offer_id, company_id, customer_name, customer_phone, status, expires_at, redeemed_at")
      .eq("code", code)
      .maybeSingle();

    if (cErr || !coupon) {
      return new Response(JSON.stringify({ error: "Cupom não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (coupon.company_id !== profile.id) {
      return new Response(JSON.stringify({ error: "Este cupom pertence a outra empresa" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (coupon.status === "REDEEMED") {
      return new Response(JSON.stringify({
        error: "Cupom já resgatado",
        redeemed_at: coupon.redeemed_at,
      }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (new Date(coupon.expires_at) < new Date()) {
      await admin.from("coupons").update({ status: "EXPIRED" }).eq("id", coupon.id).eq("status", "ISSUED");
      return new Response(JSON.stringify({ error: "Cupom expirado" }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Atomic update: only redeem if still ISSUED
    const { data: updated, error: uErr } = await admin
      .from("coupons")
      .update({
        status: "REDEEMED",
        redeemed_at: new Date().toISOString(),
        redeemed_by_whatsapp: profile.telefone ?? null,
      })
      .eq("id", coupon.id)
      .eq("status", "ISSUED")
      .select("id, code, customer_name, customer_phone, redeemed_at, offer_id")
      .maybeSingle();

    if (uErr || !updated) {
      return new Response(JSON.stringify({ error: "Não foi possível resgatar. Tente novamente." }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load offer title for the receipt
    const { data: offer } = await admin
      .from("offers")
      .select("title")
      .eq("id", updated.offer_id)
      .maybeSingle();

    // Send confirmation template (best-effort)
    const waToken = Deno.env.get("WA_TOKEN");
    const waPhoneId = Deno.env.get("WA_PHONE_NUMBER_ID");
    if (waToken && waPhoneId && updated.customer_phone && offer?.title) {
      try {
        const to = updated.customer_phone.startsWith("55")
          ? updated.customer_phone
          : `55${updated.customer_phone}`;
        const metaRes = await fetch(`https://graph.facebook.com/v19.0/${waPhoneId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${waToken}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "template",
            template: {
              name: "clilin_resgate_confirmado",
              language: { code: "pt_BR" },
              components: [{
                type: "body",
                parameters: [{ type: "text", text: offer.title }],
              }],
            },
          }),
        });
        if (!metaRes.ok) {
          const metaJson = await metaRes.json().catch(() => ({}));
          console.error("[redeem-coupon] Meta error:", metaJson);
        }
      } catch (err) {
        console.error("[redeem-coupon] Meta fetch error:", err);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      coupon: {
        code: updated.code,
        customer_name: updated.customer_name,
        customer_phone: updated.customer_phone,
        redeemed_at: updated.redeemed_at,
        offer_title: offer?.title ?? null,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
