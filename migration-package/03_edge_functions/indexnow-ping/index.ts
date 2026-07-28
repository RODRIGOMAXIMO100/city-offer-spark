import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const INDEXNOW_KEY = "6ecb105350d30b04dd9bbc209231f7150331d901a8891ed9c8cda0b1430c61f7";
const HOST = "clilin.com";
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { urls } = await req.json();
    if (!Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ error: "urls array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanUrls = urls.filter((u: unknown) => typeof u === "string" && u.startsWith(`https://${HOST}/`)).slice(0, 10000);

    // Ping IndexNow (Bing, Yandex, Seznam, Naver all share this endpoint)
    const indexNowRes = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: KEY_LOCATION, urlList: cleanUrls }),
    });

    // Also ping Google via sitemap re-fetch hint
    const googlePing = await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(`https://${HOST}/sitemap.xml`)}`,
      { method: "GET" }
    ).catch(() => null);

    return new Response(JSON.stringify({
      success: true,
      submitted: cleanUrls.length,
      indexnow_status: indexNowRes.status,
      google_ping: googlePing?.status ?? "failed",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("indexnow-ping error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
