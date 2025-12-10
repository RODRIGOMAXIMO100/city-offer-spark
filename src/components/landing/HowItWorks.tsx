import { Building2, Share2, Sparkles, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Building2,
    title: "Empresa cadastra oferta",
    description: "Crie ofertas com descontos reais e defina quanto quer pagar por clique verificado.",
    color: "company",
  },
  {
    icon: Share2,
    title: "Divulgadores compartilham",
    description: "Influenciadores locais compartilham as ofertas em suas redes e ganham comissão por clique.",
    color: "affiliate",
  },
  {
    icon: Sparkles,
    title: "Clientes encontram via IA",
    description: "Nossa IA conecta clientes às ofertas mais relevantes baseado em suas preferências e localização.",
    color: "client",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Como funciona?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Um ecossistema simples e eficiente que beneficia todos os participantes
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection Lines (desktop only) */}
          <div className="hidden md:block absolute top-16 left-1/3 w-1/3 h-0.5 bg-gradient-to-r from-company via-affiliate to-client" />
          
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              <div className="flex flex-col items-center text-center">
                {/* Step Number */}
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                
                {/* Icon */}
                <div className={`w-20 h-20 rounded-2xl bg-${step.color}/10 border border-${step.color}/20 flex items-center justify-center mb-6`}>
                  <step.icon className={`h-10 w-10 text-${step.color}`} />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
              
              {/* Arrow (mobile only) */}
              {index < steps.length - 1 && (
                <div className="md:hidden flex justify-center my-6">
                  <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
