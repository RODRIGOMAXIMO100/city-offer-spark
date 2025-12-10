import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  MapPin, 
  Percent, 
  MessageCircle,
  ArrowRight 
} from "lucide-react";

const benefits = [
  {
    icon: Sparkles,
    title: "IA que entende você",
    description: "Nossa inteligência artificial aprende suas preferências e sugere ofertas relevantes.",
  },
  {
    icon: MapPin,
    title: "Ofertas perto de você",
    description: "Encontre descontos em estabelecimentos da sua cidade.",
  },
  {
    icon: Percent,
    title: "Descontos exclusivos",
    description: "Acesse ofertas que não estão disponíveis em outros lugares.",
  },
  {
    icon: MessageCircle,
    title: "Converse com a IA",
    description: "Pergunte o que precisa e receba sugestões personalizadas.",
  },
];

const sampleOffers = [
  { title: "Pizza Grande", discount: "30%", category: "Alimentação" },
  { title: "Corte + Barba", discount: "25%", category: "Beleza" },
  { title: "Lavagem Completa", discount: "40%", category: "Automotivo" },
];

export function ForClients() {
  return (
    <section id="clientes" className="py-20 bg-client/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-client/10 text-client px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Para Clientes
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Encontre ofertas com inteligência
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8">
              Diga o que você precisa e nossa IA encontra as melhores ofertas 
              perto de você. Economize tempo e dinheiro.
            </p>

            {/* Benefits Grid */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-client/10 flex items-center justify-center shrink-0">
                    <benefit.icon className="h-5 w-5 text-client" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button size="lg" asChild className="bg-client hover:bg-client/90">
              <Link to="/auth?role=CLIENT">
                Descobrir Ofertas
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Visual - Chat Interface */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-xl">
            <div className="bg-client/10 rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-client mb-4">Assistente IA</h3>
              
              {/* Chat Messages */}
              <div className="space-y-3">
                <div className="bg-muted rounded-lg rounded-tl-none p-3 max-w-[80%]">
                  <p className="text-sm">Olá! O que você está procurando hoje?</p>
                </div>
                <div className="bg-client text-white rounded-lg rounded-tr-none p-3 max-w-[80%] ml-auto">
                  <p className="text-sm">Quero uma pizzaria com desconto</p>
                </div>
                <div className="bg-muted rounded-lg rounded-tl-none p-3 max-w-[80%]">
                  <p className="text-sm">Encontrei 3 ofertas de pizzaria perto de você! 🍕</p>
                </div>
              </div>
            </div>
            
            {/* Sample Offers */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Ofertas encontradas:</p>
              {sampleOffers.map((offer) => (
                <div key={offer.title} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{offer.title}</p>
                    <p className="text-xs text-muted-foreground">{offer.category}</p>
                  </div>
                  <span className="bg-client/10 text-client px-2 py-1 rounded text-sm font-bold">
                    -{offer.discount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
