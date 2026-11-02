// blog-diario: escreve e publica 1 post por dia no blog do Clilin, com o Claude, na narrativa atual
// (ofertas locais com cupom grátis no WhatsApp, loja confirma com um toque, começando por BH).
// Chamado pelo pg_cron (job "blog-diario") com o header x-cron-secret (private.app_secrets: blog_cron).
// Responde na hora e escreve em segundo plano (EdgeRuntime.waitUntil), para o pg_net não cortar.
// verify_jwt = false (a função confere o segredo).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAUTAS = ["empresas", "divulgadores", "clientes"] as const;

const REGRAS = `Você escreve o blog do Clilin (clilin.com/blog), em português do Brasil.

O QUE É O CLILIN
- Plataforma de ofertas locais: negócios da cidade publicam promoções, divulgadores espalham e o cliente pega o cupom de graça, direto no WhatsApp.
- O cliente mostra o código na loja ou manda no WhatsApp da loja. Quando alguém pega um cupom, a loja recebe um aviso no WhatsApp e, quando o cliente chega, confirma o uso com um toque no botão "Confirmar uso", sem digitar código nem entrar em outro sistema (o painel continua como opção). Cada cupom vale uma vez.
- A loja só paga pelo cupom usado: 15% do preço da oferta, mínimo de R$ 3. Sem mensalidade. Visita e cupom não usado não custam nada. Com saldo pré-pago, 10% de desconto.
- Divulgador: indica as ofertas da cidade pelo próprio link e ganha metade da taxa de cada cupom usado por quem veio do link dele, chegando a 70% conforme o nível. Saque por Pix a partir de R$ 100. Cadastro grátis, não precisa ter muitos seguidores.
- Cliente: grátis, sem app e sem cadastro.
- O Clilin está começando por Belo Horizonte (MG). Em outras cidades a pessoa faz o pré-cadastro. Pode citar BH e bairros de BH como exemplo.
- O Clilin é um produto do Grupo MAXIMO.

TOM E REGRAS
- Direto, popular, brasileiro, prático. Parágrafos curtos. Afirme o que é bom; não abra levantando objeção.
- NUNCA use travessão (— ou –). Use vírgula, ponto ou dois-pontos.
- Use "divulgadores", nunca "afiliados". Nada de termo religioso. Não fale de "lead", "CPL" nem "pagar por lead": o Clilin cobra por cupom usado.
- Não invente números, estatísticas, pesquisas, clientes, lojas reais ou depoimentos. Exemplos de loja são hipotéticos e genéricos ("uma pizzaria do bairro").
- Não prometa resultado garantido. Não cite links externos.
- Links internos permitidos: /empresas, /divulgadores, /ofertas, /ajuda, /transparencia.`;

const FORMATO = `Responda SOMENTE com JSON:
{"title": "título de até 60 caracteres, com a palavra-chave principal",
 "meta_description": "até 155 caracteres",
 "excerpt": "resumo de 1 ou 2 frases",
 "keywords": ["5 palavras-chave"],
 "faq": [{"question": "...", "answer": "..."}],
 "content_html": "HTML do post"}
Regras do HTML: 800 a 1200 palavras. Só as tags h2, h3, p, ul, ol, li, strong, em, blockquote e a (só links internos permitidos). Sem h1, sem imagens, sem estilos.
Comece com 2 parágrafos que vão direto ao ponto. Use de 4 a 6 seções h2 práticas. Termine com uma seção h2 de chamada para o Clilin com link interno.
O "faq" tem 3 perguntas com respostas curtas, que também devem aparecer no fim do HTML numa seção h2 "Perguntas frequentes".`;

const ANGULOS: Record<string, string> = {
  empresas: "donos de restaurante, pizzaria, salão, barbearia, academia, loja, açaí, pet shop e serviços em BH: como trazer cliente novo para a loja, encher dia fraco, fazer promoção que dá lucro, medir o que a divulgação trouxe, confirmar cupom no WhatsApp",
  divulgadores: "quem quer renda extra em BH indicando ofertas da cidade em grupos de WhatsApp, status e conversas: como começar, como divulgar sem ser chato, como subir de nível, como sacar por Pix",
  clientes: "quem quer economizar em BH: como achar oferta perto de casa, como pegar e usar o cupom no WhatsApp, programas baratos no bairro, dicas de economia no dia a dia",
};

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
const semTravessao = (s: string) => String(s || "").replace(/\s*[—–]\s*/g, ", ").replace(/ ,/g, ",");
const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);

