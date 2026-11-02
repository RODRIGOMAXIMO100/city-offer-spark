// issue-coupon v3
//   (1) atribuicao do divulgador: lead_id, lead pelo telefone ou affiliate_id do link (?ref=)
//   (2) envio do cupom pelo WhatsApp Cloud API (template clilin_cupom)
//   (3) oferta pausa sozinha quando a empresa pre-paga nao tem saldo para o proximo cupom
//   (4) aviso para a loja no WhatsApp com o botao "Confirmar uso" (desliga em
//       profiles.preferences.aviso_cupom_whatsapp = false)
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
    const refAffiliate = String(body?.affiliate_id ?? "").trim() || null;

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
      .select("id, company_id, active, deleted_at, expires_at, title, price_new, coupon_valid_hours, profiles!offers_company_id_fkey(name, balance, billing_mode, banned)")
      .eq("id", offerId)
      .maybeSingle();

    if (offerErr || !offer) return json({ error: "Oferta não encontrada" }, 404);
    if (!offer.active || offer.deleted_at || new Date(offer.expires_at) < new Date()) {
      return json({ error: "Oferta indisponível" }, 400);
    }

    // Empresa pre-paga sem saldo para pagar o proximo cupom: oferta pausada
    // deno-lint-ignore no-explicit-any
    const company = (offer as any).profiles ?? {};
    if (company.banned) return json({ error: "Oferta indisponível" }, 400);
    if (String(company.billing_mode ?? "PRE").toUpperCase() === "PRE") {
      const { data: feeNow } = await admin.rpc("calc_redemption_fee", { p_offer_id: offerId });
      const need = typeof feeNow === "number" ? Math.ceil(feeNow * 0.9) : 300;
      if (Number(company.balance ?? 0) < need) {
        return json({ error: "Esta oferta está pausada no momento. Volte mais tarde." }, 409);
      }
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

    // 3) divulgador do link (?ref=): precisa ser divulgador ativo
    if (!affiliateId && refAffiliate && /^[0-9a-f-]{36}$/i.test(refAffiliate) && refAffiliate !== offer.company_id) {
      const { data: aff } = await admin
        .from("profiles").select("id, user_id, banned").eq("id", refAffiliate).maybeSingle();
      if (aff && !aff.banned) {
        const { data: isAff } = await admin.rpc("has_role", { _user_id: aff.user_id, _role: "AFFILIATE" });
        if (isAff) affiliateId = aff.id;
      }
    }

    // Reuso de cupom ISSUED vigente (comportamento atual mantido)
    const { data: existing } = await admin
      .from("coupons")
      .select("id, code, expires_at, status, affiliate_id")
      .eq("customer_phone", customerPhone).eq("offer_id", offerId)
      .eq("status", "ISSUED").gt("expires_at", new Date().toISOString())
      .maybeSingle();

    let coupon: { id: string; code: string; expires_at: string } | null = existing as any;
    let novo = false;

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
      novo = true;
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

    // ---- aviso para a loja com o botao "Confirmar uso" (best-effort) ----
    if (WA_TOKEN && WA_PHONE_NUMBER_ID && novo) {
      try {
        await avisaLoja(admin, offer.company_id, offer.title, coupon, customerName);
      } catch (e) {
        console.error("aviso loja:", e);
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

// Avisa a loja que alguém pegou um cupom. Dentro da janela de 24h da conversa manda
// mensagem com botão; fora dela, o modelo aprovado clilin_novo_cupom (botão de resposta rápida).
async function avisaLoja(
  admin: any, companyId: string, titulo: string,
  coupon: { id: string; code: string; expires_at: string }, customerName: string,
) {
  const { data: loja } = await admin.from("profiles").select("telefone, preferences").eq("id", companyId).maybeSingle();
  if ((loja?.preferences as any)?.aviso_cupom_whatsapp === false) return;
  const { data: nums } = await admin.from("merchant_whatsapp").select("phone").eq("profile_id", companyId).eq("verified", true).limit(3);
  let fones: string[] = (nums ?? []).map((n: any) => normalizePhone(n.phone));
  if (!fones.length && loja?.telefone) {
    const d = normalizePhone(loja.telefone);
    if (d.length >= 10) fones = [d.startsWith("55") && d.length >= 12 ? d : "55" + d];
  }
  if (!fones.length) return;
  const partes = String(customerName || "").trim().split(/\s+/).filter(Boolean);
  const cliente = partes.length > 1 ? `${partes[0]} ${partes[partes.length - 1][0].toUpperCase()}.` : (partes[0] || "Cliente");
  const validade = new Date(coupon.expires_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const WA_TOKEN = Deno.env.get("WA_TOKEN");
  const WA_PHONE_NUMBER_ID = Deno.env.get("WA_PHONE_NUMBER_ID");
  const desde = new Date(Date.now() - 23 * 36e5).toISOString();
  for (const to of fones) {
    const { data: recente } = await admin.from("wa_messages").select("id")
      .eq("phone", to).eq("direction", "IN").gte("created_at", desde).limit(1).maybeSingle();
    const corpo = recente
      ? {
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: `Novo cupom da sua oferta *${titulo}*.\n\nCliente: *${cliente}*\nCódigo: *${coupon.code}*\nVálido até: ${validade}\n\nQuando o cliente chegar, toque em *Confirmar uso*.` },
          action: { buttons: [{ type: "reply", reply: { id: `confirm_${coupon.id}`, title: "Confirmar uso" } }] },
        },
      }
      : {
        type: "template",
        template: {
          name: "clilin_novo_cupom",
          language: { code: "pt_BR" },
          components: [
            { type: "body", parameters: [titulo, cliente, coupon.code, validade].map((t) => ({ type: "text", text: t })) },
            { type: "button", sub_type: "quick_reply", index: "0", parameters: [{ type: "payload", payload: `confirm_${coupon.id}` }] },
          ],
        },
      };
    const resp = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, ...corpo }),
    });
    const r = await resp.json().catch(() => ({}));
    await admin.from("wa_messages").insert({
      direction: "OUT", phone: to, kind: recente ? "aviso_loja:botao" : "template:clilin_novo_cupom", payload: { ok: resp.ok, resp: r },
    });
  }
}
