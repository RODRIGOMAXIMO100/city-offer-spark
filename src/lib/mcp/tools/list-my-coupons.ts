import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_shared/supabase";

export default defineTool({
  name: "list_my_coupons",
  title: "Listar cupons da empresa",
  description:
    "Lista cupons emitidos para a empresa logada, com filtro opcional por status (ISSUED, REDEEMED, EXPIRED).",
  inputSchema: {
    status: z.enum(["ISSUED", "REDEEMED", "EXPIRED"]).optional(),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const { data: profile } = await sb.from("profiles").select("id").eq("user_id", ctx.getUserId()).maybeSingle();
    if (!profile) return { content: [{ type: "text", text: "Perfil não encontrado" }], isError: true };
    let q = sb
      .from("coupons")
      .select("id, code, customer_name, customer_phone, offer_id, status, expires_at, redeemed_at, created_at")
      .eq("company_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(Math.min(limit ?? 50, 200));
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { coupons: data ?? [] },
    };
  },
});
