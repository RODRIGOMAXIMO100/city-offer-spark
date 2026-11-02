// wa-webhook v5 — uso do cupom pelo WhatsApp, em tempo real.
//
// Cliente: a mensagem do cupom (clilin_cupom) tem o botão "Estou na loja" (payload loja_<id>).
//   Tocou, a loja recebe 1 mensagem "Maria está na loja com o cupom..." com o botão Confirmar uso.
//   O cliente não recebe resposta (economia: o próprio toque fica no chat dele).
// Loja (todos terminam no mesmo botão "Confirmar uso"):
//   1) o aviso de uso (acima) ou o aviso do site (função cupom);
//   2) texto: a loja manda ou encaminha qualquer mensagem que tenha o código;
//   3) foto: a loja manda a foto da tela do cliente; a IA lê o código.
// O número do WhatsApp do cadastro da empresa (profiles.telefone) vira autorizado sozinho
// na primeira mensagem: quem manda é o dono do número, então o próprio WhatsApp prova a posse.
//
// Segurança: GET handshake (WA_VERIFY_TOKEN) + POST assinado (WA_APP_SECRET, HMAC).
// Financeiro: RPC settle_redemption (o mesmo do painel), atômico e idempotente.
// Secrets: WA_TOKEN, WA_PHONE_NUMBER_ID, WA_VERIFY_TOKEN, WA_APP_SECRET, ANTHROPIC_API_KEY (foto, opcional)
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// código do cupom: 8 chars do alfabeto sem 0/O/1/I (igual ao generateCode do issue-coupon)
const CODE_RE = /\b([A-HJ-NP-Z2-9]{8})\b/;
// uma mensagem encaminhada tem outras palavras de 8 letras ("RESGATAR"): pega todos os candidatos,
// com os que têm número primeiro, e o banco diz qual é cupom da loja
const candidatos = (t: string) => {
  const m = [...new Set((t || "").toUpperCase().match(/\b[A-HJ-NP-Z2-9]{8}\b/g) || [])];
  return [...m.filter((x) => /\d/.test(x)), ...m.filter((x) => !/\d/.test(x))].slice(0, 20);
};
const digits = (p: string) => (p || "").replace(/\D/g, "");
const ok = () => new Response("ok", { status: 200 });
const GRAPH = "https://graph.facebook.com/v21.0";

