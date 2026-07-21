import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_shared/supabase";

export default defineTool({
  name: "adjust_user_balance",
  title: "Ajustar saldo de usuário",
  description:
    "Admin: adiciona (positivo) ou remove (negativo) créditos do saldo em CENTAVOS e registra transação. Ex: 10000 = R$ 100,00.",
  inputSchema: {
    profile_id: z.string().uuid(),
    amount_cents: z.number().int().describe("Valor em centavos. Positivo credita, negativo debita."),
    reason: z.string().min(3),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ profile_id, amount_cents, reason }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const sb = supabaseForUser(ctx);
    const { data: prof, error: pErr } = await sb.from("profiles").select("balance").eq("id", profile_id).maybeSingle();
    if (pErr || !prof) return { content: [{ type: "text", text: pErr?.message ?? "Usuário não encontrado / sem permissão." }], isError: true };
    const newBalance = (prof.balance ?? 0) + amount_cents;
    const { error: uErr } = await sb.from("profiles").update({ balance: newBalance }).eq("id", profile_id);
    if (uErr) return { content: [{ type: "text", text: uErr.message }], isError: true };
    const { error: tErr } = await sb.from("transactions").insert({
      user_id: profile_id,
      amount: amount_cents,
      type: amount_cents >= 0 ? "DEPOSIT" : "WITHDRAWAL",
      description: `Ajuste manual via MCP: ${reason}`,
    });
    if (tErr) return { content: [{ type: "text", text: `Saldo atualizado mas transação falhou: ${tErr.message}` }] };
    return { content: [{ type: "text", text: `Saldo ajustado. Novo saldo: R$ ${(newBalance / 100).toFixed(2)}` }], structuredContent: { balance_cents: newBalance } };
  },
});
