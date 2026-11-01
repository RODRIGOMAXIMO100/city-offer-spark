import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Search } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Faq = { q: string; a: string };
type Group = { id: string; title: string; tone: string; faqs: Faq[] };

const GROUPS: Group[] = [
  {
    id: "geral",
    title: "Começando",
    tone: "text-primary",
    faqs: [
      { q: "O que é o Clilin?", a: "Uma rede de divulgadores. Empresas criam campanhas com uma palavra-chave, e gente de verdade da cidade posta sobre a marca no mesmo período, cada um no seu perfil. A empresa paga só pelas visualizações verificadas e os melhores divulgadores de cada liga ganham prêmio em dinheiro todo mês." },
      { q: "Quanto custa para usar?", a: "Para o divulgador, nada. Para a empresa, R$ 5 a cada mil visualizações verificadas, com campanhas a partir de 20 mil visualizações (R$ 100)." },
      { q: "Em quais cidades funciona?", a: "No Brasil inteiro. A empresa escolhe as cidades da campanha e só os divulgadores dessas cidades recebem a missão." },
      { q: "Preciso ter 18 anos?", a: "Sim. O Clilin é só para maiores de 18 anos." },
    ],
  },
  {
    id: "empresas",
    title: "Para empresas",
    tone: "text-company",
    faqs: [
      { q: "Como crio uma campanha?", a: "Entre no painel, vá em Campanhas e clique em criar. Você informa o nome, a palavra-chave ou hashtag, o que os divulgadores devem falar, o link do material (opcional), as redes aceitas, a meta de visualizações e as datas de começo e fim." },
      { q: "Como funciona a cobrança?", a: "O valor da meta fica reservado nos seus créditos quando a campanha é criada. O débito acontece conforme cada post é aprovado. Post reprovado não é cobrado. Se a meta não for atingida, o que sobrou volta para o seu saldo quando a campanha termina." },
      { q: "Quais são os pacotes?", a: "Largada: 20 mil visualizações por R$ 100. Cidade: 50 mil por R$ 250. Região: 100 mil por R$ 500. Brasil: 300 mil por R$ 1.500. Você também pode definir uma meta própria, a partir de 20 mil." },
      { q: "Como sei que as visualizações são reais?", a: "Cada post passa por leitura automática dos dados públicos (se existe, se está no perfil cadastrado, se tem a palavra-chave e o #publi) e por conferência da equipe, comparando com o print das visualizações. Perfil com seguidor comprado ou pico fora do padrão é reprovado." },
      { q: "Onde acompanho os resultados?", a: "No painel da empresa, em Campanhas. Cada campanha mostra o total de visualizações verificadas em relação à meta e a lista de posts com a rede, a situação da conferência, as visualizações aprovadas e o link para abrir o post." },
      { q: "Posso encerrar uma campanha antes?", a: "Pode. Em Campanhas, clique em Encerrar. Os créditos que não foram usados voltam para o seu saldo." },
      { q: "Quem cria o conteúdo do post?", a: "Cada divulgador posta do seu jeito, seguindo o que você escreveu em \"O que os divulgadores devem falar\" e o material enviado. É isso que faz parecer conversa de verdade, e não anúncio." },
    ],
  },
  {
    id: "divulgadores",
    title: "Para divulgadores",
    tone: "text-affiliate",
    faqs: [
      { q: "Como começo a divulgar?", a: "Crie sua conta como divulgador, cadastre seus perfis nas redes (o @, o número de seguidores e o link) e espere a conferência. Com o perfil aprovado, as missões das marcas da sua cidade aparecem em Missões." },
      { q: "Como envio um post?", a: "Poste no seu perfil com a palavra-chave da campanha e #publi. Depois, na missão, informe o perfil onde postou, cole o link do post e, se quiser, as visualizações e o print delas. O print ajuda a aprovar mais rápido." },
      { q: "Quanto eu ganho?", a: "Você não recebe por post. Cada visualização verificada vale 1 ponto, e os 3 primeiros de cada liga no mês ganham prêmio em dinheiro. Os valores de referência são R$ 150, R$ 80 e R$ 50, pagos por um fundo formado por 35% do que as empresas investem." },
      { q: "O que são as ligas?", a: "São divisões por tamanho de perfil: Bronze (até 1 mil seguidores), Prata (de 1 mil a 5 mil) e Ouro (acima de 5 mil). Você disputa com quem tem o seu tamanho." },
      { q: "Tem pontuação mínima?", a: "Sim. Para concorrer no mês, é preciso fazer pelo menos 2 mil pontos." },
      { q: "Por que meu post foi reprovado?", a: "Os motivos mais comuns: faltou a palavra-chave ou o #publi, o post saiu fora da janela da missão, foi feito em Stories, o perfil não é o cadastrado ou os números não batem com o print. Você vê o motivo na própria missão." },
      { q: "Posso apagar o post depois?", a: "Só depois que a missão terminar. Se o post sumir durante a conferência, ele é reprovado e os pontos são anulados." },
      { q: "Quais redes valem?", a: "Feed e Reels do Instagram, TikTok, Kwai, YouTube Shorts, Facebook e X. Stories e Status do WhatsApp não valem." },
    ],
  },
  {
    id: "pagamentos",
    title: "Prêmios e saques",
    tone: "text-highlight-foreground",
    faqs: [
      { q: "Quando recebo o prêmio?", a: "Quando o ciclo do mês é fechado, os prêmios caem no seu saldo e você recebe uma notificação." },
      { q: "Como saco meu saldo?", a: "No painel, peça o saque via Pix a partir de R$ 100. A chave Pix precisa ser do titular da conta." },
      { q: "E se o fundo do mês for pequeno?", a: "Os prêmios são ajustados na mesma proporção para todos os premiados. O que sobrar do fundo passa para o mês seguinte." },
      { q: "Tem sorteio?", a: "Não. Ganha quem fica no topo da sua liga e bate a pontuação mínima." },
    ],
  },
  {
    id: "conta",
    title: "Conta e segurança",
    tone: "text-primary",
    faqs: [
      { q: "Posso ter mais de uma conta?", a: "Não. É uma conta de divulgador por CPF. Contas duplicadas são encerradas." },
      { q: "Esqueci minha senha. E agora?", a: "Na tela de entrar, clique em \"Esqueci minha senha\" e siga o link enviado para o seu e-mail." },
      { q: "O que acontece se houver fraude?", a: "Visualização comprada, robô, perfil falso ou print editado levam à reprovação do post, anulação dos pontos e, conforme a gravidade, ao bloqueio do saldo e da conta. Os detalhes estão nos Termos de Uso." },
      { q: "Como apago meus dados?", a: "Escreva para contato@clilin.com com o assunto \"Privacidade\". Respondemos em até 15 dias." },
    ],
  },
  {
    id: "em-breve",
    title: "Em breve",
    tone: "text-client",
    faqs: [
      { q: "E as ofertas e cupons?", a: "A parte de ofertas, cupons e captação de clientes para as empresas está em breve. Na página de clientes você deixa seu contato e fica sabendo primeiro quando for lançada." },
    ],
  },
];

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export default function HelpPage() {
  const [term, setTerm] = useState("");

  const groups = useMemo(() => {
    const t = normalize(term.trim());
    if (!t) return GROUPS;
    return GROUPS.map((g) => ({ ...g, faqs: g.faqs.filter((f) => normalize(f.q + " " + f.a).includes(t)) })).filter((g) => g.faqs.length > 0);
  }, [term]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Central de Ajuda do Clilin"
        description="Respostas sobre campanhas, créditos, verificação de posts, ligas, prêmios, saques e segurança no Clilin."
        keywords={["ajuda clilin", "como funciona", "divulgador", "campanha", "prêmios", "saque pix"]}
        canonicalUrl="/ajuda"
      />
      <StructuredData type="FAQPage" faqs={GROUPS.flatMap((g) => g.faqs.map((f) => ({ question: f.q, answer: f.a })))} />
      <Navbar />

      <section className="pt-28 sm:pt-36 pb-10 bg-gradient-to-b from-muted/60 to-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-5xl font-display font-bold text-foreground mb-4">Central de Ajuda</h1>
          <p className="text-lg text-muted-foreground mb-8">Tudo sobre campanhas, missões, ranking e prêmios.</p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Busque: saque, liga, cobrança, #publi..."
              className="pl-12 h-12 rounded-full text-base"
              aria-label="Buscar na ajuda"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {GROUPS.map((g) => (
              <a key={g.id} href={`#${g.id}`} className="rounded-full bg-muted px-4 py-2 text-sm text-foreground hover:bg-muted/70 transition-colors">
                {g.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 space-y-12">
        {groups.length === 0 && (
          <p className="text-center text-muted-foreground py-10">Nada encontrado para "{term}". Tente outra palavra ou fale com a gente.</p>
        )}
        {groups.map((g) => (
          <section key={g.id} id={g.id} className="scroll-mt-28">
            <h2 className={`text-xl sm:text-2xl font-display font-bold mb-4 ${g.tone === "text-highlight-foreground" ? "text-foreground" : g.tone}`}>{g.title}</h2>
            <Accordion type="multiple" className="space-y-3">
              {g.faqs.map((f, i) => (
                <AccordionItem key={i} value={`${g.id}-${i}`} className="bg-card border border-border rounded-2xl px-5 data-[state=open]:shadow-md">
                  <AccordionTrigger className="text-left hover:no-underline py-4 font-semibold">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}

        <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 text-center">
          <Mail className="h-7 w-7 text-primary mx-auto mb-3" />
          <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2">Ainda tem dúvidas?</h2>
          <p className="text-muted-foreground mb-6">Escreva para a gente. Veja também a página de Transparência e os Termos de Uso.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <a href="mailto:contato@clilin.com">contato@clilin.com</a>
            </Button>
            <Button asChild variant="outline">
              <Link to="/transparencia">Transparência</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/termos">Termos de Uso</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
