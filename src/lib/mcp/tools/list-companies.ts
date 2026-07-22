import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_shared/supabase";

export default defineTool({
  name: "list_companies",
  title: "Listar empresas",
  description: "Lista empresas (admin vê todas; empresa vê a própria). Filtro opcional por cidade ou nome.",
  inputSchema: {
    city: z.string().optional(),
    search: z.string().optional().describe("Busca parcial por nome ou razão social."),
    limit: z.number().int().min(1).max(200).default(50),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ city, search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const sb = supabaseForUser(ctx);
    let q = sb
      .from("profiles")
      .select("id, name, city, cnpj, razao_social, email, balance, banned, balance_frozen, created_at")
      .in("user_id", (
        await sb.from("user_roles").select("user_id").eq("role", "COMPANY")
      ).data?.map((r: any) => r.user_id) ?? [])
      .limit(limit);
    if (city) q = q.eq("city", city);
    if (search) q = q.or(`name.ilike.%${search}%,razao_social.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = data ?? [];
    const lines = rows.map((c: any) => `- ${c.name} | id=${c.id} | ${c.city ?? "-"} | CNPJ=${c.cnpj ?? "-"} | saldo=${c.balance ?? 0} | ${c.banned ? "BANIDA" : c.balance_frozen ? "SALDO CONGELADO" : "ok"}`);
    const text = `${rows.length} empresas. Use o campo 'id' como company_id em create_offer/update_offer.\n${lines.join("\n")}`;
    return { content: [{ type: "text", text }], structuredContent: { companies: rows } };
  },
});
