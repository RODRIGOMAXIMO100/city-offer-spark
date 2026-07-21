import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_shared/supabase";

export default defineTool({
  name: "create_offer",
  title: "Criar oferta",
  description:
    "Cria uma nova oferta para a empresa logada (ou para uma empresa específica se admin). Preços em reais (ex: 49.90).",
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
    company_id: z.string().uuid().optional().describe("Somente admin: cria para outra empresa."),
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
        active: true,
      })
      .select("id, title, price_new, active")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: `Oferta "${data?.title}" criada.` }], structuredContent: { offer: data } };
  },
});
