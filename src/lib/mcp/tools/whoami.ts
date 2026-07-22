import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../_shared/supabase";

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
      profile_id: profile?.id ?? null,
      company_id: profile?.id ?? null,
      profile,
      roles: (roles ?? []).map((r) => r.role),
      hint: "profile_id / company_id é o UUID usado em create_offer, adjust_user_balance, etc. Admins podem operar em qualquer company_id (descubra com find_company/list_companies).",
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
