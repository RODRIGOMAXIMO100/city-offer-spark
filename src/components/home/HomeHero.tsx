import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Megaphone, CheckCircle2, Trophy, Eye } from "lucide-react";

const voices = [
  { initial: "A", tone: "bg-affiliate text-affiliate-foreground" },
  { initial: "J", tone: "bg-company text-company-foreground" },
  { initial: "M", tone: "bg-highlight text-highlight-foreground" },
  { initial: "R", tone: "bg-affiliate text-affiliate-foreground" },
  { initial: "L", tone: "bg-company text-company-foreground" },
];

export function HomeHero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      <div className="absolute inset-0 bg-grid-pattern opacity-40" aria-hidden />
      <div className="absolute -top-24 left-1/4 w-[28rem] h-[28rem] bg-primary/15 rounded-full blur-3xl" aria-hidden />
      <div className="absolute bottom-0 right-0 w-[24rem] h-[24rem] bg-highlight/20 rounded-full blur-3xl" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-center">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6 animate-fade-in-up">
            <Megaphone className="h-4 w-4" />
            Campanhas de alcance com gente de verdade
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-bold tracking-tight leading-[1.05] mb-6 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            Sua marca{" "}
            <span className="text-brand-gradient">na boca do Brasil.</span>
          </h1>

          <p
            className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            Você lança uma palavra-chave. Divulgadores reais postam ao mesmo tempo nas redes sociais.
            Você paga só pelas visualizações verificadas: <strong className="text-foreground">R$ 5 a cada mil</strong>.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Button size="lg" asChild className="h-12 sm:h-14 px-6 sm:px-8 text-base bg-company text-company-foreground hover:bg-company/90 shadow-xl shadow-company/25">
              <Link to="/auth?role=COMPANY">
                <Building2 className="mr-2 h-5 w-5" />
                Criar minha campanha
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 sm:h-14 px-6 sm:px-8 text-base border-2 border-affiliate/40 text-affiliate hover:bg-affiliate/10 hover:text-affiliate">
              <Link to="/auth?role=AFFILIATE">
                <Trophy className="mr-2 h-5 w-5" />
                Quero divulgar e ganhar
              </Link>
            </Button>
          </div>

          <ul
            className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-muted-foreground animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            {["Pague só o que foi visto", "Sem mensalidade", "Brasil inteiro ou só a sua cidade"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-affiliate shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Ilustração do mecanismo: uma palavra-chave, muitas vozes ao mesmo tempo */}
        <div className="relative animate-fade-in-up" style={{ animationDelay: "0.35s" }} aria-hidden>
          <div className="glass-card rounded-3xl p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Exemplo de campanha</p>
            <div className="flex items-center justify-between gap-3 mb-6">
              <span className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-4 py-2 font-display font-bold text-lg">
                #PizzaDoZé
              </span>
              <span className="text-xs font-semibold text-affiliate bg-affiliate/10 rounded-full px-3 py-1">no ar agora</span>
            </div>

            <div className="space-y-3">
              {voices.map((v, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3">
                  <span className={`h-9 w-9 rounded-full flex items-center justify-center font-bold ${v.tone}`}>{v.initial}</span>
                  <div className="flex-1 min-w-0">
                    <div className="h-2.5 rounded-full bg-muted w-3/4 mb-1.5" />
                    <div className="h-2 rounded-full bg-muted/70 w-1/2" />
                  </div>
                  <span className="text-xs font-semibold text-primary">#PizzaDoZé</span>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-company/10 p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> Meta</p>
                <p className="font-display font-bold text-2xl text-company">50 mil</p>
                <p className="text-xs text-muted-foreground">visualizações</p>
              </div>
              <div className="rounded-2xl bg-highlight/15 p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Trophy className="h-3.5 w-3.5" /> Investimento</p>
                <p className="font-display font-bold text-2xl text-foreground">R$ 250</p>
                <p className="text-xs text-muted-foreground">só o que for visto</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
