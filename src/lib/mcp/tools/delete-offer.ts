import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_shared/supabase";

export default defineTool({
  name: "delete_offer",
  title: "Deletar oferta",
  description: "Soft-delete de oferta (marca deleted_at). Não some do banco, só some do site.",
  inputSchema: { offer_id: z.string().uuid() },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ offer_id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("offers")
      .update({ deleted_at: new Date().toISOString(), active: false })
      .eq("id", offer_id)
      .select("id, title")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Oferta não encontrada ou sem permissão." }], isError: true };
    return { content: [{ type: "text", text: `Oferta "${data.title}" deletada.` }] };
  },
});
