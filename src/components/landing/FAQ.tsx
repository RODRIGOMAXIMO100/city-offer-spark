import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { PRICING_DISCLAIMER } from "@/types/database";

// Export FAQs for use in structured data
export const faqs = [
  {
    question: "Quanto custa para empresas?",
    answer: `Não há mensalidade ou taxa fixa. Você só paga quando alguém clica na sua oferta. O custo por clique varia de R$ 0,40 a R$ 1,00, calculado automaticamente pela qualidade da sua oferta. Quanto melhor sua nota, menos você paga! ${PRICING_DISCLAIMER.short}`,
  },
  {
    question: "Como recebo minha comissão como divulgador?",
    answer: `Cada clique válido no seu link gera saldo na sua conta. Você começa ganhando 30% e pode chegar até 50% conforme sobe de nível (Bronze 30%, Prata 40%, Ouro 50%). Por exemplo, em uma oferta de R$ 0,70, você ganha de R$ 0,21 a R$ 0,35 por clique! Saque mínimo: R$ 100,00 via PIX. ${PRICING_DISCLAIMER.short}`,
  },
  {
    question: "Preciso ter CNPJ para cadastrar minha empresa?",
    answer: "Sim, o CNPJ é obrigatório para cadastrar ofertas. MEIs, microempresas e empresas de qualquer porte podem participar, desde que tenham CNPJ ativo.",
  },
  {
    question: "Como funciona o custo por clique (CPC)?",
    answer: `O CPC é automático! Ofertas novas começam com nota 7 e pagam R$ 0,70 por clique. Melhore a qualidade da oferta (bons descontos, descrição completa, Instagram vinculado) para aumentar sua nota e pagar menos. Nota 10 = R$ 0,40. Nota 4 = R$ 1,00. ${PRICING_DISCLAIMER.short}`,
  },
  {
    question: "O que é a Nota da Oferta?",
    answer: "É uma pontuação de 0 a 10 que avalia sua oferta. Considera: CTR/engajamento (40%), qualidade da oferta (35%) e reputação da empresa (25%). Ofertas novas começam com nota 7. Quanto maior sua nota, menor o custo por clique!",
  },
  {
    question: "Como funciona a divisão de valores?",
    answer: `Você começa ganhando 30% do valor pago pela empresa e pode chegar até 50% no nível Ouro! Por exemplo, se a empresa paga R$ 0,70 e você está no Bronze, ganha R$ 0,21. No Ouro, ganha R$ 0,35. Quanto mais você divulga, mais você ganha! ${PRICING_DISCLAIMER.short}`,
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
