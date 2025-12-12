import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, Users, Sparkles, ArrowRight } from "lucide-react";

const colorClasses = {
  company: {
    bg: "bg-company",
    bgHover: "hover:bg-company/90",
    shadow: "shadow-lg shadow-company/25 hover:shadow-xl hover:shadow-company/30",
    iconBg: "bg-company/10",
    iconText: "text-company",
    hoverGlow: "bg-company/5",
  },
  affiliate: {
    bg: "bg-affiliate",
    bgHover: "hover:bg-affiliate/90",
    shadow: "shadow-lg shadow-affiliate/25 hover:shadow-xl hover:shadow-affiliate/30",
    iconBg: "bg-affiliate/10",
    iconText: "text-affiliate",
    hoverGlow: "bg-affiliate/5",
  },
  client: {
    bg: "bg-client",
    bgHover: "hover:bg-client/90",
    shadow: "shadow-lg shadow-client/25 hover:shadow-xl hover:shadow-client/30",
    iconBg: "bg-client/10",
    iconText: "text-client",
    hoverGlow: "bg-client/5",
  },
} as const;

type ColorKey = keyof typeof colorClasses;

const options = [
  {
    icon: Building2,
    title: "Empresa",
    description: "Cadastre ofertas e pague apenas por interesse real",
    cta: "Começar como Empresa",
    ctaMobile: "Começar",
    color: "company" as ColorKey,
    role: "COMPANY",
  },
  {
    icon: Users,
    title: "Divulgador",
    description: "Ganhe comissão real compartilhando ofertas — pessoas reais da sua cidade divulgando para você",
    cta: "Começar como Divulgador",
    ctaMobile: "Começar",
    color: "affiliate" as ColorKey,
    role: "AFFILIATE",
  },
  {
    icon: Sparkles,
    title: "Cliente",
    description: "Encontre as melhores ofertas com ajuda da IA",
    cta: "Descobrir Ofertas",
    ctaMobile: "Descobrir",
    color: "client" as ColorKey,
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

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {options.map((option) => {
            const colors = colorClasses[option.color];
            return (
              <div
                key={option.title}
                className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:shadow-2xl transition-all duration-500 flex flex-col group relative overflow-hidden"
              >
                {/* Hover Glow */}
                <div className={`absolute inset-0 ${colors.hoverGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl ${colors.iconBg} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <option.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${colors.iconText}`} />
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-display font-bold mb-2">{option.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 flex-grow">{option.description}</p>
                  
                  <Button asChild className={`w-full h-10 sm:h-12 text-sm sm:text-base ${colors.bg} ${colors.bgHover} ${colors.shadow} transition-all`}>
                    <Link to={`/auth?role=${option.role}`}>
                      <span className="sm:hidden">{option.ctaMobile}</span>
                      <span className="hidden sm:inline">{option.cta}</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}