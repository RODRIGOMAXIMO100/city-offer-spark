import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_my_earnings",
  title: "Meu saldo e transações",
  description:
    "Retorna o saldo atual (em centavos) e as últimas transações do usuário logado. Útil para divulgadores e empresas verem movimentações.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("Nº de transações (padrão 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const { data: profile } = await sb
      .from("profiles")
      .select("id, balance")
      .eq("user_id", ctx.getUserId())
      .maybeSingle();
    if (!profile) return { content: [{ type: "text", text: "Perfil não encontrado" }], isError: true };
    const { data: txs, error } = await sb
      .from("transactions")
      .select("id, type, amount, description, created_at, offer_id")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(Math.min(limit ?? 20, 100));
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const payload = {
      balance_cents: profile.balance ?? 0,
      balance_reais: ((profile.balance ?? 0) / 100).toFixed(2),
      transactions: txs ?? [],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
