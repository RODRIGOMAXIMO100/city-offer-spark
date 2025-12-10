import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, TrendingUp, Users } from "lucide-react";

export function HeroSection() {
  return (
    <section className="pt-24 pb-16 sm:pt-32 sm:pb-24 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Plataforma de ofertas locais com IA
          </Badge>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Ofertas locais que chegam às{" "}
            <span className="text-primary">pessoas certas</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Conectamos empresas a divulgadores e clientes. Empresas pagam por resultados, 
            divulgadores ganham comissões e clientes encontram descontos exclusivos.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" asChild className="text-lg px-8">
              <Link to="/auth?role=COMPANY">
                Sou Empresa
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link to="/auth?role=AFFILIATE">
                Quero Divulgar
                <TrendingUp className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span>+500 empresas ativas</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-affiliate" />
              <span>+1.000 divulgadores</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-client" />
              <span>+50.000 cliques gerados</span>
            </div>
          </div>
        </div>

        {/* Visual Element */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
          <div className="bg-card rounded-2xl border border-border shadow-2xl p-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-4">
              {/* Company Card */}
              <div className="bg-company/10 rounded-xl p-4 border border-company/20">
                <div className="w-10 h-10 bg-company rounded-lg flex items-center justify-center mb-3">
                  <span className="text-white font-bold">E</span>
                </div>
                <p className="text-sm font-medium">Empresa</p>
                <p className="text-xs text-muted-foreground">Cria ofertas</p>
              </div>
              
              {/* Affiliate Card */}
              <div className="bg-affiliate/10 rounded-xl p-4 border border-affiliate/20">
                <div className="w-10 h-10 bg-affiliate rounded-lg flex items-center justify-center mb-3">
                  <span className="text-white font-bold">D</span>
                </div>
                <p className="text-sm font-medium">Divulgador</p>
                <p className="text-xs text-muted-foreground">Compartilha</p>
              </div>
              
              {/* Client Card */}
              <div className="bg-client/10 rounded-xl p-4 border border-client/20">
                <div className="w-10 h-10 bg-client rounded-lg flex items-center justify-center mb-3">
                  <span className="text-white font-bold">C</span>
                </div>
                <p className="text-sm font-medium">Cliente</p>
                <p className="text-xs text-muted-foreground">Economiza</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
