import { TresCs, TRES_CS_VIEWBOX } from "@/components/brand/TresCsMark";
import { categoryLabel, normalizeCategory } from "@/lib/blog";

type Size = "card" | "hero";

// Cada categoria tem um fundo; o violeta nunca aparece sozinho (os Cs levam rosa e laranja).
const STYLES: Record<string, { bg: string; text: string; colors: [string, string, string] }> = {
  empresas: {
    bg: "bg-company",
    text: "text-company-foreground",
    colors: ["hsl(var(--primary-foreground))", "hsl(var(--affiliate))", "hsl(var(--highlight))"],
  },
  divulgadores: {
    bg: "bg-affiliate",
    text: "text-affiliate-foreground",
    colors: ["hsl(var(--company))", "hsl(var(--primary-foreground))", "hsl(var(--highlight))"],
  },
  tendencias: {
    bg: "bg-foreground",
    text: "text-background",
    colors: ["hsl(var(--company))", "hsl(var(--affiliate))", "hsl(var(--highlight))"],
  },
};

/** Capa automática do post quando ele não tem imagem própria */
export function BlogCover({ title, category, size = "card", className = "" }: { title: string; category: string; size?: Size; className?: string }) {
  const cat = normalizeCategory(category);
  const st = STYLES[cat] ?? STYLES.tendencias;
  const hero = size === "hero";

  return (
    <div className={`relative overflow-hidden ${st.bg} ${st.text} ${className}`} role="img" aria-label={title}>
      <svg
        viewBox={TRES_CS_VIEWBOX}
        className={`absolute pointer-events-none ${hero ? "-right-10 -bottom-16 h-[130%]" : "-right-8 -bottom-10 h-[125%]"} w-auto opacity-90`}
        aria-hidden
      >
        <TresCs colors={st.colors} strokeWidth={4.2} />
      </svg>
      <div className={`relative h-full flex flex-col justify-between ${hero ? "p-6 sm:p-10" : "p-4 sm:p-5"}`}>
        <span className={`font-semibold uppercase tracking-wider opacity-80 ${hero ? "text-xs sm:text-sm" : "text-[10px] sm:text-xs"}`}>
          {categoryLabel(cat)}
        </span>
        <p
          className={`font-display font-bold leading-tight max-w-[60%] ${
            hero ? "text-2xl sm:text-4xl line-clamp-4" : "text-base sm:text-lg line-clamp-2"
          }`}
        >
          {title}
        </p>
      </div>
    </div>
  );
}
