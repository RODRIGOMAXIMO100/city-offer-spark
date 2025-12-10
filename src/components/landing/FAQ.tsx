import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Quanto custa para empresas?",
    answer: "Não há mensalidade ou taxa fixa. Você só paga quando alguém clica na sua oferta. O valor por clique é definido por você ao criar a oferta, geralmente entre R$ 0,05 e R$ 0,50 dependendo do tipo de negócio.",
  },
  {
    question: "Como recebo minha comissão como divulgador?",
    answer: "Cada clique válido no seu link gera créditos na sua conta. Quando atingir o mínimo de R$ 20, você pode solicitar o saque via PIX. O valor é transferido em até 24 horas para a chave PIX cadastrada.",
  },
  {
    question: "Preciso ter CNPJ para cadastrar minha empresa?",
    answer: "Não é obrigatório ter CNPJ. MEIs, autônomos e empresas de qualquer porte podem cadastrar ofertas. Basta ter uma conta ativa e créditos disponíveis.",
  },
  {
    question: "Como funciona o rastreamento de cliques?",
    answer: "Cada divulgador recebe um link único para cada oferta. Quando alguém clica, nosso sistema registra o clique, verifica se é válido (não é bot, não é repetido) e credita a comissão automaticamente.",
  },
  {
    question: "O que acontece se eu não tiver créditos suficientes?",
    answer: "Empresas precisam ter créditos para manter ofertas ativas. Se o saldo zerar, as ofertas são pausadas automaticamente. Você pode adicionar créditos a qualquer momento via PIX.",
  },
  {
    question: "Como cliente, preciso pagar algo?",
    answer: "Não! O acesso às ofertas é 100% gratuito para clientes. Você só precisa criar uma conta para usar a IA personalizada e salvar suas preferências.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="section-padding landing-section">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">FAQ</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-3 mb-4">
            Perguntas frequentes
          </h2>
          <p className="text-lg text-muted-foreground">
            Tire suas dúvidas sobre a plataforma
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-card border border-border rounded-2xl px-6 data-[state=open]:shadow-lg transition-shadow"
            >
              <AccordionTrigger className="text-left hover:no-underline py-5 gap-4">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-semibold">{faq.question}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 pl-8">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}