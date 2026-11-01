import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { LogoGraphic } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import { useNoIndex } from "@/components/seo/NoIndex";
import { THEMES, applyLogo, applyTheme, loadFonts, type LogoId, type ThemeId } from "@/lib/theme";

const DIRECTIONS = THEMES.filter((t) => t.id !== "0");

function Tile({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl flex items-center justify-center p-5 min-h-[104px] ${className}`}>{children}</div>;
}

const PAGES: Record<string, { logo: LogoId; title: string; text: string; name: string }> = {
  corrente: {
    logo: "c",
    name: "Corrente",
    title: "Logo Corrente nas três cores",
    text: "Os anéis agora crescem da esquerda para a direita, se entrelaçam como elos e têm uma versão de pontos para tamanhos pequenos. Também aparece em uma cor só, para camiseta, carimbo e marca d'água.",
  },
  "3cs": {
    logo: "e",
    name: "3 Cs",
    title: "Logo 3 Cs nas três cores",
    text: "Três Cs, um dentro do outro, do maior para o menor. Encostam do lado esquerdo e se abrem para a direita, como som saindo de uma boca. Também aparece em uma cor só, para camiseta, carimbo e marca d'água.",
  },
};

// Um logo nas três direções de cor, lado a lado
export default function MarcaCorrentePage({ variant = "corrente" }: { variant?: keyof typeof PAGES }) {
  const page = PAGES[variant];
  useNoIndex();
  useEffect(() => {
    DIRECTIONS.forEach((d) => loadFonts(d.id));
  }, []);

  const useIt = (id: ThemeId) => {
    applyTheme(id);
    applyLogo(page.logo);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">{page.title}</h1>
        <p className="text-muted-foreground mb-2 max-w-3xl">
          {page.text}
        </p>
        <p className="text-sm mb-10">
          <Link to="/marca" className="text-primary font-semibold hover:underline">Ver as outras opções de logo</Link>
        </p>

        <div className="grid lg:grid-cols-3 gap-6">
          {DIRECTIONS.map((d) => (
            <section key={d.id} data-tema-scope={d.id} className="rounded-3xl border border-border bg-background text-foreground p-5 space-y-4 font-sans">
              <div>
                <h2 className="text-xl font-display font-bold">{d.id}. {d.name}</h2>
                <p className="text-sm text-muted-foreground">{d.idea}</p>
              </div>

              {/* Menu do site */}
              <div className="rounded-2xl border border-border bg-card px-4 h-16 flex items-center justify-between">
                <LogoGraphic logo={page.logo} className="h-8" bg="hsl(var(--card))" />
                <span className="rounded-[var(--radius)] bg-primary text-primary-foreground text-sm font-semibold px-4 py-2">Fazer Parte</span>
              </div>

              <Tile className="bg-background border border-border">
                <LogoGraphic logo={page.logo} className="h-12" />
              </Tile>
              <Tile className="bg-primary">
                <LogoGraphic logo={page.logo} inverse className="h-12" />
              </Tile>

              {/* Ícone de app */}
              <Tile className="bg-muted/60 gap-4">
                <span className="h-16 w-16 rounded-2xl bg-card shadow-md flex items-center justify-center">
                  <LogoGraphic logo={page.logo} variant="mark" className="h-9" bg="hsl(var(--card))" />
                </span>
                <span className="h-16 w-16 rounded-2xl bg-primary shadow-md flex items-center justify-center">
                  <LogoGraphic logo={page.logo} variant="mark" inverse className="h-9" />
                </span>
              </Tile>

              {/* Pequeno: aba do navegador e redes */}
              <Tile className="bg-background border border-border gap-5">
                <LogoGraphic logo={page.logo} variant="mark" small className="h-4" />
                <LogoGraphic logo={page.logo} variant="mark" small className="h-6" />
                <LogoGraphic logo={page.logo} variant="mark" className="h-8" />
              </Tile>

              {/* Uma cor só */}
              <div className="grid grid-cols-2 gap-3">
                <Tile className="bg-white border border-border">
                  <LogoGraphic logo={page.logo} mono="dark" bg="#ffffff" className="h-7" />
                </Tile>
                <Tile className="bg-[#111827]">
                  <LogoGraphic logo={page.logo} mono="light" bg="#111827" className="h-7" />
                </Tile>
              </div>

              <Button className="w-full" onClick={() => useIt(d.id)}>
                Usar {page.name} + {d.name} no site
              </Button>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
