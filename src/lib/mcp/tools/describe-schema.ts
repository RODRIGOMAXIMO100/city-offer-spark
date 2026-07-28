import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_shared/supabase";
import { errorResult, jsonResult } from "../_shared/admin";

export default defineTool({
  name: "describe_schema",
  title: "Descrever schema do banco (admin)",
  description:
    "ADMIN-ONLY. Lista tabelas, colunas, tipos, políticas RLS e funções do schema public. Use antes de escrever SQL para saber a estrutura real do banco. Passe `table` para detalhar apenas uma tabela.",
  inputSchema: {
    table: z.string().optional().describe("Nome da tabela (opcional). Sem isso, retorna todas."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ table }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult(new Error("Não autenticado"));
    const filter = table ? `AND c.table_name = ${JSON.stringify(table).replace(/"/g, "'")}` : "";
    const sql = `
      select
        c.table_name,
        jsonb_agg(jsonb_build_object(
          'column', c.column_name,
          'type', c.data_type,
          'nullable', c.is_nullable,
          'default', c.column_default
        ) order by c.ordinal_position) as columns,
        (select coalesce(jsonb_agg(jsonb_build_object(
            'policy', p.policyname, 'cmd', p.cmd, 'roles', p.roles,
            'using', p.qual, 'with_check', p.with_check)), '[]'::jsonb)
         from pg_policies p where p.schemaname = 'public' and p.tablename = c.table_name) as policies
      from information_schema.columns c
      join information_schema.tables t
        on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
      where c.table_schema = 'public' ${filter}
      group by c.table_name
      order by c.table_name
    `;
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb.rpc("admin_exec_sql", { p_sql: sql });
    if (error) return errorResult(error);
    return jsonResult(data);
  },
});
