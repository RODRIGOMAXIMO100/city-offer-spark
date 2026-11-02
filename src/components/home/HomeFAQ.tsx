import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

// Exportado também para os dados estruturados (FAQPage) do Google
export const homeFaqs = [
  {
    question: "Quanto custa para a empresa?",
    answer:
      "Não tem mensalidade. Você paga só pelo cupom usado na loja: 15% do preço da oferta, com mínimo de R$ 3. Numa pizza de R$ 39, cada cliente custa R$ 5,85. Com saldo pré-pago, sai 10% mais barato. Cupom pego e não usado não custa nada.",
  },
  {
    question: "Como o cliente recebe e usa o cupom?",
    answer:
      "Na página da oferta, ele informa nome e WhatsApp e recebe um código de 8 letras na hora, também no WhatsApp. Depois é só mostrar o código no balcão ou mandar para o WhatsApp da loja na hora de pedir.",
  },
  {
    question: "Como a loja confirma o cupom?",
    answer:
      "Com um toque. Na hora de usar, o cliente toca em Estou na loja ou Pedir online, no WhatsApp ou na página do cupom. A loja recebe o aviso na hora, no WhatsApp e no painel, com o nome do cliente, o código e o botão Confirmar uso. O sistema avisa se o cupom já foi usado, venceu ou é de outra loja. Quem preferir também pode digitar o código no painel.",
  },
  {
    question: "As ofertas valem para qualquer cidade?",
    answer:
      "Cada oferta é da cidade da loja e aparece para quem procura ofertas ali. O Clilin está começando por Belo Horizonte. Em outras cidades, faça o pré-cadastro: a gente chama quando abrir aí.",
  },
  {
    question: "Como o divulgador ganha?",
    answer:
      "Ele divulga o link das ofertas da cidade. Quem pega o cupom por esse link fica marcado no nome dele, e quando o cupom é usado na loja ele recebe metade da taxa, chegando a 70% conforme o nível. O saque é por Pix a partir de R$ 100.",
  },
  {
    question: "O cliente paga alguma coisa?",
    answer: "Não. Pegar e usar o cupom é grátis e não precisa baixar app nem criar conta.",
  },
  {
    question: "Preciso ter muitos seguidores para divulgar?",
    answer:
      "Não. O que conta é conhecer gente da sua cidade: grupos de WhatsApp, status, vizinhança, trabalho. Quem leva cliente de verdade até a loja ganha.",
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
