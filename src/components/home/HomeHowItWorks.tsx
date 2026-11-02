import { Store, Megaphone, MessageCircle, BadgeCheck } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Store,
    title: "A loja cria a oferta",
    text: "Monta a promoção no painel, com preço, validade e fotos. Ela aparece para quem é da mesma cidade.",
    tone: "company",
  },
  {
    n: "02",
    icon: Megaphone,
    title: "A cidade fica sabendo",
    text: "Divulgadores da cidade espalham o link nas redes e nos grupos, e quem procura acha a oferta na busca do Clilin.",
    tone: "affiliate",
  },
  {
    n: "03",
    icon: MessageCircle,
    title: "O cliente pega o cupom",
    text: "Informa nome e WhatsApp e recebe o código na hora, no próprio WhatsApp. Sem app e sem cadastro.",
    tone: "highlight",
  },
  {
    n: "04",
    icon: BadgeCheck,
    title: "O cliente avisa, a loja confirma e só então paga",
    text: "Na hora de usar, o cliente toca em Estou na loja ou Pedir online. A loja recebe o aviso na hora e confirma com um toque, no WhatsApp ou no painel.",
    tone: "company",
  },
];

const toneClass: Record<string, { badge: string; icon: string }> = {
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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-3 mb-4">Da oferta ao balcão em quatro passos</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Cada cupom tem um código único, vale uma vez e só vira cobrança quando o cliente está na loja.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="relative bg-card rounded-3xl p-6 sm:p-7 border border-border hover:shadow-xl transition-shadow">
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
