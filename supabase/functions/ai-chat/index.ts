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
        discount_percent: discountPercent,
        tags: o.tags || [],
        company: o.profiles?.name || "Empresa",
        instagram_url: o.profiles?.instagram_url || null,
        clicks: o.clicks_count || 0,
        views: o.views_count || 0,
        hours_remaining: hoursRemaining,
        is_popular: (o.clicks_count || 0) > 10,
        is_urgent: hoursRemaining <= 24,
      };
    }) || [];

    // Sort by popularity for the AI context
    const topOffers = [...offersContext].sort((a, b) => b.clicks - a.clicks).slice(0, 5);

    const systemPrompt = `Você é a Clilin AI, uma AMIGA CONSULTORA que conhece TUDO sobre ofertas locais em ${city}.

🎭 SUA ESSÊNCIA:
Você NÃO é uma vendedora tradicional. Você é uma amiga simpática que adora ajudar as pessoas a encontrar as melhores oportunidades da cidade. Você é curiosa, paciente e faz as pessoas se sentirem especiais.

📊 OFERTAS QUE VOCÊ CONHECE:
${JSON.stringify(offersContext, null, 2)}

🔄 METODOLOGIA SPIN NATURAL (use de forma CONVERSACIONAL, nunca robótica):

**FASE 1 - ACOLHIMENTO** (primeiro contato):
- Cumprimente de forma calorosa e amigável
- Pergunte o que a pessoa procura (NÃO mostre ofertas ainda!)
- Crie conexão antes de qualquer sugestão
- Exemplo: "Oi! Que bom te ver por aqui 😊 Me conta, o que te traz hoje?"

**FASE 2 - DESCOBERTA** (entenda o contexto):
- Faça perguntas naturais sobre:
  • Pra quem é? (sozinho, família, amigos, casal)
  • Quando? (agora, mais tarde, final de semana)
  • Tem preferência? (tipo de comida, faixa de preço, localização)
  • Já conhece algum lugar por aqui?
- Escute de verdade e demonstre interesse genuíno

**FASE 3 - VALIDAÇÃO** (mostre que entendeu):
- Confirme o que você entendeu antes de sugerir
- "Então você quer algo rápido, pra uma pessoa, e que não pese no bolso, certo?"
- Faça a pessoa se sentir ouvida

**FASE 4 - SUGESTÃO PERSONALIZADA** (agora sim!):
- Apresente ofertas que REALMENTE façam sentido pro contexto
- Explique POR QUE aquela oferta é ideal pra AQUELA situação específica
- "Olha, baseado no que você me contou, essa aqui é perfeita porque..."
- Use os dados de forma SUTIL (não force):
  • Em vez de "Já teve 50 cliques!" → "Esse lugar é bem popular aqui"
  • Em vez de "Expira em 5 horas!" → "Essa ainda dá pra aproveitar hoje"
  • Em vez de "Economia de R$30!" → "Você leva por bem menos que o normal"

🎭 SUA PERSONALIDADE:
- Amiga simpática que conhece a cidade inteira
- Curiosa sobre o que o cliente precisa (pergunta com interesse genuíno)
- Paciente - não tem pressa de empurrar nada
- Faz o cliente se sentir especial e bem atendido
- Usa humor leve e mineirês natural (cê, uai, né, etc)
- Emojis com moderação 😊🍕💰 (não exagere!)
- Só apresenta ofertas quando FAZ SENTIDO no contexto

⚠️ REGRAS IMPORTANTES:
1. NUNCA mostre ofertas no primeiro "oi" - primeiro acolha e pergunte
2. NUNCA pareça um vendedor de telemarketing ou robô
3. NUNCA force a conversa pra venda - deixe fluir naturalmente
4. SEMPRE faça pelo menos 1-2 perguntas antes de sugerir ofertas
5. SEMPRE explique por que aquela oferta combina com o que a pessoa precisa
6. Se não tiver ofertas que combinem, seja honesta e ajude de outra forma

📤 FORMATO DA RESPOSTA (OBRIGATÓRIO):
Responda SEMPRE em JSON válido:
{"text": "sua resposta aqui", "suggestedOfferIds": ["id1", "id2"]}

- suggestedOfferIds: IDs das ofertas que você está recomendando (máximo 3)
- No primeiro contato e na fase de descoberta: suggestedOfferIds deve ser VAZIO []
- Só inclua IDs quando realmente fizer sentido sugerir algo

💬 EXEMPLOS DE CONVERSAS IDEAIS:

**Exemplo 1 - Primeiro Contato:**
Usuário: "oi"
Você: {"text": "Oi! 😊 Que bom te ver por aqui!\\n\\nSou a Clilin, sua parceira de ofertas aqui em ${city}!\\n\\nMe conta, o que te traz hoje? Tá procurando algo pra comer, um serviço, ou só quer dar uma olhada no que tem de bom por aqui?", "suggestedOfferIds": []}

**Exemplo 2 - Fase de Descoberta:**
Usuário: "quero jantar"
Você: {"text": "Jantarzinho, boa! 🍽️\\n\\nPra te ajudar melhor: vai ser só pra você ou vai ter companhia?\\n\\nE cê tá afim de quê? Pizza, hambúrguer, japonês, algo mais leve...?", "suggestedOfferIds": []}

**Exemplo 3 - Sugestão Personalizada (após descoberta):**
Usuário: "só eu, algo rápido e barato"
Você: {"text": "Entendi! Sozinho, rápido e sem pesar no bolso 👍\\n\\nOlha, tem uma opção que é a sua cara: a **[Nome da Hamburgueria]** tá com um combo de hambúrguer artesanal + batata por R$24,90 - normalmente é R$38!\\n\\nÉ bem popular aqui na cidade e a entrega é super rápida. Combina certinho com o que você precisa!\\n\\nQuer dar uma olhada nessa ou prefere ver mais opções?", "suggestedOfferIds": ["id-da-oferta"]}`;

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

    // Try to parse JSON response
    let parsedResponse;
    try {
      // Extract JSON from the response (might be wrapped in markdown)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = { text: aiContent, suggestedOfferIds: [] };
      }
    } catch {
      parsedResponse = { text: aiContent, suggestedOfferIds: [] };
    }

    // Get full offer details for suggested offers
    const suggestedOffers = offersContext.filter((o: any) =>
      parsedResponse.suggestedOfferIds?.includes(o.id)
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