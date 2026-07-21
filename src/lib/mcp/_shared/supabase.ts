import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

// Executado dentro do bundle Deno da edge function.
declare const Deno: { env: { get(name: string): string | undefined } };

function readEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Env var ausente na edge function mcp: ${name}`);
  return value;
}

export function supabaseForUser(ctx: ToolContext) {
  return createClient(
    readEnv("SUPABASE_URL"),
    // fallback: alguns runtimes só têm ANON_KEY, outros só PUBLISHABLE_KEY
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? readEnv("SUPABASE_ANON_KEY"),
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
