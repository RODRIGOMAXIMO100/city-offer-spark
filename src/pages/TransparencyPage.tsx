import { Link } from "react-router-dom";
import { ArrowRight, Ban, Camera, CheckCircle2, Eye, FileBarChart, ScanSearch, UserCheck } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";

const verification = [
  { icon: UserCheck, title: "Perfil conferido", text: "Antes de receber missões, o perfil do divulgador é conferido: precisa ser dele, estar aberto e ter seguidores reais. É isso que define a liga." },
  { icon: ScanSearch, title: "Leitura automática", text: "Quando o link do post chega, o sistema lê os dados públicos: se o post existe, se está no perfil cadastrado, se saiu na janela da missão e se tem a palavra-chave e o #publi." },
  { icon: Camera, title: "Print das visualizações", text: "O divulgador envia o print com o número de visualizações. A equipe compara com o que o sistema leu." },
  { icon: Eye, title: "Conferência da equipe", text: "Uma pessoa revisa e aprova ou reprova. Pico fora do padrão, seguidor comprado ou robô reprovam o post." },
];

const never = [
  "Cobrar do divulgador para entrar ou participar.",
  "Fazer sorteio. Prêmio é por mérito, dentro da liga.",
  "Cobrar da empresa um post que foi reprovado.",
  "Vender ou alugar dados de quem usa o Clilin.",
];

const prizes = [
  { pos: "1º lugar", value: "R$ 150" },
  { pos: "2º lugar", value: "R$ 80" },
  { pos: "3º lugar", value: "R$ 50" },
];

export default function TransparencyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Transparência: para onde vai cada real no Clilin"
        description="Veja como o Clilin divide o dinheiro das campanhas, como cada post é verificado e como os prêmios dos divulgadores são calculados."
        keywords={["clilin transparência", "como funciona", "prêmios divulgadores", "verificação de posts", "custo por mil visualizações"]}
        canonicalUrl="/transparencia"
      />
      <Navbar />

      <section className="pt-28 sm:pt-36 pb-14 bg-gradient-to-b from-muted/60 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Transparência</span>
          <h1 className="text-3xl sm:text-5xl font-display font-bold text-foreground mt-3 mb-5 leading-tight">
            Cada real, <span className="text-brand-gradient">explicado</span>.
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Quanto a empresa paga, para onde vai o dinheiro, como cada post é conferido e como os prêmios são calculados.
          </p>
        </div>
      </section>

      {/* Divisão do dinheiro */}
      <section className="py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-3">Para onde vai o dinheiro</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-3xl">
            A empresa paga <strong className="text-foreground">R$ 5 a cada mil visualizações verificadas</strong>. De cada R$ 5:
          </p>

          <div className="rounded-3xl border border-border bg-card p-5 sm:p-8">
            <div className="flex h-14 sm:h-16 rounded-2xl overflow-hidden text-sm sm:text-base font-semibold">
              <div className="bg-affiliate text-affiliate-foreground flex items-center justify-center" style={{ width: "35%" }}>
                35%
              </div>
              <div className="bg-company text-company-foreground flex items-center justify-center flex-1">65%</div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5 mt-6">
              <div>
                <p className="font-display font-bold text-foreground text-lg">R$ 1,75 vão para o fundo de prêmios</p>
                <p className="text-muted-foreground">É dos divulgadores. Todo mês, o fundo é dividido entre os melhores de cada liga.</p>
              </div>
              <div>
                <p className="font-display font-bold text-foreground text-lg">R$ 3,25 mantêm o Clilin</p>
                <p className="text-muted-foreground">Verificação dos posts, equipe, sistema, servidores, suporte e impostos.</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-muted/50 p-5 sm:p-6">
            <p className="font-semibold text-foreground mb-1">Exemplo: campanha de 20 mil visualizações</p>
            <p className="text-muted-foreground">
              A empresa reserva R$ 100. Se todos os posts forem aprovados, R$ 35 entram no fundo de prêmios do mês e R$ 65 ficam com o Clilin. Se a campanha
              fechar com 15 mil visualizações verificadas, a empresa paga R$ 75 e os R$ 25 que sobraram voltam para o saldo dela.
            </p>
          </div>
        </div>
      </section>

      {/* Verificação */}
      <section className="py-14 sm:py-20 bg-muted/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-3">Como cada post é conferido</h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-3xl">Só entra na conta da empresa e no ranking o que passou por estas etapas.</p>
          <div className="grid sm:grid-cols-2 gap-5">
            {verification.map((v, i) => (
              <div key={v.title} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <v.icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">Etapa {i + 1}</span>
                </div>
                <h3 className="font-display font-bold text-foreground mb-1">{v.title}</h3>
                <p className="text-muted-foreground">{v.text}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            Valem posts no feed e Reels do Instagram, TikTok, Kwai, YouTube Shorts, Facebook e X. Stories e Status não valem, porque somem e não dá para
            conferir depois.
          </p>
        </div>
      </section>

      {/* Prêmios */}
      <section className="py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-3">Como os prêmios são calculados</h2>
          <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
            <ul className="space-y-4 text-muted-foreground text-lg">
              {[
                "Cada visualização verificada vale 1 ponto.",
                "O ranking é mensal e dividido em três ligas: Bronze (até 1 mil seguidores), Prata (de 1 mil a 5 mil) e Ouro (acima de 5 mil).",
                "Para concorrer no mês, o divulgador precisa fazer pelo menos 2 mil pontos.",
                "Os 3 primeiros de cada liga são premiados. Se o fundo do mês não cobrir os valores de referência, todos são ajustados na mesma proporção.",
                "O que sobrar do fundo passa para o mês seguinte. Nada some.",
                "O prêmio cai no saldo e pode ser sacado via Pix a partir de R$ 100.",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-affiliate shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-3xl border border-highlight/40 bg-highlight/10 p-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Valores de referência por liga</p>
              <div className="space-y-3">
                {prizes.map((p) => (
                  <div key={p.pos} className="flex items-center justify-between rounded-xl bg-card px-4 py-3">
                    <span className="text-muted-foreground">{p.pos}</span>
                    <span className="font-display font-bold text-foreground text-lg">{p.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">Valem para Bronze, Prata e Ouro. Os prêmios crescem conforme a rede cresce.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Relatório e o que nunca fazemos */}
      <section className="py-14 sm:py-20 bg-muted/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <FileBarChart className="h-7 w-7 text-company mb-3" />
            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-3">O que a empresa recebe</h2>
            <p className="text-muted-foreground">
              Um painel com cada post da campanha: a rede, o link para abrir, a situação da conferência e as visualizações aprovadas. E o total verificado
              crescendo em direção à meta conforme os posts são aprovados.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <Ban className="h-7 w-7 text-affiliate mb-3" />
            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-3">O que o Clilin nunca faz</h2>
            <ul className="space-y-2 text-muted-foreground">
              {never.map((n) => (
                <li key={n} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-affiliate shrink-0" />
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-4">Ficou alguma dúvida?</h2>
          <p className="text-lg text-muted-foreground mb-8">A Central de Ajuda responde as perguntas mais comuns. As regras completas estão nos Termos de Uso.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/ajuda">
                Central de Ajuda <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/termos">Termos de Uso</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
