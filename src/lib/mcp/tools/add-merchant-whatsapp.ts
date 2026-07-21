import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_shared/supabase";

export default defineTool({
  name: "add_merchant_whatsapp",
  title: "Adicionar WhatsApp de resgate",
  description: "Adiciona um número de WhatsApp autorizado a resgatar cupons para a empresa logada.",
  inputSchema: {
    phone: z.string().regex(/^\+?\d{10,15}$/, "Telefone em formato internacional, só dígitos (ex: 5511999998888)."),
    label: z.string().optional().describe("Ex: Caixa 1, Balcão"),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ phone, label }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const sb = supabaseForUser(ctx);
    const { data: prof } = await sb.from("profiles").select("id").eq("user_id", ctx.getUserId()).maybeSingle();
    if (!prof) return { content: [{ type: "text", text: "Profile não encontrado." }], isError: true };
    const normalized = phone.replace(/\D/g, "");
    const { data, error } = await sb.from("merchant_whatsapp").insert({
      profile_id: prof.id,
      phone: normalized,
      label: label ?? null,
      verified: false,
    }).select("id, phone, label").maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: `WhatsApp ${data?.phone} adicionado${data?.label ? ` (${data.label})` : ""}.` }] };
  },
});
