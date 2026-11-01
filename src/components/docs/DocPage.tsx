import { ReactNode } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export type DocBlock =
  | string
  | { list: (string | [string, string])[] }
  | { note: string; tone?: "info" | "alert" };

export interface DocSection {
  id: string;
  title: string;
  blocks: DocBlock[];
}

/** Texto com **negrito** simples, sem HTML */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="text-foreground font-semibold">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function Block({ b }: { b: DocBlock }) {
  if (typeof b === "string") {
    return (
      <p className="text-muted-foreground leading-relaxed">
        <Rich text={b} />
      </p>
    );
  }
  if ("list" in b) {
    return (
      <ul className="space-y-2">
        {b.list.map((item, i) => (
          <li key={i} className="flex gap-3 text-muted-foreground leading-relaxed">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <span>
              {Array.isArray(item) ? (
                <>
                  <strong className="text-foreground font-semibold">{item[0]}:</strong> <Rich text={item[1]} />
                </>
              ) : (
                <Rich text={item} />
              )}
            </span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 leading-relaxed ${
        b.tone === "alert" ? "border-affiliate/30 bg-affiliate/5 text-foreground" : "border-company/20 bg-company/5 text-foreground"
      }`}
    >
      <Rich text={b.note} />
    </div>
  );
}

/** Página de documento (termos, privacidade): título, índice e seções numeradas */
export function DocPage({
  title,
  subtitle,
  updated,
  intro,
  sections,
  after,
}: {
  title: string;
  subtitle?: string;
  updated: string;
  intro?: ReactNode;
  sections: DocSection[];
  after?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <header className="pt-28 sm:pt-32 pb-10 bg-gradient-to-b from-muted/60 to-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-5xl font-display font-bold text-foreground mb-3">{title}</h1>
          {subtitle && <p className="text-lg text-muted-foreground max-w-3xl">{subtitle}</p>}
          <p className="text-sm text-muted-foreground mt-4">Última atualização: {updated}</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid lg:grid-cols-[1fr_240px] gap-10">
          <article className="space-y-10 min-w-0">
            {intro && <div className="space-y-4">{intro}</div>}
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-28 space-y-4">
                <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
                  {i + 1}. {s.title}
                </h2>
                {s.blocks.map((b, j) => (
                  <Block key={j} b={b} />
                ))}
              </section>
            ))}
            {after}
          </article>

          <aside className="hidden lg:block">
            <nav className="sticky top-28 rounded-2xl border border-border bg-card p-4 max-h-[75vh] overflow-y-auto" aria-label="Índice">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Nesta página</p>
              <ol className="space-y-2 text-sm">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-muted-foreground hover:text-primary transition-colors">
                      {i + 1}. {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
