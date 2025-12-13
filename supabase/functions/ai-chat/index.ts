import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Offer {
  id: string;
  title: string;
  description: string;
  price_old: number;
  price_new: number;
  tags: string[];
  city: string;
  company_name?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, city, conversationHistory } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client to fetch offers
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch active offers from the city with extra data for sales context
    const { data: offers, error: offersError } = await supabase
      .from("offers")
      .select(`
        id,
        title,
        description,
        price_old,
        price_new,
        tags,
        city,
        clicks_count,
        views_count,
        expires_at,
        images,
        profiles!offers_company_id_fkey(name, instagram_url)
      `)
      .eq("city", city)
      .eq("active", true)
      .gt("expires_at", new Date().toISOString())
      .order("clicks_count", { ascending: false })
      .limit(20);

    if (offersError) {
      console.error("Error fetching offers:", offersError);
    }

    // Calculate hours remaining and savings for each offer
    const now = new Date();
    const offersContext = offers?.map((o: any) => {
      const expiresAt = new Date(o.expires_at);
      const hoursRemaining = Math.max(0, Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));
      const savingsReais = (o.price_old - o.price_new).toFixed(2);
      const discountPercent = Math.round((1 - o.price_new / o.price_old) * 100);
      
      return {
        id: o.id,
        title: o.title,
        description: o.description || "",
        price_old: o.price_old,
        price_new: o.price_new,
        savings_reais: savingsReais,
        discount: discountPercent,
        tags: o.tags || [],
        company: o.profiles?.name || "Empresa",
        instagram_url: o.profiles?.instagram_url || null,
        images: o.images || [],
        clicks: o.clicks_count || 0,
        views: o.views_count || 0,
        hours_remaining: hoursRemaining,
        is_popular: (o.clicks_count || 0) > 10,
        is_urgent: hoursRemaining <= 24,
      };
    }) || [];

    // Sort by popularity for the AI context
    const topOffers = [...offersContext].sort((a, b) => b.clicks - a.clicks).slice(0, 5);

    // Create a simple ID mapping for the AI
    const offersList = offersContext.map((o: any, index: number) => 
      `[${index + 1}] ID: ${o.id} | ${o.company}: "${o.title}" | De R$${o.price_old} por R$${o.price_new} (${o.discount}% off) | Economia: R$${o.savings_reais}${o.is_popular ? ' | ⭐ POPULAR' : ''}${o.is_urgent ? ' | ⏰ URGENTE' : ''}`
    ).join('\n');

    const systemPrompt = `Você é a Clilin, uma amiga animada que conhece TODAS as ofertas de ${city} e quer ajudar RÁPIDO! 😊

📊 OFERTAS DISPONÍVEIS (use os IDs exatos):
${offersList}

🎯 REGRAS CRÍTICAS:

1. **SEMPRE QUE MENCIONAR OFERTAS**: Você DEVE incluir os IDs no campo suggestedOfferIds
2. Não descreva preços ou detalhes - os cards já mostram isso automaticamente
3. Apenas faça uma introdução curta e deixe os cards mostrarem as ofertas

**PRIMEIRO CONTATO (oi, olá, etc):**
- Saudação curta: "Oi! 😊 Tá afim de quê hoje? Comida, serviço, ou quer ver as ofertas mais quentes?"
- NÃO mostre ofertas ainda (suggestedOfferIds: [])

**QUANDO SOUBER A PREFERÊNCIA ou PEDIR OFERTAS:**
- Resposta CURTA tipo: "Opa, olha só o que separei pra você! 🔥" ou "Achei essas aqui que você vai curtir!"
- SEMPRE inclua os IDs das ofertas no suggestedOfferIds
- Os cards aparecem automaticamente, não descreva preços no texto

🎭 TOM:
- Amiga animada, mineirês leve (cê, uai, né)
- Emojis moderados 😊🍕💰
- Respostas CURTAS - os cards fazem o trabalho pesado

📤 FORMATO OBRIGATÓRIO (JSON):
{"text": "mensagem curta", "suggestedOfferIds": ["id-uuid-aqui", "outro-id"]}

💬 EXEMPLOS:

Usuário: "oi"
{"text": "Oi! 😊 Tá afim de quê hoje? Comida, serviço, ou quer ver as ofertas mais quentes de ${city}?", "suggestedOfferIds": []}

Usuário: "quero ver ofertas" ou "o que tem?"
{"text": "Olha só o que tá rolando de bom! 🔥", "suggestedOfferIds": ${JSON.stringify(topOffers.slice(0, 3).map((o: any) => o.id))}}

Usuário: "comida" ou preferência específica
{"text": "Boa escolha! Separei essas pra você 😋", "suggestedOfferIds": ["ids-das-ofertas-relevantes"]}`;

    console.log("AI Chat - City:", city, "Offers found:", offersContext.length);

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []),
      { role: "user", content: message },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.8,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Limite de uso atingido. Entre em contato com o suporte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("Erro ao processar sua mensagem");
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || "";
    
    console.log("AI raw response:", aiContent.substring(0, 500));

    // Try to parse JSON response
    let parsedResponse;
    try {
      // Extract JSON from the response (might be wrapped in markdown)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, use the raw text
        parsedResponse = { text: aiContent, suggestedOfferIds: [] };
      }
    } catch (parseError) {
      console.log("JSON parse error, using raw text:", parseError);
      // Clean up markdown formatting from raw text
      let cleanText = aiContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^\s*\{[\s\S]*?\}\s*$/g, ''); // Remove failed JSON
      
      // If cleaned text is empty or just whitespace, provide a fallback
      if (!cleanText.trim()) {
        cleanText = "Encontrei algumas ofertas que podem te interessar! 😊";
      }
      
      parsedResponse = { text: cleanText, suggestedOfferIds: [] };
    }

    // Get full offer details for suggested offers
    const suggestedOffers = offersContext.filter((o: any) =>
      parsedResponse.suggestedOfferIds?.includes(o.id)
    );

    console.log(
      "AI Chat - Suggested offers:",
      suggestedOffers.map((o: any) => ({ id: o.id, hasImage: !!(o.images && o.images.length) }))
    );

    return new Response(
      JSON.stringify({
        text: parsedResponse.text,
        suggestedOffers,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-chat function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});