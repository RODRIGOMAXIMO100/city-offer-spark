// issue-coupon v2 — mesmo comportamento do deployado + 2 adicoes:
//   (1) atribuicao do divulgador (via lead_id opcional ou lookup por telefone)
//   (2) envio do cupom pelo WhatsApp Cloud API (template clilin_cupom)
// Secrets novos: WA_TOKEN, WA_PHONE_NUMBER_ID (sem eles, funciona como hoje: so tela)
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
    const leadId = String(body?.lead_id ?? "").trim() || null;

    if (!offerId || !/^[0-9a-f-]{36}$/i.test(offerId)) {
      return json({ error: "offer_id inválido" }, 400);
    }
    if (customerName.length < 3 || customerName.length > 100) {
      return json({ error: "Nome inválido" }, 400);
    }
    if (customerPhone.length < 10 || customerPhone.length > 11) {
      return json({ error: "WhatsApp inválido" }, 400);
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    const { data: offer, error: offerErr } = await admin
      .from("offers")
      .select("id, company_id, active, deleted_at, expires_at, title, price_new, coupon_valid_hours, profiles!offers_company_id_fkey(name)")
      .eq("id", offerId)
      .maybeSingle();

    if (offerErr || !offer) return json({ error: "Oferta não encontrada" }, 404);
    if (!offer.active || offer.deleted_at || new Date(offer.expires_at) < new Date()) {
      return json({ error: "Oferta indisponível" }, 400);
    }

    // Rate limit: phone (24h)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: phoneCount } = await admin
      .from("coupons").select("id", { count: "exact", head: true })
      .eq("customer_phone", customerPhone).gte("created_at", since);
    if ((phoneCount ?? 0) >= MAX_PER_PHONE_24H) {
      return json({ error: "Limite diário atingido para este WhatsApp" }, 429);
    }
    // Rate limit: IP (24h)
    if (clientIp !== "unknown") {
      const { count: ipCount } = await admin
        .from("coupons").select("id", { count: "exact", head: true })
        .eq("customer_ip", clientIp).gte("created_at", since);
      if ((ipCount ?? 0) >= MAX_PER_IP_24H) {
        return json({ error: "Muitos cupons deste dispositivo. Tente mais tarde." }, 429);
      }
    }

    // ---- NOVO: atribuicao do divulgador ----
    // 1) lead_id explicito; 2) lookup do lead mais recente dessa oferta com esse telefone
    let affiliateId: string | null = null;
    let resolvedLeadId: string | null = null;
    if (leadId && /^[0-9a-f-]{36}$/i.test(leadId)) {
      const { data: lead } = await admin
        .from("leads").select("id, offer_id, affiliate_id")
        .eq("id", leadId).maybeSingle();
      if (lead && lead.offer_id === offerId) {
        affiliateId = lead.affiliate_id ?? null;
        resolvedLeadId = lead.id;
      }
    }
    if (!resolvedLeadId) {
      const { data: lead } = await admin
        .from("leads").select("id, affiliate_id")
        .eq("offer_id", offerId)
        .in("phone_whatsapp", [customerPhone, "55" + customerPhone])
        .order("created_at", { ascending: false })
        .limit(1).maybeSingle();
      if (lead) { affiliateId = lead.affiliate_id ?? null; resolvedLeadId = lead.id; }
    }

    // Reuso de cupom ISSUED vigente (comportamento atual mantido)
    const { data: existing } = await admin
      .from("coupons")
      .select("id, code, expires_at, status, affiliate_id")
      .eq("customer_phone", customerPhone).eq("offer_id", offerId)
      .eq("status", "ISSUED").gt("expires_at", new Date().toISOString())
      .maybeSingle();

    let coupon: { id: string; code: string; expires_at: string } | null = existing as any;

    if (coupon && !((existing as any).affiliate_id) && affiliateId) {
      // completa atribuicao de cupom antigo sem afiliado
      await admin.from("coupons")
        .update({ affiliate_id: affiliateId, lead_id: resolvedLeadId })
        .eq("id", coupon.id);
    }

    if (!coupon) {
      let code = "";
      for (let i = 0; i < 5; i++) {
        const candidate = generateCode();
        const { data: dup } = await admin.from("coupons").select("id").eq("code", candidate).maybeSingle();
        if (!dup) { code = candidate; break; }
      }
      if (!code) return json({ error: "Não foi possível gerar código" }, 500);

      // FASE 1: validade definida pela empresa na oferta (fallback 7 dias),
      // sempre limitada pela data em que a propria oferta expira.
      const validHours = Number((offer as any).coupon_valid_hours) || COUPON_TTL_DAYS * 24;
      const expiresAt = new Date(
        Math.min(Date.now() + validHours * 36e5, new Date(offer.expires_at).getTime())
      ).toISOString();

      // FASE 1: taxa CONGELADA na emissao — max(piso, % do preco).
      // Se a empresa mudar o preco depois, este cupom mantem o valor combinado.
      let feeCents: number | null = null;
      const { data: feeRpc } = await admin.rpc("calc_redemption_fee", { p_offer_id: offerId });
      if (typeof feeRpc === "number" && feeRpc > 0) feeCents = feeRpc;

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
          affiliate_id: affiliateId,
          lead_id: resolvedLeadId,
          fee_cents: feeCents,
        })
        .select("id, code, expires_at")
        .single();

      if (insErr || !inserted) {
        console.error("insert coupon error:", insErr);
        return json({ error: "Erro ao emitir cupom" }, 500);
      }
      coupon = inserted;
    }

    // ---- NOVO: envio do cupom pelo WhatsApp (best-effort, nao bloqueia) ----
    let whatsappSent = false;
    const WA_TOKEN = Deno.env.get("WA_TOKEN");
    const WA_PHONE_NUMBER_ID = Deno.env.get("WA_PHONE_NUMBER_ID");
    if (WA_TOKEN && WA_PHONE_NUMBER_ID) {
      try {
        const to = "55" + customerPhone;
        const validade = new Date(coupon.expires_at).toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit",
          hour: "2-digit", minute: "2-digit",
        });
        const resp = await fetch(
          `https://graph.facebook.com/v21.0/${WA_PHONE_NUMBER_ID}/messages`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to,
              type: "template",
              template: {
                name: "clilin_cupom",
                language: { code: "pt_BR" },
                components: [{
                  type: "body",
                  parameters: [
                    { type: "text", text: offer.title },
                    { type: "text", text: (offer as any).profiles?.name || "Parceiro Clilin" },
                    { type: "text", text: coupon.code },
                    { type: "text", text: validade },
                  ],
                }],
              },
            }),
          }
        );
        const respJson = await resp.json().catch(() => ({}));
        whatsappSent = resp.ok;
        await admin.from("wa_messages").insert({
          direction: "OUT", phone: to, kind: "template:clilin_cupom",
          payload: { ok: resp.ok, resp: respJson },
        });
      } catch (waErr) {
        console.error("wa send error:", waErr);
      }
    }

    return json({
      code: coupon.code,
      expires_at: coupon.expires_at,
      offer_title: offer.title,
      whatsapp_sent: whatsappSent,
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
