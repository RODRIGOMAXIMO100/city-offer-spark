import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_shared/supabase";

export default defineTool({
  name: "publish_blog_post",
  title: "Publicar ou despublicar post",
  description: "Muda status de um post do blog para published/draft.",
  inputSchema: {
    post_id: z.string().uuid(),
    status: z.enum(["published", "draft"]),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ post_id, status }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const sb = supabaseForUser(ctx);
    const patch: Record<string, unknown> = { status };
    if (status === "published") patch.published_at = new Date().toISOString();
    const { data, error } = await sb.from("blog_posts").update(patch).eq("id", post_id).select("id, title, status").maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Post não encontrado / sem permissão." }], isError: true };
    return { content: [{ type: "text", text: `Post "${data.title}" -> ${data.status}.` }] };
  },
});
