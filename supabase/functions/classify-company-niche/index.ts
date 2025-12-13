import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id } = await req.json();
    
    if (!company_id) {
      throw new Error('company_id is required');
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all active offers from the company
    const { data: offers, error: offersError } = await supabase
      .from('offers')
      .select('title, description, tags')
      .eq('company_id', company_id)
      .eq('active', true)
      .is('deleted_at', null);

    if (offersError) {
      console.error('Error fetching offers:', offersError);
      throw offersError;
    }

    if (!offers || offers.length === 0) {
      console.log('No offers found for company:', company_id);
      return new Response(JSON.stringify({ message: 'No offers to classify' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch available niches
    const { data: niches, error: nichesError } = await supabase
      .from('niches')
      .select('id, name, category')
      .eq('active', true);

    if (nichesError) {
      console.error('Error fetching niches:', nichesError);
      throw nichesError;
    }

    // Concatenate offer texts for analysis
    const offerTexts = offers.map(o => {
      const tags = Array.isArray(o.tags) ? o.tags.join(', ') : '';
      return `Título: ${o.title}. Descrição: ${o.description || ''}. Tags: ${tags}`;
    }).join('\n\n');

    // Create niche list for the prompt
    const nicheList = niches.map(n => `${n.name} (${n.category})`).join(', ');

    console.log('Classifying company:', company_id);
    console.log('Offer texts:', offerTexts.substring(0, 500));

    // Call Lovable AI for classification
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um classificador de nichos de negócio. Analise as ofertas de uma empresa e classifique em UM dos nichos disponíveis.
            
Nichos disponíveis: ${nicheList}

REGRAS:
1. Retorne APENAS um JSON válido, sem markdown ou texto adicional
2. O campo "niche" deve ser EXATAMENTE um dos nichos listados
3. O campo "confidence" deve ser um número entre 0.0 e 1.0
4. Se não tiver certeza, use "Outros" com confidence baixa

Formato da resposta:
{"niche": "Nome do Nicho", "confidence": 0.95}`
          },
          {
            role: "user",
            content: `Classifique esta empresa com base nas suas ofertas:\n\n${offerTexts}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices?.[0]?.message?.content;

    console.log('AI response:', aiResponse);

    if (!aiResponse) {
      throw new Error('Empty response from AI');
    }

    // Parse AI response
    let classification;
    try {
      // Clean up response (remove markdown if present)
      const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      classification = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      // Default to "Outros" if parsing fails
      classification = { niche: "Outros", confidence: 0.5 };
    }

    console.log('Classification result:', classification);

    // Find the niche ID
    const matchedNiche = niches.find(n => 
      n.name.toLowerCase() === classification.niche.toLowerCase()
    );

    if (!matchedNiche) {
      console.warn('Niche not found, defaulting to Outros:', classification.niche);
      const outrosNiche = niches.find(n => n.name === 'Outros');
      if (outrosNiche) {
        classification.niche = 'Outros';
        classification.confidence = Math.min(classification.confidence, 0.5);
      }
    }

    const nicheId = matchedNiche?.id || niches.find(n => n.name === 'Outros')?.id;

    if (!nicheId) {
      throw new Error('Could not find niche ID');
    }

    // Update company profile with niche
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        niche_id: nicheId,
        niche_confidence: classification.confidence,
        niche_last_updated: new Date().toISOString()
      })
      .eq('id', company_id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw updateError;
    }

    console.log('Successfully classified company:', company_id, 'as', classification.niche);

    return new Response(JSON.stringify({ 
      success: true,
      niche: classification.niche,
      niche_id: nicheId,
      confidence: classification.confidence
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in classify-company-niche:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