async function escreve(admin: any, forcar: boolean) {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new Error("falta ANTHROPIC_API_KEY");

  // 1 por dia (dia de Brasília), a não ser que forçado
  const agora = new Date();
  const hojeBR = new Date(agora.getTime() - 3 * 36e5).toISOString().slice(0, 10);
  const inicio = new Date(`${hojeBR}T03:00:00Z`).toISOString();
  if (!forcar) {
    const { count } = await admin.from("blog_posts").select("id", { count: "exact", head: true })
      .eq("author_name", "Equipe Clilin").gte("published_at", inicio).like("slug", "%-cl");
    if ((count ?? 0) > 0) return { pulado: "já tem post hoje" };
  }

  const dia = Math.floor((agora.getTime() - Date.UTC(agora.getUTCFullYear(), 0, 0)) / 864e5);
  const pauta = PAUTAS[dia % PAUTAS.length];
  const { data: recentes } = await admin.from("blog_posts").select("title").order("created_at", { ascending: false }).limit(60);
  const usados = (recentes ?? []).map((r: any) => r.title).filter(Boolean);

  const hd = { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" };
  let modelo = Deno.env.get("BLOG_MODEL") || "";
  if (!modelo) {
    const lst = await fetch("https://api.anthropic.com/v1/models?limit=50", { headers: hd }).then((r) => r.json()).catch(() => ({}));
    modelo = (lst?.data ?? []).map((m: any) => m.id).find((id: string) => id.includes("sonnet")) || "claude-sonnet-5-5";
  }
  const pedido = `Pauta de hoje: ${pauta} (${ANGULOS[pauta]}).
Escolha UM tema específico e útil dentro da pauta, com uma palavra-chave que as pessoas buscam no Google.
${FORMATO}

Temas que já saíram, NÃO repita nem chegue perto:
- ${usados.join("\n- ")}`;

  let c: any = null;
  const msgs: any[] = [{ role: "user", content: pedido }];
  for (let tent = 0; tent < 2 && !c; tent++) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: hd,
      body: JSON.stringify({ model: modelo, max_tokens: 8000, system: REGRAS, messages: msgs }),
    }).then((x) => x.json());
    const txt = (r?.content ?? []).map((p: any) => p.text || "").join("");
    try {
      const m = txt.match(/\{[\s\S]*\}/);
      const j = m ? JSON.parse(m[0]) : null;
      if (j?.title && j?.content_html && String(j.content_html).length > 3000) c = j;
      else throw new Error("incompleto");
    } catch (_e) {
      msgs.push({ role: "assistant", content: txt || "{}" }, { role: "user", content: "O JSON veio incompleto ou inválido. Devolva o JSON inteiro de novo, válido." });
    }
  }
  if (!c) throw new Error("Claude não devolveu um post válido");

  const titulo = semTravessao(c.title).slice(0, 90);
  const html = semTravessao(c.content_html)
    .replace(/<(script|style|iframe|img)[\s\S]*?(<\/\1>|\/?>)/gi, "")
    .replace(/href="(?!\/(empresas|divulgadores|ofertas|ajuda|transparencia)\b)[^"]*"/gi, 'href="/ofertas"');
  const slug = `${slugify(titulo)}-${hojeBR.replace(/-/g, "").slice(2)}-cl`;
  const faq = Array.isArray(c.faq) ? c.faq.slice(0, 5).map((f: any) => ({ question: semTravessao(f.question), answer: semTravessao(f.answer) })) : null;

  const { error } = await admin.from("blog_posts").insert({
    title: titulo,
    slug,
    excerpt: semTravessao(c.excerpt || "").slice(0, 300),
    content: html,
    meta_title: titulo.slice(0, 60),
    meta_description: semTravessao(c.meta_description || c.excerpt || "").slice(0, 160),
    keywords: Array.isArray(c.keywords) ? c.keywords.slice(0, 8).map(String) : [],
    category: pauta,
    status: "published",
    published_at: new Date().toISOString(),
    author_name: "Equipe Clilin",
    faq,
  });
  if (error) throw error;
  console.log("blog-diario publicado", slug, modelo);
  return { publicado: slug, pauta, modelo };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const segredo = req.headers.get("x-cron-secret") || "";
  const { data: ok } = await admin.rpc("check_cron_secret", { p_name: "blog_cron", p_value: segredo });
  if (!ok) return json({ error: "não autorizado" }, 401);
  const body = await req.json().catch(() => ({}));
  const tarefa = escreve(admin, !!body?.forcar).catch((e) => {
    console.error("blog-diario falhou:", e instanceof Error ? e.message : e);
    return { erro: String(e instanceof Error ? e.message : e) };
  });
  // @ts-ignore EdgeRuntime existe no Supabase
  if (typeof EdgeRuntime !== "undefined" && body?.esperar !== true) { EdgeRuntime.waitUntil(tarefa); return json({ ok: true, em_segundo_plano: true }, 202); }
  return json(await tarefa);
});
