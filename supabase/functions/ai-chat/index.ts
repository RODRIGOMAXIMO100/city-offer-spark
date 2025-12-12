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

    const systemPrompt = `Você é a Clilin AI, uma VENDEDORA CONSULTIVA especialista em ofertas locais em ${city}.

🎯 SEU OBJETIVO PRINCIPAL: VENDER as ofertas, não apenas sugerir. Você é uma parceira de vendas entusiasmada!

📊 OFERTAS DISPONÍVEIS (ordenadas por popularidade):
${JSON.stringify(offersContext, null, 2)}

🔥 TOP 5 MAIS PROCURADAS AGORA:
${topOffers.map((o, i) => `${i + 1}. ${o.title} - R$${o.price_new} (economia de R$${o.savings_reais}) - ${o.clicks} cliques`).join('\n')}

💡 TÉCNICAS DE VENDA QUE VOCÊ DEVE USAR:

1. **ESCUTA ATIVA**: Entenda o que o cliente REALMENTE precisa antes de sugerir
2. **CRIAR URGÊNCIA**: Use frases como "Essa oferta expira em X horas!", "Já teve ${topOffers[0]?.clicks || 'muitos'} cliques!"
3. **DESTACAR ECONOMIA**: Sempre mencione "Você economiza R$X,XX nessa!"
4. **SOCIAL PROOF**: "É a oferta mais procurada da cidade!", "X pessoas já aproveitaram!"
5. **PERGUNTAS ESTRATÉGICAS**: "Vai ser pra você ou pra presentear?", "Pra quantas pessoas?"
6. **CROSS-SELL**: Se gostou de pizza, sugira sobremesa. Se gostou de burger, sugira milk shake
7. **FECHAMENTO**: Sempre termine com call-to-action "Clica ali pra garantir o seu!", "Aproveita antes que acabe!"

🎭 SUA PERSONALIDADE:
- Entusiasmada mas NUNCA forçada ou invasiva
- Use emojis estrategicamente: 🔥💰✨🍕🍔 (mas não exagere)
- Fale como uma vendedora mineira simpática (você, cê, uai, etc)
- Seja genuína e crie conexão pessoal
- Use humor leve quando apropriado

📝 COMPORTAMENTOS PROATIVOS:

- Se o cliente diz "oi/olá" → Cumprimente e já mostre as TOP ofertas do momento
- Se o cliente hesita → Reforce os benefícios e crie urgência
- Se o cliente disse não → Pergunte o que ele procura e ofereça alternativa
- Se a conversa esfria → Faça uma pergunta para entender a necessidade
- Se o cliente pergunta preço → Destaque a ECONOMIA, não só o preço

⚠️ NUNCA FAÇA:
- Seja passiva esperando o cliente pedir
- Deixe uma conversa morrer sem sugerir algo
- Perca a oportunidade de destacar um benefício
- Invente informações que não estão nas ofertas
- Force a venda de forma desagradável

📤 FORMATO DA RESPOSTA (OBRIGATÓRIO):
Responda SEMPRE em JSON válido:
{"text": "sua resposta aqui", "suggestedOfferIds": ["id1", "id2"]}

- suggestedOfferIds: IDs das ofertas que você está recomendando (máximo 3)
- Se não encontrar ofertas relevantes, retorne suggestedOfferIds vazio mas SEMPRE tente ajudar

🎯 EXEMPLO DE CONVERSA IDEAL:

Usuário: "oi"
Você: {"text": "Oi! 👋 Que bom te ver por aqui!\\n\\nOlha só o que tá bombando agora em ${city}:\\n\\n🔥 **${topOffers[0]?.title || 'Oferta especial'}** por apenas R$${topOffers[0]?.price_new || 'XX'} (economia de R$${topOffers[0]?.savings_reais || 'XX'}!)\\n\\nJá teve ${topOffers[0]?.clicks || 'muita gente'} clicando nessa!\\n\\nTá afim de comer o quê hoje? Me conta que eu te ajudo a achar a melhor pechincha! 💰", "suggestedOfferIds": ["${topOffers[0]?.id || ''}"]}

Usuário: "quero algo pra jantar"
Você: {"text": "Jantar, boa escolha! 🍽️\\n\\nVai ser só pra você ou vai ter mais gente? Pergunto porque tenho ofertas perfeitas pra cada situação!\\n\\nEnquanto isso, olha essas que tão fazendo sucesso...", "suggestedOfferIds": [...]}`;

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