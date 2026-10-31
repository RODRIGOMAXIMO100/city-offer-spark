import { useEffect, useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { LogoGraphic } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useNoIndex } from "@/components/seo/NoIndex";
import { LOGOS, THEMES, applyLogo, applyTheme, currentLogo, currentTheme, type LogoId, type ThemeId } from "@/lib/theme";

// Página interna para comparar as opções de logo nas direções de cor.
// Fica fora do menu e do Google.
export default function MarcaPage() {
  useNoIndex();
  const [tema, setTema] = useState<ThemeId>(currentTheme());
  const [logo, setLogo] = useState<LogoId | null>(currentLogo());

  useEffect(() => {
    const on = () => {
      setTema(currentTheme());
      setLogo(currentLogo());
    };
    window.addEventListener("clilin-tema", on);
    return () => window.removeEventListener("clilin-tema", on);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">Opções de logo do Clilin</h1>
        <p className="text-muted-foreground mb-6 max-w-2xl">
          Cada opção aparece no tamanho do menu, em fundo colorido, como ícone de app e bem pequena, como no ícone da aba do navegador.
          Troque a direção de cor aqui embaixo. "Usar no site" coloca o logo no menu e nos painéis para você ver no uso de verdade.
        </p>

        <div className="flex flex-wrap gap-2 mb-10">
          {THEMES.filter((t) => t.id !== "0").map((t) => (
            <Button key={t.id} variant={tema === t.id ? "default" : "outline"} size="sm" onClick={() => applyTheme(t.id)}>
              {t.id}. {t.name}
            </Button>
          ))}
        </div>

        <div className="space-y-8">
          {LOGOS.map((l) => (
            <section key={l.id} className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-display font-bold">
                    {l.id.toUpperCase()}. {l.name}
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-xl">{l.idea}</p>
                </div>
                <Button variant={logo === l.id ? "default" : "outline"} onClick={() => applyLogo(l.id)}>
                  {logo === l.id && <Check className="h-4 w-4 mr-2" />}
                  {logo === l.id ? "Usando no site" : "Usar no site"}
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
                <div className="rounded-2xl border border-border bg-background flex items-center justify-center p-6 min-h-[120px]">
                  <LogoGraphic logo={l.id} className="h-12" />
                </div>
                <div className="rounded-2xl bg-primary flex items-center justify-center p-6 min-h-[120px]">
                  <LogoGraphic logo={l.id} inverse className="h-12" />
                </div>
                <div className="rounded-2xl border border-border bg-muted/50 flex items-center justify-center gap-4 p-6 min-h-[120px]">
                  <span className="h-16 w-16 rounded-2xl bg-card shadow-md flex items-center justify-center">
                    <LogoGraphic logo={l.id} variant="mark" className="h-10" />
                  </span>
                  <span className="h-16 w-16 rounded-2xl bg-primary shadow-md flex items-center justify-center">
                    <LogoGraphic logo={l.id} variant="mark" inverse className="h-10" />
                  </span>
                </div>
                <div className="rounded-2xl border border-border bg-background flex items-center justify-center gap-5 p-6 min-h-[120px]">
                  <LogoGraphic logo={l.id} variant="mark" className="h-4" />
                  <LogoGraphic logo={l.id} variant="mark" className="h-6" />
                  <LogoGraphic logo={l.id} className="h-6" />
                </div>
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
