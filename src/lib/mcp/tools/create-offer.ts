import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_shared/supabase";

export default defineTool({
  name: "create_offer",
  title: "Criar oferta",
  description:
    "Cria uma nova oferta. Empresa (COMPANY) cria para si própria — não passe company_id. " +
    "ADMIN pode criar em nome de QUALQUER empresa passando company_id (use `list_companies` ou " +
    "`find_company` para descobrir o id da empresa desejada). Preços em reais (ex: 49.90). " +
    "A cobrança é por RESGATE de cupom: a empresa paga uma taxa calculada sobre o preço promocional " +
    "(percentual e piso vêm de pricing_config — hoje 15% com piso de R$3,00). Ela NÃO é informada na " +
    "criação, é derivada de price_new; a resposta devolve a taxa já calculada.",
  inputSchema: {
    title: z.string().min(3).max(120),
    description: z.string().optional(),
    price_old: z.number().positive(),
    price_new: z.number().positive(),
    city: z.string(),
    link_destination: z.string().url(),
    link_type: z.enum(["WHATSAPP", "WEBSITE", "MENU"]).default("WHATSAPP"),
    tags: z.array(z.string()).optional(),
    images: z.array(z.string().url()).optional(),
    company_id: z.string().uuid().optional().describe("UUID da empresa dona da oferta (tabela profiles.id). Obrigatório apenas para admins criando em nome de terceiros; empresas comuns devem omitir."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const sb = supabaseForUser(ctx);
    let companyId = input.company_id;
    if (!companyId) {
      const { data: prof } = await sb.from("profiles").select("id").eq("user_id", ctx.getUserId()).maybeSingle();
      if (!prof) return { content: [{ type: "text", text: "Profile não encontrado." }], isError: true };
      companyId = prof.id;
    }
    const { data, error } = await sb
      .from("offers")
      .insert({
        company_id: companyId,
        title: input.title,
        description: input.description ?? null,
        price_old: input.price_old,
        price_new: input.price_new,
        city: input.city,
        link_destination: input.link_destination,
        link_type: input.link_type,
        tags: input.tags ?? [],
        images: input.images ?? [],
        // redemption_cost NAO e mais gravado: campo legado do modelo de custo fixo,
        // ignorado por calc_redemption_fee e settle_redemption. A coluna tem default
        // no banco, entao omitir aqui e seguro.
        active: true,
      })
      .select("id, title, price_new, active")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    // Taxa real do resgate, pela MESMA funcao que a cobranca usa — evita divergencia
    // entre o que a tool anuncia e o que a empresa efetivamente paga.
    let feeCents: number | null = null;
    if (data?.id) {
      const { data: fee } = await sb.rpc("calc_redemption_fee", { p_offer_id: data.id });
      if (typeof fee === "number") feeCents = fee;
    }
    const taxaTxt = feeCents !== null ? ` Taxa por resgate: R$ ${(feeCents / 100).toFixed(2)}.` : "";

    return {
      content: [{ type: "text", text: `Oferta "${data?.title}" criada.${taxaTxt}` }],
      structuredContent: { offer: data, redemption_fee_cents: feeCents },
    };
  },
});
