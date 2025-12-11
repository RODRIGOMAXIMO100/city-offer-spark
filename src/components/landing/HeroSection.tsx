import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Users, Sparkles, Zap, TrendingUp, CheckCircle2 } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 via-transparent to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-5 py-2.5 rounded-full text-sm font-medium mb-8 animate-fade-in-up">
            <Zap className="h-4 w-4" />
            Plataforma de ofertas locais com IA
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Conecte ofertas a{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              quem realmente importa
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Empresas pagam por resultados reais. Divulgadores monetizam sua audiência. 
            Clientes encontram as melhores ofertas com IA.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Button size="lg" asChild className="text-lg px-8 h-14 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all">
              <Link to="/auth?role=COMPANY">
                <Building2 className="mr-2 h-5 w-5" />
                Sou Empresa
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 h-14 border-2 hover:bg-affiliate/10 hover:border-affiliate hover:text-affiliate transition-all">
              <Link to="/auth?role=AFFILIATE">
                <TrendingUp className="mr-2 h-5 w-5" />
                Quero Divulgar
              </Link>
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 text-sm animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            {[
              { icon: CheckCircle2, text: "Sem mensalidade" },
              { icon: CheckCircle2, text: "Pague por resultado" },
              { icon: CheckCircle2, text: "Saque via PIX" },
              { icon: Users, text: "Ganhos compartilhados com pessoas reais da sua cidade" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-muted-foreground">
                <item.icon className="h-5 w-5 text-secondary" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Cards */}
        <div className="mt-20 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          {[
            {
              icon: Building2,
              title: "Empresa",
              desc: "Cadastra ofertas com desconto",
              color: "company",
              gradient: "from-company to-company/70",
            },
            {
              icon: Users,
              title: "Divulgador",
              desc: "Compartilha e ganha comissão",
              color: "affiliate",
              gradient: "from-affiliate to-affiliate/70",
            },
            {
              icon: Sparkles,
              title: "Cliente",
              desc: "Encontra ofertas com IA",
              color: "client",
              gradient: "from-client to-client/70",
            },
          ].map((card, i) => (
            <div
              key={card.title}
              className={`glass-card rounded-2xl p-6 hover:scale-105 transition-all duration-300 group ${i === 1 ? "md:-mt-4" : ""}`}
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow`}>
                <card.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-display font-semibold mb-1">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}