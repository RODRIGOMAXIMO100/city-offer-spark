import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Banknote, 
  Share2, 
  Wallet, 
  TrendingUp, 
  ArrowRight,
  DollarSign
} from "lucide-react";

const benefits = [
  {
    icon: Banknote,
    title: "Comissão por clique",
    description: "Cada clique no seu link gera saldo real na sua conta.",
  },
  {
    icon: Share2,
    title: "Use suas redes",
    description: "WhatsApp, Instagram, TikTok. Compartilhe onde sua audiência está.",
  },
  {
    icon: Wallet,
    title: "PIX instantâneo",
    description: "Atingiu o mínimo? Saque direto para sua conta em segundos.",
  },
  {
    icon: TrendingUp,
    title: "Escale seus ganhos",
    description: "Quanto mais você divulga, mais você ganha. Sem limites.",
  },
];

const earnings = [
  { level: "Iniciante", offers: "10 ofertas", clicks: "~50 cliques/dia", value: "R$ 300", period: "/mês" },
  { level: "Intermediário", offers: "25 ofertas", clicks: "~150 cliques/dia", value: "R$ 900", period: "/mês" },
  { level: "Avançado", offers: "50 ofertas", clicks: "~300 cliques/dia", value: "R$ 1.800", period: "/mês" },
];

export function ForAffiliates() {
  return (
    <section id="divulgadores" className="section-padding landing-section relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-bl from-affiliate/5 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-affiliate/10 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Visual */}
          <div className="order-2 lg:order-1 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-affiliate/20 to-affiliate/5 rounded-3xl blur-2xl" />
            <div className="relative glass-card rounded-3xl p-8">
              {/* Balance Card */}
              <div className="bg-gradient-to-br from-affiliate to-affiliate/80 rounded-2xl p-6 mb-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-90">Saldo disponível</span>
                  <Wallet className="h-5 w-5 opacity-80" />
                </div>
                <p className="text-4xl font-display font-bold mb-4">R$ 247,50</p>
                <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                  Sacar via PIX
                </Button>
              </div>
              
              {/* Earnings Table */}
              <div className="space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-affiliate" />
                  Potencial de ganhos
                </p>
                {earnings.map((item) => (
                  <div key={item.level} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                    <div>
                      <p className="font-semibold text-sm">{item.level}</p>
                      <p className="text-xs text-muted-foreground">{item.offers} • {item.clicks}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-display font-bold text-affiliate">{item.value}</span>
                      <span className="text-sm text-muted-foreground">{item.period}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 bg-affiliate/10 text-affiliate px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <TrendingUp className="h-4 w-4" />
              Para Divulgadores
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-6">
              Transforme alcance em{" "}
              <span className="text-affiliate">renda</span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Você já influencia pessoas na sua região. Agora pode ganhar dinheiro 
              compartilhando ofertas que sua audiência vai adorar. <strong className="text-foreground">100% do valor pago pelas empresas é dividido entre a plataforma e você</strong> — pessoas reais da sua cidade.
            </p>

            {/* Benefits */}
            <div className="space-y-6 mb-10">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-affiliate/10 flex items-center justify-center shrink-0 group-hover:bg-affiliate group-hover:text-white transition-all duration-300">
                    <benefit.icon className="h-6 w-6 text-affiliate group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button size="lg" asChild className="bg-affiliate hover:bg-affiliate/90 shadow-xl shadow-affiliate/25 hover:shadow-2xl hover:shadow-affiliate/30 transition-all h-14 px-8">
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