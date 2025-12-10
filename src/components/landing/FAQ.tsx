import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  {
    question: "Posso ser divulgador e empresa ao mesmo tempo?",
    answer: "Cada conta tem um tipo específico (Empresa, Divulgador ou Cliente). Se você precisa de ambos, recomendamos criar contas separadas com e-mails diferentes.",
  },
  {
    question: "As ofertas têm prazo de validade?",
    answer: "Sim, toda oferta tem uma data de expiração definida pela empresa. Após essa data, a oferta é automaticamente desativada e não aparece mais para os clientes.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 bg-muted/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-muted-foreground">
            Tire suas dúvidas sobre como funciona a plataforma
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-card border border-border rounded-lg px-6"
            >
              <AccordionTrigger className="text-left hover:no-underline py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
