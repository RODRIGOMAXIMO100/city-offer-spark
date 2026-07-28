import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BASE_URL = "https://clilin.com";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, title, excerpt, published_at, updated_at, featured_image, author_name")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(50);

    const now = new Date().toUTCString();
    const items = (posts || []).map((p) => {
      const link = `${BASE_URL}/blog/${p.slug}`;
      const pub = new Date(p.published_at).toUTCString();
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pub}</pubDate>
      <description>${esc(p.excerpt || "")}</description>
      ${p.featured_image ? `<enclosure url="${esc(p.featured_image)}" type="image/png"/>` : ""}
      <author>noreply@clilin.com (${esc(p.author_name || "Equipe Clilin")})</author>
    </item>`;
    }).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Clilin — Blog</title>
    <link>${BASE_URL}/blog</link>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <description>Marketing local, divulgadores e crescimento para pequenos negócios.</description>
    <language>pt-BR</language>
    <lastBuildDate>${now}</lastBuildDate>
${items}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: { ...corsHeaders, "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=1800" },
    });
  } catch (e) {
    console.error("rss error:", e);
    return new Response("<?xml version=\"1.0\"?><rss/>", { status: 500, headers: { ...corsHeaders, "Content-Type": "application/xml" } });
  }
});
