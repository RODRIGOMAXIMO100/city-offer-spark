import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, UserPlus, Link2, Store, Wallet, Medal } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "Cadastre-se grátis", text: "Não precisa ter muitos seguidores. Precisa conhecer gente da sua cidade." },
  { icon: Link2, title: "Escolha as ofertas", text: "Pegue o seu link das ofertas da cidade e mande nos grupos, no status e nas redes." },
  { icon: Store, title: "O cliente usa o cupom", text: "Quem pega o cupom pelo seu link fica marcado no seu nome até usar na loja." },
  { icon: Wallet, title: "Você recebe", text: "A comissão cai no seu saldo quando a loja confere o cupom. Saque por Pix a partir de R$ 100." },
];

// affiliate_levels: comissão de 50% da taxa, com bônus por nível até 70%
export const LEVEL_INFO = [
  { name: "Bronze", share: "50%" },
  { name: "Ouro", share: "60%" },
  { name: "Diamante", share: "70%" },
];

export function HomeForAffiliates() {
  return (
    <section id="divulgadores" className="section-padding relative bg-muted/30">
      <div className="absolute top-0 right-0 w-96 h-96 bg-affiliate/10 rounded-full blur-3xl" aria-hidden />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 grid sm:grid-cols-2 gap-4">
            {steps.map((s) => (
              <div key={s.title} className="bg-card rounded-3xl p-6 border border-border">
                <span className="w-12 h-12 rounded-2xl bg-affiliate/10 text-affiliate flex items-center justify-center mb-4">
                  <s.icon className="h-6 w-6" />
                </span>
                <h3 className="font-display font-semibold text-lg mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>

          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 bg-affiliate/10 text-affiliate px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Trophy className="h-4 w-4" />
              Para divulgadores
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-5">
              Indique ofertas da cidade e <span className="text-affiliate">ganhe por cliente</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Você fica com metade da taxa de cada cupom usado por quem veio pelo seu link. Exemplo: numa pizza de R$ 39,
              a taxa é R$ 5,85 e você leva cerca de R$ 2,90 por cliente. Quanto mais clientes no mês, maior o seu nível.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {LEVEL_INFO.map((l) => (
                <div key={l.name} className="rounded-2xl bg-card border border-border p-4 text-center">
                  <Medal className="h-6 w-6 mx-auto mb-1 text-highlight" />
                  <p className="font-display font-semibold">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{l.share} da taxa</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground mb-8">
              Sem mensalidade e sem custo para entrar. Comissão só de cliente real: cupom usado e conferido pela loja.
            </p>

            <Button size="lg" asChild className="h-12 sm:h-14 px-6 sm:px-8 bg-affiliate text-affiliate-foreground hover:bg-affiliate/90 shadow-xl shadow-affiliate/25">
              <Link to="/auth?role=AFFILIATE">
                Quero ser divulgador
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
