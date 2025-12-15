import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Gift, 
  Search, 
  Sparkles, 
  MapPin, 
  Users, 
  Zap, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  Star,
  MessageSquare,
  Percent,
  Heart,
  Clock
} from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Footer } from "@/components/landing/Footer";
import SignupForm from "@/components/auth/SignupForm";

const ParaClientesPage = () => {
  const comparisons = [
    { 
      tradicional: "50 resultados genéricos", 
      clilin: "IA entende o que você quer",
      icon: Search
    },
    { 
      tradicional: "Avaliações podem ser falsas", 
      clilin: "Indicação de pessoas reais locais",
      icon: Users
    },
    { 
      tradicional: "Sem garantia de desconto", 
      clilin: "Ofertas exclusivas verificadas",
      icon: Percent
    },
    { 
      tradicional: "Você procura, procura, procura...", 
      clilin: "A IA traz pra você em segundos",
      icon: Zap
    },
    { 
      tradicional: "Preço cheio ou cupom expirado", 
      clilin: "Descontos de 20% a 70% ativos",
      icon: Gift
    },
    { 
      tradicional: "Não sabe se é confiável", 
      clilin: "Negócios da sua cidade indicados por vizinhos",
      icon: Heart
    },
  ];

  const categories = [
    { emoji: "🍕", name: "Pizzarias", discount: "até 40% off" },
    { emoji: "🍔", name: "Hamburguerias", discount: "até 35% off" },
    { emoji: "💇", name: "Salões", discount: "até 50% off" },
    { emoji: "🔧", name: "Mecânicas", discount: "até 30% off" },
    { emoji: "🏋️", name: "Academias", discount: "até 60% off" },
    { emoji: "🦷", name: "Dentistas", discount: "até 40% off" },
    { emoji: "🐕", name: "Pet Shops", discount: "até 35% off" },
    { emoji: "🍰", name: "Confeitarias", discount: "até 25% off" },
  ];

  const howItWorks = [
    {
      icon: MessageSquare,
      title: "Pergunte pra IA",
      description: "\"Quero uma pizzaria boa com desconto perto de mim\""
    },
    {
      icon: Sparkles,
      title: "IA encontra pra você",
      description: "Em segundos, ofertas exclusivas da sua cidade"
    },
    {
      icon: Gift,
      title: "Aproveite o desconto",
      description: "Fale direto com o estabelecimento pelo WhatsApp"
    }
  ];

  const benefits = [
    {
      icon: Percent,
      title: "Descontos de 20% a 70%",
      description: "Ofertas exclusivas que você não encontra em nenhum outro lugar."
    },
    {
      icon: MapPin,
      title: "Negócios da sua cidade",
      description: "Pizzarias, salões, mecânicas... Tudo pertinho de você."
    },
    {
      icon: Users,
      title: "Indicação de pessoas reais",
      description: "Não são avaliações anônimas. São vizinhos indicando."
    },
    {
      icon: Sparkles,
      title: "IA que entende você",
      description: "Fale naturalmente. A IA encontra o que você precisa."
    },
    {
      icon: Zap,
      title: "Instantâneo",
      description: "Perguntou, achou. Sem baixar app, sem cadastro."
    },
    {
      icon: Gift,
      title: "100% gratuito",
      description: "Sem pegadinha. Sem assinatura. Grátis mesmo."
    }
  ];

  const faqs = [
    {
      question: "Preciso baixar algum aplicativo?",
      answer: "Não! Funciona direto no navegador. Sem instalar nada."
    },
    {
      question: "Preciso me cadastrar?",
      answer: "Não precisa. Pode usar direto. Se quiser salvar favoritos, aí sim pode criar uma conta."
    },
    {
      question: "Como sei que o desconto é real?",
      answer: "Todas as ofertas são de empresas cadastradas e verificadas. O desconto tá ativo e funcionando."
    },
    {
      question: "Como entro em contato com a empresa?",
      answer: "Clicou na oferta, abre o WhatsApp do estabelecimento. Direto, sem intermediário."
    },
    {
      question: "Tem em qualquer cidade?",
      answer: "Estamos em várias cidades do Brasil e expandindo todo dia. Pergunta pra IA e descobre!"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Para Clientes | Clilin - Ofertas exclusivas da sua cidade"
        description="Descontos de 20% a 70% em negócios da sua cidade. Curados por IA. Indicados por vizinhos. 100% gratuito. Sem app, sem cadastro."
        keywords={["ofertas locais", "descontos", "cupons", "promoções", "negócios locais"]}
      />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 via-background to-background" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-secondary/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/20 rounded-full px-3 py-1.5 md:px-4 md:py-2 mb-6 md:mb-8">
              <Gift className="w-3 h-3 md:w-4 md:h-4 text-secondary" />
              <span className="text-xs md:text-sm font-medium text-secondary">Para Clientes</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 md:mb-6 leading-tight">
              Ofertas{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
                exclusivas
              </span>{" "}
              que você não encontra em nenhum app
            </h1>
            
            <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-3xl mx-auto">
              Descontos de <strong className="text-foreground">20% a 70%</strong> em negócios da sua cidade. 
              Curados por IA. Indicados por vizinhos. <strong className="text-secondary">100% gratuito.</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8 md:mb-12">
              <Button asChild size="lg" className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                <Link to="/chat">
                  Encontrar Ofertas
                  <Sparkles className="ml-2 w-4 h-4 md:w-5 md:h-5" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6"
                onClick={() => document.getElementById('cadastro')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Criar conta grátis
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 max-w-2xl mx-auto">
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-3 md:p-4">
                <div className="text-lg md:text-3xl font-black text-secondary">70%</div>
                <div className="text-[10px] md:text-sm text-muted-foreground">Desconto máx</div>
              </div>
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-3 md:p-4">
                <div className="text-lg md:text-3xl font-black text-secondary">0</div>
                <div className="text-[10px] md:text-sm text-muted-foreground">Apps pra baixar</div>
              </div>
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-3 md:p-4">
                <div className="text-lg md:text-3xl font-black text-secondary">R$ 0</div>
                <div className="text-[10px] md:text-sm text-muted-foreground">Pra usar</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Simples assim
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {howItWorks.map((step, index) => (
                <div key={index} className="text-center relative">
                  {index < howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-border" />
                  )}
                  <div className="relative z-10">
                    <div className="w-24 h-24 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <step.icon className="w-10 h-10 text-secondary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Ofertas em todas as categorias
            </h2>
            <p className="text-xl text-muted-foreground">
              O que você precisa hoje?
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {categories.map((category, index) => (
              <Link 
                key={index}
                to="/chat"
                className="bg-card border border-border rounded-xl p-6 text-center hover:border-secondary/50 hover:bg-secondary/5 transition-all group"
              >
                <div className="text-4xl mb-2">{category.emoji}</div>
                <h3 className="font-bold mb-1">{category.name}</h3>
                <p className="text-sm text-secondary font-medium">{category.discount}</p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button asChild variant="outline" size="lg">
              <Link to="/chat">
                Ver todas as ofertas
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-black mb-3 md:mb-6">
              Por que a Clilin é diferente
            </h2>
            <p className="text-base md:text-xl text-muted-foreground">
              Buscar sozinho vs Usar a Clilin
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Mobile: Cards empilhados */}
            <div className="md:hidden space-y-3 max-w-sm mx-auto">
              {comparisons.map((item, index) => (
                <div key={index} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-bold text-sm">Comparativo</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 py-2 px-3 bg-destructive/5 rounded-lg">
                      <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-destructive font-medium mb-0.5">Buscar sozinho</div>
                        <span className="text-xs">{item.tradicional}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 py-2 px-3 bg-secondary/10 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-secondary font-medium mb-0.5">Com a Clilin</div>
                        <span className="text-xs font-medium">{item.clilin}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Tabela */}
            <div className="hidden md:block">
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="grid grid-cols-3 bg-muted/50">
                  <div className="p-4 font-semibold text-center"></div>
                  <div className="p-4 font-semibold text-center text-destructive">Buscar Sozinho</div>
                  <div className="p-4 font-semibold text-center text-secondary">Com a Clilin</div>
                </div>
                
                {comparisons.map((item, index) => (
                  <div key={index} className="grid grid-cols-3 border-t border-border">
                    <div className="p-4 flex items-center gap-2">
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="p-4 flex items-center gap-2 bg-destructive/5">
                      <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                      <span className="text-sm">{item.tradicional}</span>
                    </div>
                    <div className="p-4 flex items-center gap-2 bg-secondary/5">
                      <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0" />
                      <span className="text-sm font-medium">{item.clilin}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-black mb-6">
                  Pergunte como se fosse pra um amigo
                </h2>
                <p className="text-xl text-muted-foreground mb-6">
                  A IA entende linguagem natural. Não precisa de busca exata.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>"Quero pizza barata perto de mim"</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>"Preciso de mecânico bom e honesto"</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>"Salão com desconto pra hoje"</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>"Academia com mensalidade barata"</span>
                  </li>
                </ul>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <div className="font-bold">Clilin IA</div>
                    <div className="text-sm text-muted-foreground">Assistente de ofertas</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-xl p-4 max-w-[80%]">
                    <p className="text-sm">Oi! O que você está procurando hoje?</p>
                  </div>

                  <div className="bg-secondary/10 rounded-xl p-4 max-w-[80%] ml-auto">
                    <p className="text-sm">Quero uma pizzaria boa com desconto</p>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4 max-w-[80%]">
                    <p className="text-sm mb-3">Encontrei 3 pizzarias perto de você com descontos de até 40%! 🍕</p>
                    <div className="bg-card border border-border rounded-lg p-3">
                      <div className="font-bold text-sm">Pizzaria Bella Napoli</div>
                      <div className="text-xs text-muted-foreground">2km de você</div>
                      <div className="text-secondary font-bold text-sm mt-1">40% OFF</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Por que usar a Clilin
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="bg-card border border-border rounded-xl p-6 hover:border-secondary/50 transition-colors"
              >
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black mb-12 text-center">
              Perguntas frequentes
            </h2>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <h3 className="text-lg font-bold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Signup Section */}
      <section id="cadastro" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left: Benefits summary */}
              <div>
                <div className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/20 rounded-full px-4 py-2 mb-6">
                  <Gift className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-bold text-secondary">100% Gratuito</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-6">
                  Crie uma conta e <span className="text-secondary">salve suas ofertas favoritas</span>
                </h2>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span>Descontos de 20% a 70%</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span>Ofertas exclusivas da sua cidade</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span>IA que entende o que você quer</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span>Salve favoritos e receba alertas</span>
                  </li>
                </ul>
                <p className="text-muted-foreground text-sm">
                  Ou use direto sem cadastro - é gratuito também!
                </p>
                <Button asChild variant="outline" className="mt-4">
                  <Link to="/chat">
                    Usar sem cadastro
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>

              {/* Right: Signup Form */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xl">
                <SignupForm 
                  role="CLIENT"
                  title="Crie sua conta"
                  description="Gratuito para sempre"
                  buttonText="Criar Conta Grátis"
                  compact
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ParaClientesPage;
