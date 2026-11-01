import { Zap, UserCheck, Search, ShieldCheck, Wallet, HandCoins } from "lucide-react";

const reasons = [
  {
    icon: Zap,
    title: "Todo mundo no mesmo dia",
    text: "Quando muita gente fala da mesma coisa ao mesmo tempo, a pessoa vê o seu nome de novo e de novo, e ele fica na cabeça.",
  },
  {
    icon: UserCheck,
    title: "Gente de verdade",
    text: "Perfis reais, abertos e conferidos. Recomendação de pessoa pesa mais que anúncio.",
  },
  {
    icon: Search,
    title: "Seu nome na busca",
    text: "O nome da sua marca aparece falado e escrito em dezenas de vídeos. Quem viu e ficou curioso procura e acha você.",
  },
  {
    icon: ShieldCheck,
    title: "Cada post conferido",
    text: "O Clilin lê cada link antes de cobrar. Post sem o nome da marca na legenda ou sem #publi não conta.",
  },
  {
    icon: Wallet,
    title: "Preço justo e claro",
    text: "R$ 5 por mil visualizações verificadas. Sem mensalidade e sem taxa escondida.",
  },
  {
    icon: HandCoins,
    title: "Quem divulga é premiado",
    text: "35% de cada real investido vira prêmio para os divulgadores. Todo mundo sabe para onde vai o dinheiro.",
  },
];

export function HomeWhyItWorks() {
  return (
    <section id="por-que-funciona" className="section-padding">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Por que funciona</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-3 mb-4">Alcance que vem de pessoas</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A força de muita gente real falando ao mesmo tempo, com regra clara, dentro das regras das redes e a serviço do seu negócio.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reasons.map((r) => (
            <div key={r.title} className="group bg-card rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all">
              <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                <r.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-display font-semibold mb-2">{r.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
