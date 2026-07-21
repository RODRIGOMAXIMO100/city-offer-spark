import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const COUPON_TTL_DAYS = 7;
const MAX_PER_PHONE_24H = 3;
const MAX_PER_IP_24H = 10;

function generateCode(): string {
  // 8 chars, no ambiguous (0/O, 1/I)
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

function normalizePhone(raw: string): string {
  return String(raw || "").replace(/\D/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const offerId = String(body?.offer_id ?? "").trim();
    const customerName = String(body?.customer_name ?? "").trim();
    const customerPhone = normalizePhone(body?.customer_phone ?? "");

    // Basic validation
    if (!offerId || !/^[0-9a-f-]{36}$/i.test(offerId)) {
      return new Response(JSON.stringify({ error: "offer_id inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (customerName.length < 3 || customerName.length > 100) {
      return new Response(JSON.stringify({ error: "Nome inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (customerPhone.length < 10 || customerPhone.length > 11) {
      return new Response(JSON.stringify({ error: "WhatsApp inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    // Fetch offer + company
    const { data: offer, error: offerErr } = await admin
      .from("offers")
      .select("id, company_id, active, deleted_at, expires_at, title")
      .eq("id", offerId)
      .maybeSingle();

    if (offerErr || !offer) {
      return new Response(JSON.stringify({ error: "Oferta não encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!offer.active || offer.deleted_at || new Date(offer.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Oferta indisponível" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: phone (per 24h)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: phoneCount } = await admin
      .from("coupons")
      .select("id", { count: "exact", head: true })
      .eq("customer_phone", customerPhone)
      .gte("created_at", since);
    if ((phoneCount ?? 0) >= MAX_PER_PHONE_24H) {
      return new Response(JSON.stringify({ error: "Limite diário atingido para este WhatsApp" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: IP (per 24h)
    if (clientIp !== "unknown") {
      const { count: ipCount } = await admin
        .from("coupons")
        .select("id", { count: "exact", head: true })
        .eq("customer_ip", clientIp)
        .gte("created_at", since);
      if ((ipCount ?? 0) >= MAX_PER_IP_24H) {
        return new Response(JSON.stringify({ error: "Muitos cupons deste dispositivo. Tente mais tarde." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Prevent duplicate active coupon for same phone + offer
    const { data: existing } = await admin
      .from("coupons")
      .select("id, code, expires_at, status")
      .eq("customer_phone", customerPhone)
      .eq("offer_id", offerId)
      .eq("status", "ISSUED")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({
        code: existing.code,
        expires_at: existing.expires_at,
        reused: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generate unique code (retry up to 5 times)
    let code = "";
    for (let i = 0; i < 5; i++) {
      const candidate = generateCode();
      const { data: dup } = await admin.from("coupons").select("id").eq("code", candidate).maybeSingle();
      if (!dup) { code = candidate; break; }
    }
    if (!code) {
      return new Response(JSON.stringify({ error: "Não foi possível gerar código" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expiresAt = new Date(Date.now() + COUPON_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data: inserted, error: insErr } = await admin
      .from("coupons")
      .insert({
        code,
        offer_id: offerId,
        company_id: offer.company_id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_ip: clientIp === "unknown" ? null : clientIp,
        expires_at: expiresAt,
        status: "ISSUED",
      })
      .select("code, expires_at")
      .single();

    if (insErr || !inserted) {
      console.error("insert coupon error:", insErr);
      return new Response(JSON.stringify({ error: "Erro ao emitir cupom" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch company name for template
    const { data: company } = await admin
      .from("profiles")
      .select("company_name, name")
      .eq("id", offer.company_id)
      .maybeSingle();
    const companyName = company?.company_name || company?.name || "Empresa parceira";

    // Send WhatsApp template (best-effort — never blocks the response)
    const waToken = Deno.env.get("WA_TOKEN");
    const waPhoneId = Deno.env.get("WA_PHONE_NUMBER_ID");
    let waSent = false;
    let waError: string | null = null;
    if (waToken && waPhoneId) {
      try {
        const to = customerPhone.startsWith("55") ? customerPhone : `55${customerPhone}`;
        const validade = new Date(inserted.expires_at).toLocaleDateString("pt-BR", {
          day: "2-digit", month: "2-digit", year: "numeric",
        });
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
              name: "clilin_cupom",
              language: { code: "pt_BR" },
              components: [{
                type: "body",
                parameters: [
                  { type: "text", text: offer.title },
                  { type: "text", text: companyName },
                  { type: "text", text: inserted.code },
                  { type: "text", text: validade },
                ],
              }],
            },
          }),
        });
        const metaJson = await metaRes.json();
        if (!metaRes.ok) {
          waError = metaJson?.error?.message || "meta_send_failed";
          console.error("[issue-coupon] Meta error:", metaJson);
        } else {
          waSent = true;
          console.log("[issue-coupon] Template sent to", to, "wamid:", metaJson.messages?.[0]?.id);
        }
      } catch (err) {
        waError = err instanceof Error ? err.message : "unknown";
        console.error("[issue-coupon] Meta fetch error:", err);
      }
    }

    return new Response(JSON.stringify({
      code: inserted.code,
      expires_at: inserted.expires_at,
      offer_title: offer.title,
      wa_sent: waSent,
      wa_error: waError,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
