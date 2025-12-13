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
    answer: `Não há mensalidade ou taxa fixa. Você só paga quando recebe um lead qualificado (nome + WhatsApp). O custo por lead varia de R$ 1,00 a R$ 3,00, calculado automaticamente pela qualidade da sua oferta. Quanto melhor sua nota, menos você paga! ${PRICING_DISCLAIMER.short}`,
  },
  {
    question: "Como recebo minha comissão como divulgador?",
    answer: `Cada lead qualificado gerado pelo seu link (quando alguém preenche nome e WhatsApp) gera saldo na sua conta. Você começa ganhando 30% e pode chegar até 50% conforme sobe de nível (Bronze 30%, Prata 40%, Ouro 50%). Por exemplo, em um lead de R$ 2,00, você ganha de R$ 0,60 a R$ 1,00! Saque mínimo: R$ 100,00 via PIX. ${PRICING_DISCLAIMER.short}`,
  },
  {
    question: "Preciso ter CNPJ para cadastrar minha empresa?",
    answer: "Sim, o CNPJ é obrigatório para cadastrar ofertas. MEIs, microempresas e empresas de qualquer porte podem participar, desde que tenham CNPJ ativo.",
  },
  {
    question: "Como funciona o custo por lead (CPL)?",
    answer: `O CPL é automático! Ofertas novas começam com nota 7 e pagam R$ 2,00 por lead qualificado. Melhore a qualidade da oferta (bons descontos, descrição completa, Instagram vinculado) para aumentar sua nota e pagar menos. Nota 10 = R$ 1,00. Nota 4 = R$ 3,00. ${PRICING_DISCLAIMER.short}`,
  },
  {
    question: "O que é a Nota da Oferta?",
    answer: "É uma pontuação de 0 a 10 que avalia sua oferta. Considera: taxa de conversão (40%), qualidade da oferta (35%) e reputação da empresa (25%). Ofertas novas começam com nota 7. Quanto maior sua nota, menor o custo por lead!",
  },
  {
    question: "Como funciona a divisão de valores?",
    answer: `Você começa ganhando 30% do valor pago pela empresa e pode chegar até 50% no nível Ouro! Por exemplo, se a empresa paga R$ 2,00 por lead e você está no Bronze, ganha R$ 0,60. No Ouro, ganha R$ 1,00. Quanto mais você divulga, mais você ganha! ${PRICING_DISCLAIMER.short}`,
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
