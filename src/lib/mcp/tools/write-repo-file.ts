import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, supabaseAsAdmin } from "../_shared/admin";

declare const Deno: { env: { get(name: string): string | undefined } };

const GH_API = "https://api.github.com";

function readSecret(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Secret ausente na edge function mcp: ${name}`);
  return v;
}

function toBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export default defineTool({
  name: "write_repo_file",
  title: "Escrever arquivo no repositório (admin)",
  description:
    "ADMIN-ONLY. Cria ou atualiza um arquivo no repositório GitHub do projeto via GitHub Contents API. Requer os secrets GITHUB_TOKEN e GITHUB_REPO ('owner/repo'). Retorna o sha do commit e a URL do arquivo.",
  inputSchema: {
    path: z.string().min(1).describe("Caminho do arquivo no repo, ex.: 'src/hooks/usePricingConfig.tsx'."),
    content: z.string().describe("Conteúdo completo do arquivo (texto puro, será convertido para base64)."),
    message: z.string().min(1).describe("Mensagem de commit."),
    branch: z.string().optional().describe("Branch de destino. Padrão: 'main'."),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: true,
  },
  handler: async ({ path, content, message, branch }, ctx) => {
    try {
      // Exige papel ADMIN (checado via token do usuário).
      await supabaseAsAdmin(ctx);

      const token = readSecret("GITHUB_TOKEN");
      const repo = readSecret("GITHUB_REPO");
      const ref = branch ?? "main";

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "clilin-mcp",
      };

      const cleanPath = path.replace(/^\/+/, "");
      const contentsUrl = `${GH_API}/repos/${repo}/contents/${cleanPath
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`;

      // 1) Buscar sha atual (se existir).
      let sha: string | undefined;
      const getRes = await fetch(`${contentsUrl}?ref=${encodeURIComponent(ref)}`, { headers });
      if (getRes.status === 200) {
        const existing = await getRes.json();
        sha = existing?.sha;
      } else if (getRes.status !== 404) {
        const body = await getRes.text();
        throw new Error(`GitHub GET falhou [${getRes.status}]: ${body}`);
      }

      // 2) PUT com conteúdo em base64.
      const putRes = await fetch(contentsUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message,
          content: toBase64(content),
          branch: ref,
          ...(sha ? { sha } : {}),
        }),
      });

      const putText = await putRes.text();
      if (!putRes.ok) {
        throw new Error(`GitHub PUT falhou [${putRes.status}]: ${putText}`);
      }

      const data = JSON.parse(putText);
      return jsonResult({
        action: sha ? "updated" : "created",
        path: cleanPath,
        branch: ref,
        commit_sha: data?.commit?.sha,
        content_sha: data?.content?.sha,
        html_url: data?.content?.html_url,
      });
    } catch (e) {
      return errorResult(e);
    }
  },
});