// celular brasileiro pode chegar com ou sem o 9 depois do DDD
function variantes(p: string): string[] {
  const d = digits(p);
  const out = new Set([d]);
  if (d.startsWith("55") && d.length === 13 && d[4] === "9") out.add(d.slice(0, 4) + d.slice(5));
  if (d.startsWith("55") && d.length === 12) out.add(d.slice(0, 4) + "9" + d.slice(4));
  return [...out];
}

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
  const resp = await fetch(`${GRAPH}/${Deno.env.get("WA_PHONE_NUMBER_ID")}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("WA_TOKEN")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, ...payload }),
  });
  return { ok: resp.ok, body: await resp.json().catch(() => ({})) };
}
const waText = (to: string, text: string) => waSend(to, { type: "text", text: { body: text } });

const nomeCurto = (n?: string | null) => {
  const p = (n || "").trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "Cliente";
  return p.length > 1 ? `${p[0]} ${p[p.length - 1][0].toUpperCase()}.` : p[0];
};

// ---------- uso do cupom (mesmo código da função cupom) ----------
const waDe = (raw?: string | null) => {
  if (!raw) return null;
  const doLink = raw.match(/wa\.me\/(\d+)/)?.[1] ?? raw.match(/phone=(\d+)/)?.[1];
  const d = digits(doLink ?? raw);
  if (d.length < 10) return null;
  return d.startsWith("55") && d.length >= 12 ? d : "55" + d;
};

// Avisa a loja que o cliente vai usar o cupom agora. 1 mensagem por pedido de uso (com trava de 10 min).
// Dentro da janela de 24h da conversa com a loja manda mensagem com botão; fora dela, o modelo aprovado.
async function avisaLoja(admin: any, c: any, canal: string) {
  const WA_TOKEN = Deno.env.get("WA_TOKEN"), WA_PHONE_NUMBER_ID = Deno.env.get("WA_PHONE_NUMBER_ID");
  if (!WA_TOKEN || !WA_PHONE_NUMBER_ID) return false;
  if (c.loja_avisada_em && Date.now() - new Date(c.loja_avisada_em).getTime() < 10 * 60e3) return false;
  const { data: loja } = await admin.from("profiles").select("telefone, preferences").eq("id", c.company_id).maybeSingle();
  if ((loja?.preferences as any)?.aviso_cupom_whatsapp === false) return false;
  const { data: nums } = await admin.from("merchant_whatsapp").select("phone").eq("profile_id", c.company_id).eq("verified", true).limit(3);
  let fones: string[] = (nums ?? []).map((n: any) => digits(n.phone));
  if (!fones.length) { const w = waDe(loja?.telefone); if (w) fones = [w]; }
  if (!fones.length) return false;
  const titulo = c.offers?.title || "sua oferta";
  const acao = canal === "online" ? "vai pedir online" : "está na loja";
  const cliente = nomeCurto(c.customer_name);
  const desde = new Date(Date.now() - 23 * 36e5).toISOString();
  for (const to of fones) {
    const { data: janela } = await admin.from("wa_messages").select("id")
      .eq("phone", to).eq("direction", "IN").gte("created_at", desde).limit(1).maybeSingle();
    const corpo = janela
      ? { type: "interactive", interactive: { type: "button",
          body: { text: `*${cliente}* ${acao} com o cupom *${titulo}*.\n\nCódigo: *${c.code}*\n\nQuando atender, toque em *Confirmar uso*.` },
          action: { buttons: [{ type: "reply", reply: { id: `confirm_${c.id}`, title: "Confirmar uso" } }] } } }
      : { type: "template", template: { name: "clilin_cliente_usando", language: { code: "pt_BR" }, components: [
          { type: "body", parameters: [cliente, acao, titulo, c.code].map((t) => ({ type: "text", text: t })) },
          { type: "button", sub_type: "quick_reply", index: "0", parameters: [{ type: "payload", payload: `confirm_${c.id}` }] },
        ] } };
    const r = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_NUMBER_ID}/messages`, {
      method: "POST", headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, ...corpo }),
    });
    await admin.from("wa_messages").insert({ direction: "OUT", phone: to, kind: janela ? "uso_loja:botao" : "template:clilin_cliente_usando",
      payload: { ok: r.ok, resp: await r.json().catch(() => ({})) } });
  }
  await admin.from("coupons").update({ loja_avisada_em: new Date().toISOString() }).eq("id", c.id);
  return true;
}

// Marca que o cliente vai usar o cupom agora e avisa a loja. Usado pelo site e pelo wa-webhook.
async function registraUso(admin: any, id: string, canal: "loja" | "online", origem: "site" | "whatsapp") {
  const { data: c } = await admin.from("coupons")
    .select("id, code, status, expires_at, company_id, customer_name, customer_phone, loja_avisada_em, offers(title, link_type, link_destination)")
    .eq("id", id).maybeSingle();
  if (!c) return { erro: "Cupom não encontrado" };
  if (c.status === "REDEEMED") return { erro: "Este cupom já foi usado", cupom: c };
  if (c.status !== "ISSUED" || new Date(c.expires_at) <= new Date()) return { erro: "Este cupom venceu", cupom: c };
  await admin.from("coupons").update({ uso_solicitado_em: new Date().toISOString(), uso_canal: canal, uso_origem: origem }).eq("id", c.id);
  let avisou = false;
  try { avisou = await avisaLoja(admin, c, canal); } catch (e) { console.error("aviso loja:", e); }
  return { ok: true, cupom: c, avisou };
}


// ---------- quem está falando: número autorizado ou WhatsApp do cadastro ----------
async function lojaDoNumero(admin: SupabaseClient, from: string) {
  const vs = variantes(from);
  const { data: m } = await admin.from("merchant_whatsapp")
    .select("profile_id").in("phone", vs).eq("verified", true).limit(1).maybeSingle();
  if (m) return { profileId: m.profile_id as string, novo: false };
  const { data: pid } = await admin.rpc("find_company_by_phone", { p_phone: from });
  if (!pid) return null;
  await admin.from("merchant_whatsapp").insert({ profile_id: pid, phone: from, label: "WhatsApp do cadastro", verified: true });
  return { profileId: pid as string, novo: true };
}

