import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  MapPin, 
  Percent, 
  MessageCircle,
  ArrowRight,
  Bot
} from "lucide-react";

const benefits = [
  {
    icon: Bot,
    title: "IA personalizada",
    description: "Nossa inteligência artificial aprende o que você gosta e sugere ofertas perfeitas.",
  },
  {
    icon: MapPin,
    title: "Ofertas locais",
    description: "Encontre descontos em estabelecimentos perto de você.",
  },
  {
    icon: Percent,
    title: "Descontos exclusivos",
    description: "Acesse ofertas que não estão disponíveis em outros lugares.",
  },
  {
    icon: MessageCircle,
    title: "Converse e encontre",
    description: "Pergunte o que precisa e receba sugestões na hora.",
  },
];

export function ForClients() {
  return (
    <section id="clientes" className="section-padding landing-section relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-tr from-client/5 via-transparent to-transparent" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-client/10 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-client/10 text-client px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="h-4 w-4" />
              Para Clientes
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-6">
              Ofertas que a IA{" "}
              <span className="text-client">encontra pra você</span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Diga o que você precisa e nossa IA encontra as melhores ofertas 
              perto de você. Simples, rápido e gratuito.
            </p>

            {/* Benefits */}
            <div className="space-y-6 mb-10">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-client/10 flex items-center justify-center shrink-0 group-hover:bg-client group-hover:text-white transition-all duration-300">
                    <benefit.icon className="h-6 w-6 text-client group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button size="lg" asChild className="bg-client hover:bg-client/90 shadow-xl shadow-client/25 hover:shadow-2xl hover:shadow-client/30 transition-all h-14 px-8">
              <Link to="/auth?role=CLIENT">
                Descobrir Ofertas
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Visual - Chat Interface */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-client/20 to-client/5 rounded-3xl blur-2xl" />
            <div className="relative glass-card rounded-3xl p-8">
              {/* Chat Header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-client to-client/70 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Assistente clilin</p>
                  <p className="text-xs text-muted-foreground">Online agora</p>
                </div>
              </div>
              
              {/* Chat Messages */}
              <div className="space-y-4 mb-6">
                <div className="bg-muted rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
                  <p className="text-sm">Olá! 👋 O que você está procurando hoje?</p>
                </div>
                <div className="bg-client text-white rounded-2xl rounded-tr-sm p-4 max-w-[85%] ml-auto">
                  <p className="text-sm">Quero uma pizzaria com desconto perto de mim</p>
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
                  <p className="text-sm">Encontrei 3 ofertas de pizzaria perto de você! 🍕</p>
                </div>
              </div>
              
              {/* Sample Offers */}
              <div className="space-y-3">
                {[
                  { title: "Pizza Grande", place: "Pizzaria do João", discount: "33%" },
                  { title: "Combo Família", place: "Pizza Express", discount: "25%" },
                  { title: "2 Pizzas Médias", place: "Forno & Massa", discount: "40%" },
                ].map((offer) => (
                  <div key={offer.title} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border hover:border-client/30 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🍕</span>
                      <div>
                        <p className="text-sm font-medium">{offer.title}</p>
                        <p className="text-xs text-muted-foreground">{offer.place}</p>
                      </div>
                    </div>
                    <span className="bg-client/10 text-client px-3 py-1 rounded-full text-sm font-bold">
                      -{offer.discount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}