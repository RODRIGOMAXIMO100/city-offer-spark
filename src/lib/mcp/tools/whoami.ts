import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "whoami",
  title: "Quem sou eu",
  description:
    "Retorna o perfil do usuário logado no Clilin: id, nome, papel (CLIENT/COMPANY/AFFILIATE/ADMIN), cidade e saldo em centavos.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const { data: profile, error: pErr } = await sb
      .from("profiles")
      .select("id, name, city, balance, cnpj, telefone")
      .eq("user_id", ctx.getUserId())
      .maybeSingle();
    if (pErr) {
      return { content: [{ type: "text", text: pErr.message }], isError: true };
    }
    const { data: roles } = await sb
      .from("user_roles")
      .select("role")
      .eq("user_id", ctx.getUserId());
    const payload = {
      user_id: ctx.getUserId(),
      email: ctx.getUserEmail?.() ?? null,
      profile,
      roles: (roles ?? []).map((r) => r.role),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
