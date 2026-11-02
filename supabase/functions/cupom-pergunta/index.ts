// cupom-pergunta: pergunta ao cliente "Você foi atendido?" no WhatsApp, 2 horas depois de ele tocar em
// "Estou na loja" pelo WhatsApp, quando a loja ainda não confirmou o uso.
// Só pergunta dentro da janela de 24h aberta pelo toque do cliente (mensagem de serviço, sem custo).
// Botões: atendido_sim_<id> / atendido_nao_<id> (tratados no wa-webhook).
// Chamado pelo pg_cron (job "cupom-pergunta") com o header x-cron-secret (private.app_secrets: cupom_cron).
// Sem WA_TOKEN configurado, não faz nada. verify_jwt = false (a função confere o segredo).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
const digits = (p: string) => String(p || "").replace(/\D/g, "");

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: ok } = await admin.rpc("check_cron_secret", { p_name: "cupom_cron", p_value: req.headers.get("x-cron-secret") || "" });
  if (!ok) return json({ error: "não autorizado" }, 401);

  const WA_TOKEN = Deno.env.get("WA_TOKEN"), WA_PHONE_NUMBER_ID = Deno.env.get("WA_PHONE_NUMBER_ID");
  if (!WA_TOKEN || !WA_PHONE_NUMBER_ID) return json({ ok: true, pulado: "WhatsApp não configurado" });

  const agora = Date.now();
  const { data: lista } = await admin.from("coupons")
    .select("id, code, customer_phone, customer_name, uso_solicitado_em, offers(title)")
    .eq("status", "ISSUED").eq("uso_origem", "whatsapp")
    .is("cliente_atendido", null).is("cliente_perguntado_em", null)
    .lte("uso_solicitado_em", new Date(agora - 2 * 36e5).toISOString())
    .gte("uso_solicitado_em", new Date(agora - 22 * 36e5).toISOString())
    .limit(100);

  let enviados = 0;
  for (const c of lista ?? []) {
    const to = digits(c.customer_phone);
    const fone = to.startsWith("55") ? to : "55" + to;
    // deno-lint-ignore no-explicit-any
    const titulo = (c as any).offers?.title || "sua oferta";
    const r = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp", to: fone, type: "interactive",
        interactive: {
          type: "button",
          body: { text: `Você foi atendido com o cupom *${c.code}* (${titulo})?\n\nSua resposta ajuda a manter as ofertas da cidade justas para todo mundo.` },
          action: { buttons: [
            { type: "reply", reply: { id: `atendido_sim_${c.id}`, title: "Sim, fui atendido" } },
            { type: "reply", reply: { id: `atendido_nao_${c.id}`, title: "Não fui atendido" } },
          ] },
        },
      }),
    });
    await admin.from("coupons").update({ cliente_perguntado_em: new Date().toISOString() }).eq("id", c.id);
    await admin.from("wa_messages").insert({ direction: "OUT", phone: fone, kind: "pergunta_atendido",
      payload: { ok: r.ok, resp: await r.json().catch(() => ({})) } });
    if (r.ok) enviados++;
  }
  return json({ ok: true, enviados });
});
