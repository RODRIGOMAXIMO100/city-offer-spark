import { MessageSquare, Users, Heart, ShieldCheck, TrendingUp, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PRICING_DISCLAIMER } from "@/types/database";
import logo from "@/assets/logo.png";

const strategicComparison = [
  {
    feature: "Cliente vai pra onde?",
    ifood: "Pro iFood",
    ifoodNote: "(você perde o contato)",
    google: "Pro site genérico",
    googleNote: "",
    clilin: "Pro SEU WhatsApp",
    clilinNote: "✓",
  },
  {
    feature: "Quem indica você?",
    ifood: "Algoritmo",
    ifoodNote: "",
    google: "Algoritmo",
    googleNote: "",
    clilin: "Pessoas reais + IA",
    clilinNote: "✓",
  },
  {
    feature: "Você fideliza?",
    ifood: "Não",
    ifoodNote: "(cliente é do iFood)",
    google: "Difícil",
    googleNote: "",
    clilin: "Sim, você controla",
    clilinNote: "✓",
  },
  {
    feature: "Taxa por venda?",
    ifood: "15-30%",
    ifoodNote: "sempre",
    google: "Não",
    googleNote: "",
    clilin: "Não",
    clilinNote: "✓",
  },
  {
    feature: "Branding local?",
    ifood: "Mínimo",
    ifoodNote: "(marca iFood)",
    google: "Não",
    googleNote: "",
    clilin: "Sim, sua marca",
    clilinNote: "✓",
  },
];

const differentials = [
  {
    icon: MessageSquare,
    title: "Descoberta por IA",
    description: "Quando alguém perguntar 'onde comer?' ou 'qual salão?' para nossa IA, sua oferta aparece. Demanda real, não anúncio frio.",
    highlight: "Seja encontrado naturalmente",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Users,
    title: "Marketing de confiança",
    description: "Pessoas reais da sua cidade indicam você. É como boca a boca, só que digital e mensurável.",
    highlight: "Indicação vale mais que anúncio",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: Smartphone,
    title: "Cliente no SEU canal",
    description: "Diferente de marketplaces, o cliente vai direto pro seu WhatsApp. Você conversa, fideliza e não paga taxa por venda.",
    highlight: "Relacionamento direto",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: ShieldCheck,
    title: "Independência total",
    description: "Construa SUA base de clientes, não a de uma plataforma. Sem ficar refém de algoritmos ou taxas abusivas.",
    highlight: "Sua empresa, suas regras",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
];

export function WhyDifferent() {
  return (
    <section className="py-20 bg-muted/30" id="diferenciais">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Compare e decida
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            O que você REALMENTE ganha com cada plataforma
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Não é só sobre custo — é sobre construir SEU negócio, não o de uma plataforma
          </p>
        </div>

        {/* Strategic Comparison Table */}
        <div className="max-w-4xl mx-auto mb-16 overflow-x-auto">
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-lg min-w-[600px]">
            {/* Header */}
            <div className="grid grid-cols-4 gap-2 p-4 bg-muted/50 font-semibold text-sm">
              <span></span>
              <span className="text-center text-muted-foreground">iFood / Marketplaces</span>
              <span className="text-center text-muted-foreground">Google Ads</span>
              <span className="text-center">
                <img src={logo} alt="Clilin" className="h-5 mx-auto object-contain" />
              </span>
            </div>
            {/* Rows */}
            {strategicComparison.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-4 gap-2 p-4 border-t border-border items-center"
              >
                <span className="font-medium text-sm">{row.feature}</span>
                <div className="text-center text-sm text-muted-foreground">
                  <span>{row.ifood}</span>
                  {row.ifoodNote && <span className="block text-xs opacity-70">{row.ifoodNote}</span>}
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  <span>{row.google}</span>
                  {row.googleNote && <span className="block text-xs opacity-70">{row.googleNote}</span>}
                </div>
                <div className="text-center text-sm font-medium text-primary">
                  <span>{row.clilin}</span>
                  {row.clilinNote === "✓" && <span className="ml-1 text-secondary">✓</span>}
                </div>
              </div>
            ))}
          </div>
          
          {/* Footnote */}
          <p className="mt-4 text-xs text-muted-foreground text-center">
            {PRICING_DISCLAIMER.full}
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
          {differentials.map((item, index) => (
            <div
              key={index}
              className="group bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl"
            >
              <div className={`inline-flex p-3 rounded-xl ${item.bgColor} mb-4 group-hover:scale-110 transition-transform`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {item.title}
              </h3>
              <p className="text-muted-foreground mb-4">
                {item.description}
              </p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${item.bgColor} ${item.color}`}>
                {item.highlight}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Sem mensalidade. Sem taxas escondidas. Sem surpresas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link to="/auth?tab=register&role=company">
                Começar Agora — É Grátis
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link to="/transparencia">
                Ver Transparência
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
