import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_shared/supabase";

export default defineTool({
  name: "find_company",
  title: "Encontrar empresa (id)",
  description:
    "Busca uma empresa por nome, razão social, CNPJ ou email e retorna o UUID (company_id) para usar em create_offer/update_offer/adjust_user_balance. Admin vê todas.",
  inputSchema: {
    query: z.string().min(2).describe("Nome, razão social, CNPJ ou email (parcial)."),
    limit: z.number().int().min(1).max(50).default(10),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const sb = supabaseForUser(ctx);
    const companyUserIds = (await sb.from("user_roles").select("user_id").eq("role", "COMPANY")).data?.map((r: any) => r.user_id) ?? [];
    const q = query.replace(/[%,]/g, "");
    const { data, error } = await sb
      .from("profiles")
      .select("id, user_id, name, razao_social, cnpj, email, city, balance, banned, balance_frozen")
      .in("user_id", companyUserIds)
      .or(`name.ilike.%${q}%,razao_social.ilike.%${q}%,cnpj.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(limit);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = data ?? [];
    const lines = rows.map((c: any) => `- company_id=${c.id} | user_id=${c.user_id} | ${c.name} | ${c.city ?? "-"} | CNPJ=${c.cnpj ?? "-"}`);
    const text = rows.length === 0
      ? `Nenhuma empresa encontrada para "${query}".`
      : `${rows.length} empresa(s) para "${query}":\n${lines.join("\n")}`;
    return { content: [{ type: "text", text }], structuredContent: { matches: rows } };
  },
});
