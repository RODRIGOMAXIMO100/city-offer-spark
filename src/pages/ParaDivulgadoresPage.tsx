import { Trophy, CheckCircle2, XCircle, Wallet, Smartphone } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import SignupForm from "@/components/auth/SignupForm";
import { HomeForAffiliates } from "@/components/home/HomeForAffiliates";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { homeFaqs } from "@/components/home/HomeFAQ";

const rules = [
  "Poste no feed ou nos Reels, nunca só nos Stories",
  "Use a palavra-chave da campanha e o #publi na legenda",
  "Poste dentro da janela de tempo da missão",
  "Envie o link do post e, quando a rede não mostrar, o print das visualizações",
];
const avoid = [
  "Comprar visualização ou usar robô: a conta é bloqueada",
  "Postar em perfil fechado ou de outra pessoa",
  "Apagar o post antes da conferência",
];

const affiliateFaqs = homeFaqs.filter((f) =>
  ["Como o divulgador ganha?", "Preciso ter muitos seguidores para divulgar?", "Em quais redes os posts acontecem?", "Por que o post precisa ter #publi?"].includes(f.question),
);

const ParaDivulgadoresPage = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Para Divulgadores: poste, suba no ranking e ganhe prêmios"
      description="Divulgue marcas nas suas redes sociais, some pontos a cada visualização verificada e dispute prêmios em dinheiro todo mês, em ligas do seu tamanho. Cadastro grátis."
      keywords={["ganhar dinheiro divulgando", "divulgador", "ranking", "prêmios em dinheiro", "publi"]}
      canonicalUrl="/divulgadores"
    />
    <StructuredData type="FAQPage" faqs={affiliateFaqs} />
    <Navbar />

    <main>
      <section className="pt-32 pb-12 sm:pt-40 relative overflow-hidden">
        <div className="absolute -top-20 left-0 w-[28rem] h-[28rem] bg-affiliate/10 rounded-full blur-3xl" aria-hidden />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 bg-affiliate/10 text-affiliate px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Trophy className="h-4 w-4" /> Para divulgadores
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-5">
            Sua rede social <span className="text-affiliate">vale prêmio</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Pegue missões de marcas, poste com a palavra-chave e dispute prêmios em dinheiro todo mês com gente do seu tamanho.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-affiliate" /> Cadastro grátis</span>
            <span className="flex items-center gap-2"><Trophy className="h-4 w-4 text-affiliate" /> Sem sorteio</span>
            <span className="flex items-center gap-2"><Wallet className="h-4 w-4 text-affiliate" /> Prêmio no Pix</span>
          </div>
        </div>
      </section>

      <HomeForAffiliates />

      <section className="section-padding">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-10">As regras do jogo</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-3xl p-6">
              <p className="font-display font-semibold text-lg mb-4 text-affiliate">Para valer ponto</p>
              <ul className="space-y-3">
                {rules.map((r) => (
                  <li key={r} className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-affiliate shrink-0 mt-0.5" />{r}</li>
                ))}
              </ul>
            </div>
            <div className="bg-card border border-border rounded-3xl p-6">
              <p className="font-display font-semibold text-lg mb-4 text-destructive">Tira você do jogo</p>
              <ul className="space-y-3">
                {avoid.map((r) => (
                  <li key={r} className="flex gap-3"><XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl font-display font-bold mb-6">Dúvidas de quem quer divulgar</h2>
            <Accordion type="single" collapsible className="space-y-3">
              {affiliateFaqs.map((f, i) => (
                <AccordionItem key={i} value={`d-${i}`} className="bg-card border border-border rounded-2xl px-5">
                  <AccordionTrigger className="text-left hover:no-underline font-semibold">{f.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">{f.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <div id="cadastro" className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl">
            <SignupForm
              role="AFFILIATE"
              title="Quero ser divulgador"
              description="Crie sua conta grátis, cadastre seus perfis e pegue a primeira missão."
              buttonText="Criar minha conta"
            />
          </div>
        </div>
      </section>
    </main>

    <Footer />
  </div>
);

export default ParaDivulgadoresPage;
