import { Link } from "react-router-dom";
import { ArrowRight, Ban, CheckCircle2, FileBarChart, KeyRound, Clock, Store, ShieldCheck } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";

const verification = [
  { icon: KeyRound, title: "Código único", text: "Cada cupom tem um código de 8 letras que só existe uma vez. Ele fica ligado à oferta, à loja e ao WhatsApp de quem pegou." },
  { icon: Clock, title: "Validade", text: "O cupom tem prazo para ser usado, definido pela loja e nunca depois do fim da oferta. Cupom vencido não passa." },
  { icon: Store, title: "Confirmação pela loja", text: "Na hora de usar, o cliente toca em Estou na loja ou Pedir online. A loja recebe o aviso na hora, no WhatsApp e no painel, e confirma com um toque (ou digita o código). Só vale cupom da própria loja, e cada código vale uma vez: depois de confirmado, fica marcado como usado." },
  { icon: ShieldCheck, title: "Proteção contra abuso", text: "Até 3 cupons por dia no mesmo WhatsApp e limite por aparelho. Telefone falso, validação sem cliente ou combinação entre loja e divulgador bloqueiam a conta." },
];

const never = [
  "Cobrar do cliente para pegar ou usar cupom.",
  "Cobrar do divulgador para entrar ou participar.",
  "Cobrar da loja por visita, clique ou cupom que não foi usado.",
  "Vender ou alugar dados de quem usa o Clilin.",
];

export default function TransparencyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Transparência: para onde vai cada real no Clilin"
        description="Quanto a loja paga por cupom usado, quanto fica com o divulgador e como cada cupom é conferido no Clilin."
        keywords={["clilin transparência", "como funciona", "taxa por cupom", "comissão de divulgador", "cupom no WhatsApp"]}
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
            Quanto a loja paga, quanto fica com quem divulgou e como cada cupom é conferido.
          </p>
        </div>
      </section>

      {/* Divisão do dinheiro */}
      <section className="py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-3">Para onde vai o dinheiro</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-3xl">
            A loja paga só quando o cupom é usado: <strong className="text-foreground">15% do preço da oferta, com mínimo de R$ 3</strong>.
            Quando o cliente veio pelo link de um divulgador, a taxa é dividida assim:
          </p>

          <div className="rounded-3xl border border-border bg-card p-5 sm:p-8">
            <div className="flex h-14 sm:h-16 rounded-2xl overflow-hidden text-sm sm:text-base font-semibold">
              <div className="bg-affiliate text-affiliate-foreground flex items-center justify-center" style={{ width: "50%" }}>
                50% a 70%
              </div>
              <div className="bg-company text-company-foreground flex items-center justify-center flex-1">o resto</div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5 mt-6">
              <div>
                <p className="font-display font-bold text-foreground text-lg">Metade vai para o divulgador</p>
                <p className="text-muted-foreground">Chega a 70% conforme o nível dele no mês. Cai no saldo quando a loja confirma o cupom.</p>
              </div>
              <div>
                <p className="font-display font-bold text-foreground text-lg">O resto mantém o Clilin</p>
                <p className="text-muted-foreground">Sistema, envio dos cupons no WhatsApp, servidores, suporte e impostos. Sem divulgador, a taxa fica toda com o Clilin.</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-muted/50 p-5 sm:p-6">
            <p className="font-semibold text-foreground mb-1">Exemplo: pizza de R$ 39</p>
            <p className="text-muted-foreground">
              A taxa do cupom usado é R$ 5,85. O divulgador que trouxe o cliente recebe cerca de R$ 2,90 e o Clilin fica com o resto.
              Se a loja paga com saldo pré-pago, ela tem 10% de desconto e o cupom sai por R$ 5,27. O desconto sai da parte do Clilin, não do divulgador.
            </p>
          </div>
        </div>
      </section>

      {/* Verificação */}
      <section className="py-14 sm:py-20 bg-muted/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-3">Como cada cupom é conferido</h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-3xl">A cobrança só acontece quando o cupom passa por tudo isso.</p>
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
        </div>
      </section>

      {/* Comissão */}
      <section className="py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-6">Como o divulgador ganha</h2>
          <ul className="space-y-4 text-muted-foreground text-lg">
            {[
              "Cada divulgador tem um link para cada oferta da cidade.",
              "Quem pega o cupom por esse link fica marcado no nome do divulgador.",
              "Quando a loja confirma o cupom, o divulgador recebe metade da taxa, ou até 70% conforme o nível.",
              "Os níveis sobem com a quantidade de clientes no mês: Bronze, Prata, Ouro, Platina e Diamante.",
              "O saldo pode ser sacado por Pix a partir de R$ 100.",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <CheckCircle2 className="h-6 w-6 text-affiliate shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Relatório e o que nunca fazemos */}
      <section className="py-14 sm:py-20 bg-muted/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <FileBarChart className="h-7 w-7 text-company mb-3" />
            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-3">O que a loja vê</h2>
            <p className="text-muted-foreground">
              Um painel com cada oferta: quantas pessoas viram, quantas pegaram o cupom e quantos cupons foram usados. Cada cupom confirmado aparece com
              o nome do cliente, o horário e quanto foi cobrado.
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
