import { Store, MapPin, MessageCircle, ShieldCheck, Users, HandCoins } from "lucide-react";

const reasons = [
  {
    icon: Store,
    title: "Paga por cliente na loja",
    text: "Visita, clique e cupom pego não custam nada. A loja só paga quando o cupom é usado de verdade.",
  },
  {
    icon: MapPin,
    title: "Local de verdade",
    text: "As ofertas são separadas por cidade. Quem vê a sua promoção é quem pode ir até você.",
  },
  {
    icon: MessageCircle,
    title: "Cupom no WhatsApp",
    text: "O cliente não baixa app nem cria conta. O código chega no WhatsApp que ele já usa todo dia.",
  },
  {
    icon: ShieldCheck,
    title: "Confirmado com um toque",
    text: "Cada código é único, tem validade e vale uma vez. A loja confirma no WhatsApp quando o cliente chega, sem digitar nada.",
  },
  {
    icon: Users,
    title: "Gente da cidade divulgando",
    text: "Divulgadores locais levam a oferta para os grupos e perfis de quem mora perto. Indicação de conhecido pesa mais.",
  },
  {
    icon: HandCoins,
    title: "Regra clara",
    text: "15% do preço da oferta por cupom usado, mínimo de R$ 3. Metade disso vai para o divulgador que trouxe o cliente.",
  },
];

export function HomeWhyItWorks() {
  return (
    <section id="por-que-funciona" className="section-padding">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Por que funciona</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-3 mb-4">Resultado que entra pela porta</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Nada de pagar por curtida ou clique. O Clilin cobra pelo que importa para o negócio: cliente no balcão.
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
