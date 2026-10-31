import { useEffect, useState } from "react";
import logoPng from "@/assets/logo.png";
import { currentLogo, currentTheme, type LogoId, type ThemeId } from "@/lib/theme";

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
function Wordmark({ x = 0, ink, inverse }: { x?: number; ink: string; inverse: boolean }) {
  const dot1 = inverse ? "hsl(var(--highlight))" : "hsl(var(--company))";
  const dot2 = inverse ? "hsl(var(--primary-foreground))" : "hsl(var(--affiliate))";
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
}: {
  logo: LogoId;
  variant?: "full" | "mark";
  inverse?: boolean;
  className?: string;
}) {
  const ink = inverse ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))";
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
  const active = logo ?? chosen ?? (tema === "0" ? null : "a");

  if (!active) {
    return <img src={logoPng} alt="Clilin" className={className} />;
  }
  return <LogoGraphic logo={active} variant={variant} inverse={inverse} className={className} />;
}

export type { ThemeId };
