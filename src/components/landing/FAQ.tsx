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
    answer: `Não há mensalidade nem taxa fixa. Você só paga quando um cliente novo vai até a sua loja e usa o cupom — resultado real, não clique. A taxa é 15% do preço da oferta (mínimo R$ 3,00), cobrada só nesse momento. Se ninguém aparecer, você não paga nada. ${PRICING_DISCLAIMER.short}`,
  },
  {
    question: "Como recebo minha comissão como divulgador?",
    answer: `Você ganha quando alguém que você indicou vai até a loja e usa o cupom. A comissão começa em 50% da taxa que a loja paga por cada cliente. Exemplo: oferta de R$ 50 → taxa de R$ 7,50 → você leva R$ 3,75. Quanto mais clientes você traz, mais alto fica seu nível e maior sua comissão. Saque mínimo: R$ 100,00 via PIX. ${PRICING_DISCLAIMER.short}`,
  },
  {
    question: "Preciso ter CNPJ para cadastrar minha empresa?",
    answer: "Sim, o CNPJ é obrigatório para cadastrar ofertas. MEIs, microempresas e empresas de qualquer porte podem participar, desde que tenham CNPJ ativo.",
  },
  {
    question: "Como a empresa é cobrada?",
    answer: `Só quando dá resultado. O cliente pega o cupom e, quando vai à loja e o lojista confirma o resgate, aí sim a recompensa é debitada. Cliques e cadastros no caminho são gratuitos — servem só pra você medir o alcance da campanha. ${PRICING_DISCLAIMER.short}`,
  },
  {
    question: "O que é a Nota da Oferta?",
    answer: "É uma pontuação de 0 a 10 que avalia sua oferta. Considera: taxa de conversão (40%), qualidade da oferta (35%) e reputação da empresa (25%). Ofertas novas começam com nota 7. Quanto maior sua nota, mais destaque sua oferta ganha para divulgadores e clientes!",
  },
  {
    question: "Como funciona a divisão de valores?",
    answer: `A empresa paga 15% do preço da oferta (mínimo R$ 3,00) por cada cliente que aparece na loja. Desse valor, o divulgador leva 50% e a plataforma fica com 50%. Subindo de nível o divulgador chega a 70%. ${PRICING_DISCLAIMER.short}`,
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
            Estamos aqui para ajudar — tire suas dúvidas 💛
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
