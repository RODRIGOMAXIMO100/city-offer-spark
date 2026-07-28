import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "./supabase";

declare const Deno: { env: { get(name: string): string | undefined } };

/**
 * Retorna um client com service_role APENAS depois de confirmar,
 * via token do usuário, que ele tem o papel ADMIN no Clilin.
 * Lança erro caso contrário.
 */
export async function supabaseAsAdmin(ctx: ToolContext): Promise<SupabaseClient> {
  if (!ctx.isAuthenticated()) throw new Error("Não autenticado");

  const asUser = supabaseForUser(ctx);
  const { data, error } = await asUser.rpc("has_role", {
    _user_id: ctx.getUserId(),
    _role: "ADMIN",
  });
  if (error) throw new Error(`Falha ao verificar papel: ${error.message}`);
  if (data !== true) throw new Error("Acesso negado: apenas ADMIN pode usar esta ferramenta.");

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Service role indisponível na edge function mcp.");

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function errorResult(e: unknown) {
  return {
    content: [{ type: "text" as const, text: e instanceof Error ? e.message : String(e) }],
    isError: true,
  };
}

export function jsonResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
    structuredContent: { result: value as any },
  };
}
