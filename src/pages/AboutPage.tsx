import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Hash, Megaphone, Scale, ShieldCheck, Sparkles, Trophy, Users } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { LogoGraphic } from "@/components/brand/BrandLogo";

const principles = [
  { icon: BadgeCheck, title: "Gente de verdade", text: "Perfis abertos, conferidos antes de entrar, e cada post verificado. Visualização comprada não conta." },
  { icon: Hash, title: "Transparência", text: "Todo post leva #publi. Quem vê sabe que é divulgação, e isso protege o divulgador, a marca e as redes." },
  { icon: Scale, title: "Jogo justo", text: "Ligas por tamanho de perfil e prêmio por mérito, sem sorteio. Quem tem 800 seguidores disputa com quem tem 800." },
  { icon: ShieldCheck, title: "Só paga o que aconteceu", text: "A empresa paga pelo alcance verificado. Post reprovado não é cobrado e o que sobra volta para o saldo." },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Sobre o Clilin: a rede de divulgadores que coloca sua marca na boca da cidade"
        description="O Clilin junta empresas e gente de verdade para falar da mesma marca na mesma hora. A empresa paga só pelo alcance verificado e os melhores divulgadores ganham prêmios todo mês."
        keywords={["clilin", "rede de divulgadores", "boca a boca", "marketing local", "campanha de alcance", "sobre"]}
        canonicalUrl="/sobre"
      />
      <Navbar />

      {/* Abertura */}
      <section className="pt-28 sm:pt-36 pb-16 bg-gradient-to-b from-muted/60 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <LogoGraphic logo="e" variant="mark" className="h-16 sm:h-20 mx-auto mb-6" />
          <h1 className="text-3xl sm:text-5xl font-display font-bold text-foreground mb-5 leading-tight">
            O boca a boca, <span className="text-brand-gradient">organizado</span>.
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            O Clilin junta empresas e gente comum da cidade para falar da mesma marca, no mesmo dia, nas redes de cada um. É assim que um nome vira assunto.
          </p>
        </div>
      </section>

      {/* O que é */}
      <section className="py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mb-10">
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-4">O que é o Clilin</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Um anúncio fala com quem não pediu. Uma pessoa conhecida falando de uma marca é diferente: as pessoas confiam, comentam e lembram. O Clilin
              transforma isso em campanha. A empresa escolhe a palavra-chave e as cidades, dezenas de divulgadores postam no mesmo período, e cada
              visualização é conferida antes de ser cobrada.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-3xl border border-company/20 bg-company/5 p-6 sm:p-8">
              <span className="h-12 w-12 rounded-2xl bg-company text-company-foreground flex items-center justify-center mb-4">
                <Megaphone className="h-6 w-6" />
              </span>
              <h3 className="text-xl font-display font-bold text-foreground mb-2">Para empresas</h3>
              <p className="text-muted-foreground mb-5">
                Sua marca na boca da cidade, com gente de verdade. R$ 5 a cada mil visualizações verificadas, a partir de R$ 100 por campanha. Você
                acompanha cada post no painel, conforme é aprovado.
              </p>
              <Link to="/empresas" className="inline-flex items-center gap-2 font-semibold text-company hover:underline">
                Como funciona para empresas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-3xl border border-affiliate/20 bg-affiliate/5 p-6 sm:p-8">
              <span className="h-12 w-12 rounded-2xl bg-affiliate text-affiliate-foreground flex items-center justify-center mb-4">
                <Trophy className="h-6 w-6" />
              </span>
              <h3 className="text-xl font-display font-bold text-foreground mb-2">Para divulgadores</h3>
              <p className="text-muted-foreground mb-5">
                Poste as missões das marcas no seu perfil, some pontos pelas visualizações e suba no ranking da sua liga. Os melhores do mês ganham prêmio
                em dinheiro no Pix. Entrar é grátis.
              </p>
              <Link to="/divulgadores" className="inline-flex items-center gap-2 font-semibold text-affiliate hover:underline">
                Como funciona para divulgadores <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-dashed border-client/40 bg-client/5 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="h-12 w-12 rounded-2xl bg-client/15 text-client flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-client mb-1">Em breve</p>
              <h3 className="text-lg font-display font-bold text-foreground">Ofertas, cupons e captação de clientes</h3>
              <p className="text-muted-foreground">
                A próxima etapa leva clientes até as empresas, com ofertas da cidade e cupons. Deixe seu contato para saber primeiro.
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link to="/clientes">Quero saber primeiro</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Princípios */}
      <section className="py-14 sm:py-20 bg-muted/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-3">No que a gente acredita</h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl">Servir quem vende, conectar quem quer ajudar e crescer junto com a cidade.</p>
          <div className="grid sm:grid-cols-2 gap-5">
            {principles.map((p) => (
              <div key={p.title} className="rounded-2xl border border-border bg-card p-6">
                <p.icon className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-display font-bold text-foreground mb-1">{p.title}</h3>
                <p className="text-muted-foreground">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dados e login (exigido pelo Google para o login com conta Google) */}
      <section className="py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-6 w-6 text-primary" />
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Seus dados e o login com Google</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Quando você entra com a conta Google, o Clilin recebe só o seu <strong className="text-foreground">nome</strong>, o seu{" "}
            <strong className="text-foreground">e-mail</strong> e, se houver, a <strong className="text-foreground">foto de perfil</strong>. Usamos esses dados
            para criar e proteger sua conta e para falar com você sobre ela. Nada além disso.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Não vendemos nem compartilhamos seus dados para publicidade, e você pode pedir a exclusão quando quiser. Os detalhes estão na{" "}
            <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link> e nos{" "}
            <Link to="/termos" className="text-primary hover:underline">Termos de Uso</Link>.
          </p>
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="font-display font-bold text-foreground mb-1">Fale com a gente</p>
            <p className="text-muted-foreground mb-4">Dúvida, sugestão ou parceria.</p>
            <Button asChild>
              <a href="mailto:contato@clilin.com">contato@clilin.com</a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
