import { useEffect, useState } from "react";
import { currentLogo, currentTheme, type LogoId, type ThemeId } from "@/lib/theme";
import { CorrenteRings, CorrenteDots, CORRENTE_VIEWBOX } from "./CorrenteMark";
import { TresCs, TRES_CS_VIEWBOX } from "./TresCsMark";

interface Props {
  className?: string;
  /** "full" = símbolo + nome; "mark" = só o símbolo (ícone) */
  variant?: "full" | "mark";
  /** cores para fundo escuro ou colorido */
  inverse?: boolean;
  /** força uma opção (usado na página /marca para comparar) */
  logo?: LogoId;
}

function useBrandState() {
  const [state, setState] = useState(() => ({ tema: currentTheme(), logo: currentLogo() }));
  useEffect(() => {
    const on = () => setState({ tema: currentTheme(), logo: currentLogo() });
    window.addEventListener("clilin-tema", on);
    return () => window.removeEventListener("clilin-tema", on);
  }, []);
  return state;
}

const STROKE = 5.5;

/** Nome "clilin" desenhado em traço único, igual em todas as direções de cor. */
function Wordmark({ x = 0, ink, inverse, mono = false }: { x?: number; ink: string; inverse: boolean; mono?: boolean }) {
  const dot1 = mono ? ink : inverse ? "hsl(var(--highlight))" : "hsl(var(--company))";
  const dot2 = mono ? ink : inverse ? "hsl(var(--primary-foreground))" : "hsl(var(--affiliate))";
  return (
    <g transform={`translate(${x} 0)`}>
      <g fill="none" stroke={ink} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.5 19.5 A8.5 8.5 0 1 0 17.5 30.5" />
        <path d="M27 5.5 V33.5" />
        <path d="M36 17 V33.5" />
        <path d="M45 5.5 V33.5" />
        <path d="M54 17 V33.5" />
        <path d="M63 17 V33.5 M63 24.5 A7.5 7.5 0 0 1 78 24.5 V33.5" />
      </g>
      <circle cx="36" cy="8" r="3.8" fill={dot1} />
      <circle cx="54" cy="8" r="3.8" fill={dot2} />
    </g>
  );
}

/** Símbolos 40x40 de cada opção */
function Mark({ logo, inverse }: { logo: LogoId; inverse: boolean }) {
  const main = inverse ? "hsl(var(--primary-foreground))" : "hsl(var(--primary))";
  switch (logo) {
    case "b":
      return (
        <g fill="none" strokeLinecap="round">
          <circle cx="9" cy="20" r="5.5" fill={main} />
          <path d="M18.2 10.8 A13 13 0 0 1 18.2 29.2" stroke="hsl(var(--affiliate))" strokeWidth="4.5" />
          <path d="M23.8 5.2 A21 21 0 0 1 23.8 34.8" stroke="hsl(var(--highlight))" strokeWidth="4.5" />
        </g>
      );
    case "c":
      return (
        <g fill="none" strokeWidth="4.5">
          <circle cx="10" cy="20" r="7.5" stroke={main} />
          <circle cx="20" cy="20" r="7.5" stroke="hsl(var(--affiliate))" />
          <circle cx="30" cy="20" r="7.5" stroke="hsl(var(--highlight))" />
        </g>
      );
    case "d":
      return (
        <g>
          <rect x="1" y="3" width="36" height="36" rx="10" fill={inverse ? "hsl(var(--primary-foreground))" : "hsl(var(--primary))"} />
          <path
            d="M25 16 A8.5 8.5 0 1 0 25 28"
            fill="none"
            stroke={inverse ? "hsl(var(--primary))" : "hsl(var(--primary-foreground))"}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="33" cy="7" r="6" fill="hsl(var(--highlight))" stroke={inverse ? "hsl(var(--primary))" : "hsl(var(--background))"} strokeWidth="2.5" />
        </g>
      );
    default:
      // "a" não tem símbolo separado: o ícone é o "c" com os dois pingos
      return (
        <g>
          <path d="M26 14 A10 10 0 1 0 26 28" fill="none" stroke={main} strokeWidth="5.5" strokeLinecap="round" />
          <circle cx="31" cy="9" r="4" fill="hsl(var(--company))" />
          <circle cx="31" cy="21" r="4" fill="hsl(var(--affiliate))" />
        </g>
      );
  }
}

