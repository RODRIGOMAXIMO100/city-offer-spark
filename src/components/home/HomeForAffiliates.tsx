import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, UserPlus, Target, Star, Medal } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "Cadastre seus perfis", text: "Instagram, TikTok, Kwai, YouTube, Facebook ou X. O perfil precisa estar aberto." },
  { icon: Target, title: "Pegue as missões", text: "Ondas de marcas da sua cidade ou do Brasil. Poste um vídeo seu falando da marca, com o nome na legenda e o #publi." },
  { icon: Star, title: "Some pontos", text: "Cada visualização verificada vale 1 ponto. Quem posta nas primeiras 12 horas da onda ganha 20% a mais." },
  { icon: Trophy, title: "Ganhe prêmios", text: "Os melhores de cada liga ganham prêmio em dinheiro todo mês, direto no Pix." },
];

export const LEAGUE_INFO = [
  { name: "Bronze", range: "até 1 mil seguidores" },
  { name: "Prata", range: "de 1 mil a 5 mil seguidores" },
  { name: "Ouro", range: "acima de 5 mil seguidores" },
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
              Poste, suba no ranking e <span className="text-affiliate">ganhe todo mês</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Aqui não tem sorteio: quem posta mais e alcança mais, ganha. E você disputa com quem tem o seu tamanho,
              porque o ranking é dividido em ligas.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {LEAGUE_INFO.map((l) => (
                <div key={l.name} className="rounded-2xl bg-card border border-border p-4 text-center">
                  <Medal className="h-6 w-6 mx-auto mb-1 text-highlight" />
                  <p className="font-display font-semibold">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{l.range}</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground mb-8">
              35% de tudo que as empresas investem vai para o fundo de prêmios do mês. Para concorrer, faça pelo menos 2 mil pontos no mês.
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
