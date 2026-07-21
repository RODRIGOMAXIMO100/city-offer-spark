import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_shared/supabase";

export default defineTool({
  name: "list_my_leads",
  title: "Listar meus leads (empresa)",
  description: "Lista os leads recebidos pela empresa logada, mais recentes primeiro.",
  inputSchema: {
    limit: z.number().int().min(1).max(200).optional().describe("Máximo de leads (padrão 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const { data: profile } = await sb.from("profiles").select("id").eq("user_id", ctx.getUserId()).maybeSingle();
    if (!profile) return { content: [{ type: "text", text: "Perfil não encontrado" }], isError: true };
    const { data, error } = await sb
      .from("leads")
      .select("id, name, phone, email, offer_id, created_at, status")
      .eq("company_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(Math.min(limit ?? 50, 200));
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { leads: data ?? [] },
    };
  },
});
