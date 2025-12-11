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

    // Get least used active theme
    const { data: themes, error: themeError } = await supabase
      .from("blog_themes")
      .select("*")
      .eq("active", true)
      .order("use_count", { ascending: true })
      .order("last_used_at", { ascending: true, nullsFirst: true })
      .limit(1);

    if (themeError || !themes || themes.length === 0) {
      throw new Error("No active themes found");
    }

    const theme = themes[0];
    console.log("Selected theme:", theme.theme);

    // Generate blog post with AI
    const systemPrompt = `Você é um especialista em marketing de conteúdo e SEO para o mercado brasileiro. 
Você escreve artigos para o blog da Clilin, uma plataforma de ofertas locais e programa de afiliados.

Seu objetivo é criar conteúdo que:
1. Seja altamente otimizado para SEO com as keywords fornecidas
2. Seja útil e prático para o leitor
3. Tenha entre 800-1200 palavras
4. Use linguagem acessível e conversacional
5. Inclua subtítulos (H2, H3) para melhor leitura
6. Tenha uma introdução envolvente e conclusão com call-to-action
7. Seja formatado em HTML válido (use <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>)

IMPORTANTE: Retorne APENAS um JSON válido, sem markdown, sem backticks, sem texto adicional.`;

    const userPrompt = `Crie um artigo de blog sobre o tema: "${theme.theme}"

Keywords para incluir naturalmente: ${theme.keywords.join(", ")}
Categoria: ${theme.category}

Retorne um JSON com exatamente esta estrutura:
{
  "title": "Título otimizado para SEO (max 60 chars)",
  "slug": "url-do-post-em-kebab-case",
  "excerpt": "Resumo de 150-160 caracteres para meta description",
  "content": "<h2>Subtítulo</h2><p>Parágrafo...</p>...",
  "meta_title": "Título SEO (max 60 chars)",
  "meta_description": "Descrição para SEO (max 160 chars)",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error("No content generated");
    }

    console.log("Generated content:", generatedContent.substring(0, 200));

    // Parse JSON response
    let postData;
    try {
      // Clean up the response - remove any markdown formatting
      let cleanContent = generatedContent.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();
      
      postData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Parse error:", parseError, "Content:", generatedContent);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Validate required fields
    if (!postData.title || !postData.content || !postData.excerpt) {
      throw new Error("Missing required fields in generated content");
    }

    // Generate unique slug
    const baseSlug = postData.slug || postData.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    
    const timestamp = Date.now().toString(36);
    const uniqueSlug = `${baseSlug}-${timestamp}`;

    // Insert blog post as draft
    const { data: newPost, error: insertError } = await supabase
      .from("blog_posts")
      .insert({
        title: postData.title.substring(0, 200),
        slug: uniqueSlug,
        excerpt: postData.excerpt.substring(0, 300),
        content: postData.content,
        meta_title: (postData.meta_title || postData.title).substring(0, 60),
        meta_description: (postData.meta_description || postData.excerpt).substring(0, 160),
        keywords: postData.keywords || theme.keywords,
        category: theme.category,
        status: "published",
        published_at: new Date().toISOString(),
        author_name: "Equipe Clilin",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to insert post: ${insertError.message}`);
    }

    // Update theme usage
    await supabase
      .from("blog_themes")
      .update({
        use_count: theme.use_count + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", theme.id);

    console.log("Post created:", newPost.id, newPost.title);

    return new Response(
      JSON.stringify({
        success: true,
        post: {
          id: newPost.id,
          title: newPost.title,
          slug: newPost.slug,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating blog post:", error);
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
