// check-post — leitura automatica dos dados PUBLICOS de um post de campanha.
//
// Le o que cada rede deixa ver sem login (oEmbed oficial e paginas publicas de
// incorporacao): se o post existe, quem postou, a legenda, se tem a palavra-chave
// e o #publi e, quando a rede mostra, o numero de visualizacoes. O resultado vai
// para campaign_posts.auto_check e ajuda o admin na conferencia; a aprovacao
// continua sendo humana. Quem chama: o proprio divulgador (logo apos enviar) ou
// um admin (botao "Ler de novo").
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function fetchText(url: string, timeoutMs = 8000): Promise<{ status: number; text: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9" }, signal: ctrl.signal, redirect: "follow" });
    return { status: r.status, text: await r.text() };
  } finally {
    clearTimeout(t);
  }
}

const decodeHtml = (s: string) =>
  s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const firstNumber = (text: string, patterns: RegExp[]): number | null => {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const n = parseInt(m[1].replace(/[^0-9]/g, ""), 10);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
};

interface Reading {
  method: string;
  exists: boolean | null;
  author: string | null;
  caption: string | null;
  views: number | null;
  note: string | null;
}

async function readTikTok(url: string): Promise<Reading> {
  const o = await fetchText(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
  if (o.status !== 200) return { method: "tiktok-oembed", exists: o.status === 404 ? false : null, author: null, caption: null, views: null, note: `oEmbed respondeu ${o.status}` };
  const data = JSON.parse(o.text);
  let views: number | null = null;
  try {
    const page = await fetchText(url);
    views = firstNumber(page.text, [/"playCount":\s*(\d+)/, /"play_count":\s*(\d+)/]);
  } catch { /* visualizacoes sao opcionais */ }
  return {
    method: "tiktok-oembed",
    exists: true,
    author: data.author_unique_id ?? data.author_name ?? null,
    caption: data.title ?? null,
    views,
    note: views == null ? "TikTok não mostrou as visualizações para leitura automática" : null,
  };
}

async function readYouTube(url: string): Promise<Reading> {
  const o = await fetchText(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`);
  if (o.status !== 200) return { method: "youtube-oembed", exists: o.status === 404 ? false : null, author: null, caption: null, views: null, note: `oEmbed respondeu ${o.status}` };
  const data = JSON.parse(o.text);
  let views: number | null = null;
  let description = "";
  try {
    const page = await fetchText(url);
    views = firstNumber(page.text, [/"viewCount":"(\d+)"/, /"viewCount":\{"simpleText":"([\d.,]+)/]);
    const d = page.text.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
    if (d) description = JSON.parse(`"${d[1]}"`);
  } catch { /* opcional */ }
  const handle = typeof data.author_url === "string" ? data.author_url.split("/").pop()?.replace(/^@/, "") : null;
  return {
    method: "youtube-oembed",
    exists: true,
    author: handle ?? data.author_name ?? null,
    caption: [data.title, description].filter(Boolean).join(" — "),
    views,
    note: views == null ? "YouTube não mostrou as visualizações para leitura automática" : null,
  };
}

async function readX(url: string): Promise<Reading> {
  const o = await fetchText(`https://publish.twitter.com/oembed?omit_script=1&url=${encodeURIComponent(url)}`);
  if (o.status !== 200) return { method: "x-oembed", exists: o.status === 404 ? false : null, author: null, caption: null, views: null, note: `oEmbed respondeu ${o.status}` };
  const data = JSON.parse(o.text);
  const author = typeof data.author_url === "string" ? data.author_url.split("/").pop() ?? null : null;
  const textMatch = String(data.html ?? "").match(/<p[^>]*>([\s\S]*?)<\/p>/);
  return {
    method: "x-oembed",
    exists: true,
    author,
    caption: textMatch ? decodeHtml(textMatch[1]) : null,
    views: null,
    note: "O X não mostra visualizações sem login: use o print enviado pelo divulgador",
  };
}

async function readInstagram(url: string): Promise<Reading> {
  const m = url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  if (!m) return { method: "instagram-embed", exists: null, author: null, caption: null, views: null, note: "Link do Instagram não reconhecido" };
  const page = await fetchText(`https://www.instagram.com/p/${m[1]}/embed/captioned/`);
  if (page.status === 404) return { method: "instagram-embed", exists: false, author: null, caption: null, views: null, note: "Post não encontrado" };
  if (page.status !== 200) return { method: "instagram-embed", exists: null, author: null, caption: null, views: null, note: `Instagram respondeu ${page.status}: conferir manualmente` };
  const html = page.text;
  const author =
    html.match(/class="UsernameText"[^>]*>([^<]+)</)?.[1] ??
    html.match(/"owner":\{[^}]*"username":"([^"]+)"/)?.[1] ??
    html.match(/"username":"([^"]+)"/)?.[1] ?? null;
  const capHtml = html.match(/class="Caption"[^>]*>([\s\S]*?)<div class="CaptionComments/)?.[1] ??
    html.match(/class="Caption"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? null;
  const views = firstNumber(html, [/"video_view_count":\s*(\d+)/, /"video_play_count":\s*(\d+)/]);
  const exists = !!(author || capHtml);
  return {
    method: "instagram-embed",
    exists: exists ? true : null,
    author,
    caption: capHtml
      ? decodeHtml(capHtml).replace(new RegExp(`^${(author ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`), "")
      : null,
    views,
    note: exists
      ? (views == null ? "Instagram não mostrou as visualizações: use o print enviado pelo divulgador" : null)
      : "Instagram não liberou a leitura agora: conferir manualmente",
  };
}

async function readPost(network: string, url: string): Promise<Reading> {
  switch (network) {
    case "TIKTOK": return await readTikTok(url);
    case "YOUTUBE": return await readYouTube(url);
    case "X": return await readX(url);
    case "INSTAGRAM": return await readInstagram(url);
    default:
      return { method: "manual", exists: null, author: null, caption: null, views: null, note: "Esta rede ainda não tem leitura automática: conferir manualmente" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Não autenticado" }, 401);

    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Sessão inválida" }, 401);

    const body = await req.json().catch(() => ({}));
    const postId = String(body?.post_id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(postId)) return json({ error: "post_id inválido" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: post } = await admin
      .from("campaign_posts")
      .select("id, network, post_url, affiliate_id, campaigns(keyword), affiliate_social_accounts(handle), profiles!campaign_posts_affiliate_id_fkey(user_id)")
      .eq("id", postId)
      .maybeSingle();
    if (!post) return json({ error: "Post não encontrado" }, 404);

    // Pode chamar: o autor do post ou um admin
    // deno-lint-ignore no-explicit-any
    const p = post as any;
    const isAuthor = p.profiles?.user_id === userData.user.id;
    if (!isAuthor) {
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userData.user.id, _role: "ADMIN" });
      if (!isAdmin) return json({ error: "Sem permissão" }, 403);
    }

    let reading: Reading;
    try {
      reading = await readPost(p.network, p.post_url);
    } catch (e) {
      reading = { method: "erro", exists: null, author: null, caption: null, views: null, note: `Falha na leitura: ${(e as Error).message}`.slice(0, 200) };
    }

    const keyword: string = p.campaigns?.keyword ?? "";
    const caption = reading.caption ?? "";
    const handle: string = p.affiliate_social_accounts?.handle ?? "";
    const result = {
      ...reading,
      caption: caption ? caption.slice(0, 600) : null,
      checked_at: new Date().toISOString(),
      has_keyword: caption ? norm(caption).includes(norm(keyword.replace(/^#/, ""))) : null,
      has_publi: caption ? /#publi\b|#publicidade\b|parceria paga|paid partnership/i.test(caption) : null,
      author_matches: reading.author && handle ? norm(reading.author).replace(/^@/, "") === norm(handle) : null,
    };

    await admin.rpc("set_post_auto_check", { p_post_id: postId, p_result: result });
    return json({ ok: true, auto_check: result });
  } catch (e) {
    console.error("check-post error", e);
    return json({ error: "Erro interno" }, 500);
  }
});
