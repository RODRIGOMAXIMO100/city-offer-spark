import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_my_offers",
  title: "Listar minhas ofertas (empresa)",
  description:
    "Lista as ofertas da empresa logada, incluindo pausadas e expiradas. Só funciona se o usuário for COMPANY.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const { data: profile } = await sb.from("profiles").select("id").eq("user_id", ctx.getUserId()).maybeSingle();
    if (!profile) return { content: [{ type: "text", text: "Perfil não encontrado" }], isError: true };
    const { data, error } = await sb
      .from("offers")
      .select("id, title, price_old, price_new, active, expires_at, clicks_count, views_count, city, tags, created_at")
      .eq("company_id", profile.id)
      .order("created_at", { ascending: false });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { offers: data ?? [] },
    };
  },
});
