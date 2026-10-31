import { useEffect, useState } from "react";
import { Palette, ChevronDown } from "lucide-react";
import { THEMES, applyTheme, currentTheme, isThemePreview, type ThemeId } from "@/lib/theme";

// Seletor flutuante para comparar as direções de identidade no site de verdade.
// Só aparece para quem abriu o site com ?tema=.
export function ThemePreviewSwitcher() {
  const [visible] = useState(isThemePreview);
  const [tema, setTema] = useState<ThemeId>(currentTheme());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setTema(currentTheme());
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
          </div>
        )}
      </div>
    </div>
  );
}