// ---------- foto da tela do cliente: a IA lê o código ----------
async function codigoDaFoto(mediaId: string): Promise<string | null> {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return null;
  const tok = Deno.env.get("WA_TOKEN");
  const meta = await fetch(`${GRAPH}/${mediaId}`, { headers: { Authorization: `Bearer ${tok}` } }).then(r => r.json()).catch(() => null);
  if (!meta?.url) return null;
  const bin = await fetch(meta.url, { headers: { Authorization: `Bearer ${tok}` } }).then(r => r.arrayBuffer()).catch(() => null);
  if (!bin || bin.byteLength > 5_000_000) return null;
  let s = "";
  const u8 = new Uint8Array(bin);
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("FOTO_MODEL") || "claude-haiku-5-5",
      max_tokens: 30,
      messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: meta.mime_type || "image/jpeg", data: btoa(s) } },
        { type: "text", text: "Esta é a foto de um cupom do Clilin. Responda só com o código do cupom (8 letras e números, sem espaço). Se não achar, responda NADA." },
      ] }],
    }),
  }).then(x => x.json()).catch(() => null);
  const txt = (r?.content?.[0]?.text || "").toUpperCase().replace(/[\s-]/g, "");
  return txt.match(CODE_RE)?.[1] ?? null;
}

// ---------- mostra o cupom e pede a confirmação ----------
async function ofereceConfirmacao(admin: SupabaseClient, from: string, lojaId: string, codes: string[]) {
  const { data: achados } = await admin.from("coupons")
    .select("id, code, status, expires_at, customer_name, offers(title)")
    .in("code", codes).eq("company_id", lojaId).limit(5);
  const coupon = (achados ?? []).sort((a: any, b: any) => codes.indexOf(a.code) - codes.indexOf(b.code))[0];
  const code = coupon?.code ?? codes[0];
  if (!coupon) return waText(from, `Não achei o cupom *${code}* na sua loja. Confira o código.`);
  if (coupon.status === "REDEEMED") return waText(from, `O cupom *${code}* já foi usado. Não aceite de novo.`);
  if (coupon.status !== "ISSUED" || new Date(coupon.expires_at) <= new Date()) {
    if (coupon.status === "ISSUED") await admin.from("coupons").update({ status: "EXPIRED" }).eq("id", coupon.id).eq("status", "ISSUED");
    return waText(from, `O cupom *${code}* venceu.`);
  }
  const title = (coupon as any).offers?.title || "Oferta";
  return waSend(from, {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: `Cupom válido\n\nCódigo: *${coupon.code}*\nOferta: *${title}*\nCliente: ${nomeCurto(coupon.customer_name)}\n\nConfirmar o uso?` },
      action: { buttons: [
        { type: "reply", reply: { id: `confirm_${coupon.id}`, title: "Confirmar uso" } },
        { type: "reply", reply: { id: `cancel_${coupon.id}`, title: "Agora não" } },
      ] },
    },
  });
}

// ---------- confirma (botão do aviso ou da validação) ----------
async function confirma(admin: SupabaseClient, from: string, lojaId: string, couponId: string) {
  const { data: redeemed } = await admin.from("coupons")
    .update({ status: "REDEEMED", redeemed_at: new Date().toISOString(), redeemed_by_whatsapp: from })
    .eq("id", couponId).eq("company_id", lojaId).eq("status", "ISSUED")
    .gt("expires_at", new Date().toISOString())
    .select("id, code, customer_phone, customer_name, offers(title)")
    .maybeSingle();
  if (!redeemed) {
    const { data: c } = await admin.from("coupons").select("code, status").eq("id", couponId).eq("company_id", lojaId).maybeSingle();
    return waText(from, c?.status === "REDEEMED" ? `O cupom *${c.code}* já estava confirmado.` : "Este cupom não está mais válido.");
  }
  const { data: settle, error: sErr } = await admin.rpc("settle_redemption", { p_coupon_id: redeemed.id });
  if (sErr) console.error("settle_redemption FALHOU", { code: redeemed.code, coupon_id: redeemed.id, err: sErr });
  const b = (settle ?? {}) as Record<string, unknown>;
  const brl = (c: unknown) => "R$ " + (Number(c ?? 0) / 100).toFixed(2).replace(".", ",");
  const linha = b.billing_mode === "PRE" ? `\n${brl(b.charged_cents)} debitado do seu saldo.`
    : b.billing_mode === "POS" ? `\n${brl(b.charged_cents)} lançado na sua fatura.` : "";
  const title = (redeemed as any).offers?.title || "sua oferta";
  await waText(from, `Cupom confirmado!\n\nCódigo: *${redeemed.code}*\nOferta: ${title}\nCliente: ${nomeCurto(redeemed.customer_name)}${linha}\n\nBom atendimento!`);
}

