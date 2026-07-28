import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, supabaseAsAdmin } from "../_shared/admin";

export default defineTool({
  name: "manage_storage",
  title: "Gerenciar arquivos de storage (admin)",
  description:
    "ADMIN-ONLY. Opera nos buckets de arquivos (offer-images, company-avatars, static-files): `list_buckets`, `list` (arquivos de um bucket/pasta), `upload` (conteúdo texto/base64), `delete` e `signed_url`.",
  inputSchema: {
    action: z.enum(["list_buckets", "list", "upload", "delete", "signed_url"]),
    bucket: z.string().optional().describe("Nome do bucket (obrigatório exceto em list_buckets)."),
    path: z.string().optional().describe("Caminho do arquivo ou pasta dentro do bucket."),
    content: z.string().optional().describe("Conteúdo para upload."),
    content_base64: z.boolean().optional().describe("true se `content` estiver em base64."),
    content_type: z.string().optional().describe("MIME type do upload. Padrão: text/plain."),
    expires_in: z.number().int().min(30).max(604800).optional().describe("Segundos de validade da signed_url."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    try {
      const sb = await supabaseAsAdmin(ctx);
      const { action, bucket, path } = input;

      if (action === "list_buckets") {
        const { data, error } = await sb.storage.listBuckets();
        if (error) throw error;
        return jsonResult(data);
      }
      if (!bucket) throw new Error("bucket é obrigatório para esta ação.");

      if (action === "list") {
        const { data, error } = await sb.storage.from(bucket).list(path ?? "", { limit: 200 });
        if (error) throw error;
        return jsonResult(data);
      }
      if (!path) throw new Error("path é obrigatório para esta ação.");

      if (action === "upload") {
        if (input.content === undefined) throw new Error("content é obrigatório para upload.");
        const body = input.content_base64
          ? Uint8Array.from(atob(input.content), (c) => c.charCodeAt(0))
          : new TextEncoder().encode(input.content);
        const { data, error } = await sb.storage.from(bucket).upload(path, body, {
          contentType: input.content_type ?? "text/plain",
          upsert: true,
        });
        if (error) throw error;
        return jsonResult(data);
      }
      if (action === "delete") {
        const { data, error } = await sb.storage.from(bucket).remove([path]);
        if (error) throw error;
        return jsonResult(data);
      }
      const { data, error } = await sb.storage
        .from(bucket)
        .createSignedUrl(path, input.expires_in ?? 3600);
      if (error) throw error;
      return jsonResult(data);
    } catch (e) {
      return errorResult(e);
    }
  },
});
