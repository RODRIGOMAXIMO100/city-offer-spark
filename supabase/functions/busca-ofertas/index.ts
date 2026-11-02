// busca-ofertas — busca das ofertas com IA (Claude).
//
// O cliente escreve o que procura ("pizza barata", "algo pra fazer com criança")
// e o Claude escolhe, só entre as ofertas ATIVAS do banco (na cidade, quando
// informada), as que combinam. Ele nunca inventa oferta: só devolve ids que
// estão na lista enviada. Sem a chave ANTHROPIC_API_KEY, cai numa busca simples
// por palavra. Limite de buscas por IP por dia para proteger a chave.
// Publica (sem login): verify_jwt = false.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const MAX_POR_IP_DIA = 30;
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

interface Oferta {
  id: string;
  title: string;
  description: string | null;
  price_old: number;
  price_new: number;
  city: string;
  tags: string[] | null;
  empresa: string;
}

function buscaSimples(q: string, ofertas: Oferta[]): string[] {
  const termos = norm(q).split(/\s+/).filter((t) => t.length >= 3);
  if (!termos.length) return ofertas.slice(0, 6).map((o) => o.id);
  return ofertas
    .map((o) => {
      const txt = norm(`${o.title} ${o.description ?? ""} ${(o.tags ?? []).join(" ")} ${o.empresa}`);
      return { id: o.id, pontos: termos.filter((t) => txt.includes(t)).length };
    })
    .filter((x) => x.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, 6)
    .map((x) => x.id);
}

async function perguntarClaude(key: string, q: string, cidade: string | null, ofertas: Oferta[]) {
  const lista = ofertas
    .map((o, i) => {
      const off = o.price_old > o.price_new ? Math.round((1 - o.price_new / o.price_old) * 100) : 0;
      return `${i + 1}. id=${o.id} | ${o.empresa} (${o.city}) | ${o.title} | de R$ ${o.price_old} por R$ ${o.price_new}${off ? ` (-${off}%)` : ""}${o.description ? ` | ${o.description.slice(0, 160)}` : ""}`;
    })
    .join("\n");

  const system =
    `Você é a busca de ofertas do Clilin, uma plataforma de ofertas de negócios locais com cupom grátis no WhatsApp.\n` +
    `Escolha, SOMENTE da lista abaixo, as ofertas que combinam com o pedido da pessoa (até 6, da mais para a menos relevante).\n` +
    `Nunca invente oferta, preço ou loja. Se nada combinar, devolva a lista vazia.\n` +
    `Escreva uma resposta curta (1 frase, português do Brasil, tom simpático e direto, sem travessão).\n` +
    `Responda APENAS com JSON: {"resposta": "...", "ids": ["..."]}\n\n` +
    `Cidade escolhida: ${cidade || "todas"}\n\nOFERTAS:\n${lista}`;

  const chamar = (model: string) =>
    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 400, system, messages: [{ role: "user", content: q }] }),
    });

  let model = Deno.env.get("BUSCA_MODEL") || "claude-haiku-5-5";
  let r = await chamar(model);
  if (r.status === 404 || r.status === 400) {
    // modelo indisponível: pega o haiku mais novo da conta
    const lst = await fetch("https://api.anthropic.com/v1/models?limit=50", {
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
    }).then((x) => x.json()).catch(() => ({}));
    const alt = (lst?.data ?? []).map((m: { id: string }) => m.id).find((id: string) => id.includes("haiku"));
    if (alt && alt !== model) {
      model = alt;
      r = await chamar(model);
    }
  }
  if (!r.ok) throw new Error(`Claude respondeu ${r.status}`);
  const data = await r.json();
  const txt: string = (data?.content ?? []).map((c: { text?: string }) => c.text ?? "").join("");
  const m = txt.match(/\{[\s\S]*\}/);
  const parsed = m ? JSON.parse(m[0]) : {};
  const validos = new Set(ofertas.map((o) => o.id));
  const ids = (Array.isArray(parsed.ids) ? parsed.ids : []).filter((id: unknown) => typeof id === "string" && validos.has(id)).slice(0, 6);
  const resposta = typeof parsed.resposta === "string" ? parsed.resposta.slice(0, 300) : "";
  return { ids, resposta };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const q = String(body?.q ?? "").trim().slice(0, 200);
    const cidade = String(body?.cidade ?? "").trim().slice(0, 80) || null;
    if (q.length < 2) return json({ error: "Escreva o que você procura" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Limite por IP (24h)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "desconhecido";
    const desde = new Date(Date.now() - 864e5).toISOString();
    const { count } = await admin.from("ai_chat_rate_limits").select("id", { count: "exact", head: true })
      .eq("ip_address", ip).gte("created_at", desde);
    if ((count ?? 0) >= MAX_POR_IP_DIA) {
      return json({ error: "Você fez muitas buscas hoje. Tente amanhã ou navegue pelas ofertas da cidade." }, 429);
    }
    await admin.from("ai_chat_rate_limits").insert({ ip_address: ip });

    let query = admin
      .from("offers")
      .select("id, title, description, price_old, price_new, city, tags, profiles!offers_company_id_fkey(name)")
      .eq("active", true)
      .is("deleted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(150);
    if (cidade) query = query.eq("city", cidade);
    const { data } = await query;
    // deno-lint-ignore no-explicit-any
    const ofertas: Oferta[] = (data ?? []).map((o: any) => ({
      id: o.id, title: o.title, description: o.description, price_old: Number(o.price_old), price_new: Number(o.price_new),
      city: o.city, tags: o.tags, empresa: o.profiles?.name ?? "Negócio local",
    }));

    if (ofertas.length === 0) {
      return json({
        modo: "vazio",
        ids: [],
        resposta: cidade
          ? `Ainda não tem oferta em ${cidade}. Conhece um negócio daí? Ele pode entrar de graça no Clilin.`
          : "Ainda não tem oferta no ar. As primeiras estão chegando.",
      });
    }

    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (key) {
      try {
        const r = await perguntarClaude(key, q, cidade, ofertas);
        return json({
          modo: "ia",
          ids: r.ids,
          resposta: r.resposta || (r.ids.length ? "Achei estas ofertas pra você." : "Não achei nada parecido agora. Veja as outras ofertas da cidade."),
        });
      } catch (e) {
        console.error("busca-ofertas claude", (e as Error).message);
      }
    }

    const ids = buscaSimples(q, ofertas);
    return json({
      modo: "simples",
      ids,
      resposta: ids.length ? "Achei estas ofertas pra você." : "Não achei nada parecido agora. Veja as outras ofertas da cidade.",
    });
  } catch (e) {
    console.error("busca-ofertas", e);
    return json({ error: "Não deu para buscar agora. Tente de novo." }, 500);
  }
});
