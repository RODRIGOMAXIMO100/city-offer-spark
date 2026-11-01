// Categorias do blog do Clilin. O valor fica salvo em blog_posts.category.

export const BLOG_CATEGORIES = [
  { value: "empresas", label: "Para Empresas", badge: "bg-company/10 text-company border-company/20" },
  { value: "divulgadores", label: "Para Divulgadores", badge: "bg-affiliate/10 text-affiliate border-affiliate/20" },
  { value: "tendencias", label: "Tendências", badge: "bg-highlight/15 text-foreground border-highlight/40" },
] as const;

export const BLOG_FILTERS = [{ value: "todos", label: "Todos" }, ...BLOG_CATEGORIES.map(({ value, label }) => ({ value, label }))];

// valores antigos que ainda podem aparecer em links ou em posts gerados antes da mudança
const LEGACY: Record<string, string> = { afiliados: "divulgadores", geral: "tendencias", clientes: "tendencias" };

export function normalizeCategory(value: string | null | undefined): string {
  if (!value) return "tendencias";
  return LEGACY[value] ?? value;
}

export function categoryLabel(value: string) {
  const v = normalizeCategory(value);
  return BLOG_CATEGORIES.find((c) => c.value === v)?.label ?? "Tendências";
}

export function categoryBadge(value: string) {
  const v = normalizeCategory(value);
  return BLOG_CATEGORIES.find((c) => c.value === v)?.badge ?? BLOG_CATEGORIES[2].badge;
}

export function authorSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-");
}
