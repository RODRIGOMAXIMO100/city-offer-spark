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
    <section className="section-padding landing-section relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4">
            Pronto para{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              começar
            </span>
            ?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha como você quer participar do ecossistema clilin
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {options.map((option) => (
            <div
              key={option.title}
              className={`glass-card rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 flex flex-col group relative overflow-hidden`}
            >
              {/* Hover Glow */}
              <div className={`absolute inset-0 bg-${option.color}/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative">
                <div className={`w-16 h-16 rounded-2xl bg-${option.color}/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <option.icon className={`h-8 w-8 text-${option.color}`} />
                </div>
                
                <h3 className="text-2xl font-display font-bold mb-2">{option.title}</h3>
                <p className="text-muted-foreground mb-8 flex-grow">{option.description}</p>
                
                <Button asChild className={`w-full h-12 bg-${option.color} hover:bg-${option.color}/90 shadow-lg shadow-${option.color}/25 hover:shadow-xl hover:shadow-${option.color}/30 transition-all`}>
                  <Link to={`/auth?role=${option.role}`}>
                    {option.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}