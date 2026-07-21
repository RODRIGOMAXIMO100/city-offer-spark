import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_shared/supabase";

export default defineTool({
  name: "set_balance_frozen",
  title: "Congelar/descongelar saldo",
  description: "Admin: congela ou descongela o saldo de um usuário (bloqueia saques).",
  inputSchema: { profile_id: z.string().uuid(), frozen: z.boolean() },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ profile_id, frozen }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb.from("profiles").update({ balance_frozen: frozen }).eq("id", profile_id).select("id, name, balance_frozen").maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Usuário não encontrado / sem permissão." }], isError: true };
    return { content: [{ type: "text", text: `Saldo de ${data.name} ${data.balance_frozen ? "congelado" : "descongelado"}.` }] };
  },
});
