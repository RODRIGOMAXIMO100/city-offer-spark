import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Users, Store, TrendingUp, Mail, CheckCircle } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { Footer } from "@/components/landing/Footer";
import logo from "@/assets/logo.png";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Sobre o Clilin - Plataforma de Ofertas Locais"
        description="Clilin é a plataforma que conecta empresas locais, divulgadores e clientes. Descubra como funciona, quais dados utilizamos e nosso compromisso com sua privacidade."
        keywords={["clilin", "ofertas locais", "divulgadores", "empresas locais", "sobre"]}
        canonicalUrl="https://clilin.com/sobre"
      />
      <StructuredData type="Organization" />

      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Clilin Logo" className="h-8 w-auto" />
              <span className="text-xl font-bold text-foreground">Clilin</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Início
              </Link>
              <Link to="/privacidade" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacidade
              </Link>
              <Link to="/termos" className="text-muted-foreground hover:text-foreground transition-colors">
                Termos
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <img src={logo} alt="Clilin" className="h-20 w-auto mx-auto mb-6" />
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Plataforma de Ofertas Locais que conecta empresas, divulgadores e clientes em sua cidade
          </p>
        </div>
      </section>

      {/* O que é o Clilin */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            O que é o Clilin?
          </h2>
          <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-12">
            Clilin é uma plataforma inovadora que revoluciona a forma como ofertas locais são descobertas e compartilhadas. 
            Conectamos três perfis diferentes em um ecossistema único e benéfico para todos.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Para Empresas</h3>
              <p className="text-muted-foreground">
                Crie ofertas atrativas e alcance clientes locais através de uma rede de divulgadores. 
                Pague apenas por resultados reais com nosso modelo de Custo Por Clique (CPC).
              </p>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Para Divulgadores</h3>
              <p className="text-muted-foreground">
                Ganhe comissões compartilhando ofertas da sua cidade nas suas redes sociais. 
                Quanto mais pessoas clicarem nos seus links, mais você ganha.
              </p>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Para Clientes</h3>
              <p className="text-muted-foreground">
                Descubra as melhores ofertas e promoções de empresas perto de você. 
                Economize tempo e dinheiro encontrando ofertas relevantes na sua região.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Como Funciona
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-1 text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Empresa Cria Oferta</h3>
                <p className="text-muted-foreground">
                  A empresa cadastra sua promoção com fotos, preços e link de destino (WhatsApp, site ou cardápio).
                </p>
              </div>
              
              <div className="hidden md:block w-px h-20 bg-border self-center" />
              
              <div className="flex-1 text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Divulgador Compartilha</h3>
                <p className="text-muted-foreground">
                  Divulgadores geram links únicos e compartilham nas redes sociais para seus seguidores.
                </p>
              </div>
              
              <div className="hidden md:block w-px h-20 bg-border self-center" />
              
              <div className="flex-1 text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Todos Ganham</h3>
                <p className="text-muted-foreground">
                  Cliente encontra a oferta, empresa ganha cliente, divulgador ganha comissão.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Uso de Dados e Google Sign-In - CRÍTICO */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-8">
              <Shield className="w-10 h-10 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">
                Uso de Dados e Autenticação Google
              </h2>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-8 mb-8">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Por que oferecemos login com Google?
              </h3>
              <p className="text-muted-foreground mb-6">
                Oferecemos a opção de login com Google para proporcionar uma experiência de cadastro mais rápida e segura. 
                Isso elimina a necessidade de criar e lembrar de mais uma senha, utilizando a segurança 
                já estabelecida da sua conta Google.
              </p>
              
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Quais dados acessamos da sua conta Google?
              </h3>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Nome:</strong> Para personalizar sua experiência e identificá-lo na plataforma
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Endereço de e-mail:</strong> Para criar sua conta, enviar notificações importantes e permitir recuperação de acesso
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Foto de perfil:</strong> Para exibir seu avatar na plataforma (opcional)
                  </span>
                </li>
              </ul>
              
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Como utilizamos esses dados?
              </h3>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Autenticação segura na plataforma</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Personalização da sua experiência de uso</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Comunicação sobre sua conta e transações</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Suporte ao usuário quando necessário</span>
                </li>
              </ul>
              
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">Nosso Compromisso</h4>
                <p className="text-muted-foreground text-sm">
                  <strong>Nunca vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing.</strong> 
                  Seus dados são utilizados exclusivamente para o funcionamento da plataforma Clilin. 
                  Você pode solicitar a exclusão dos seus dados a qualquer momento.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Segurança e Privacidade */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground text-center mb-8">
            Segurança e Privacidade
          </h2>
          <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-8">
            Levamos a segurança dos seus dados muito a sério. Utilizamos criptografia de ponta e 
            seguimos as melhores práticas de segurança da indústria para proteger suas informações.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 max-w-2xl mx-auto">
            <Link 
              to="/privacidade" 
              className="flex items-center gap-2 bg-card border border-border rounded-lg px-6 py-4 hover:border-primary transition-colors w-full md:w-auto justify-center"
            >
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Política de Privacidade</span>
            </Link>
            
            <Link 
              to="/termos" 
              className="flex items-center gap-2 bg-card border border-border rounded-lg px-6 py-4 hover:border-primary transition-colors w-full md:w-auto justify-center"
            >
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Termos de Serviço</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Entre em Contato
          </h2>
          <p className="text-muted-foreground mb-6">
            Tem dúvidas ou precisa de suporte? Estamos aqui para ajudar.
          </p>
          <a 
            href="mailto:contato@clilin.com" 
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Mail className="w-5 h-5" />
            contato@clilin.com
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
