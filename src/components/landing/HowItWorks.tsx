import { Building2, Share2, Sparkles } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Building2,
    title: "Empresa cadastra oferta",
    description: "Crie ofertas com descontos reais. O custo por clique é calculado automaticamente pela qualidade da oferta.",
    color: "company",
  },
  {
    step: "02",
    icon: Share2,
    title: "Divulgadores compartilham",
    description: "Influenciadores locais compartilham ofertas em suas redes e ganham comissão por clique.",
    color: "affiliate",
  },
  {
    step: "03",
    icon: Sparkles,
    title: "Clientes encontram via IA",
    description: "Nossa IA conecta clientes às ofertas mais relevantes baseado em preferências e localização.",
    color: "client",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="section-padding landing-section bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Como funciona</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-3 mb-4">
            Simples para todos
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Um ecossistema que beneficia empresas, divulgadores e clientes
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 relative">
          {/* Connection Line (desktop only) */}
          <div className="hidden lg:block absolute top-24 left-[20%] right-[20%] h-0.5">
            <div className="h-full bg-gradient-to-r from-company via-affiliate to-client rounded-full" />
          </div>
          
          {steps.map((item, index) => (
            <div key={item.title} className="relative group">
              <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border hover:border-primary/30 hover:shadow-2xl transition-all duration-500 h-full">
                {/* Step Number */}
                <div className={`absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-${item.color} text-white font-display font-bold text-base sm:text-lg flex items-center justify-center shadow-lg`}>
                  {item.step}
                </div>
                
                {/* Icon */}
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-${item.color}/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className={`h-7 w-7 sm:h-8 sm:w-8 text-${item.color}`} />
                </div>
                
                {/* Content */}
                <h3 className="text-lg sm:text-xl font-display font-semibold mb-2 sm:mb-3">{item.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}