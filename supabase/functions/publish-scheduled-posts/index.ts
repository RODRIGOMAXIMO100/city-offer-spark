import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find posts scheduled for publication
    const now = new Date().toISOString();
    
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from("blog_posts")
      .select("id, title, slug")
      .eq("status", "scheduled")
      .lte("scheduled_for", now);

    if (fetchError) {
      throw fetchError;
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      console.log("No scheduled posts to publish");
      return new Response(
        JSON.stringify({ success: true, published: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${scheduledPosts.length} posts to publish`);

    // Publish each post
    const postIds = scheduledPosts.map(p => p.id);
    
    const { error: updateError } = await supabase
      .from("blog_posts")
      .update({
        status: "published",
        published_at: now,
      })
      .in("id", postIds);

    if (updateError) {
      throw updateError;
    }

    console.log(`Published ${scheduledPosts.length} posts:`, scheduledPosts.map(p => p.title));

    return new Response(
      JSON.stringify({
        success: true,
        published: scheduledPosts.length,
        posts: scheduledPosts.map(p => ({ id: p.id, title: p.title, slug: p.slug })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error publishing scheduled posts:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