export function LogoGraphic({
  logo,
  variant = "full",
  inverse = false,
  className = "h-10",
  bg,
  mono,
  small,
}: {
  logo: LogoId;
  variant?: "full" | "mark";
  inverse?: boolean;
  className?: string;
  /** cor do fundo onde o logo está (usada no respiro do entrelaçado) */
  bg?: string;
  /** uma cor só: "dark" (preto) ou "light" (branco) */
  mono?: "dark" | "light";
  /** versão simplificada para tamanhos pequenos */
  small?: boolean;
}) {
  const ink = mono === "dark" ? "#111827" : mono === "light" ? "#ffffff" : inverse ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))";

  if (logo === "e") {
    const colors: [string, string, string] = mono
      ? [ink, ink, ink]
      : [inverse ? "hsl(var(--primary-foreground))" : "hsl(var(--primary))", "hsl(var(--affiliate))", "hsl(var(--highlight))"];
    const mark = <TresCs colors={colors} strokeWidth={small ? 4.6 : 3.8} />;
    if (variant === "mark") {
      return (
        <svg viewBox={TRES_CS_VIEWBOX} className={`${className} w-auto`} role="img" aria-label="Clilin">
          {mark}
        </svg>
      );
    }
    return (
      <svg viewBox="-1 0.5 124 39" className={`${className} w-auto`} role="img" aria-label="Clilin">
        {mark}
        <Wordmark x={42} ink={ink} inverse={inverse || mono === "light"} mono={!!mono} />
      </svg>
    );
  }

  if (logo === "c") {
    const gap = bg ?? (mono === "light" || inverse ? "hsl(var(--primary))" : "hsl(var(--background))");
    const colors: [string, string, string] = mono
      ? [ink, ink, ink]
      : [inverse ? "hsl(var(--primary-foreground))" : "hsl(var(--primary))", "hsl(var(--affiliate))", "hsl(var(--highlight))"];
    const mark = small ? <CorrenteDots colors={colors} gap={gap} /> : <CorrenteRings colors={colors} gap={gap} />;
    if (variant === "mark") {
      return (
        <svg viewBox={CORRENTE_VIEWBOX} className={`${className} w-auto`} role="img" aria-label="Clilin">
          {mark}
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 150 40" className={`${className} w-auto`} role="img" aria-label="Clilin">
        {mark}
        <Wordmark x={67} ink={ink} inverse={inverse || mono === "light"} mono={!!mono} />
      </svg>
    );
  }
  if (variant === "mark") {
    return (
      <svg viewBox="0 0 40 40" className={`${className} w-auto`} role="img" aria-label="Clilin">
        <Mark logo={logo} inverse={inverse} />
      </svg>
    );
  }
  if (logo === "a") {
    return (
      <svg viewBox="0 0 84 40" className={`${className} w-auto`} role="img" aria-label="Clilin">
        <Wordmark ink={ink} inverse={inverse} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 132 40" className={`${className} w-auto`} role="img" aria-label="Clilin">
      <Mark logo={logo} inverse={inverse} />
      <Wordmark x={48} ink={ink} inverse={inverse} />
    </svg>
  );
}

export function BrandLogo({ className = "h-10", variant = "full", inverse = false, logo }: Props) {
  const { tema, logo: chosen } = useBrandState();
  // 3 Cs é o logo oficial; as outras opções só aparecem na página /marca
  const active = logo ?? (tema === "0" ? "e" : chosen ?? "e");
  return <LogoGraphic logo={active} variant={variant} inverse={inverse} className={className} />;
}

export type { ThemeId };