const AJUDA =
  "Para confirmar um cupom do Clilin, faça um destes:\n\n" +
  "1. Toque em *Confirmar uso* no aviso de cliente usando cupom.\n" +
  "2. Mande ou encaminhe a mensagem com o código (8 letras e números).\n" +
  "3. Mande uma foto da tela do cliente com o código.";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    if (mode === "subscribe" && token && token === Deno.env.get("WA_VERIFY_TOKEN")) {
      return new Response(url.searchParams.get("hub.challenge") || "", { status: 200 });
    }
    return new Response("forbidden", { status: 403 });
  }
  if (req.method !== "POST") return ok();

  const raw = await req.text();
  const APP_SECRET = Deno.env.get("WA_APP_SECRET") || "";
  if (!APP_SECRET || !(await validSignature(raw, req.headers.get("x-hub-signature-256"), APP_SECRET))) {
    return new Response("invalid signature", { status: 401 });
  }
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const value = JSON.parse(raw)?.entry?.[0]?.changes?.[0]?.value;
    const msg = value?.messages?.[0];
    if (!msg) return ok();
    const from = digits(msg.from);
    await admin.from("wa_messages").insert({ direction: "IN", phone: from, kind: msg.type, payload: msg });

    // ---- cliente tocou em "Estou na loja" na mensagem do cupom ----
    const payloadCliente: string = msg.type === "button" ? (msg.button?.payload || "") : "";
    if (payloadCliente.startsWith("loja_")) {
      const id = payloadCliente.slice(5);
      const { data: cp } = await admin.from("coupons").select("customer_phone").eq("id", id).maybeSingle();
      // só vale se quem tocou é o WhatsApp de quem pegou o cupom (DDD + 8 últimos dígitos)
      const a = digits(cp?.customer_phone || ""), b = from.replace(/^55/, "");
      if (cp && a.slice(0, 2) === b.slice(0, 2) && a.slice(-8) === b.slice(-8)) {
        await registraUso(admin, id, "loja", "whatsapp");
      }
      return ok();
    }

    const loja = await lojaDoNumero(admin, from);
    if (!loja) return ok(); // só loja opera; o resto é ignorado em silêncio
    if (loja.novo) {
      const { data: p } = await admin.from("profiles").select("name").eq("id", loja.profileId).maybeSingle();
      await waText(from, `Pronto! Este WhatsApp agora confirma os cupons de *${p?.name || "sua loja"}* no Clilin.\n\n${AJUDA}`);
    }

    // botão: aviso do cupom (template, type=button) ou validação (interactive)
    const idBotao: string =
      msg.type === "button" ? (msg.button?.payload || "")
      : msg.type === "interactive" && msg.interactive?.type === "button_reply" ? (msg.interactive.button_reply?.id || "")
      : "";
    if (idBotao) {
      const sep = idBotao.indexOf("_");
      const acao = sep > 0 ? idBotao.slice(0, sep) : "";
      const couponId = sep > 0 ? idBotao.slice(sep + 1) : "";
      if (acao === "cancel") await waText(from, "Tudo bem. O cupom continua valendo.");
      else if (acao === "confirm" && couponId) await confirma(admin, from, loja.profileId, couponId);
      return ok();
    }

    let codes: string[] = [];
    if (msg.type === "text") codes = candidatos(msg.text?.body || "");
    if (msg.type === "image" && msg.image?.id) {
      codes = candidatos(msg.image.caption || "");
      if (!codes.length) { const c = await codigoDaFoto(msg.image.id); if (c) codes = [c]; }
      if (!codes.length) {
        await waText(from, "Não consegui ler o código nessa foto. Manda o código digitado (8 letras e números).");
        return ok();
      }
    }
    if (codes.length) await ofereceConfirmacao(admin, from, loja.profileId, codes);
    else if (!loja.novo) await waText(from, AJUDA);
    return ok();
  } catch (e) {
    console.error("wa-webhook error:", e);
    return ok(); // 200 mesmo em erro, para a Meta não desligar o webhook
  }
});
