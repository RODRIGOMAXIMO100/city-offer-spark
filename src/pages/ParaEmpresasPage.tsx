import { Building2, CheckCircle2, XCircle, Tag, Image as ImageIcon, MapPin, CalendarClock, MessageCircle } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import SignupForm from "@/components/auth/SignupForm";
import { HomeHowItWorks } from "@/components/home/HomeHowItWorks";
import { HomeForCompanies } from "@/components/home/HomeForCompanies";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { homeFaqs } from "@/components/home/HomeFAQ";

const offerFields = [
  { icon: Tag, title: "A promoção", text: "O que é, o preço de antes e o preço com desconto. Ex.: pizza grande + refri por R$ 39." },
  { icon: ImageIcon, title: "Fotos", text: "Até algumas fotos do produto ou do lugar. Oferta com foto boa vende mais." },
  { icon: MapPin, title: "Cidade", text: "A oferta aparece para quem procura na sua cidade." },
  { icon: CalendarClock, title: "Validade", text: "Até quando a oferta fica no ar e quanto tempo o cliente tem para usar o cupom." },
  { icon: MessageCircle, title: "Seu WhatsApp", text: "Para o cliente mandar o código e já pedir, se você atende por WhatsApp." },
];

const counts = [
  "Cupom com código válido, dentro da validade",
  "Conferido por você no painel, na hora do atendimento",
  "Usado uma vez só: depois de conferido, o código não serve mais",
];
const notCounts = [
  "Visita na página da oferta",
  "Cupom pego e não usado",
  "Código vencido, já usado ou de outra loja",
];

const companyFaqs = homeFaqs.filter((f) =>
  ["Quanto custa para a empresa?", "Como a loja confere se o cupom vale?", "Como o cliente recebe e usa o cupom?", "As ofertas valem para qualquer cidade?"].includes(f.question),
);

const ParaEmpresasPage = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Para empresas: cliente novo na loja, pague só pelo cupom usado"
      description="Crie uma oferta, divulgadores da cidade espalham e o cliente chega com o cupom no WhatsApp. Sem mensalidade: 15% do preço por cupom usado, mínimo de R$ 3."
      keywords={["cupom de desconto para loja", "atrair clientes", "divulgação local", "promoção no WhatsApp"]}
      canonicalUrl="/empresas"
    />
    <StructuredData type="FAQPage" faqs={companyFaqs} />
    <Navbar />

    <main>
      <section className="pt-32 pb-12 sm:pt-40 relative overflow-hidden">
        <div className="absolute -top-20 right-0 w-[28rem] h-[28rem] bg-company/10 rounded-full blur-3xl" aria-hidden />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 bg-company/10 text-company px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Building2 className="h-4 w-4" /> Para negócios locais
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-5">
            Cliente novo na loja, <span className="text-company">pagando só pelo cupom usado</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Você cria a oferta em poucos minutos, divulgadores da cidade espalham e o cliente chega com o cupom no WhatsApp. Você confere o código e só então paga.
          </p>
        </div>
      </section>

      <HomeHowItWorks />

      <section className="section-padding">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-10">O que você coloca na oferta</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {offerFields.map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-2xl p-5">
                <f.icon className="h-6 w-6 text-company mb-3" />
                <p className="font-display font-semibold mb-1">{f.title}</p>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HomeForCompanies />

      <section className="section-padding bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-10">O que é cobrado e o que não é</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-3xl p-6">
              <p className="font-display font-semibold text-lg mb-4 text-affiliate">É cobrado</p>
              <ul className="space-y-3">
                {counts.map((c) => (
                  <li key={c} className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-affiliate shrink-0 mt-0.5" />{c}</li>
                ))}
              </ul>
            </div>
            <div className="bg-card border border-border rounded-3xl p-6">
              <p className="font-display font-semibold text-lg mb-4 text-destructive">Não é cobrado</p>
              <ul className="space-y-3">
                {notCounts.map((c) => (
                  <li key={c} className="flex gap-3"><XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl font-display font-bold mb-6">Perguntas de quem está começando</h2>
            <Accordion type="single" collapsible className="space-y-3">
              {companyFaqs.map((f, i) => (
                <AccordionItem key={i} value={`c-${i}`} className="bg-card border border-border rounded-2xl px-5">
                  <AccordionTrigger className="text-left hover:no-underline font-semibold">{f.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">{f.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <div id="cadastro" className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl">
            <SignupForm
              role="COMPANY"
              title="Cadastre sua empresa"
              description="Crie a conta, coloque saldo e publique a primeira oferta."
              buttonText="Criar minha conta"
            />
          </div>
        </div>
      </section>
    </main>

    <Footer />
  </div>
);

export default ParaEmpresasPage;
