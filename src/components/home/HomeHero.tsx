import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Ticket, CheckCircle2, MessageCircle, MapPin, Store, Trophy } from "lucide-react";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      <div className="absolute inset-0 bg-grid-pattern opacity-40" aria-hidden />
      <div className="absolute -top-24 left-1/4 w-[28rem] h-[28rem] bg-primary/15 rounded-full blur-3xl" aria-hidden />
      <div className="absolute bottom-0 right-0 w-[24rem] h-[24rem] bg-highlight/20 rounded-full blur-3xl" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-center">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6 animate-fade-in-up">
            <MapPin className="h-4 w-4" />
            Começando por Belo Horizonte
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-bold tracking-tight leading-[1.05] mb-6 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            Cliente novo na loja.{" "}
            <span className="text-brand-gradient">Pague só quando ele chega.</span>
          </h1>

          <p
            className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            Negócios da cidade publicam promoções, divulgadores espalham e o cliente pega o cupom de graça, direto no WhatsApp.
            Na hora de usar, o cliente toca em "Estou na loja" ou "Pedir online", a loja confirma com um toque e <strong className="text-foreground">só paga pelo cupom usado</strong>.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-4 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Button size="lg" asChild className="h-12 sm:h-14 px-6 sm:px-8 text-base bg-company text-company-foreground hover:bg-company/90 shadow-xl shadow-company/25">
              <Link to="/auth?role=COMPANY">
                <Building2 className="mr-2 h-5 w-5" />
                Colocar minha oferta
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 sm:h-14 px-6 sm:px-8 text-base border-2">
              <Link to="/ofertas">
                <Ticket className="mr-2 h-5 w-5" />
                Ver ofertas da cidade
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-8 animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
            Quer ganhar indicando?{" "}
            <Link to="/divulgadores" className="font-semibold text-affiliate hover:underline inline-flex items-center gap-1">
              <Trophy className="h-4 w-4" /> Seja divulgador
            </Link>
          </p>

          <ul
            className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-muted-foreground animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            {["Sem mensalidade", "Grátis para o cliente", "Separado por cidade"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-affiliate shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Ilustração do fluxo: oferta, cupom no WhatsApp, conferência na loja */}
        <div className="relative animate-fade-in-up" style={{ animationDelay: "0.35s" }} aria-hidden>
          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="rounded-2xl bg-card border border-border p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Store className="h-3.5 w-3.5" /> Pizzaria do Zé · Viçosa
                </span>
                <span className="rounded-full bg-highlight text-highlight-foreground px-2.5 py-0.5 text-xs font-bold">-35%</span>
              </div>
              <p className="font-display font-bold text-lg">Pizza grande + refri</p>
              <p className="text-sm text-muted-foreground">
                <span className="line-through mr-2">R$ 60</span>
                <span className="font-display font-bold text-2xl text-primary">R$ 39</span>
              </p>
            </div>

            <div className="rounded-2xl bg-affiliate/10 border border-affiliate/20 p-4 ml-6">
              <p className="text-xs font-semibold text-affiliate flex items-center gap-1 mb-1">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp do cliente
              </p>
              <p className="text-sm text-foreground">Seu cupom da Pizzaria do Zé chegou! Mostre na loja:</p>
              <p className="font-display font-bold text-2xl tracking-widest text-foreground mt-1">K7M2Q9XA</p>
            </div>

            <div className="rounded-2xl bg-company/10 border border-company/20 p-4 flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-company shrink-0" />
              <div>
                <p className="font-semibold">Cupom válido</p>
                <p className="text-xs text-muted-foreground">Confirmado no WhatsApp. Só agora a loja paga: R$ 4,68.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
