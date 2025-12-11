import { TrendingDown, MessageSquare, Users, BarChart3, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PRICING_DISCLAIMER } from "@/types/database";

const comparisonData = [
  { type: "Marketplaces de Delivery*", cpc: "~R$ 15 - R$ 30", highlight: false, isMarketplace: true },
  { type: "Anúncios de Busca", cpc: "~R$ 25,00", highlight: false, isMarketplace: false },
  { type: "Redes Sociais", cpc: "~R$ 3,00", highlight: false, isMarketplace: false },
  { type: "Clilin", cpc: "R$ 0,40 - R$ 1,00**", highlight: true, isMarketplace: false },
];

const differentials = [
  {
    icon: TrendingDown,
    title: "CPC até 60x mais barato",
    description: "Enquanto plataformas tradicionais cobram de R$ 3 a R$ 25 por clique, na Clilin você paga de R$ 0,40 a R$ 1,00.",
    highlight: "Economia de até 97% por clique",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: MessageSquare,
    title: "Clientes encontram você conversando",
    description: "O cliente diz para nossa IA o que precisa e ela sugere sua oferta. É demanda real, não impressões vazias.",
    highlight: "O cliente vem até você",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Users,
    title: "Divulgado por gente da sua cidade",
    description: "Pessoas reais da sua comunidade divulgam suas ofertas e ganham 50% de cada clique. Confiança local + alcance orgânico.",
    highlight: "Pessoas reais, não algoritmos",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: BarChart3,
    title: "100% transparente",
    description: "Você sabe exatamente para onde vai cada centavo: 50% divulgadores, 50% plataforma. Dashboard em tempo real.",
    highlight: "Zero custos ocultos",
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
            Compare e economize
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Por que gastar mais se você pode pagar menos?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Veja como a Clilin revoluciona o custo de aquisição de clientes para negócios locais
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-xl mx-auto mb-16">
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-lg">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 font-semibold text-sm">
              <span>Plataforma</span>
              <span className="text-right">Custo por Clique</span>
            </div>
            {comparisonData.map((item, index) => (
              <div
                key={index}
                className={`grid grid-cols-2 gap-4 p-4 border-t border-border ${
                  item.highlight ? "bg-primary/5" : ""
                }`}
              >
                <span className={`font-medium ${item.highlight ? "text-primary font-bold" : "text-foreground"}`}>
                  {item.type}
                </span>
                <span className={`text-right ${item.highlight ? "text-primary font-bold text-lg" : "text-muted-foreground"}`}>
                  {item.cpc}
                </span>
              </div>
            ))}
          </div>
          
          {/* Footnotes */}
          <div className="mt-4 space-y-1 text-xs text-muted-foreground">
            <p className="flex items-start gap-1">
              <span className="font-medium">*</span>
              <span>{PRICING_DISCLAIMER.marketplaceNote}</span>
            </p>
            <p className="flex items-start gap-1">
              <span className="font-medium">**</span>
              <span>{PRICING_DISCLAIMER.full}</span>
            </p>
          </div>
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
