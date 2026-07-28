import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, supabaseAsAdmin } from "../_shared/admin";

export default defineTool({
  name: "list_auth_users",
  title: "Listar usuários de autenticação (admin)",
  description:
    "ADMIN-ONLY. Lista os usuários cadastrados no sistema de autenticação (id, email, telefone, criado em, último login, confirmação). Use para achar o user_id real de alguém antes de mexer em profiles/roles.",
  inputSchema: {
    page: z.number().int().min(1).default(1).describe("Página (100 por página)."),
    search: z.string().optional().describe("Filtra por e-mail contendo este texto."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ page, search }, ctx) => {
    try {
      const sb = await supabaseAsAdmin(ctx);
      const { data, error } = await sb.auth.admin.listUsers({ page: page ?? 1, perPage: 100 });
      if (error) throw error;
      let users = data.users.map((u) => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
        providers: u.app_metadata?.providers,
      }));
      if (search) {
        const s = search.toLowerCase();
        users = users.filter((u) => (u.email ?? "").toLowerCase().includes(s));
      }
      return jsonResult({ count: users.length, users });
    } catch (e) {
      return errorResult(e);
    }
  },
});
