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
    answer: "Não há mensalidade ou taxa fixa. Você só paga quando alguém clica na sua oferta. O valor por clique varia de R$ 0,40 a R$ 1,50 (4 a 15 créditos), definido por você através de um sistema de leilão inteligente. Quanto melhor sua Nota da Oferta, menos você paga!",
  },
  {
    question: "Como recebo minha comissão como divulgador?",
    answer: "Cada clique válido no seu link gera créditos na sua conta. Você recebe 50% do CPC pago pela empresa, variando de R$ 0,20 a R$ 0,75 por clique base. Com bônus de nível (até 1.3x), pode chegar a R$ 0,97 por clique! Saque mínimo: R$ 30,00 via PIX.",
  },
  {
    question: "Preciso ter CNPJ para cadastrar minha empresa?",
    answer: "Não é obrigatório ter CNPJ. MEIs, autônomos e empresas de qualquer porte podem cadastrar ofertas. Basta ter uma conta ativa e créditos disponíveis.",
  },
  {
    question: "Como funciona o sistema de leilão?",
    answer: "Inspirado no Google Ads: você define um lance máximo (4-15 créditos) e sua Nota da Oferta (nota de 0-10) determina sua posição. Posição = Lance × Nota. O melhor: você paga apenas o necessário para superar o concorrente, não o lance máximo!",
  },
  {
    question: "O que é a Nota da Oferta?",
    answer: "É sua nota de 0 a 10 que considera: CTR Esperado (40%), Qualidade da Oferta (30%), Reputação (20%) e Relevância Local (10%). Quanto maior sua nota, menor o CPC real que você paga. Vincule seu Instagram e ofereça bons descontos para aumentar!",
  },
  {
    question: "Como funciona a divisão de valores?",
    answer: "Transparência total: do valor pago pela empresa, 50% vai para o divulgador e 50% para a plataforma. Por exemplo, se a empresa paga 8 créditos (R$ 0,80), o divulgador recebe R$ 0,40. Simples assim!",
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