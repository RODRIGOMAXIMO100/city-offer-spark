import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

// Exportado também para os dados estruturados (FAQPage) do Google
export const homeFaqs = [
  {
    question: "Quanto custa para a empresa?",
    answer:
      "R$ 5 a cada mil visualizações verificadas. A meta mínima é de 20 mil visualizações (R$ 100). O valor da meta fica reservado no seu crédito, é cobrado conforme os posts são aprovados e o que sobrar volta para o seu saldo quando a campanha termina.",
  },
  {
    question: "Como vocês sabem que as visualizações são reais?",
    answer:
      "Cada post é lido pelo sistema (se existe, quem postou, se tem a palavra-chave e o #publi) e conferido pela equipe, junto com o print das visualizações enviado pelo divulgador. Só entra na conta o que foi aprovado. Os perfis precisam estar abertos e são conferidos antes.",
  },
  {
    question: "Em quais redes os posts acontecem?",
    answer:
      "Instagram (feed e Reels), TikTok, Kwai, YouTube Shorts, Facebook e X. Stories não entram, porque somem em 24 horas e não dá para conferir depois.",
  },
  {
    question: "Como o divulgador ganha?",
    answer:
      "Com prêmios em dinheiro todo mês. Cada visualização verificada vale 1 ponto, e 35% de tudo que as empresas investem vai para o fundo de prêmios. Os melhores de cada liga recebem no saldo e sacam via Pix a partir de R$ 100.",
  },
  {
    question: "Preciso ter muitos seguidores para divulgar?",
    answer:
      "Não. O ranking é dividido em ligas: Bronze (até 1 mil seguidores), Prata (de 1 mil a 5 mil) e Ouro (acima de 5 mil). Você disputa com quem tem o seu tamanho. Para concorrer no mês, faça pelo menos 2 mil pontos.",
  },
  {
    question: "Por que o post precisa ter #publi?",
    answer:
      "Porque é conteúdo de divulgação, e quem vê tem o direito de saber. Isso protege o divulgador, a empresa e as próprias redes sociais.",
  },
  {
    question: "Posso escolher onde a campanha acontece?",
    answer:
      "Sim. Você escolhe as cidades ou deixa aberta para o Brasil inteiro. Só divulgadores dessas cidades recebem a missão.",
  },
];

export function HomeFAQ() {
  return (
    <section id="faq" className="section-padding bg-muted/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Dúvidas</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-3">Perguntas frequentes</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {homeFaqs.map((f, i) => (
            <AccordionItem key={i} value={`q-${i}`} className="bg-card border border-border rounded-2xl px-6 data-[state=open]:shadow-lg">
              <AccordionTrigger className="text-left hover:no-underline py-5 gap-4">
                <span className="flex items-center gap-3 font-semibold">
                  <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                  {f.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 pl-8 leading-relaxed">{f.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
