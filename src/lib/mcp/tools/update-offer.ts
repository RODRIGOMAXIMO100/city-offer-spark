import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_shared/supabase";

export default defineTool({
  name: "update_offer",
  title: "Editar oferta",
  description:
    "Atualiza campos de uma oferta existente. Só envie os campos que quer mudar. " +
    "A taxa por resgate não é editável aqui: ela é derivada de price_new " +
    "(percentual e piso vêm de pricing_config). Para mudar a taxa, mude o preço promocional.",
  inputSchema: {
    offer_id: z.string().uuid(),
    title: z.string().min(3).max(120).optional(),
    description: z.string().optional(),
    price_old: z.number().positive().optional(),
    price_new: z.number().positive().optional(),
    city: z.string().optional(),
    link_destination: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
    images: z.array(z.string().url()).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ offer_id, ...patch }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    // 'bounty'/'redemption_cost' foram removidos: campo legado do modelo de custo fixo,
    // ignorado por calc_redemption_fee e settle_redemption.
    const cleaned: Record<string, unknown> = Object.fromEntries(
      Object.entries(patch as Record<string, unknown>).filter(([, v]) => v !== undefined),
    );
    if (Object.keys(cleaned).length === 0) return { content: [{ type: "text", text: "Nada para atualizar." }], isError: true };
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb.from("offers").update(cleaned).eq("id", offer_id).select("id, title").maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Oferta não encontrada ou sem permissão." }], isError: true };

    // Se o preco mudou, a taxa muda junto — devolve o valor novo pra nao restar duvida.
    let feeCents: number | null = null;
    if (cleaned.price_new !== undefined) {
      const { data: fee } = await sb.rpc("calc_redemption_fee", { p_offer_id: offer_id });
      if (typeof fee === "number") feeCents = fee;
    }
    const taxaTxt = feeCents !== null ? ` Nova taxa por resgate: R$ ${(feeCents / 100).toFixed(2)}.` : "";

    return {
      content: [{ type: "text", text: `Oferta "${data.title}" atualizada.${taxaTxt}` }],
      structuredContent: { offer: data, redemption_fee_cents: feeCents },
    };
  },
});
