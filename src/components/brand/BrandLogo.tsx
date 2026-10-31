import { useEffect, useState } from "react";
import logoPng from "@/assets/logo.png";
import { currentTheme, type ThemeId } from "@/lib/theme";

interface Props {
  className?: string;
  /** "full" = símbolo + nome; "mark" = só o símbolo */
  variant?: "full" | "mark";
  /** usa o nome em branco, para fundo escuro ou colorido */
  inverse?: boolean;
}

// Raio do balão por direção: Feira (letreiro), Boca a boca (bolha), Pódio (placa)
const BUBBLE_RADIUS: Record<ThemeId, number> = { "0": 8, "1": 6, "2": 14, "3": 3 };

function useTheme() {
  const [tema, setTema] = useState<ThemeId>(currentTheme());
  useEffect(() => {
    const on = () => setTema(currentTheme());
    window.addEventListener("clilin-tema", on);
    return () => window.removeEventListener("clilin-tema", on);
  }, []);
  return tema;
}

/**
 * Símbolo: um balão de fala (boca a boca) com três barras subindo (alcance e ranking).
 * As cores vêm dos tokens do tema ativo.
 */
export function BrandMark({ className = "h-9 w-9", tema }: { className?: string; tema: ThemeId }) {
  const r = BUBBLE_RADIUS[tema];
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path d="M9 29 L7 38 L18 29 Z" fill="hsl(var(--primary))" />
      <rect x="2" y="2" width="36" height="28" rx={r} fill="hsl(var(--primary))" />
      <rect x="10" y="17" width="5" height="8" rx="1" fill="hsl(var(--highlight))" />
      <rect x="17.5" y="13" width="5" height="12" rx="1" fill="hsl(var(--highlight))" />
      <rect x="25" y="8" width="5" height="17" rx="1" fill="hsl(var(--primary-foreground))" />
    </svg>
  );
}

export function BrandLogo({ className = "h-10", variant = "full", inverse = false }: Props) {
  const tema = useTheme();

  if (tema === "0") {
    return <img src={logoPng} alt="Clilin" className={className} />;
  }

  if (variant === "mark") return <BrandMark tema={tema} className={`${className} w-auto aspect-square`} />;

  // Nome desenhado no mesmo SVG para acompanhar a altura do símbolo
  return (
    <svg viewBox="0 0 132 40" className={`${className} w-auto`} role="img" aria-label="Clilin">
      <g>
        <path d="M9 29 L7 38 L18 29 Z" fill="hsl(var(--primary))" />
        <rect x="2" y="2" width="36" height="28" rx={BUBBLE_RADIUS[tema]} fill="hsl(var(--primary))" />
        <rect x="10" y="17" width="5" height="8" rx="1" fill="hsl(var(--highlight))" />
        <rect x="17.5" y="13" width="5" height="12" rx="1" fill="hsl(var(--highlight))" />
        <rect x="25" y="8" width="5" height="17" rx="1" fill="hsl(var(--primary-foreground))" />
      </g>
      <text
        x="46"
        y="28"
        className="font-display"
        fill={inverse ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))"}
        style={{ fontSize: tema === "2" ? 22 : 27, fontWeight: 800, letterSpacing: tema === "2" ? "-0.04em" : "-0.02em" }}
      >
        clilin
      </text>
    </svg>
  );
}
