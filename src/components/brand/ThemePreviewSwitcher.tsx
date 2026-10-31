import { useEffect, useState } from "react";
import { Palette, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { LOGOS, THEMES, applyLogo, applyTheme, currentLogo, currentTheme, isThemePreview, type LogoId, type ThemeId } from "@/lib/theme";

// Seletor flutuante para comparar as direções de identidade no site de verdade.
// Só aparece para quem abriu o site com ?tema=.
export function ThemePreviewSwitcher() {
  const [visible] = useState(isThemePreview);
  const [tema, setTema] = useState<ThemeId>(currentTheme());
  const [open, setOpen] = useState(false);
  const [logo, setLogo] = useState<LogoId | null>(currentLogo());

  useEffect(() => {
    const on = () => {
      setTema(currentTheme());
      setLogo(currentLogo());
    };
    window.addEventListener("clilin-tema", on);
    return () => window.removeEventListener("clilin-tema", on);
  }, []);

  if (!visible) return null;

  const active = THEMES.find((t) => t.id === tema);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-64 max-w-[calc(100vw-2rem)]">
      <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold"
          aria-expanded={open}
        >
          <Palette className="h-4 w-4 text-primary" />
          Identidade: {active?.name}
          <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${open ? "" : "-rotate-90"}`} />
        </button>
        {open && (
          <div className="px-3 pb-3 space-y-1.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTheme(t.id)}
                className={`w-full text-left rounded-xl px-3 py-2 text-sm border transition-colors ${
                  tema === t.id ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"
                }`}
              >
                <span className="font-semibold">{t.id === "0" ? "Atual" : `${t.id}. ${t.name}`}</span>
                <span className="block text-xs text-muted-foreground">{t.idea}</span>
              </button>
            ))}
            <div className="pt-2 mt-1 border-t border-border">
              <p className="text-xs font-semibold mb-1.5">Logo</p>
              <div className="grid grid-cols-4 gap-1.5">
                {LOGOS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    title={l.name}
                    onClick={() => applyLogo(l.id)}
                    className={`rounded-lg py-1.5 text-sm font-semibold border ${logo === l.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}
                  >
                    {l.id.toUpperCase()}
                  </button>
                ))}
              </div>
              <Link to="/marca" className="block text-xs text-primary font-semibold mt-2 hover:underline">
                Ver todas as opções de logo
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
