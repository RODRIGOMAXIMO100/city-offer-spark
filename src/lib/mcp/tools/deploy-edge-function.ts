import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, supabaseAsAdmin } from "../_shared/admin";

declare const Deno: { env: { get(name: string): string | undefined } };

const MGMT_API = "https://api.supabase.com";

function readSecret(...names: string[]): string {
  for (const n of names) {
    const v = Deno.env.get(n);
    if (v) return v;
  }
  throw new Error(`Secret ausente na edge function mcp: ${names.join(" ou ")}`);
}

export default defineTool({
  name: "deploy_edge_function",
  title: "Deploy de edge function (admin)",
  description:
    "ADMIN-ONLY. Faz deploy de uma edge function no projeto Supabase via Management API. Cria a função se o slug não existir, ou atualiza (PATCH) se já existir. Requer os secrets SUPABASE_ACCESS_TOKEN e SUPABASE_PROJECT_REF. USE COM CUIDADO: o deploy afeta produção imediatamente.",
  inputSchema: {
    slug: z.string().min(1).describe("Slug da edge function, ex.: 'wa-webhook'."),
    code: z.string().min(1).describe("Conteúdo completo do index.ts da função."),
    verify_jwt: z
      .boolean()
      .optional()
      .describe("Se a plataforma deve validar o JWT antes de invocar. Padrão: true."),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: true,
  },
  handler: async ({ slug, code, verify_jwt }, ctx) => {
    try {
      // Exige papel ADMIN (checado via token do usuário).
      await supabaseAsAdmin(ctx);

      const token = readSecret("SUPABASE_ACCESS_TOKEN", "SB_MGMT_ACCESS_TOKEN");
      const ref = readSecret("SUPABASE_PROJECT_REF", "SB_PROJECT_REF");
      const jwt = verify_jwt ?? true;

      const authHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const existsRes = await fetch(
        `${MGMT_API}/v1/projects/${ref}/functions/${encodeURIComponent(slug)}`,
        { headers: authHeaders },
      );
      const exists = existsRes.status === 200;

      const payload = {
        slug,
        name: slug,
        verify_jwt: jwt,
        entrypoint_path: "index.ts",
        body: code,
      };

      const url = exists
        ? `${MGMT_API}/v1/projects/${ref}/functions/${encodeURIComponent(slug)}`
        : `${MGMT_API}/v1/projects/${ref}/functions`;

      const res = await fetch(url, {
        method: exists ? "PATCH" : "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(`Management API falhou [${res.status}]: ${text}`);
      }

      let parsed: unknown = text;
      try {
        parsed = JSON.parse(text);
      } catch {
        /* resposta não-JSON */
      }

      return jsonResult({
        action: exists ? "updated" : "created",
        slug,
        verify_jwt: jwt,
        status: res.status,
        response: parsed,
      });
    } catch (e) {
      return errorResult(e);
    }
  },
});
