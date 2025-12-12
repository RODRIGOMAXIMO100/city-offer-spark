import { MessageSquare, Users, Globe, Smartphone, DollarSign, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PRICING_DISCLAIMER } from "@/types/database";

const differentials = [
  {
    icon: Globe,
    title: "Você escolhe o destino",
    description: "Cliente vai pro seu WhatsApp, site ou cardápio digital. Você decide onde prefere receber e atender.",
    highlight: "Flexibilidade total",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: MessageSquare,
    title: "Descoberta natural",
    description: "Sua oferta aparece quando alguém pergunta pra IA ou quando um divulgador da cidade indica. Demanda real, não anúncio frio.",
    highlight: "Seja encontrado organicamente",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
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
    icon: DollarSign,
    title: "Sem taxa por venda",
    description: "Pague apenas pelo interesse gerado, não uma porcentagem de cada venda. Você sabe exatamente quanto vai gastar.",
    highlight: "Preço justo e previsível",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Smartphone,
    title: "Relacionamento direto",
    description: "O cliente vai pro SEU canal — você conversa, entende o que ele precisa e fideliza. Sem intermediários.",
    highlight: "Construa sua base de clientes",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Target,
    title: "Foco no local",
    description: "Feito para negócios locais que querem ser encontrados na própria cidade. Visibilidade onde importa.",
    highlight: "Sua cidade, sua marca",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
];

export function WhyDifferent() {
  return (
    <section className="py-20 bg-muted/30" id="diferenciais">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Por que a Clilin
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Visibilidade local com flexibilidade
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Conecte sua empresa a clientes reais da sua cidade, do jeito que funciona pra você
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
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

        {/* Footnote */}
        <p className="text-center text-xs text-muted-foreground mb-8 max-w-2xl mx-auto">
          {PRICING_DISCLAIMER.full}
        </p>

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
