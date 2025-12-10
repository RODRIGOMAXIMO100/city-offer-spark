import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Banknote, 
  Share2, 
  Wallet, 
  TrendingUp, 
  ArrowRight,
  CheckCircle2 
} from "lucide-react";

const benefits = [
  {
    icon: Banknote,
    title: "Ganhe comissão por clique",
    description: "Cada clique no seu link gera créditos que viram dinheiro real.",
  },
  {
    icon: Share2,
    title: "Compartilhe onde quiser",
    description: "WhatsApp, Instagram, Facebook, TikTok. Use suas redes.",
  },
  {
    icon: Wallet,
    title: "Saque via PIX instantâneo",
    description: "Quando atingir o mínimo, saque direto para sua conta.",
  },
  {
    icon: TrendingUp,
    title: "Acompanhe seus ganhos",
    description: "Dashboard completo com histórico de cliques e ganhos.",
  },
];

const earnings = [
  { offers: "10 ofertas", clicks: "100 cliques/dia", value: "R$ 150/mês" },
  { offers: "25 ofertas", clicks: "300 cliques/dia", value: "R$ 450/mês" },
  { offers: "50 ofertas", clicks: "700 cliques/dia", value: "R$ 1.050/mês" },
];

export function ForAffiliates() {
  return (
    <section id="divulgadores" className="py-20 bg-affiliate/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Visual */}
          <div className="order-2 lg:order-1">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-xl">
              <div className="bg-affiliate/10 rounded-xl p-4 mb-4">
                <h3 className="font-semibold text-affiliate mb-2">Painel do Divulgador</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo disponível</p>
                    <p className="text-3xl font-bold text-affiliate">R$ 247,50</p>
                  </div>
                  <Button size="sm" className="bg-affiliate hover:bg-affiliate/90">
                    Sacar PIX
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Potencial de ganhos:</p>
                {earnings.map((item) => (
                  <div key={item.offers} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{item.offers}</p>
                      <p className="text-xs text-muted-foreground">{item.clicks}</p>
                    </div>
                    <span className="font-bold text-affiliate">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 bg-affiliate/10 text-affiliate px-4 py-2 rounded-full text-sm font-medium mb-6">
              <TrendingUp className="h-4 w-4" />
              Para Divulgadores
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Transforme seu alcance em renda
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8">
              Você já influencia pessoas na sua região. Agora pode ganhar dinheiro 
              compartilhando ofertas relevantes para sua audiência.
            </p>

            {/* Benefits Grid */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-affiliate/10 flex items-center justify-center shrink-0">
                    <benefit.icon className="h-5 w-5 text-affiliate" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button size="lg" asChild className="bg-affiliate hover:bg-affiliate/90">
              <Link to="/auth?role=AFFILIATE">
                Começar a Ganhar
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
