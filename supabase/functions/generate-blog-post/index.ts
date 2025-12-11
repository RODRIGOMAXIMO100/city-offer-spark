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
Você escreve artigos para o blog da Clilin, uma plataforma de ofertas locais e programa de afiliados em cidades do Brasil.

Seu objetivo é criar conteúdo que:
1. Seja ALTAMENTE otimizado para SEO com as keywords fornecidas (use-as naturalmente 3-5 vezes)
2. Seja útil, prático e ORIGINAL para o leitor
3. Tenha entre 1000-1500 palavras para melhor rankeamento
4. Use linguagem acessível e conversacional em português brasileiro
5. Inclua subtítulos (H2, H3) estratégicos com keywords
6. Tenha uma introdução envolvente com a keyword principal
7. Inclua listas, dicas práticas e exemplos reais
8. Termine com uma seção de FAQ com 3 perguntas frequentes
9. Seja formatado em HTML válido

REGRAS DE FORMATAÇÃO HTML:
- Use <h2> para títulos principais de seção
- Use <h3> para subtítulos dentro das seções
- Use <p> para parágrafos
- Use <ul> e <li> para listas
- Use <strong> para destacar termos importantes
- Use <blockquote> para citações ou dicas especiais
- NÃO use <h1> (é reservado para o título da página)
- Para a seção de FAQ, use este formato:
  <h2>Perguntas Frequentes</h2>
  <h3>Pergunta 1?</h3>
  <p>Resposta 1...</p>

LINKS INTERNOS OBRIGATÓRIOS (inclua 2-3 no conteúdo):
- <a href="/auth">cadastre-se grátis</a> ou <a href="/auth">criar conta</a>
- <a href="/blog">mais artigos</a> ou <a href="/blog">nosso blog</a>
- <a href="/">página inicial</a> ou <a href="/">Clilin</a>

IMPORTANTE: Retorne APENAS um JSON válido, sem markdown, sem backticks.`;

    const userPrompt = `Crie um artigo de blog completo sobre: "${theme.theme}"

Keywords OBRIGATÓRIAS para incluir naturalmente: ${theme.keywords.join(", ")}
Categoria: ${theme.category}

Retorne um JSON com exatamente esta estrutura:
{
  "title": "Título atraente e otimizado para SEO (50-60 chars)",
  "slug": "url-do-post-em-kebab-case-sem-acentos",
  "excerpt": "Resumo envolvente de 150-160 caracteres para meta description com keyword principal",
  "content": "Conteúdo HTML completo com H2, H3, parágrafos, listas, links internos e FAQ",
  "meta_title": "Título SEO com keyword principal (max 60 chars)",
  "meta_description": "Meta description persuasiva com keyword (max 160 chars)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "faq": [
    {"question": "Pergunta 1?", "answer": "Resposta 1"},
    {"question": "Pergunta 2?", "answer": "Resposta 2"},
    {"question": "Pergunta 3?", "answer": "Resposta 3"}
  ]
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
      
      // Remove markdown code blocks
      cleanContent = cleanContent.replace(/^```json\s*/i, '');
      cleanContent = cleanContent.replace(/^```\s*/i, '');
      cleanContent = cleanContent.replace(/\s*```$/i, '');
      cleanContent = cleanContent.trim();
      
      // Try to find JSON object in the content
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      postData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Parse error:", parseError, "Content length:", generatedContent.length);
      console.error("First 500 chars:", generatedContent.substring(0, 500));
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

    // Generate featured image with AI
    let featuredImageUrl = null;
    try {
      console.log("Generating featured image...");
      
      const imagePrompt = `Create a professional, modern blog header image for an article about "${postData.title}". 
Style: Clean, minimalist, vibrant colors, marketing/business theme. 
Include visual elements related to: ${theme.keywords.slice(0, 3).join(", ")}.
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
          messages: [
            { role: "user", content: imagePrompt }
          ],
          modalities: ["image", "text"]
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const imageBase64 = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (imageBase64) {
          // Extract base64 data (remove data:image/png;base64, prefix)
          const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
          const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          
          // Upload to Supabase storage
          const imagePath = `blog/${uniqueSlug}.png`;
          const { error: uploadError } = await supabase.storage
            .from("offer-images")
            .upload(imagePath, imageBytes, {
              contentType: "image/png",
              upsert: true
            });

          if (!uploadError) {
            const { data: publicUrl } = supabase.storage
              .from("offer-images")
              .getPublicUrl(imagePath);
            
            featuredImageUrl = publicUrl.publicUrl;
            console.log("Image uploaded:", featuredImageUrl);
          } else {
            console.error("Image upload error:", uploadError);
          }
        }
      } else {
        console.error("Image generation failed:", await imageResponse.text());
      }
    } catch (imageError) {
      console.error("Image generation error:", imageError);
      // Continue without image
    }

    // Insert blog post
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
        featured_image: featuredImageUrl,
        faq: postData.faq || null,
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

    console.log("Post created:", newPost.id, newPost.title, "Image:", featuredImageUrl ? "Yes" : "No");

    return new Response(
      JSON.stringify({
        success: true,
        post: {
          id: newPost.id,
          title: newPost.title,
          slug: newPost.slug,
          featured_image: featuredImageUrl,
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
