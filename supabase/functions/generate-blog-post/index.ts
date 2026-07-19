import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate new themes dynamically when running low
async function generateNewThemes(supabase: any, lovableApiKey: string, count: number = 5) {
  console.log(`Generating ${count} new themes dynamically...`);
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const nextYear = currentYear + 1;
  const month = currentDate.toLocaleString('pt-BR', { month: 'long' });

  const themePrompt = `Você é especialista em marketing digital e comércio local no Brasil.

Gere ${count} temas ÚNICOS e ATUAIS para artigos de blog sobre:
- Marketing local e digital para pequenos negócios
- Programa de afiliados e criadores de conteúdo
- Tendências de consumo e tecnologia

CONTEXTO TEMPORAL: Estamos em ${month} de ${currentYear}, próximos de ${nextYear}.

Foque em:
- Retrospectivas de ${currentYear} e previsões para ${nextYear}
- Tecnologias emergentes (IA, Pix, TikTok Shop, etc)
- Comportamento do consumidor atual
- Estratégias práticas e acionáveis

Categorias disponíveis: "empresas", "afiliados", "tendencias"

Use a função create_themes para retornar os temas.`;

  const tools = [{
    type: "function",
    function: {
      name: "create_themes",
      description: "Create blog themes with keywords",
      parameters: {
        type: "object",
        properties: {
          themes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                theme: { type: "string", description: "Título do tema para o artigo" },
                keywords: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "5 keywords SEO relevantes"
                },
                category: { 
                  type: "string", 
                  enum: ["empresas", "afiliados", "tendencias"],
                  description: "Categoria do tema"
                }
              },
              required: ["theme", "keywords", "category"]
            }
          }
        },
        required: ["themes"]
      }
    }
  }];

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [{ role: "user", content: themePrompt }],
        tools,
        tool_choice: { type: "function", function: { name: "create_themes" } }
      }),
    });

    if (!response.ok) {
      console.error("Theme generation API error:", await response.text());
      return [];
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error("No tool call in theme generation response");
      return [];
    }

    const { themes } = JSON.parse(toolCall.function.arguments);
    
    // Insert new themes
    const newThemes = themes.map((t: any) => ({
      theme: t.theme,
      keywords: t.keywords,
      category: t.category,
      active: true,
      use_count: 0
    }));

    const { data: inserted, error } = await supabase
      .from("blog_themes")
      .insert(newThemes)
      .select();

    if (error) {
      console.error("Error inserting new themes:", error);
      return [];
    }

    console.log(`Successfully created ${inserted.length} new themes`);
    return inserted;
  } catch (error) {
    console.error("Error generating themes:", error);
    return [];
  }
}

