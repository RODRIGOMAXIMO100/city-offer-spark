import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_shared/supabase";

export default defineTool({
  name: "list_offers",
  title: "Listar ofertas ativas",
  description:
    "Lista ofertas ativas no Clilin, com filtros opcionais por cidade e busca no título. Retorna id, título, preços, cidade, empresa e cliques.",
  inputSchema: {
    city: z.string().optional().describe("Cidade no formato 'Cidade - UF' (ex: 'Belo Horizonte - MG')."),
    search: z.string().optional().describe("Texto para buscar no título da oferta."),
    limit: z.number().int().min(1).max(50).optional().describe("Máximo de ofertas a retornar (padrão 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ city, search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    let q = sb
      .from("offers")
      .select("id, title, description, price_old, price_new, city, tags, clicks_count, views_count, expires_at, company_id")
      .eq("active", true)
      .gt("expires_at", new Date().toISOString())
      .order("clicks_count", { ascending: false })
      .limit(Math.min(limit ?? 20, 50));
    if (city) q = q.eq("city", city);
    if (search) q = q.ilike("title", `%${search}%`);
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { offers: data ?? [] },
    };
  },
});
