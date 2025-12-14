import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://clilin.com";

const STATIC_PAGES = [
  { path: "/", changefreq: "weekly", priority: 1.0 },
  { path: "/sobre", changefreq: "monthly", priority: 0.8 },
  { path: "/blog", changefreq: "daily", priority: 0.9 },
  { path: "/termos", changefreq: "yearly", priority: 0.5 },
  { path: "/privacidade", changefreq: "yearly", priority: 0.5 },
  { path: "/transparencia", changefreq: "monthly", priority: 0.6 },
  { path: "/ajuda", changefreq: "monthly", priority: 0.7 },
  { path: "/chat", changefreq: "weekly", priority: 0.6 },
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

    // Get pages from database
    const { data: pages, error: pagesError } = await supabase
      .from("site_pages")
      .select("path, changefreq, priority")
      .eq("include_in_sitemap", true)
      .order("priority", { ascending: false });

    if (pagesError) {
      console.error("Error fetching site pages:", pagesError);
    }

    console.log(`Found ${pages?.length || 0} site pages`);

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

    const today = new Date().toISOString().split("T")[0];

    // Build XML sitemap
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static pages first (always included)
    for (const page of STATIC_PAGES) {
      sitemap += `  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Add additional pages from database (if any)
    if (pages && pages.length > 0) {
      for (const page of pages) {
        // Skip if already in static pages
        if (STATIC_PAGES.some(sp => sp.path === page.path)) continue;
        sitemap += `  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
      }
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

    const totalUrls = STATIC_PAGES.length + (posts?.length || 0);

    console.log(`Sitemap saved successfully with ${totalUrls} URLs (${STATIC_PAGES.length} static + ${posts?.length || 0} blog posts)`);
    console.log(`Public URL: ${publicUrlData.publicUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        totalUrls,
        sitePages: pages?.length || 0,
        blogPosts: posts?.length || 0,
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
