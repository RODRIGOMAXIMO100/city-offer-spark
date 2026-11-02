// cupom: página pública do cupom (clilin.com/cupom/:id e clilin.com/pedir/:id).
//   POST { id, acao: "ver" }               -> dados do cupom
//   POST { id, acao: "loja" | "online" }   -> cliente avisa que vai usar agora; a loja vê no painel
//                                             e recebe 1 mensagem no WhatsApp com o botão Confirmar uso
//   POST { id, acao: "atendido" | "nao_atendido" } -> cliente diz se foi atendido. "Fui atendido" vale como
//                                             uso: a loja tem 48h para contestar, depois é confirmado sozinho.
// O id do cupom (uuid) é o segredo do link: só quem recebeu o cupom tem. Sem login: verify_jwt = false.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const digits = (p: string) => String(p || "").replace(/\D/g, "");

export const nomeCurto = (n?: string | null) => {
  const p = (n || "").trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "Cliente";
  return p.length > 1 ? `${p[0]} ${p[p.length - 1][0].toUpperCase()}.` : p[0];
};

const waDe = (raw?: string | null) => {
  if (!raw) return null;
  const doLink = raw.match(/wa\.me\/(\d+)/)?.[1] ?? raw.match(/phone=(\d+)/)?.[1];
  const d = digits(doLink ?? raw);
  if (d.length < 10) return null;
  return d.startsWith("55") && d.length >= 12 ? d : "55" + d;
};

// Avisa a loja que o cliente vai usar o cupom agora. 1 mensagem por pedido de uso (com trava de 10 min).
// Dentro da janela de 24h da conversa com a loja manda mensagem com botão; fora dela, o modelo aprovado.
export async function avisaLoja(admin: any, c: any, canal: string) {
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
export async function registraUso(admin: any, id: string, canal: "loja" | "online", origem: "site" | "whatsapp") {
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

// Cliente diz se foi atendido (página do cupom ou botão no WhatsApp). Usado pelo site e pelo wa-webhook.
export async function respostaCliente(admin: any, id: string, atendido: boolean) {
  const { data: c } = await admin.from("coupons")
    .select("id, status, uso_solicitado_em, cliente_atendido, expires_at")
    .eq("id", id).maybeSingle();
  if (!c) return { erro: "Cupom não encontrado" };
  if (c.status === "REDEEMED") return { ok: true, ja: true };
  if (!c.uso_solicitado_em) return { erro: "Toque em Estou na loja ou Pedir online antes." };
  if (c.cliente_atendido) return { ok: true, ja: true };
  await admin.from("coupons").update({
    cliente_atendido: atendido ? "sim" : "nao",
    cliente_respondeu_em: new Date().toISOString(),
  }).eq("id", id).is("cliente_atendido", null);
  return { ok: true };
}

async function dados(admin: any, id: string) {
  const { data: c } = await admin.from("coupons")
    .select("id, code, status, expires_at, redeemed_at, company_id, customer_name, uso_canal, uso_solicitado_em, cliente_atendido, offers(title, price_old, price_new, link_type, link_destination, city)")
    .eq("id", id).maybeSingle();
  if (!c) return null;
  const { data: loja } = await admin.from("profiles").select("name, telefone").eq("id", c.company_id).maybeSingle();
  const o: any = c.offers || {};
  const wa = (o.link_type === "WHATSAPP" ? waDe(o.link_destination) : null) || waDe(loja?.telefone);
  const texto = `Oi! Quero fazer um pedido com o cupom ${c.code} do Clilin: ${o.title || ""}`.trim();
  return {
    id: c.id, codigo: c.code,
    status: c.status === "ISSUED" && new Date(c.expires_at) <= new Date() ? "EXPIRED" : c.status,
    valido_ate: c.expires_at, usado_em: c.redeemed_at,
    oferta: { titulo: o.title, de: o.price_old, por: o.price_new, cidade: o.city },
    loja: loja?.name || "Loja parceira",
    cliente: nomeCurto(c.customer_name),
    uso_canal: c.uso_canal, uso_solicitado_em: c.uso_solicitado_em,
    cliente_atendido: c.cliente_atendido ?? null,
    pedir_link: wa ? `https://wa.me/${wa}?text=${encodeURIComponent(texto)}` : (o.link_destination && /^https?:\/\//.test(o.link_destination) ? o.link_destination : null),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body?.id ?? "").trim();
    const acao = String(body?.acao ?? "ver");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Cupom inválido" }, 400);
    if (!["ver", "loja", "online", "atendido", "nao_atendido"].includes(acao)) return json({ error: "Ação inválida" }, 400);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    if (acao === "atendido" || acao === "nao_atendido") {
      const r = await respostaCliente(admin, id, acao === "atendido");
      if (r.erro) return json({ error: r.erro, cupom: await dados(admin, id) }, 409);
    } else if (acao !== "ver") {
      const r = await registraUso(admin, id, acao as "loja" | "online", "site");
      if (r.erro && !r.cupom) return json({ error: r.erro }, 404);
      if (r.erro) return json({ error: r.erro, cupom: await dados(admin, id) }, 409);
    }
    const d = await dados(admin, id);
    if (!d) return json({ error: "Cupom não encontrado" }, 404);
    return json({ cupom: d });
  } catch (e) {
    console.error("cupom", e);
    return json({ error: "Não deu para abrir o cupom agora. Tente de novo." }, 500);
  }
});
