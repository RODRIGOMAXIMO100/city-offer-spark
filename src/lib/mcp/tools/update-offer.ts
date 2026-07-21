import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_shared/supabase";

export default defineTool({
  name: "update_offer",
  title: "Editar oferta",
  description: "Atualiza campos de uma oferta existente. Só envie os campos que quer mudar.",
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
    bounty: z.number().positive().optional().describe("Recompensa por resgate em reais (minimo R$5,00)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ offer_id, ...patch }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const { bounty, ...rest } = patch as Record<string, unknown>;
    const cleaned: Record<string, unknown> = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
    if (bounty !== undefined) cleaned.redemption_cost = Math.max(500, Math.round(Number(bounty) * 100));
    if (Object.keys(cleaned).length === 0) return { content: [{ type: "text", text: "Nada para atualizar." }], isError: true };
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb.from("offers").update(cleaned).eq("id", offer_id).select("id, title").maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Oferta não encontrada ou sem permissão." }], isError: true };
    return { content: [{ type: "text", text: `Oferta "${data.title}" atualizada.` }], structuredContent: { offer: data } };
  },
});
