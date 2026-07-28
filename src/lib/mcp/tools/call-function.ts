import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, supabaseAsAdmin } from "../_shared/admin";

export default defineTool({
  name: "call_function",
  title: "Chamar edge function (admin)",
  description:
    "ADMIN-ONLY. Invoca qualquer edge function do Clilin (ex.: issue-coupon, redeem-coupon, process-lead, generate-blog-post, gsc-sitemap, create-wa-templates) com um corpo JSON. Retorna a resposta da função. Não chame `mcp` (recursivo).",
  inputSchema: {
    name: z.string().min(1).describe("Nome da edge function."),
    body: z.record(z.any()).optional().describe("Corpo JSON enviado para a função."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  handler: async ({ name, body }, ctx) => {
    try {
      if (name === "mcp") throw new Error("Chamada recursiva à função mcp não é permitida.");
      const sb = await supabaseAsAdmin(ctx);
      const { data, error } = await sb.functions.invoke(name, { body: body ?? {} });
      if (error) throw error;
      return jsonResult(data);
    } catch (e) {
      return errorResult(e);
    }
  },
});
