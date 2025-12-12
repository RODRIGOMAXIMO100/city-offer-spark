import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  MousePointerClick, 
  BarChart3, 
  MapPin, 
  Link2, 
  ArrowRight,
  Zap
} from "lucide-react";

const benefits = [
  {
    icon: MousePointerClick,
    title: "Pague por lead qualificado",
    description: "Sem mensalidade. Pague apenas quando um cliente local demonstra interesse real na sua oferta.",
  },
  {
    icon: BarChart3,
    title: "Dashboard completo",
    description: "Acompanhe visualizações, leads e conversões em tempo real.",
  },
  {
    icon: MapPin,
    title: "Leads locais garantidos",
    description: "Clientes da sua cidade que pediram ao assistente IA ou receberam indicação de divulgadores.",
  },
  {
    icon: Link2,
    title: "Links inteligentes",
    description: "WhatsApp, cardápio ou site. O cliente vai direto onde você quer.",
  },
];

export function ForCompanies() {
  return (
    <section id="empresas" className="section-padding landing-section relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-company/5 via-transparent to-transparent" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-company/10 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-company/10 text-company px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Zap className="h-4 w-4" />
              Para Empresas
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-6">
              Marketing que dá{" "}
              <span className="text-company">resultado</span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Pare de gastar com anúncios que não convertem. Com o clilin, você paga apenas 
              quando um cliente qualificado demonstra interesse real — seja pedindo ao nosso assistente 
              ou clicando em uma indicação local.
            </p>

            {/* Benefits */}
            <div className="space-y-6 mb-10">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-company/10 flex items-center justify-center shrink-0 group-hover:bg-company group-hover:text-white transition-all duration-300">
                    <benefit.icon className="h-6 w-6 text-company group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button size="lg" asChild className="bg-company hover:bg-company/90 shadow-xl shadow-company/25 hover:shadow-2xl hover:shadow-company/30 transition-all h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base">
              <Link to="/auth?role=COMPANY">
                <span className="sm:hidden">Cadastrar Empresa</span>
                <span className="hidden sm:inline">Cadastrar Minha Empresa</span>
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-company/20 to-company/5 rounded-3xl blur-2xl" />
            <div className="relative glass-card rounded-3xl p-8">
              {/* Mock Dashboard */}
              <div className="bg-company/10 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-company">Desempenho Hoje</span>
                  <span className="text-xs text-muted-foreground">Atualizado agora</span>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="bg-card rounded-xl p-3 sm:p-4 text-center">
                    <p className="text-xl sm:text-3xl font-display font-bold text-company">1.2k</p>
                    <p className="text-xs text-muted-foreground mt-1">Views</p>
                  </div>
                  <div className="bg-card rounded-xl p-3 sm:p-4 text-center">
                    <p className="text-xl sm:text-3xl font-display font-bold text-company">340</p>
                    <p className="text-xs text-muted-foreground mt-1">Leads</p>
                  </div>
                  <div className="bg-card rounded-xl p-3 sm:p-4 text-center">
                    <p className="text-xl sm:text-3xl font-display font-bold text-secondary">28%</p>
                    <p className="text-xs text-muted-foreground mt-1">Taxa</p>
                  </div>
                </div>
              </div>
              
              {/* Mock Offer Card */}
              <div className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-company/20 to-company/10 flex items-center justify-center">
                    <span className="text-2xl">🍕</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Pizza Grande Margherita</h4>
                    <p className="text-sm text-muted-foreground">Pizzaria do João</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-muted-foreground line-through">R$ 59,90</span>
                      <span className="text-lg font-bold text-secondary">R$ 39,90</span>
                      <span className="bg-destructive/10 text-destructive text-xs font-bold px-2 py-0.5 rounded-full">-33%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}