import { Building2, CheckCircle2, XCircle, Eye, Hash, MapPin, CalendarClock, Link2 } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import SignupForm from "@/components/auth/SignupForm";
import { HomeHowItWorks } from "@/components/home/HomeHowItWorks";
import { HomeForCompanies } from "@/components/home/HomeForCompanies";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { homeFaqs } from "@/components/home/HomeFAQ";

const campaignFields = [
  { icon: Hash, title: "Palavra-chave", text: "O nome, a hashtag ou a frase que você quer ver rodando. Ex.: #PizzaDoZé." },
  { icon: Link2, title: "Redes", text: "Instagram, TikTok, Kwai, YouTube Shorts, Facebook e X. Você escolhe uma ou todas." },
  { icon: MapPin, title: "Onde", text: "Cidades específicas ou o Brasil inteiro." },
  { icon: CalendarClock, title: "Quando", text: "A janela de postagem, de algumas horas até 31 dias." },
  { icon: Eye, title: "Meta", text: "Quantas visualizações você quer, a partir de 20 mil." },
];

const counts = [
  "Post no feed ou Reels, com a palavra-chave e o #publi",
  "Perfil aberto e cadastrado pelo divulgador",
  "Visualizações conferidas pelo print e pela leitura do post",
];
const notCounts = [
  "Stories, que somem em 24 horas",
  "Post sem a palavra-chave ou sem #publi",
  "Perfil fechado ou de outra pessoa",
];

const companyFaqs = homeFaqs.filter((f) =>
  ["Quanto custa para a empresa?", "Como vocês sabem que as visualizações são reais?", "Em quais redes os posts acontecem?", "Posso escolher onde a campanha acontece?", "Por que o post precisa ter #publi?"].includes(f.question),
);

const ParaEmpresasPage = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Para Empresas: campanhas de alcance com gente de verdade"
      description="Lance uma palavra-chave e veja divulgadores reais postando ao mesmo tempo nas redes sociais. Pague só pelas visualizações verificadas, R$ 5 a cada mil. A partir de R$ 100."
      keywords={["campanha de alcance", "divulgação nas redes sociais", "marketing de influência local", "lançamento de marca"]}
      canonicalUrl="/empresas"
    />
    <StructuredData type="FAQPage" faqs={companyFaqs} />
    <Navbar />

    <main>
      <section className="pt-32 pb-12 sm:pt-40 relative overflow-hidden">
        <div className="absolute -top-20 right-0 w-[28rem] h-[28rem] bg-company/10 rounded-full blur-3xl" aria-hidden />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 bg-company/10 text-company px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Building2 className="h-4 w-4" /> Para empresas e marcas
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-5">
            O seu nome no assunto do dia, <span className="text-company">pagando só o que foi visto</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Você monta a campanha em poucos minutos, a rede de divulgadores posta junto e o Clilin confere cada visualização antes de cobrar.
          </p>
        </div>
      </section>

      <HomeHowItWorks />

      <section className="section-padding">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-10">O que você define na campanha</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {campaignFields.map((f) => (
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
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-10">O que conta e o que não conta</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-3xl p-6">
              <p className="font-display font-semibold text-lg mb-4 text-affiliate">Entra na conta</p>
              <ul className="space-y-3">
                {counts.map((c) => (
                  <li key={c} className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-affiliate shrink-0 mt-0.5" />{c}</li>
                ))}
              </ul>
            </div>
            <div className="bg-card border border-border rounded-3xl p-6">
              <p className="font-display font-semibold text-lg mb-4 text-destructive">Não entra na conta</p>
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
              description="Crie a conta, coloque crédito e lance a primeira campanha."
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
