import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, Users, Sparkles, ArrowRight } from "lucide-react";

const options = [
  {
    icon: Building2,
    title: "Empresa",
    description: "Cadastre ofertas e pague apenas por cliques verificados",
    cta: "Começar como Empresa",
    color: "company",
    role: "COMPANY",
  },
  {
    icon: Users,
    title: "Divulgador",
    description: "Compartilhe ofertas e ganhe comissão por cada clique",
    cta: "Começar como Divulgador",
    color: "affiliate",
    role: "AFFILIATE",
  },
  {
    icon: Sparkles,
    title: "Cliente",
    description: "Encontre as melhores ofertas com ajuda da IA",
    cta: "Descobrir Ofertas",
    color: "client",
    role: "CLIENT",
  },
];

export function FinalCTA() {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Pronto para começar?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha como você quer participar do ecossistema clilin e comece agora mesmo
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {options.map((option) => (
            <div
              key={option.title}
              className={`bg-card rounded-2xl border border-border p-6 hover:border-${option.color}/50 hover:shadow-xl transition-all duration-300 flex flex-col`}
            >
              <div className={`w-14 h-14 rounded-xl bg-${option.color}/10 flex items-center justify-center mb-4`}>
                <option.icon className={`h-7 w-7 text-${option.color}`} />
              </div>
              
              <h3 className="text-xl font-semibold mb-2">{option.title}</h3>
              <p className="text-muted-foreground mb-6 flex-grow">{option.description}</p>
              
              <Button asChild className={`w-full bg-${option.color} hover:bg-${option.color}/90`}>
                <Link to={`/auth?role=${option.role}`}>
                  {option.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
