import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_shared/supabase";

export default defineTool({
  name: "set_withdrawal_status",
  title: "Aprovar/rejeitar saque",
  description: "Admin: muda status de uma solicitação de saque (APPROVED, REJECTED, PAID).",
  inputSchema: {
    withdrawal_id: z.string().uuid(),
    status: z.enum(["APPROVED", "REJECTED", "PAID"]),
    note: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ withdrawal_id, status, note }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const sb = supabaseForUser(ctx);
    const patch: Record<string, unknown> = { status };
    if (note) patch.admin_note = note;
    if (status === "PAID") patch.paid_at = new Date().toISOString();
    const { data, error } = await sb.from("withdrawals").update(patch).eq("id", withdrawal_id).select("id, status, amount").maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Saque não encontrado / sem permissão." }], isError: true };
    return { content: [{ type: "text", text: `Saque marcado como ${data.status}.` }], structuredContent: { withdrawal: data } };
  },
});
