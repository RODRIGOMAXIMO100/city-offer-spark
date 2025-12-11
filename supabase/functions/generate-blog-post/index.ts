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

    // Generate blog post with AI using TOOL CALLING for reliable structured output
    const systemPrompt = `Você é um especialista em marketing de conteúdo e SEO para o mercado brasileiro. 
Você escreve artigos para o blog da Clilin, uma plataforma de ofertas locais e programa de afiliados.

Seu objetivo é criar conteúdo que:
1. Seja ALTAMENTE otimizado para SEO com as keywords fornecidas (use-as 3-5 vezes)
2. Seja útil, prático e ORIGINAL para o leitor
3. Tenha entre 1000-1500 palavras
4. Use linguagem acessível em português brasileiro
5. Inclua subtítulos (H2, H3) estratégicos com keywords
6. Inclua listas, dicas práticas e exemplos reais
7. Termine com seção FAQ com 3 perguntas

REGRAS DE FORMATAÇÃO HTML:
- Use <h2> para títulos principais de seção
- Use <h3> para subtítulos
- Use <p> para parágrafos
- Use <ul> e <li> para listas
- Use <strong> para termos importantes
- Use <blockquote> para citações
- NÃO use <h1> (reservado para título)
- Inclua seção FAQ:
  <h2>Perguntas Frequentes</h2>
  <h3>Pergunta?</h3>
  <p>Resposta...</p>

LINKS INTERNOS (inclua 2-3):
- <a href="/auth">cadastre-se grátis</a>
- <a href="/blog">mais artigos</a>
- <a href="/">Clilin</a>`;

    const userPrompt = `Crie um artigo de blog completo sobre: "${theme.theme}"

Keywords OBRIGATÓRIAS: ${theme.keywords.join(", ")}
Categoria: ${theme.category}

Use a função create_blog_post para retornar os dados estruturados.`;

    // Define the tool for structured output extraction
    const tools = [
      {
        type: "function",
        function: {
          name: "create_blog_post",
          description: "Create a complete blog post with all required fields",
          parameters: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Título atraente e otimizado para SEO (50-60 caracteres)"
              },
              slug: {
                type: "string",
                description: "URL do post em kebab-case sem acentos (ex: como-ganhar-dinheiro-online)"
              },
              excerpt: {
                type: "string",
                description: "Resumo envolvente de 150-160 caracteres para meta description"
              },
              content: {
                type: "string",
                description: "Conteúdo HTML completo com H2, H3, parágrafos, listas, links internos e seção FAQ"
              },
              meta_title: {
                type: "string",
                description: "Título SEO com keyword principal (max 60 caracteres)"
              },
              meta_description: {
                type: "string",
                description: "Meta description persuasiva com keyword (max 160 caracteres)"
              },
              keywords: {
                type: "array",
                items: { type: "string" },
                description: "5 keywords relevantes para o artigo"
              },
              faq: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string", description: "Pergunta frequente sobre o tema" },
                    answer: { type: "string", description: "Resposta completa de 2-3 frases" }
                  },
                  required: ["question", "answer"]
                },
                description: "3 perguntas frequentes com respostas"
              }
            },
            required: ["title", "slug", "excerpt", "content", "meta_title", "meta_description", "keywords", "faq"]
          }
        }
      }
    ];

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
        tools: tools,
        tool_choice: { type: "function", function: { name: "create_blog_post" } },
        max_tokens: 8192
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");
    
    // Extract data from tool call
    let postData;
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall || toolCall.function.name !== "create_blog_post") {
        console.error("No tool call found, response:", JSON.stringify(aiData).substring(0, 500));
        throw new Error("AI did not return expected tool call");
      }
      
      postData = JSON.parse(toolCall.function.arguments);
      console.log("Parsed post data:", postData.title);
    } catch (parseError) {
      console.error("Tool call parse error:", parseError);
      console.error("AI response:", JSON.stringify(aiData).substring(0, 1000));
      throw new Error("Failed to parse AI tool call response");
    }

    // Validate required fields
    if (!postData.title || !postData.content || !postData.excerpt) {
      throw new Error("Missing required fields in generated content");
    }

    // Log content length for debugging
    console.log("Generated content length:", postData.content.length, "characters");

    // Validate minimum content length (1000-1500 words = ~5000-8000 characters)
    if (postData.content.length < 5000) {
      console.error("Content too short:", postData.content.length, "characters. Expected at least 5000.");
      throw new Error(`Generated content is too short (${postData.content.length} chars). May have been truncated.`);
    }

    // Ensure FAQ exists - create default if missing
    if (!postData.faq || !Array.isArray(postData.faq) || postData.faq.length === 0) {
      console.log("FAQ missing, generating default FAQ");
      postData.faq = [
        { question: `O que é ${theme.theme.split(' ').slice(0, 4).join(' ')}?`, answer: "Esta é uma estratégia importante para quem busca resultados no mercado local e digital. Confira o artigo completo para entender melhor." },
        { question: "Como posso começar?", answer: "O primeiro passo é se cadastrar na plataforma Clilin e explorar as oportunidades disponíveis na sua cidade." },
        { question: "Quanto tempo leva para ver resultados?", answer: "Os resultados variam de pessoa para pessoa, mas com dedicação é possível ver os primeiros resultados em poucas semanas." }
      ];
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
