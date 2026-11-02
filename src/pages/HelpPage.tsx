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
      { q: "O que é o Clilin?", a: "Uma plataforma de ofertas locais. Negócios da cidade publicam promoções, divulgadores espalham e o cliente pega o cupom de graça, direto no WhatsApp. A loja confirma no WhatsApp com um toque e só paga pelo cupom usado." },
      { q: "Quanto custa para usar?", a: "Para o cliente e para o divulgador, nada. Para a empresa, não tem mensalidade: ela paga 15% do preço da oferta por cupom usado, com mínimo de R$ 3. Com saldo pré-pago, sai 10% mais barato." },
      { q: "Em quais cidades funciona?", a: "O Clilin está começando por Belo Horizonte. Em outras cidades, faça o pré-cadastro na hora de criar a conta: a gente chama quando abrir aí. Cada oferta é da cidade da loja e aparece para quem procura ofertas ali." },
      { q: "Preciso ter 18 anos?", a: "Para ter conta de empresa ou de divulgador, sim. Para pegar cupom, não precisa de conta." },
    ],
  },
  {
    id: "clientes",
    title: "Para quem pega cupom",
    tone: "text-primary",
    faqs: [
      { q: "Como pego um cupom?", a: "Em Ofertas, escolha a sua cidade e a oferta. Toque em \"Quero meu cupom\", informe nome e WhatsApp e o código de 8 letras aparece na hora. Ele também é enviado para o seu WhatsApp." },
      { q: "Como uso o cupom?", a: "Mostre o código na loja na hora de pagar ou mande o código no WhatsApp da loja quando for pedir. A loja confirma o cupom no WhatsApp com um toque e aplica o desconto." },
      { q: "O cupom tem validade?", a: "Tem. A validade aparece no cupom e é definida pela loja, nunca depois do fim da oferta. Cada cupom vale uma vez." },
      { q: "Quantos cupons posso pegar?", a: "Até 3 por dia no mesmo WhatsApp. Se você pedir de novo o cupom da mesma oferta, recebe o mesmo código enquanto ele for válido." },
    ],
  },
  {
    id: "empresas",
    title: "Para empresas",
    tone: "text-company",
    faqs: [
      { q: "Como crio uma oferta?", a: "Entre no painel, na aba Ofertas, e clique em criar. Informe o que é a promoção, o preço de antes e o com desconto, fotos, validade e, se atender por WhatsApp, o seu número." },
      { q: "Como confirmo o cupom do cliente?", a: "Pelo WhatsApp, com um toque. Cada cupom pego chega no WhatsApp do seu cadastro com o nome do cliente, o código e o botão Confirmar uso. O cliente chegou, você toca e pronto. Também dá para encaminhar o código ou mandar a foto da tela do cliente para o WhatsApp do Clilin. Se preferir, digite o código na aba Confirmar cupons do painel. O sistema avisa se o cupom já foi usado, venceu ou é de outra loja." },
      { q: "Como funciona a cobrança?", a: "Você coloca saldo no painel (por Pix) e cada cupom confirmado desconta a taxa: 15% do preço da oferta, mínimo de R$ 3, com 10% de desconto no pré-pago. Cupom pego e não usado não custa nada." },
      { q: "E se o meu saldo acabar?", a: "As suas ofertas ficam pausadas para novos cupons até você colocar saldo de novo. Os cupons que já foram entregues continuam valendo." },
      { q: "Onde acompanho os resultados?", a: "No painel da empresa: quantas pessoas viram cada oferta, quantas pegaram o cupom e quantos cupons foram usados." },
      { q: "Quem divulga a minha oferta?", a: "Divulgadores da sua cidade e a própria busca de ofertas do Clilin. O divulgador só ganha quando o cliente dele usa o cupom na sua loja." },
    ],
  },
  {
    id: "divulgadores",
    title: "Para divulgadores",
    tone: "text-affiliate",
    faqs: [
      { q: "Como começo a divulgar?", a: "Crie sua conta como divulgador. No painel aparecem as ofertas da sua cidade, cada uma com o seu link. Mande o link nos grupos, no status e nas redes." },
      { q: "Quanto eu ganho?", a: "Metade da taxa de cada cupom usado por quem veio pelo seu link, chegando a 70% conforme o seu nível. Numa oferta de R$ 39, a taxa é R$ 5,85 e você recebe cerca de R$ 2,90." },
      { q: "Quando o dinheiro entra?", a: "Quando a loja confirma o cupom do cliente que veio pelo seu link. Você recebe uma notificação e o valor aparece no seu saldo." },
      { q: "O que são os níveis?", a: "Quanto mais clientes você leva no mês, mais alto o seu nível: Bronze, Prata, Ouro, Platina e Diamante. Cada nível aumenta a sua comissão." },
      { q: "Preciso ter muitos seguidores?", a: "Não. O que conta é levar cliente de verdade até a loja." },
    ],
  },
  {
    id: "pagamentos",
    title: "Saques",
    tone: "text-highlight-foreground",
    faqs: [
      { q: "Como saco meu saldo?", a: "No painel, peça o saque via Pix a partir de R$ 100. A chave Pix precisa ser do titular da conta." },
      { q: "Quanto tempo leva?", a: "O pedido é conferido pela equipe e pago por Pix. Você acompanha a situação do pedido no painel." },
    ],
  },
  {
    id: "conta",
    title: "Conta e segurança",
    tone: "text-primary",
    faqs: [
      { q: "Posso ter mais de uma conta?", a: "Não. É uma conta de divulgador por CPF. Contas duplicadas são encerradas." },
      { q: "Esqueci minha senha. E agora?", a: "Na tela de entrar, clique em \"Esqueci minha senha\" e siga o link enviado para o seu e-mail." },
      { q: "O que acontece se houver fraude?", a: "Cupom pego com telefone falso, validação sem cliente ou combinação entre loja e divulgador levam ao cancelamento da comissão e ao bloqueio da conta." },
      { q: "Como apago meus dados?", a: "Escreva para contato@clilin.com com o assunto \"Privacidade\". Respondemos em até 15 dias." },
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
        description="Respostas sobre ofertas, cupons no WhatsApp, conferência na loja, cobrança por cupom usado, comissão de divulgador, saques e segurança no Clilin."
        keywords={["ajuda clilin", "como funciona", "cupom", "divulgador", "oferta", "saque pix"]}
        canonicalUrl="/ajuda"
      />
      <StructuredData type="FAQPage" faqs={GROUPS.flatMap((g) => g.faqs.map((f) => ({ question: f.q, answer: f.a })))} />
      <Navbar />

      <section className="pt-28 sm:pt-36 pb-10 bg-gradient-to-b from-muted/60 to-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-5xl font-display font-bold text-foreground mb-4">Central de Ajuda</h1>
          <p className="text-lg text-muted-foreground mb-8">Tudo sobre ofertas, cupons, comissões e saques.</p>
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
