import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_shared/supabase";

export default defineTool({
  name: "set_user_banned",
  title: "Banir ou desbanir usuário",
  description: "Admin: bane (banned=true) ou desbane (banned=false) um usuário.",
  inputSchema: {
    profile_id: z.string().uuid(),
    banned: z.boolean(),
    reason: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ profile_id, banned, reason }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const sb = supabaseForUser(ctx);
    const patch: Record<string, unknown> = { banned };
    if (banned) {
      patch.banned_at = new Date().toISOString();
      patch.banned_reason = reason ?? "Banido via MCP";
    } else {
      patch.banned_at = null;
      patch.banned_reason = null;
    }
    const { data, error } = await sb.from("profiles").update(patch).eq("id", profile_id).select("id, name, banned").maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Usuário não encontrado / sem permissão." }], isError: true };
    return { content: [{ type: "text", text: `Usuário ${data.name} ${data.banned ? "banido" : "desbanido"}.` }] };
  },
});
