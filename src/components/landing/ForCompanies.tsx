import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  MousePointerClick, 
  BarChart3, 
  MapPin, 
  Link2, 
  ArrowRight,
  CheckCircle2 
} from "lucide-react";

const benefits = [
  {
    icon: MousePointerClick,
    title: "Pague só por clique verificado",
    description: "Sem taxas fixas. Você só paga quando alguém realmente clica na sua oferta.",
  },
  {
    icon: BarChart3,
    title: "Dashboard em tempo real",
    description: "Acompanhe visualizações, cliques e desempenho das suas ofertas.",
  },
  {
    icon: MapPin,
    title: "Segmentação por cidade",
    description: "Alcance clientes da sua região com ofertas locais relevantes.",
  },
  {
    icon: Link2,
    title: "Links rastreáveis",
    description: "WhatsApp, cardápio ou site. Escolha para onde o cliente vai.",
  },
];

const features = [
  "Ofertas com preço antigo e novo",
  "Múltiplos links de destino",
  "Tags para categorização",
  "Controle de ativação",
  "Relatórios detalhados",
];

export function ForCompanies() {
  return (
    <section id="empresas" className="py-20 bg-company/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-company/10 text-company px-4 py-2 rounded-full text-sm font-medium mb-6">
              <MousePointerClick className="h-4 w-4" />
              Para Empresas
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Pague apenas por resultados
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8">
              Cadastre suas ofertas, defina o valor por clique e deixe nossa rede de divulgadores 
              trabalhar para você. Sem mensalidades, sem surpresas.
            </p>

            {/* Benefits Grid */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-company/10 flex items-center justify-center shrink-0">
                    <benefit.icon className="h-5 w-5 text-company" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button size="lg" asChild className="bg-company hover:bg-company/90">
              <Link to="/auth?role=COMPANY">
                Cadastrar Minha Empresa
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Visual */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-xl">
            <div className="bg-company/10 rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-company mb-2">Dashboard da Empresa</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">1.2k</p>
                  <p className="text-xs text-muted-foreground">Visualizações</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">340</p>
                  <p className="text-xs text-muted-foreground">Cliques</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">28%</p>
                  <p className="text-xs text-muted-foreground">Taxa</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Funcionalidades incluídas:</p>
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-company" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
