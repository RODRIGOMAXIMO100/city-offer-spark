import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Zap, 
  Shield, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  Star,
  Clock,
  DollarSign,
  Target,
  Smartphone
} from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Footer } from "@/components/landing/Footer";

const ParaEmpresasPage = () => {
  const comparisons = [
    { 
      tradicional: "27% de taxa por venda", 
      clilin: "R$ 1-3 por lead (0% da venda)",
      icon: DollarSign
    },
    { 
      tradicional: "Cliente é do marketplace", 
      clilin: "Cliente é SEU no WhatsApp",
      icon: Smartphone
    },
    { 
      tradicional: "Compete com centenas de concorrentes", 
      clilin: "Oferta destacada na sua região",
      icon: Target
    },
    { 
      tradicional: "Depende de algoritmo da plataforma", 
      clilin: "IA + divulgadores locais trabalham pra você",
      icon: Users
    },
    { 
      tradicional: "Contrato e mensalidade obrigatórios", 
      clilin: "Sem contrato, sem mensalidade",
      icon: Shield
    },
    { 
      tradicional: "Pagamento em 15-30 dias", 
      clilin: "Cliente contata você na hora",
      icon: Clock
    },
  ];

  const benefits = [
    {
      icon: MessageSquare,
      title: "Cliente direto no WhatsApp",
      description: "Sem intermediário. O cliente fala com você diretamente. Relacionamento é seu."
    },
    {
      icon: DollarSign,
      title: "Pague só pelo interesse real",
      description: "R$ 1 a R$ 3 por lead. Não importa se vende R$ 50 ou R$ 500. Taxa fixa."
    },
    {
      icon: TrendingUp,
      title: "Aumente sua margem",
      description: "Pizza de R$ 100 no app = R$ 27 de taxa. Na Clilin = R$ 2. Faça as contas."
    },
    {
      icon: Users,
      title: "Divulgadores locais",
      description: "Pessoas da sua cidade indicando seu negócio. Marketing boca a boca digital."
    },
    {
      icon: Zap,
      title: "IA trabalhando 24h",
      description: "Nossa inteligência artificial encontra clientes interessados no que você oferece."
    },
    {
      icon: Shield,
      title: "Sem risco",
      description: "Sem contrato. Sem mensalidade. Deposita quanto quiser. Cancela quando quiser."
    }
  ];

  const faqs = [
    {
      question: "Quanto custa para começar?",
      answer: "Você deposita quanto quiser. Mínimo de R$ 50. Cada lead custa entre R$ 1 e R$ 3 dependendo da sua cidade e categoria."
    },
    {
      question: "Como funciona o lance por clique?",
      answer: "Você define quanto quer pagar por lead. Quanto maior seu lance, mais destaque sua oferta ganha. Simples assim."
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim. Sem contrato, sem fidelidade. Pause ou cancele quando quiser. Seu saldo fica disponível."
    },
    {
      question: "Como recebo os clientes?",
      answer: "Direto no seu WhatsApp. O cliente clica na oferta, abre conversa com você. Pronto. Venda."
    },
    {
      question: "Funciona pra qualquer tipo de negócio?",
      answer: "Sim. Restaurantes, salões, mecânicas, clínicas, lojas, serviços... Se é local, funciona."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Para Empresas | Clilin - Clientes no WhatsApp sem taxa por venda"
        description="Receba clientes direto no WhatsApp. Sem comissão por venda. Sem mensalidade. Pague R$ 1 a R$ 3 apenas por quem demonstra interesse real no seu negócio."
        keywords={["marketing local", "clientes whatsapp", "sem taxa delivery", "divulgação local", "leads qualificados"]}
      />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Para Empresas Locais</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              Cansado de dar{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                27% de cada venda
              </span>{" "}
              pra app de delivery?
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Receba clientes direto no seu WhatsApp. <strong className="text-foreground">Sem comissão por venda.</strong> Sem mensalidade. 
              Pague <strong className="text-primary">R$ 1 a R$ 3</strong> apenas por quem demonstra interesse real.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90">
                <Link to="/auth?type=company">
                  Cadastrar Minha Empresa
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link to="/chat">
                  Ver como funciona
                </Link>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-4">
                <div className="text-2xl md:text-3xl font-black text-primary">0%</div>
                <div className="text-sm text-muted-foreground">Taxa por venda</div>
              </div>
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-4">
                <div className="text-2xl md:text-3xl font-black text-primary">R$ 1-3</div>
                <div className="text-sm text-muted-foreground">Por lead</div>
              </div>
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-4">
                <div className="text-2xl md:text-3xl font-black text-primary">24h</div>
                <div className="text-sm text-muted-foreground">IA trabalhando</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-destructive/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              O problema que você conhece bem
            </h2>
            <p className="text-xl text-muted-foreground">
              Se você usa apps de delivery ou marketplaces, essa conta você já fez:
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-card border border-destructive/30 rounded-2xl p-8 mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold">Modelo tradicional</h3>
              </div>
              
              <div className="space-y-4 text-lg">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-destructive mt-1 flex-shrink-0" />
                  <span>Pizza de <strong>R$ 100</strong> = <strong className="text-destructive">R$ 27 de taxa</strong> pro app</span>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-destructive mt-1 flex-shrink-0" />
                  <span>Cliente <strong>não é seu</strong> — é do marketplace</span>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-destructive mt-1 flex-shrink-0" />
                  <span>Você compete com <strong>500 concorrentes</strong> na mesma tela</span>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-destructive mt-1 flex-shrink-0" />
                  <span>Depende do <strong>algoritmo</strong> pra aparecer</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-primary/30 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Com a Clilin</h3>
              </div>
              
              <div className="space-y-4 text-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span>Mesma pizza de R$ 100 = <strong className="text-primary">R$ 2 por lead</strong> (taxa 0% da venda)</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span>Cliente vai <strong>direto pro seu WhatsApp</strong></span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span>Oferta <strong>destacada</strong> na sua região</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span>IA + divulgadores <strong>trabalham pra você</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Compare você mesmo
            </h2>
            <p className="text-xl text-muted-foreground">
              Veja a diferença entre o modelo tradicional e a Clilin
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="grid grid-cols-3 bg-muted/50">
                <div className="p-4 font-semibold text-center"></div>
                <div className="p-4 font-semibold text-center text-destructive">Modelo Tradicional</div>
                <div className="p-4 font-semibold text-center text-primary">Clilin</div>
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
                  <div className="p-4 flex items-center gap-2 bg-primary/5">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium">{item.clilin}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Por que empresas estão migrando pra Clilin
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Math Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-black mb-8 text-center">
                Faça as contas
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-destructive/20">
                  <h3 className="text-xl font-bold mb-4 text-destructive">App de Delivery</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Venda mensal:</span>
                      <span className="font-bold">R$ 10.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa (27%):</span>
                      <span className="font-bold text-destructive">- R$ 2.700</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between">
                      <span>Você fica com:</span>
                      <span className="font-bold">R$ 7.300</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-primary/20">
                  <h3 className="text-xl font-bold mb-4 text-primary">Clilin</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Venda mensal:</span>
                      <span className="font-bold">R$ 10.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>100 leads x R$ 2:</span>
                      <span className="font-bold text-primary">- R$ 200</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between">
                      <span>Você fica com:</span>
                      <span className="font-bold text-primary text-xl">R$ 9.800</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <div className="inline-block bg-primary/20 rounded-xl px-6 py-4">
                  <span className="text-2xl md:text-3xl font-black text-primary">
                    + R$ 2.500/mês no seu bolso
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/30">
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

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 md:p-12 text-primary-foreground">
              <Star className="w-12 h-12 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-black mb-4">
                Comece agora. Sem risco.
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Sem contrato. Sem mensalidade. Deposite R$ 50 e veja como funciona. 
                Não gostou? Pause quando quiser.
              </p>
              
              <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-6">
                <Link to="/auth?type=company">
                  Cadastrar Minha Empresa Grátis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>

              <p className="mt-6 text-sm opacity-70">
                Milhares de empresas locais já pararam de dar lucro pra aplicativo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ParaEmpresasPage;
