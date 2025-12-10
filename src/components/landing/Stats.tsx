import { useEffect, useState } from "react";
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

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
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
  }, [value]);

  const formatted = count.toLocaleString("pt-BR");
  return (
    <span>
      {prefix}{formatted}{suffix}
    </span>
  );
}

export function Stats() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    const element = document.getElementById("stats-section");
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <section id="stats-section" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Números que falam por si
          </h2>
          <p className="text-lg text-muted-foreground">
            Nossa plataforma cresce a cada dia conectando empresas, divulgadores e clientes
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow"
            >
              <div className={`w-14 h-14 mx-auto mb-4 rounded-xl bg-${stat.color}/10 flex items-center justify-center`}>
                <stat.icon className={`h-7 w-7 text-${stat.color}`} />
              </div>
              <p className="text-3xl sm:text-4xl font-bold mb-2">
                {isVisible ? (
                  <AnimatedNumber value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                ) : (
                  <span>{stat.prefix}0{stat.suffix}</span>
                )}
              </p>
              <p className="text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
