import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "admin_overview",
  title: "Overview admin",
  description:
    "Retorna totais gerais da plataforma: nº de empresas, divulgadores, clientes, ofertas ativas, leads, cupons e saques pendentes. Apenas para usuários com papel ADMIN.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    // Verifica papel ADMIN
    const { data: roles } = await sb
      .from("user_roles")
      .select("role")
      .eq("user_id", ctx.getUserId());
    const isAdmin = (roles ?? []).some((r) => r.role === "ADMIN");
    if (!isAdmin) {
      return { content: [{ type: "text", text: "Acesso negado: requer papel ADMIN." }], isError: true };
    }

    const nowIso = new Date().toISOString();
    const [companies, affiliates, clients, offersActive, leads, couponsIssued, couponsRedeemed, withdrawalsPending] =
      await Promise.all([
        sb.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "COMPANY"),
        sb.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "AFFILIATE"),
        sb.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "CLIENT"),
        sb.from("offers").select("*", { count: "exact", head: true }).eq("active", true).gt("expires_at", nowIso),
        sb.from("leads").select("*", { count: "exact", head: true }),
        sb.from("coupons").select("*", { count: "exact", head: true }).eq("status", "ISSUED"),
        sb.from("coupons").select("*", { count: "exact", head: true }).eq("status", "REDEEMED"),
        sb.from("withdrawals").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
      ]);

    const payload = {
      companies: companies.count ?? 0,
      affiliates: affiliates.count ?? 0,
      clients: clients.count ?? 0,
      active_offers: offersActive.count ?? 0,
      total_leads: leads.count ?? 0,
      coupons_issued: couponsIssued.count ?? 0,
      coupons_redeemed: couponsRedeemed.count ?? 0,
      withdrawals_pending: withdrawalsPending.count ?? 0,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
