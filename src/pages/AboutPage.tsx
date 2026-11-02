import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, MapPin, Megaphone, Scale, ShieldCheck, Ticket, Trophy, Users } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { LogoGraphic } from "@/components/brand/BrandLogo";

const principles = [
  { icon: MapPin, title: "Perto de você", text: "Cada oferta é da cidade da loja. O Clilin existe para movimentar o comércio do lugar onde a gente vive." },
  { icon: BadgeCheck, title: "Cliente de verdade", text: "Cada cupom tem código único, validade e vale uma vez. Só conta quem chegou na loja." },
  { icon: Scale, title: "Regra clara", text: "15% do preço por cupom usado, mínimo de R$ 3, e metade para quem indicou. Todo mundo sabe para onde vai cada real." },
  { icon: ShieldCheck, title: "Só paga o que aconteceu", text: "Visita e cupom não usado não custam nada para a loja. Para o cliente, é sempre de graça." },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Sobre o Clilin: ofertas da cidade com cupom no WhatsApp"
        description="O Clilin junta negócios locais, divulgadores da cidade e clientes. A loja publica a oferta, o cliente pega o cupom no WhatsApp e a loja só paga pelo cupom usado."
        keywords={["clilin", "ofertas locais", "cupom de desconto", "boca a boca", "comércio local", "sobre"]}
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
            O Clilin junta os negócios da cidade, quem indica e quem compra. A loja publica a oferta, alguém de confiança espalha e o cliente chega com o cupom na mão.
          </p>
        </div>
      </section>

      {/* O que é */}
      <section className="py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mb-10">
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-4">O que é o Clilin</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Um anúncio fala com quem não pediu. Uma indicação de alguém conhecido é diferente: a pessoa confia e vai. O Clilin transforma isso em
              cliente na porta. A loja cria a oferta, divulgadores da cidade indicam, o cliente pega o cupom no WhatsApp e, na hora de usar, a loja confirma com um toque
              no balcão. Só aí existe cobrança.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-3xl border border-company/20 bg-company/5 p-6 sm:p-8">
              <span className="h-12 w-12 rounded-2xl bg-company text-company-foreground flex items-center justify-center mb-4">
                <Megaphone className="h-6 w-6" />
              </span>
              <h3 className="text-xl font-display font-bold text-foreground mb-2">Para empresas</h3>
              <p className="text-muted-foreground mb-5">
                Cliente novo na loja, pagando só pelo cupom usado: 15% do preço da oferta, mínimo de R$ 3. Sem mensalidade. O cliente avisa quando vai usar
                e você confirma com um toque.
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
                Indique as ofertas da sua cidade pelo seu link e ganhe metade da taxa de cada cupom usado, até 70% por nível. Saque no Pix. Entrar é
                grátis.
              </p>
              <Link to="/divulgadores" className="inline-flex items-center gap-2 font-semibold text-affiliate hover:underline">
                Como funciona para divulgadores <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-border bg-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Ticket className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <h3 className="text-lg font-display font-bold text-foreground">Para quem compra</h3>
              <p className="text-muted-foreground">
                Ofertas dos negócios da sua cidade, com cupom grátis no WhatsApp. Sem app e sem cadastro.
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link to="/ofertas">Ver ofertas</Link>
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

      {/* Quem está por trás */}
      <section className="py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-4">Quem está por trás</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">
            O Clilin é um produto do <strong className="text-foreground">Grupo MAXIMO</strong>, que trabalha com gestão, marketing e vendas
            para empresas e já passou dos R$ 20 milhões investidos em tráfego pago. Muita coisa deu errado no caminho, a gente corrigiu, aprendeu,
            e muita coisa deu certo depois. O Clilin junta esse aprendizado num jeito simples de levar cliente até o comércio da cidade.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Se o seu negócio quiser ir além das ofertas, a MAXIMO Empresas cuida da gestão, do marketing e das vendas junto com você.
          </p>
          <Button asChild variant="outline">
            <a href="https://www.maximoacelera.com.br/empresas" target="_blank" rel="noopener">
              Conhecer a MAXIMO Empresas <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
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
