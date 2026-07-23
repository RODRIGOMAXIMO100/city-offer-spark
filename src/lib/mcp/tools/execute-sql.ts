import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_shared/supabase";

export default defineTool({
  name: "execute_sql",
  title: "Executar SQL (admin)",
  description:
    "ADMIN-ONLY. Executa SQL arbitrário no banco Postgres do Clilin via função SECURITY DEFINER public.admin_exec_sql. Use para migrations (ALTER, CREATE, DROP), DML (INSERT/UPDATE/DELETE) e consultas (SELECT). SELECTs retornam as linhas como JSON; DDL/DML retornam rows_affected. Erros são capturados e retornados em jsonb. A checagem de admin é feita dentro da função — usuários não-admin recebem exception. USE COM EXTREMO CUIDADO: mudanças de schema afetam produção imediatamente.",
  inputSchema: {
    query: z.string().min(1).describe("SQL a ser executado. Pode ser SELECT, INSERT, UPDATE, DELETE, ALTER, CREATE, DROP, etc. Termine sem ';' opcional."),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  },
  handler: async ({ query }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb.rpc("admin_exec_sql", { p_sql: query });
    if (error) {
      return { content: [{ type: "text", text: `Erro ao executar SQL: ${error.message}` }], isError: true };
    }
    const result = data as any;
    if (result && result.status === "error") {
      return {
        content: [{ type: "text", text: `SQL error [${result.sqlstate}]: ${result.error}` }],
        structuredContent: { result },
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: { result },
    };
  },
});