// Generate image with retry and fallback
async function generateFeaturedImage(
  lovableApiKey: string, 
  supabase: any,
  title: string, 
  keywords: string[], 
  slug: string
): Promise<string> {
  const maxAttempts = 2;
  let featuredImageUrl: string | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Image generation attempt ${attempt}/${maxAttempts}...`);
      
      const imagePrompt = `Create a professional, modern blog header image for an article about "${title}". 
Style: Clean, minimalist, vibrant colors, marketing/business theme. 
Include visual elements related to: ${keywords.slice(0, 3).join(", ")}.
Aspect ratio: 16:9, suitable for web blog header.
No text in the image. High quality.`;

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
        console.error(`Attempt ${attempt} - API error:`, await imageResponse.text());
        continue;
      }

      const imageData = await imageResponse.json();
      const imageBase64 = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (!imageBase64) {
        console.error(`Attempt ${attempt} - No image in response`);
        continue;
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
        console.error(`Attempt ${attempt} - Upload error:`, uploadError);
        continue;
      }

      const { data: publicUrl } = supabase.storage
        .from("offer-images")
        .getPublicUrl(imagePath);
      
      featuredImageUrl = publicUrl.publicUrl;
      console.log(`Image generated successfully on attempt ${attempt}:`, featuredImageUrl);
      break;

    } catch (error) {
      console.error(`Attempt ${attempt} - Error:`, error);
    }
  }

  // Fallback: Use placeholder if all attempts failed
  if (!featuredImageUrl) {
    const encodedTitle = encodeURIComponent(title.substring(0, 35));
    featuredImageUrl = `https://placehold.co/1200x630/6366f1/ffffff/png?text=${encodedTitle}`;
    console.log("Using placeholder image:", featuredImageUrl);
  }

  return featuredImageUrl;
}

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

    // Check available themes (use_count < 3 means relatively fresh)
    const { data: availableThemes, error: countError } = await supabase
      .from("blog_themes")
      .select("id")
      .eq("active", true)
      .lt("use_count", 3);

    if (countError) {
      console.error("Error checking themes:", countError);
    }

    // If running low on fresh themes, generate more
    const MIN_FRESH_THEMES = 10;
    if (!availableThemes || availableThemes.length < MIN_FRESH_THEMES) {
      console.log(`Only ${availableThemes?.length || 0} fresh themes available, generating more...`);
      await generateNewThemes(supabase, lovableApiKey, 10);
    }

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
    console.log("Selected theme:", theme.theme, "| Use count:", theme.use_count);

    // Generate blog post with AI using TOOL CALLING
    const systemPrompt = `Você é copywriter sênior de SEO e conteúdo para a Clilin — plataforma de ofertas locais que conecta empresas, divulgadores e clientes em cidades brasileiras.

PEGADA EDITORIAL (OBRIGATÓRIA):
- Tom DIRETO, PROVOCATIVO e sem enrolação. Fale como quem entende do jogo e não tem tempo para fofura.
- Abra com uma verdade dura ou pergunta afiada que confronte o leitor (ex: "Você realmente acredita que...?" / "A verdade é dura: ...").
- Use frases curtas e impactantes, misturadas com parágrafos densos de argumentação.
- Use dados, números, porcentagens e referências concretas para dar autoridade (ex: "R$ X milhões", "48% de crescimento", datas específicas).
- Nomeie inimigos claros: amadorismo, "métricas de vaidade", "impulsionar botão", "o sobrinho que mexe no Insta", dependência de algoritmo, delivery caro, tráfego pago mal feito.
- Posicione a Clilin como a solução profissional e o "método" contra o improviso.
- IMPORTANTE: use SEMPRE a palavra "divulgadores" (NUNCA "afiliados"), mesmo que a categoria seja "afiliados".
- Mantenha valores de comunidade, serviço e crescimento local de forma sutil (NUNCA use termos religiosos explícitos).

ESTRUTURA OBRIGATÓRIA DO HTML (nesta ordem exata):
1. <p> Parágrafo de abertura provocativo (4-6 frases) com o problema real.
2. <p> Segundo parágrafo apresentando a keyword principal em <strong> e a promessa do artigo.
3. <h2>Principais Conclusões</h2> seguido de <ul> com 5 bullets curtos e afiados (cada um começando com verbo forte).
4. <h2>Índice</h2> seguido de <ul> com links âncora para as próximas H2 (ex: <a href="#secao-1">Título</a>).
5. 4 a 5 seções <h2> com id="secao-X" — cada uma com 2-3 subseções <h3> e parágrafos densos.
6. Ao menos 1 <img> intermediária ilustrativa usando placeholder https://placehold.co/1200x600/6366f1/ffffff/png?text=... (opcional, apenas se fizer sentido).
7. <h2>Perguntas Frequentes</h2> com 3-4 <h3>pergunta</h3> + <p>resposta</p>.
8. <p> Parágrafo final de fechamento com CTA forte para a Clilin.

REQUISITOS DE TAMANHO:
- MÍNIMO 1800 palavras (10.000-12.000 caracteres de HTML).
- Cada H2 com pelo menos 3 parágrafos substanciais + 1 lista quando fizer sentido.

SEO:
- Use a keyword principal em <strong> pelo menos 5x ao longo do texto (naturalmente).
- Use as demais keywords 2-3x cada.
- Inclua pelo menos 2 links EXTERNOS de autoridade (Wikipedia, Sebrae, IBGE, gov.br, universidades, veículos grandes) com rel="noopener" target="_blank".
- Inclua 3-4 links INTERNOS obrigatórios:
  * <a href="/empresas">cadastre sua empresa</a>
  * <a href="/divulgadores">seja um divulgador</a>
  * <a href="/clientes">encontre ofertas na sua cidade</a>
  * <a href="/blog">leia mais no blog da Clilin</a>

FORMATAÇÃO:
- NÃO use <h1> (reservado para o título do post).
- Use <strong> em termos-chave e frases de impacto.
- Use <blockquote> para 1-2 frases-manifesto ao longo do texto.
- Listas <ul> com 4-6 itens começando com <strong>Termo:</strong>.`;

    const userPrompt = `Escreva um artigo COMPLETO no estilo definido sobre: "${theme.theme}"

Keyword principal (use em <strong> 5x+): ${theme.keywords[0]}
Keywords secundárias: ${theme.keywords.slice(1).join(", ")}
Categoria: ${theme.category}

CONTEXTO CLILIN (use ao longo do texto):
- Plataforma de ofertas locais que conecta empresas, DIVULGADORES (nunca "afiliados") e clientes.
- Empresas pagam por lead qualificado (CPL) — nunca por clique vazio.
- Divulgadores ganham comissão real ao gerar leads (WhatsApp, site ou cardápio digital da empresa).
- Depósito mínimo para empresas: R$ 100.
- Foco em serviço, comunidade e crescimento local — sem jargão religioso.

Abra com um lead PROVOCATIVO, siga a estrutura obrigatória (parágrafos → Principais Conclusões → Índice → 4-5 H2 com id → FAQ → fechamento com CTA), mínimo 1800 palavras, tom direto e afiado como manual de guerra. Use a função create_blog_post.`;

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
                description: "Conteúdo HTML EXTENSO e COMPLETO com mínimo 8000 caracteres. Inclua: 4+ seções H2, múltiplos H3, parágrafos detalhados de 3-5 frases cada, listas com 5+ itens, links internos e seção FAQ com 3-4 perguntas. Desenvolva cada seção com profundidade."
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
        model: "openai/gpt-5",
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

    // Log content length
    console.log("Generated content length:", postData.content.length, "characters");

    // Validate minimum content length
    if (postData.content.length < 5000) {
      console.error("Content too short:", postData.content.length, "characters. Expected at least 5000.");
      throw new Error(`Generated content is too short (${postData.content.length} chars). May have been truncated.`);
    }

    // Ensure FAQ exists
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

    // Generate featured image with retry and fallback
    const featuredImageUrl = await generateFeaturedImage(
      lovableApiKey,
      supabase,
      postData.title,
      theme.keywords,
      uniqueSlug
    );

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

    console.log("Post created:", newPost.id, newPost.title, "| Image:", featuredImageUrl ? "Yes" : "No");

    // Fire IndexNow + Google ping so Bing/Yandex/Google discover the URL immediately.
    try {
      const postUrl = `https://clilin.com/blog/${uniqueSlug}`;
      await fetch(`${supabaseUrl}/functions/v1/indexnow-ping`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ urls: [postUrl, "https://clilin.com/blog"] }),
      });
      console.log("IndexNow pinged for:", postUrl);
    } catch (pingErr) {
      console.error("IndexNow ping failed (non-fatal):", pingErr);
    }
    

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
