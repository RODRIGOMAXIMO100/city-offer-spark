import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Users, Sparkles, Zap, TrendingUp, CheckCircle2 } from "lucide-react";
import { FloatingParticles } from "./FloatingParticles";
import { useEffect, useState } from "react";

export function HeroSection() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Elements with Parallax */}
      <div 
        className="absolute inset-0 bg-grid-pattern opacity-40"
        style={{ transform: `translateY(${scrollY * 0.1}px)` }}
      />
      <div 
        className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl transition-transform duration-100"
        style={{ transform: `translateY(${scrollY * 0.3}px) translateX(${scrollY * 0.05}px)` }}
      />
      <div 
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl transition-transform duration-100"
        style={{ transform: `translateY(${scrollY * 0.2}px) translateX(${-scrollY * 0.08}px)` }}
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 via-transparent to-transparent transition-transform duration-100"
        style={{ transform: `translate(-50%, calc(-50% + ${scrollY * 0.15}px)) scale(${1 + scrollY * 0.0002})` }}
      />
      
      {/* Floating Particles with Parallax */}
      <div style={{ transform: `translateY(${scrollY * 0.05}px)` }}>
        <FloatingParticles />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-5 py-2.5 rounded-full text-sm font-medium mb-8 animate-fade-in-up">
            <Zap className="h-4 w-4" />
            Plataforma de ofertas locais com IA
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Servir. Conectar. Crescer.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Fortalecendo negócios locais e comunidades — juntos crescemos mais.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-16 animate-fade-in-up px-4 sm:px-0" style={{ animationDelay: "0.3s" }}>
            <Button 
              size="lg" 
              asChild 
              className="text-sm sm:text-lg px-6 sm:px-8 h-12 sm:h-14 btn-shimmer btn-pulse-glow hover:scale-105 transition-all duration-300"
            >
              <Link to="/auth?role=COMPANY">
                <Building2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Sou Empresa
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="text-sm sm:text-lg px-6 sm:px-8 h-12 sm:h-14 border-2 btn-animated-border hover:text-affiliate hover:scale-105 transition-all duration-300"
            >
              <Link to="/auth?role=AFFILIATE">
                <TrendingUp className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Quero Divulgar
              </Link>
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-10 text-sm animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            {[
              { icon: CheckCircle2, text: "Comunidades fortalecidas" },
              { icon: CheckCircle2, text: "Crescimento compartilhado" },
              { icon: CheckCircle2, text: "Conexões com propósito" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-muted-foreground">
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-secondary shrink-0" />
                <span className="text-xs sm:text-sm">{item.text}</span>
              </div>
            ))}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-4 flex items-center justify-center gap-2 animate-fade-in-up" style={{ animationDelay: "0.45s" }}>
            <Users className="h-4 w-4 text-secondary shrink-0" />
            <span>Sem taxa por venda • Sem dependência de marketplace</span>
          </p>
        </div>

        {/* Visual Cards */}
        <div className="mt-20 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              icon: Building2,
              title: "Servir",
              desc: "Conecte-se com quem precisa de você",
              color: "company",
              gradient: "from-company to-company/70",
              delay: "0.5s",
            },
            {
              icon: TrendingUp,
              title: "Conectar",
              desc: "Una pessoas e negócios locais",
              color: "affiliate",
              gradient: "from-affiliate to-affiliate/70",
              delay: "0.65s",
            },
            {
              icon: Sparkles,
              title: "Crescer",
              desc: "Prospere junto com sua comunidade",
              color: "client",
              gradient: "from-client to-client/70",
              delay: "0.8s",
            },
          ].map((card, i) => (
            <div
              key={card.title}
              className={`glass-card rounded-2xl p-6 transition-all duration-500 group opacity-0 animate-fade-in-up cursor-pointer ${i === 1 ? "md:-mt-4" : ""}`}
              style={{ 
                animationDelay: card.delay, 
                animationFillMode: "forwards",
                transformStyle: "preserve-3d",
                perspective: "1000px",
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget;
                target.style.transform = "translateY(-8px) rotateX(5deg) scale(1.02)";
                target.style.boxShadow = `0 25px 50px -12px hsl(var(--${card.color}) / 0.35), 0 0 40px hsl(var(--${card.color}) / 0.2)`;
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget;
                target.style.transform = "translateY(0) rotateX(0deg) scale(1)";
                target.style.boxShadow = "";
              }}
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300`}>
                <card.icon className="h-7 w-7 text-white group-hover:scale-110 transition-transform duration-300" />
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