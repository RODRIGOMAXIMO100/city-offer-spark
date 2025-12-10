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

    // Fetch active offers from the city (not expired)
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

    const offersContext = offers?.map((o: any) => ({
      id: o.id,
      title: o.title,
      description: o.description || "",
      price_old: o.price_old,
      price_new: o.price_new,
      discount: Math.round((1 - o.price_new / o.price_old) * 100),
      tags: o.tags || [],
      company: o.profiles?.name || "Empresa",
      instagram_url: o.profiles?.instagram_url || null,
    })) || [];

    const systemPrompt = `Você é a Clilin AI, uma assistente inteligente de ofertas locais em ${city}.

Seu objetivo é ajudar clientes a encontrar as melhores ofertas disponíveis na cidade.

OFERTAS DISPONÍVEIS AGORA:
${JSON.stringify(offersContext, null, 2)}

REGRAS:
1. Sempre responda em português brasileiro de forma amigável e casual
2. Quando o usuário pedir algo (comida, produto, serviço), analise as ofertas disponíveis
3. Se encontrar ofertas relevantes, sugira as melhores opções mencionando o desconto
4. Responda em formato JSON com a estrutura: {"text": "sua resposta", "suggestedOfferIds": ["id1", "id2"]}
5. Se não encontrar ofertas relevantes, retorne suggestedOfferIds vazio
6. Seja conciso mas informativo
7. Destaque sempre o valor do desconto quando relevante

Exemplos de perguntas que você pode receber:
- "Quero pizza" → Busque ofertas com tags ou títulos relacionados a pizza
- "Algo barato" → Sugira as ofertas com maior desconto
- "Jantar romântico" → Busque restaurantes com bom ambiente
- "Promoção de lanche" → Busque hambúrgueres, lanches, fast food`;

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
        temperature: 0.7,
        max_tokens: 500,
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