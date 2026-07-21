import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_shared/supabase";

export default defineTool({
  name: "set_offer_active",
  title: "Pausar ou reativar oferta",
  description:
    "Ativa ou pausa uma oferta da empresa logada. Passe active=true para reativar, active=false para pausar.",
  inputSchema: {
    offer_id: z.string().uuid().describe("ID da oferta."),
    active: z.boolean().describe("true para reativar, false para pausar."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ offer_id, active }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("offers")
      .update({ active })
      .eq("id", offer_id)
      .select("id, title, active")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Oferta não encontrada ou sem permissão." }], isError: true };
    return {
      content: [{ type: "text", text: `Oferta "${data.title}" ${data.active ? "reativada" : "pausada"}.` }],
      structuredContent: { offer: data },
    };
  },
});
