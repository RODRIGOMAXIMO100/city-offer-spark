import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_shared/supabase";

export default defineTool({
  name: "set_city_active",
  title: "Ativar/desativar cidade",
  description: "Admin: ativa ou desativa uma cidade para cadastros.",
  inputSchema: { city_id: z.string().uuid(), active: z.boolean() },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ city_id, active }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const sb = supabaseForUser(ctx);
    const patch: Record<string, unknown> = { active };
    if (active) patch.activated_at = new Date().toISOString();
    const { data, error } = await sb.from("available_cities").update(patch).eq("id", city_id).select("id, city_name, state_code, active").maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Cidade não encontrada / sem permissão." }], isError: true };
    return { content: [{ type: "text", text: `${data.city_name}/${data.state_code} ${data.active ? "ativada" : "desativada"}.` }] };
  },
});
