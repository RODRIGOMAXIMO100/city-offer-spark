// Direções de identidade visual em avaliação.
// Abra o site com ?tema=1, ?tema=2 ou ?tema=3 para ver cada uma; ?tema=0 volta para a atual.
// A escolha fica guardada só neste navegador enquanto a avaliação durar.

export type ThemeId = "0" | "1" | "2" | "3";

export const THEMES: { id: ThemeId; name: string; idea: string; fonts?: string }[] = [
  { id: "0", name: "Atual", idea: "Identidade de hoje" },
  {
    id: "1",
    name: "Feira",
    idea: "Letreiro popular, cor de comércio de rua",
    fonts: "family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Figtree:wght@400;500;600;700",
  },
  {
    id: "2",
    name: "Boca a boca",
    idea: "Rede social, conversa, gente jovem",
    fonts: "family=Unbounded:wght@500;600;700;800&family=Onest:wght@400;500;600;700",
  },
  {
    id: "3",
    name: "Pódio",
    idea: "Placar, liga e conquista",
    fonts: "family=Archivo:wdth,wght@62..125,400..900",
  },
];

const STORAGE_KEY = "clilin_tema_preview";

function readStored(): ThemeId | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v && THEMES.some((t) => t.id === v) ? (v as ThemeId) : null;
  } catch {
    return null;
  }
}

function store(id: ThemeId) {
  try {
    if (id === "0") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* navegador sem armazenamento: vale só para esta página */
  }
}

export function loadFonts(id: ThemeId) {
  const theme = THEMES.find((t) => t.id === id);
  if (!theme?.fonts) return;
  const elId = `tema-fonts-${id}`;
  if (document.getElementById(elId)) return;
  const link = document.createElement("link");
  link.id = elId;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?${theme.fonts}&display=swap`;
  document.head.appendChild(link);
}

export function applyTheme(id: ThemeId) {
  const root = document.documentElement;
  if (id === "0") delete root.dataset.tema;
  else {
    loadFonts(id);
    root.dataset.tema = id;
  }
  store(id);
  window.dispatchEvent(new CustomEvent("clilin-tema", { detail: id }));
}

export function currentTheme(): ThemeId {
  return (document.documentElement.dataset.tema as ThemeId | undefined) ?? "0";
}

/** true quando a pessoa está avaliando as direções (mostra o seletor) */
export function isThemePreview(): boolean {
  const q = new URLSearchParams(window.location.search);
  let logo = false;
  try {
    logo = localStorage.getItem("clilin_logo_preview") !== null;
  } catch {
    /* ignora */
  }
  return readStored() !== null || logo || q.has("tema") || q.has("logo") || window.location.pathname.startsWith("/marca");
}

export function initTheme() {
  const param = new URLSearchParams(window.location.search).get("tema");
  const fromUrl = param && THEMES.some((t) => t.id === param) ? (param as ThemeId) : null;
  const id = fromUrl ?? readStored();
  if (id) applyTheme(id);
}

// ------------------------------------------------------------------
// Opções de logo em avaliação (?logo=a|b|c|d). Valem junto com o tema.
// ------------------------------------------------------------------
export type LogoId = "a" | "b" | "c" | "d";

export const LOGOS: { id: LogoId; name: string; idea: string }[] = [
  { id: "a", name: "Pingos", idea: "Só o nome. Os pingos dos dois i são duas pessoas: a empresa e quem divulga." },
  { id: "b", name: "Alcance", idea: "Um ponto que se espalha em ondas: o assunto ganhando a rede." },
  { id: "c", name: "Corrente", idea: "Três círculos de mãos dadas: gente junta falando a mesma coisa." },
  { id: "d", name: "Tlin!", idea: "Ícone de app com o c e o aviso de notificação: o som do nome." },
];

const LOGO_KEY = "clilin_logo_preview";

export function currentLogo(): LogoId | null {
  try {
    const v = localStorage.getItem(LOGO_KEY);
    return v && LOGOS.some((l) => l.id === v) ? (v as LogoId) : null;
  } catch {
    return null;
  }
}

export function applyLogo(id: LogoId) {
  try {
    localStorage.setItem(LOGO_KEY, id);
  } catch {
    /* sem armazenamento: vale só nesta página */
  }
  window.dispatchEvent(new CustomEvent("clilin-tema", { detail: id }));
}

export function initLogo() {
  const param = new URLSearchParams(window.location.search).get("logo");
  if (param && LOGOS.some((l) => l.id === param)) applyLogo(param as LogoId);
}
