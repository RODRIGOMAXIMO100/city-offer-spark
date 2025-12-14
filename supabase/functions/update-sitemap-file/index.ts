import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://clilin.com";

// Static pages that are always included
const STATIC_PAGES = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/sobre", changefreq: "monthly", priority: "0.8" },
  { loc: "/blog", changefreq: "daily", priority: "0.9" },
  { loc: "/auth", changefreq: "monthly", priority: "0.5" },
  { loc: "/ajuda", changefreq: "monthly", priority: "0.6" },
  { loc: "/transparencia", changefreq: "monthly", priority: "0.6" },
  { loc: "/termos", changefreq: "monthly", priority: "0.4" },
  { loc: "/privacidade", changefreq: "monthly", priority: "0.4" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Generating and saving sitemap...");

    // Get published blog posts
    const { data: posts, error: postsError } = await supabase
      .from("blog_posts")
      .select("slug, published_at, updated_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (postsError) {
      console.error("Error fetching blog posts:", postsError);
    }

    console.log(`Found ${posts?.length || 0} published blog posts`);

    // Get active offers
    const { data: offers, error: offersError } = await supabase
      .from("offers")
      .select("id, updated_at")
      .eq("active", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(500);

    if (offersError) {
      console.error("Error fetching offers:", offersError);
    }

    console.log(`Found ${offers?.length || 0} active offers`);

    const today = new Date().toISOString().split("T")[0];

    // Build XML sitemap
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static pages
    for (const page of STATIC_PAGES) {
      sitemap += `  <url>
    <loc>${BASE_URL}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Add blog posts
    if (posts && posts.length > 0) {
      for (const post of posts) {
        const lastmod = post.updated_at || post.published_at;
        sitemap += `  <url>
    <loc>${BASE_URL}/blog/${post.slug}</loc>
    <lastmod>${new Date(lastmod).toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    // Add offer pages
    if (offers && offers.length > 0) {
      for (const offer of offers) {
        sitemap += `  <url>
    <loc>${BASE_URL}/offer/${offer.id}</loc>
    <lastmod>${new Date(offer.updated_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
    }

    sitemap += `</urlset>`;

    // Convert to Uint8Array for upload
    const encoder = new TextEncoder();
    const sitemapBytes = encoder.encode(sitemap);

    // Upload to storage bucket
    const { error: uploadError } = await supabase.storage
      .from("static-files")
      .upload("sitemap.xml", sitemapBytes, {
        contentType: "application/xml",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading sitemap:", uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("static-files")
      .getPublicUrl("sitemap.xml");

    const totalUrls = STATIC_PAGES.length + (posts?.length || 0) + (offers?.length || 0);

    console.log(`Sitemap saved successfully with ${totalUrls} URLs`);
    console.log(`Public URL: ${publicUrlData.publicUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        totalUrls,
        staticPages: STATIC_PAGES.length,
        blogPosts: posts?.length || 0,
        offers: offers?.length || 0,
        publicUrl: publicUrlData.publicUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating sitemap:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
