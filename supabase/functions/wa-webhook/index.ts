// wa-webhook v2 — resgate de cupom pelo WhatsApp (Cloud API)
// Adaptado ao schema DEPLOYADO: codigo de 8 chars, customer_*, redeemed_by_whatsapp.
// Seguranca: GET handshake (WA_VERIFY_TOKEN) + POST assinado (WA_APP_SECRET, HMAC).
// Financeiro: debita empresa (REDEMPTION_COST) e comissiona divulgador
// (REDEMPTION_EARNING) no MESMO padrao do process-click.
// Secrets: WA_TOKEN, WA_PHONE_NUMBER_ID, WA_VERIFY_TOKEN, WA_APP_SECRET
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// codigo do cupom: 8 chars do alfabeto sem 0/O/1/I (igual ao generateCode deployado)
const CODE_RE = /\b([A-HJ-NP-Z2-9]{8})\b/;
const digits = (p: string) => (p || "").replace(/\D/g, "");

async function validSignature(raw: string, header: string | null, secret: string): Promise<boolean> {
  if (!header?.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  const hex = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, "0")).join("");
  const given = header.slice(7);
  if (hex.length !== given.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

async function waSend(to: string, payload: Record<string, unknown>) {
  const WA_TOKEN = Deno.env.get("WA_TOKEN")!;
  const WA_PHONE_NUMBER_ID = Deno.env.get("WA_PHONE_NUMBER_ID")!;
  const resp = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, ...payload }),
  });
  return { ok: resp.ok, body: await resp.json().catch(() => ({})) };
}
const waText = (to: string, text: string) => waSend(to, { type: "text", text: { body: text } });

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // ---- handshake (Meta chama 1x ao configurar o webhook) ----
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge") || "";
    if (mode === "subscribe" && token === Deno.env.get("WA_VERIFY_TOKEN")) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("forbidden", { status: 403 });
  }
  if (req.method !== "POST") return new Response("ok", { status: 200 });

  // ---- assinatura obrigatoria ----
  const raw = await req.text();
  const APP_SECRET = Deno.env.get("WA_APP_SECRET") || "";
  if (!APP_SECRET || !(await validSignature(raw, req.headers.get("x-hub-signature-256"), APP_SECRET))) {
    return new Response("invalid signature", { status: 401 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = JSON.parse(raw);
    const value = body?.entry?.[0]?.changes?.[0]?.value;
    const msg = value?.messages?.[0];
    if (!msg) return new Response("ok", { status: 200 });

    const from = digits(msg.from); // vem com DDI: 55319...
    await admin.from("wa_messages").insert({ direction: "IN", phone: from, kind: msg.type, payload: msg });

    // so numero de LOJISTA cadastrado opera resgate; resto e ignorado em silencio
    const { data: merchant } = await admin
      .from("merchant_whatsapp")
      .select("profile_id, verified")
      .eq("phone", from).eq("verified", true).maybeSingle();
    if (!merchant) return new Response("ok", { status: 200 });

    // ========== 1) LOJISTA MANDOU UM CODIGO ==========
    if (msg.type === "text") {
      const m = (msg.text?.body || "").toUpperCase().match(CODE_RE);
      if (!m) {
        await waText(from, "Envie o código do cupom (8 letras/números, ex: A7K3MQ2X) para validar um resgate. 💛");
        return new Response("ok", { status: 200 });
      }
      const code = m[1];
      const { data: coupon } = await admin
        .from("coupons")
        .select("id, code, status, expires_at, customer_name, offers(title)")
        .eq("code", code).eq("company_id", merchant.profile_id).maybeSingle();

      if (!coupon) {
        await waText(from, `❌ Cupom *${code}* não encontrado para a sua loja. Confira o código.`);
      } else if (coupon.status === "REDEEMED") {
        await waText(from, `⚠️ Cupom *${code}* JÁ FOI RESGATADO. Não aceite novamente.`);
      } else if (coupon.status !== "ISSUED" || new Date(coupon.expires_at) <= new Date()) {
        if (coupon.status === "ISSUED") {
          await admin.from("coupons").update({ status: "EXPIRED" }).eq("id", coupon.id).eq("status", "ISSUED");
        }
        await waText(from, `⏰ Cupom *${code}* está expirado.`);
      } else {
        const title = (coupon as any).offers?.title || "Oferta";
        await waSend(from, {
          type: "interactive",
          interactive: {
            type: "button",
            body: { text: `✅ CUPOM VÁLIDO\n\n🎟️ ${coupon.code}\n📦 ${title}\n👤 ${coupon.customer_name || "Cliente"}\n\nConfirmar o resgate?` },
            action: { buttons: [
              { type: "reply", reply: { id: `confirm_${coupon.id}`, title: "✅ Confirmar" } },
              { type: "reply", reply: { id: `cancel_${coupon.id}`, title: "❌ Cancelar" } },
            ]},
          },
        });
      }
      return new Response("ok", { status: 200 });
    }

    // ========== 2) LOJISTA APERTOU BOTAO ==========
    if (msg.type === "interactive" && msg.interactive?.type === "button_reply") {
      const id: string = msg.interactive.button_reply.id || "";
      const sep = id.indexOf("_");
      const action = sep > 0 ? id.slice(0, sep) : "";
      const couponId = sep > 0 ? id.slice(sep + 1) : "";

      if (action === "cancel") {
        await waText(from, "Ok, resgate cancelado. O cupom continua válido. 👍");
        return new Response("ok", { status: 200 });
      }
      if (action !== "confirm" || !couponId) return new Response("ok", { status: 200 });

      // ---- RESGATE ATOMICO (anti duplo-clique / anti replay) ----
      const { data: redeemed } = await admin
        .from("coupons")
        .update({
          status: "REDEEMED",
          redeemed_at: new Date().toISOString(),
          redeemed_by_whatsapp: from,
        })
        .eq("id", couponId).eq("company_id", merchant.profile_id).eq("status", "ISSUED")
        .gt("expires_at", new Date().toISOString())
        .select("id, code, offer_id, affiliate_id, customer_phone, offers(title)")
        .maybeSingle();

      if (!redeemed) {
        await waText(from, "⚠️ Este cupom não está mais válido (já resgatado ou expirado).");
        return new Response("ok", { status: 200 });
      }

      // ---- FINANCEIRO (padrao process-click) ----
      const { data: pricing } = await admin
        .from("pricing_config")
        .select("redemption_cost, redemption_affiliate_share")
        .limit(1).maybeSingle();
      const cost = pricing?.redemption_cost ?? 300;
      const share = Number(pricing?.redemption_affiliate_share ?? 0.6);

      const { data: companyProfile } = await admin
        .from("profiles").select("id, balance").eq("id", merchant.profile_id).maybeSingle();
      if (companyProfile) {
        await admin.from("profiles")
          .update({ balance: (companyProfile.balance ?? 0) - cost }).eq("id", companyProfile.id);
        await admin.from("transactions").insert({
          user_id: companyProfile.id, amount: -cost, type: "REDEMPTION_COST",
          offer_id: redeemed.offer_id, description: `Resgate cupom ${redeemed.code}`,
        });
      }

      if (redeemed.affiliate_id) {
        const { data: aff } = await admin
          .from("profiles").select("id, balance, banned, balance_frozen")
          .eq("id", redeemed.affiliate_id).maybeSingle();
        if (aff && !aff.banned && !aff.balance_frozen) {
          let payout = Math.round(cost * share);
          const { data: mult } = await admin
            .rpc("get_commission_multiplier", { affiliate_profile_id: aff.id });
          if (typeof mult === "number" && mult > 0) payout = Math.round(payout * mult);
          await admin.from("profiles")
            .update({ balance: (aff.balance ?? 0) + payout }).eq("id", aff.id);
          await admin.from("transactions").insert({
            user_id: aff.id, amount: payout, type: "REDEMPTION_EARNING",
            offer_id: redeemed.offer_id, description: `Comissão resgate ${redeemed.code}`,
          });
        }
      }

      await waText(from, `✅ Resgate confirmado!\n🎟️ ${redeemed.code}\nBom atendimento! 💛`);

      // avisa o cliente (best-effort; telefone salvo sem DDI → adiciona 55)
      try {
        await waSend("55" + digits(redeemed.customer_phone), {
          type: "template",
          template: {
            name: "clilin_resgate_confirmado",
            language: { code: "pt_BR" },
            components: [{ type: "body", parameters: [
              { type: "text", text: (redeemed as any).offers?.title || "sua oferta" },
            ]}],
          },
        });
      } catch (_e) { /* nao bloqueia o resgate */ }

      return new Response("ok", { status: 200 });
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("wa-webhook error:", e);
    // 200 mesmo em erro pra Meta nao desabilitar o webhook por retries
    return new Response("ok", { status: 200 });
  }
});
