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

    // Verificar se há ofertas disponíveis
    const hasOffers = offersContext.length > 0;

    // Sort by popularity for the AI context
    const topOffers = [...offersContext].sort((a, b) => b.clicks - a.clicks).slice(0, 5);
    const topOfferIds = topOffers.slice(0, 3).map((o: any) => o.id);

    // Create a simple ID mapping for the AI
    const offersList = offersContext.map((o: any, index: number) => 
      `[${index + 1}] ID: ${o.id} | ${o.company}: "${o.title}" | De R$${o.price_old} por R$${o.price_new} (${o.discount}% off) | Economia: R$${o.savings_reais}${o.is_popular ? ' | ⭐ POPULAR' : ''}${o.is_urgent ? ' | ⏰ URGENTE' : ''}`
    ).join('\n');

    // Sistema de prompt condicional baseado na disponibilidade de ofertas
    const systemPrompt = hasOffers 
      ? `Você é a Clilin, assistente de ofertas de ${city}. 😊

📊 OFERTAS:
${offersList}

🎯 REGRAS:
1. Responda em JSON: {"text": "...", "suggestedOfferIds": [...]}
2. MÁXIMO 1-2 frases curtas no "text"
3. Seja SUPER direta e objetiva

**Saudação:** "Oi! O que cê tá procurando? 😊" | suggestedOfferIds: []
**Pediu ofertas:** "Olha só! 🔥" | suggestedOfferIds: ${JSON.stringify(topOfferIds)}
**Categoria específica:** Filtre e mostre IDs relevantes

📤 JSON APENAS:
{"text": "msg curta", "suggestedOfferIds": ["id1"]}`
      : `Você é a Clilin de ${city}. 😊

⚠️ NÃO há ofertas em ${city} ainda.

🔗 LINKS ÚTEIS:
- Empresas: https://clilin.com/empresas
- Divulgadores: https://clilin.com/divulgadores

🎯 REGRAS:
1. JSON: {"text": "...", "suggestedOfferIds": []}
2. MÁXIMO 2-3 frases curtas
3. Diga que ainda não tem ofertas
4. Se perguntarem COMO convidar/indicar: "É fácil! O negócio pode se cadastrar grátis em https://clilin.com/empresas 😊"
5. NUNCA invente ofertas
6. RESPONDA o que foi perguntado

📤 JSON APENAS:
{"text": "msg curta", "suggestedOfferIds": []}`;

    console.log("AI Chat - City:", city, "Offers found:", offersContext.length, "Has offers:", hasOffers, "Top IDs:", topOfferIds);

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
        temperature: 0.5,
        max_tokens: 150,
        response_format: { type: "json_object" },
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
    
    console.log("AI raw response:", aiContent);

    // Try to parse JSON response
    let parsedResponse: { text: string; suggestedOfferIds: string[] };
    try {
      // Extract JSON from the response (might be wrapped in markdown)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = { text: aiContent, suggestedOfferIds: [] };
      }
    } catch (parseError) {
      console.log("JSON parse error:", parseError);
      // Clean up markdown formatting from raw text
      let cleanText = aiContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      if (!cleanText) {
        cleanText = hasOffers 
          ? "Encontrei algumas ofertas que podem te interessar! 😊"
          : "Ainda não temos ofertas em " + city + ", mas logo teremos! 😊";
      }
      
      parsedResponse = { text: cleanText, suggestedOfferIds: [] };
    }

    // FALLBACK INTELIGENTE: Só ativar se realmente houver ofertas disponíveis
    if (hasOffers) {
      const userWantsOffers = /oferta|quero|mostre|mostra|tem algo|o que tem|ver|procur|preciso|busco|pizza|comida|servi|desconto|promo/i.test(message);
      const isGreeting = /^(oi|olá|ola|eai|e ai|hey|hello|bom dia|boa tarde|boa noite|tudo bem)[\s!?.,]*$/i.test(message.trim());
      
      if (
        !isGreeting &&
        userWantsOffers &&
        (!parsedResponse.suggestedOfferIds || parsedResponse.suggestedOfferIds.length === 0)
      ) {
        console.log("Fallback triggered - user wants offers but AI returned none");
        parsedResponse.suggestedOfferIds = topOfferIds;
        
        // Se o texto também não menciona ofertas, ajustar
        if (!parsedResponse.text || parsedResponse.text.length < 10) {
          parsedResponse.text = "Olha só o que separei pra você! 🔥";
        }
      }
    } else {
      // Garantir que não retorne IDs quando não há ofertas
      parsedResponse.suggestedOfferIds = [];
    }

    // Get full offer details for suggested offers
    const suggestedOffers = offersContext.filter((o: any) =>
      parsedResponse.suggestedOfferIds?.includes(o.id)
    );

    console.log("AI Chat - Final suggested offers:", suggestedOffers.length, "IDs:", parsedResponse.suggestedOfferIds);

    return new Response(
      JSON.stringify({
        text: parsedResponse.text,
        suggestedOffers,
        noOffers: !hasOffers, // Flag para o frontend saber que não há ofertas
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
