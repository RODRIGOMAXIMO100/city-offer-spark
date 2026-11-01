import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Dados do cadastro que viajam junto com a conta (user_metadata) enquanto o e-mail não é confirmado.
// Assim o perfil é criado sozinho no primeiro login, sem a pessoa preencher tudo de novo.
export interface SignupMeta {
  clilin_role?: "COMPANY" | "AFFILIATE";
  clilin_name?: string;
  clilin_city?: string;
  clilin_cnpj?: string | null;
  clilin_telefone?: string | null;
}

export function buildSignupMeta(m: SignupMeta): SignupMeta {
  return {
    clilin_role: m.clilin_role,
    clilin_name: m.clilin_name?.trim(),
    clilin_city: m.clilin_city ?? "",
    clilin_cnpj: m.clilin_cnpj || null,
    clilin_telefone: m.clilin_telefone || null,
  };
}

/**
 * Garante que o usuário logado tem perfil e papel. Cria a partir do cadastro quando faltar.
 * Retorna true se o perfil existe (ou foi criado) e false se ainda falta escolher o tipo de conta.
 */
export async function ensureProfileFromSignup(user: User): Promise<boolean> {
  const { data: existing } = await supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle();
  if (existing) return true;

  const meta = (user.user_metadata ?? {}) as SignupMeta;
  const role = meta.clilin_role;
  const name = meta.clilin_name?.trim();
  if (!name || (role !== "COMPANY" && role !== "AFFILIATE")) return false;

  const { error: profileError } = await supabase.from("profiles").insert({
    user_id: user.id,
    name,
    city: meta.clilin_city || "",
    email: user.email ?? null,
    balance: role === "COMPANY" ? 100 : 0,
    cnpj: meta.clilin_cnpj || null,
    telefone: meta.clilin_telefone || null,
  });
  if (profileError) {
    console.error("Erro ao criar perfil do cadastro:", profileError);
    return false;
  }

  const { error: roleError } = await supabase.from("user_roles").insert({ user_id: user.id, role });
  if (roleError) {
    console.error("Erro ao criar papel do cadastro:", roleError);
    return false;
  }
  return true;
}
