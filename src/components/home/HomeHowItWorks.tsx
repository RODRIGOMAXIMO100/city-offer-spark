import { Rocket, Users, BadgeCheck } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Rocket,
    title: "Você lança a campanha",
    text: "Escolhe a palavra-chave, as redes, as cidades ou o Brasil todo e a meta de visualizações. O valor fica reservado no seu crédito.",
    tone: "company",
  },
  {
    n: "02",
    icon: Users,
    title: "Divulgadores postam juntos",
    text: "Gente real recebe a missão e publica no feed ou nos Reels com a sua palavra-chave e o #publi, todo mundo na mesma janela de tempo.",
    tone: "affiliate",
  },
  {
    n: "03",
    icon: BadgeCheck,
    title: "Você paga só o que foi visto",
    text: "O Clilin confere cada post e cobra apenas as visualizações verificadas. O que sobrar da meta volta para o seu saldo.",
    tone: "highlight",
  },
] as const;

const toneClass = {
  company: { badge: "bg-company text-company-foreground", icon: "bg-company/10 text-company" },
  affiliate: { badge: "bg-affiliate text-affiliate-foreground", icon: "bg-affiliate/10 text-affiliate" },
  highlight: { badge: "bg-highlight text-highlight-foreground", icon: "bg-highlight/15 text-foreground" },
};

export function HomeHowItWorks() {
  return (
    <section id="como-funciona" className="section-padding bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Como funciona</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-3 mb-4">Três passos, um assunto só</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Muita gente falando da sua marca no mesmo dia. É assim que um nome ganha força nas redes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((s) => (
            <div key={s.n} className="relative bg-card rounded-3xl p-6 sm:p-8 border border-border hover:shadow-xl transition-shadow">
              <span className={`absolute -top-3 -right-3 w-11 h-11 rounded-2xl font-display font-bold flex items-center justify-center shadow-lg ${toneClass[s.tone].badge}`}>
                {s.n}
              </span>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${toneClass[s.tone].icon}`}>
                <s.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
