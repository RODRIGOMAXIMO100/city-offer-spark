import { useEffect, useState, useRef } from "react";
import { Building2, Users, MousePointerClick, Banknote } from "lucide-react";

const stats = [
  {
    icon: Building2,
    value: 500,
    suffix: "+",
    label: "Empresas cadastradas",
    color: "company",
  },
  {
    icon: Users,
    value: 1000,
    suffix: "+",
    label: "Divulgadores ativos",
    color: "affiliate",
  },
  {
    icon: MousePointerClick,
    value: 50000,
    suffix: "+",
    label: "Cliques gerados",
    color: "primary",
  },
  {
    icon: Banknote,
    value: 10000,
    prefix: "R$",
    suffix: "+",
    label: "Em comissões pagas",
    color: "affiliate",
  },
];

function AnimatedNumber({ value, prefix = "", suffix = "", isVisible }: { value: number; prefix?: string; suffix?: string; isVisible: boolean }) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, isVisible]);

  const formatted = count.toLocaleString("pt-BR");
  return <span>{prefix}{formatted}{suffix}</span>;
}

export function Stats() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="section-padding landing-section bg-muted/30 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Resultados</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-3 mb-4">
            Números que impressionam
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Nossa plataforma cresce a cada dia conectando o ecossistema local
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="stat-card group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Glow Effect */}
              <div className={`absolute inset-0 bg-${stat.color}/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative">
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-${stat.color}/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`h-8 w-8 text-${stat.color}`} />
                </div>
                <p className="text-4xl sm:text-5xl font-display font-bold mb-2">
                  <AnimatedNumber 
                    value={stat.value} 
                    prefix={stat.prefix} 
                    suffix={stat.suffix} 
                    isVisible={isVisible}
                  />
                </p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}