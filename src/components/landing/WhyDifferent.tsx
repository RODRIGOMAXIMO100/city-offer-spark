import { TrendingDown, MessageSquare, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PRICING_DISCLAIMER } from "@/types/database";
import logo from "@/assets/logo.png";

const comparisonData = [
  { type: "Marketplaces de Delivery*", cost: "15% - 30%", metric: "por venda", highlight: false, isMarketplace: true, isLogo: false },
  { type: "Anúncios de Busca", cost: "~R$ 25,00", metric: "por clique genérico", highlight: false, isMarketplace: false, isLogo: false },
  { type: "Redes Sociais", cost: "~R$ 3,00", metric: "por clique genérico", highlight: false, isMarketplace: false, isLogo: false },
  { type: "Clilin", cost: "R$ 0,40 - R$ 1,00**", metric: "clique = lead qualificado", highlight: true, isMarketplace: false, isLogo: true },
];

const differentials = [
  {
    icon: TrendingDown,
    title: "Leads até 60x mais baratos",
    description: "Enquanto plataformas tradicionais cobram de R$ 3 a R$ 25 por clique genérico, na Clilin você paga de R$ 0,40 a R$ 1,00 por um lead qualificado e local.",
    highlight: "Economia de até 97% por lead",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: MessageSquare,
    title: "Clientes encontram você conversando",
    description: "O cliente diz para nossa IA o que precisa e ela sugere sua oferta. É demanda real, não impressões vazias.",
    highlight: "Lead com intenção de compra",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Users,
    title: "Divulgado por gente da sua cidade",
    description: "Pessoas reais da sua comunidade indicam suas ofertas. Cada lead é local, segmentado e com interesse demonstrado.",
    highlight: "Leads locais de confiança",
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
              <span className="text-right">Clique por Lead Qualificado</span>
            </div>
            {comparisonData.map((item, index) => (
              <div
                key={index}
                className={`grid grid-cols-2 gap-4 p-4 border-t border-border ${
                  item.highlight ? "bg-primary/5" : ""
                }`}
              >
                {item.isLogo ? (
                  <img src={logo} alt="Clilin" className="h-6 object-contain" />
                ) : (
                  <span className={`font-medium ${item.highlight ? "text-primary font-bold" : "text-foreground"}`}>
                    {item.type}
                  </span>
                )}
                <div className={`text-right ${item.highlight ? "text-primary font-bold" : "text-muted-foreground"}`}>
                  <span className={item.highlight ? "text-lg" : ""}>{item.cost}</span>
                  <span className="text-xs opacity-70 ml-1">{item.metric}</span>
                </div>
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
