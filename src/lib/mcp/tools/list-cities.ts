import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_shared/supabase";

export default defineTool({
  name: "list_cities",
  title: "Listar cidades disponíveis",
  description: "Lista cidades cadastradas (ativas e inativas). Filtro opcional por estado.",
  inputSchema: {
    state_code: z.string().length(2).optional(),
    active_only: z.boolean().default(false),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ state_code, active_only }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const sb = supabaseForUser(ctx);
    let q = sb.from("available_cities").select("*").order("state_code").order("city_name");
    if (state_code) q = q.eq("state_code", state_code.toUpperCase());
    if (active_only) q = q.eq("active", true);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: `${data?.length ?? 0} cidades.` }], structuredContent: { cities: data } };
  },
});
