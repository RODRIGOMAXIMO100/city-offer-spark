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

    const { postId, imageBase64, slug } = await req.json();

    if (!postId || !imageBase64 || !slug) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: postId, imageBase64, slug" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract base64 data
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to storage
    const imagePath = `blog/${slug}.png`;
    const { error: uploadError } = await supabase.storage
      .from("offer-images")
      .upload(imagePath, imageBytes, {
        contentType: "image/png",
        upsert: true
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from("offer-images")
      .getPublicUrl(imagePath);

    const featuredImageUrl = publicUrl.publicUrl;
    console.log("Image uploaded:", featuredImageUrl);

    // Update blog post
    const { error: updateError } = await supabase
      .from("blog_posts")
      .update({ featured_image: featuredImageUrl })
      .eq("id", postId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error(`Update failed: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, url: featuredImageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
