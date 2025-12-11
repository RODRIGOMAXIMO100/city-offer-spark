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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get posts without featured_image
    const { data: posts, error: postsError } = await supabase
      .from("blog_posts")
      .select("id, title, slug, keywords")
      .is("featured_image", null)
      .eq("status", "published")
      .limit(5);

    if (postsError) throw postsError;
    if (!posts || posts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No posts without images found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${posts.length} posts without images`);
    const results = [];

    for (const post of posts) {
      try {
        console.log(`Generating image for: ${post.title}`);
        
        const keywords = post.keywords?.slice(0, 3).join(", ") || post.title;
        const imagePrompt = `Create a professional, modern blog header image for an article about "${post.title}". 
Style: Clean, minimalist, vibrant colors, marketing/business theme. 
Include visual elements related to: ${keywords}.
Aspect ratio: 16:9, suitable for web blog header.
No text in the image.`;

        const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            messages: [{ role: "user", content: imagePrompt }],
            modalities: ["image", "text"]
          }),
        });

        if (!imageResponse.ok) {
          console.error(`Image generation failed for ${post.id}:`, await imageResponse.text());
          results.push({ id: post.id, success: false, error: "Generation failed" });
          continue;
        }

        const imageData = await imageResponse.json();
        const imageBase64 = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageBase64) {
          console.error(`No image returned for ${post.id}`);
          results.push({ id: post.id, success: false, error: "No image in response" });
          continue;
        }

        // Extract base64 data
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Upload to storage
        const imagePath = `blog/${post.slug}.png`;
        const { error: uploadError } = await supabase.storage
          .from("offer-images")
          .upload(imagePath, imageBytes, {
            contentType: "image/png",
            upsert: true
          });

        if (uploadError) {
          console.error(`Upload failed for ${post.id}:`, uploadError);
          results.push({ id: post.id, success: false, error: uploadError.message });
          continue;
        }

        // Get public URL
        const { data: publicUrl } = supabase.storage
          .from("offer-images")
          .getPublicUrl(imagePath);

        // Update post
        const { error: updateError } = await supabase
          .from("blog_posts")
          .update({ featured_image: publicUrl.publicUrl })
          .eq("id", post.id);

        if (updateError) {
          console.error(`Update failed for ${post.id}:`, updateError);
          results.push({ id: post.id, success: false, error: updateError.message });
          continue;
        }

        console.log(`Image added for ${post.id}: ${publicUrl.publicUrl}`);
        results.push({ id: post.id, success: true, url: publicUrl.publicUrl });

      } catch (postError) {
        console.error(`Error processing ${post.id}:`, postError);
        results.push({ id: post.id, success: false, error: String(postError) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
