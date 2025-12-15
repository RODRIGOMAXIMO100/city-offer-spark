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
  Smartphone,
  AlertTriangle,
  Flame,
  MousePointer,
  UserCheck
} from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Footer } from "@/components/landing/Footer";

const ParaEmpresasPage = () => {
  const tripleComparison = [
    { 
      metric: "Custo por cliente",
      anuncios: "R$ 40 - R$ 100",
      delivery: "R$ 21,60 (27%)",
      clilin: "R$ 1 - R$ 3",
      icon: DollarSign
    },
    { 
      metric: "O que você paga",
      anuncios: "Por clique (pode nem converter)",
      delivery: "Porcentagem de cada venda",
      clilin: "Por interesse real",
      icon: MousePointer
    },
    { 
      metric: "Cliente é de quem?",
      anuncios: "Você captura (se conseguir)",
      delivery: "Do marketplace",
      clilin: "Seu, no WhatsApp",
      icon: Smartphone
    },
    { 
      metric: "Conversão média",
      anuncios: "2-5% dos cliques",
      delivery: "100% (mas paga taxa)",
      clilin: "100% interessados",
      icon: Target
    },
    { 
      metric: "Precisa de",
      anuncios: "Especialista + verba alta",
      delivery: "Aceitar regras do app",
      clilin: "Só criar sua oferta",
      icon: Users
    },
    { 
      metric: "Quem trabalha pra você",
      anuncios: "Algoritmo que você não controla",
      delivery: "Ninguém",
      clilin: "IA + divulgadores locais",
      icon: Zap
    },
  ];

  const benefits = [
    {
      icon: MessageSquare,
      title: "Cliente direto no WhatsApp",
      description: "Sem intermediário. Relacionamento é seu. Venda direta."
    },
    {
      icon: DollarSign,
      title: "R$ 1 a R$ 3 por cliente",
      description: "Taxa FIXA. Não importa se vende R$ 50 ou R$ 500."
    },
    {
      icon: TrendingUp,
      title: "Margem intocada",
      description: "Zero porcentagem da venda. 100% do lucro é seu."
    },
    {
      icon: Users,
      title: "Exército de divulgadores",
      description: "Centenas de pessoas locais indicando seu negócio."
    },
    {
      icon: Zap,
      title: "IA 24h por dia",
      description: "Inteligência artificial encontrando clientes enquanto você dorme."
    },
    {
      icon: Shield,
      title: "Risco zero",
      description: "Sem contrato. Sem mensalidade. Cancela quando quiser."
    }
  ];

  const faqs = [
    {
      question: "Quanto custa para começar?",
      answer: "Você deposita quanto quiser. Mínimo de R$ 50. Cada lead custa entre R$ 1 e R$ 3 dependendo da sua cidade e categoria."
    },
    {
      question: "Como funciona o lance?",
      answer: "Você define quanto quer pagar por lead. Quanto maior seu lance, mais destaque sua oferta ganha. Simples assim."
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim. Sem contrato, sem fidelidade. Pause ou cancele quando quiser. Seu saldo fica disponível."
    },
    {
      question: "Como recebo os clientes?",
      answer: "Direto no seu WhatsApp. O cliente clica na oferta, abre conversa com você. Pronto."
    },
    {
      question: "Funciona pra qualquer negócio?",
      answer: "Sim. Restaurantes, salões, mecânicas, clínicas, lojas, serviços... Se é local, funciona."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Para Empresas | Clilin - Pare de queimar dinheiro com anúncios"
        description="Enquanto você paga R$ 5 por clique que talvez vire cliente, empresas espertas pagam R$ 2 por cliente que JÁ QUER comprar. Sem taxa por venda."
        keywords={["marketing local", "clientes whatsapp", "sem taxa delivery", "alternativa google ads", "leads qualificados", "custo por lead"]}
      />

      {/* Hero Section - Agressivo */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 via-background to-background" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-destructive/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-full px-4 py-2 mb-8 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-bold text-destructive">Você está perdendo dinheiro</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              Você está{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                queimando dinheiro
              </span>{" "}
              com anúncios que não convertem?
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-4xl mx-auto">
              Enquanto você paga <strong className="text-destructive">R$ 5 por cada CLIQUE</strong> que talvez vire cliente...
            </p>
            <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto">
              Empresas espertas pagam <strong className="text-primary">R$ 2 por cliente que JÁ QUER comprar.</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                <Link to="/auth?type=company">
                  <Flame className="mr-2 w-5 h-5" />
                  Parar de Queimar Dinheiro
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>

            {/* Comparativo rápido */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <div className="bg-destructive/10 backdrop-blur border border-destructive/30 rounded-xl p-4">
                <div className="text-sm text-destructive font-bold mb-1">ANÚNCIOS ONLINE</div>
                <div className="text-2xl md:text-3xl font-black text-destructive">R$ 100</div>
                <div className="text-xs text-muted-foreground">por cliente (média)</div>
              </div>
              <div className="bg-orange-500/10 backdrop-blur border border-orange-500/30 rounded-xl p-4">
                <div className="text-sm text-orange-500 font-bold mb-1">APPS DE DELIVERY</div>
                <div className="text-2xl md:text-3xl font-black text-orange-500">27%</div>
                <div className="text-xs text-muted-foreground">de cada venda</div>
              </div>
              <div className="bg-primary/10 backdrop-blur border border-primary/30 rounded-xl p-4">
                <div className="text-sm text-primary font-bold mb-1">CLILIN</div>
                <div className="text-2xl md:text-3xl font-black text-primary">R$ 2</div>
                <div className="text-xs text-muted-foreground">por cliente real</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção: Os 3 Inimigos do seu Lucro */}
      <section className="py-20 bg-destructive/5">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-6">
              Os 3 <span className="text-destructive">ladrões</span> do seu lucro
            </h2>
            <p className="text-xl text-muted-foreground">
              Você provavelmente usa pelo menos um. E está pagando caro por isso.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
            {/* Anúncios Online */}
            <div className="bg-card border-2 border-destructive/30 rounded-2xl p-6">
              <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mb-4">
                <MousePointer className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-destructive">Plataformas de Anúncios</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <span>Paga R$ 2-5 por <strong>clique</strong> — não por interesse</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <span>Conversão média: <strong>2-5%</strong> dos cliques</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <span>Precisa de <strong>especialista</strong> pra gerenciar</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <span>Queima dinheiro <strong>testando público</strong></span>
                </li>
              </ul>
              <div className="mt-6 p-3 bg-destructive/10 rounded-lg text-center">
                <span className="text-sm text-muted-foreground">Custo real por cliente:</span>
                <div className="text-2xl font-black text-destructive">R$ 40 - R$ 100</div>
              </div>
            </div>

            {/* Apps de Delivery */}
            <div className="bg-card border-2 border-orange-500/30 rounded-2xl p-6">
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-orange-500">Apps de Delivery</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>Taxa de <strong>27% por venda</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>Cliente é <strong>do marketplace</strong>, não seu</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>Compete com <strong>500 concorrentes</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>Depende do <strong>algoritmo</strong> do app</span>
                </li>
              </ul>
              <div className="mt-6 p-3 bg-orange-500/10 rounded-lg text-center">
                <span className="text-sm text-muted-foreground">Pizza R$ 80 = você perde:</span>
                <div className="text-2xl font-black text-orange-500">R$ 21,60</div>
              </div>
            </div>

            {/* Clilin - Solução */}
            <div className="bg-card border-2 border-primary rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                MELHOR OPÇÃO
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-primary">Clilin</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Paga <strong>só por interesse real</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Cliente vai <strong>pro SEU WhatsApp</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Zero taxa</strong> sobre a venda</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>IA + divulgadores <strong>trabalham 24h</strong></span>
                </li>
              </ul>
              <div className="mt-6 p-3 bg-primary/10 rounded-lg text-center">
                <span className="text-sm text-muted-foreground">Custo por cliente:</span>
                <div className="text-2xl font-black text-primary">R$ 1 - R$ 3</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabela Comparativa Tripla */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Compare você mesmo
            </h2>
            <p className="text-xl text-muted-foreground">
              Números que falam por si
            </p>
          </div>

          <div className="max-w-5xl mx-auto overflow-x-auto">
            <div className="bg-card border border-border rounded-2xl overflow-hidden min-w-[600px]">
              <div className="grid grid-cols-4 bg-muted/50">
                <div className="p-4 font-semibold"></div>
                <div className="p-4 font-semibold text-center text-destructive text-sm">
                  <MousePointer className="w-4 h-4 mx-auto mb-1" />
                  Anúncios Online
                </div>
                <div className="p-4 font-semibold text-center text-orange-500 text-sm">
                  <Smartphone className="w-4 h-4 mx-auto mb-1" />
                  Apps Delivery
                </div>
                <div className="p-4 font-semibold text-center text-primary text-sm">
                  <CheckCircle2 className="w-4 h-4 mx-auto mb-1" />
                  Clilin
                </div>
              </div>
              
              {tripleComparison.map((item, index) => (
                <div key={index} className="grid grid-cols-4 border-t border-border">
                  <div className="p-4 flex items-center gap-2 font-medium text-sm">
                    <item.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span>{item.metric}</span>
                  </div>
                  <div className="p-4 flex items-center justify-center gap-2 bg-destructive/5 text-center">
                    <span className="text-xs">{item.anuncios}</span>
                  </div>
                  <div className="p-4 flex items-center justify-center gap-2 bg-orange-500/5 text-center">
                    <span className="text-xs">{item.delivery}</span>
                  </div>
                  <div className="p-4 flex items-center justify-center gap-2 bg-primary/5 text-center">
                    <span className="text-xs font-bold text-primary">{item.clilin}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Seção: Faça as Contas - EXPANDIDA */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black mb-4">
                Faça as contas
              </h2>
              <p className="text-xl text-muted-foreground">
                Cenário: Você quer <strong className="text-foreground">100 clientes</strong> esse mês
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Anúncios Online */}
              <div className="bg-card border-2 border-destructive/30 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-destructive/20 rounded-full flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-destructive" />
                  </div>
                  <h3 className="text-lg font-bold text-destructive">Anúncios Online</h3>
                </div>
                
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">100 clientes ÷ 3% conversão</span>
                    <span className="font-mono font-bold">3.333 cliques</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">3.333 × R$ 3/clique</span>
                    <span className="font-mono font-bold text-destructive">R$ 10.000</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-destructive/10 rounded-lg px-3 -mx-3">
                    <span className="font-bold">Custo por cliente:</span>
                    <span className="font-mono font-black text-destructive text-xl">R$ 100</span>
                  </div>
                </div>
              </div>

              {/* App de Delivery */}
              <div className="bg-card border-2 border-orange-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-bold text-orange-500">App de Delivery</h3>
                </div>
                
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">100 pedidos × R$ 80</span>
                    <span className="font-mono font-bold">R$ 8.000</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Taxa de 27%</span>
                    <span className="font-mono font-bold text-orange-500">- R$ 2.160</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-orange-500/10 rounded-lg px-3 -mx-3">
                    <span className="font-bold">Custo por cliente:</span>
                    <span className="font-mono font-black text-orange-500 text-xl">R$ 21,60</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 italic">
                  + cliente não é seu
                </p>
              </div>

              {/* Clilin */}
              <div className="bg-card border-2 border-primary rounded-2xl p-6 relative">
                <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  ⚡ 50x MAIS BARATO
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-primary">Clilin</h3>
                </div>
                
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">100 leads qualificados</span>
                    <span className="font-mono font-bold">100 clientes</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">100 × R$ 2/lead</span>
                    <span className="font-mono font-bold text-primary">R$ 200</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-primary/10 rounded-lg px-3 -mx-3">
                    <span className="font-bold">Custo por cliente:</span>
                    <span className="font-mono font-black text-primary text-xl">R$ 2</span>
                  </div>
                </div>
                <p className="text-xs text-primary mt-3 font-medium">
                  ✓ Cliente vai pro SEU WhatsApp
                </p>
              </div>
            </div>

            {/* Frase de impacto */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-8 text-center">
              <p className="text-xl md:text-2xl font-bold mb-4">
                "Enquanto seu concorrente joga <span className="text-destructive">R$ 10.000/mês</span> em anúncios torcendo pra converter 3%..."
              </p>
              <p className="text-2xl md:text-3xl font-black text-primary">
                Você paga R$ 200 e recebe 100 clientes no WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frases de Impacto */}
      <section className="py-16 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="text-center md:text-left">
                <blockquote className="text-xl md:text-2xl font-bold italic mb-4">
                  "Pagar por clique é <span className="text-destructive">apostar</span>."
                </blockquote>
                <p className="text-lg opacity-80">
                  Pagar por lead é <span className="text-primary font-bold">investir</span>.
                </p>
              </div>
              <div className="text-center md:text-left">
                <blockquote className="text-xl md:text-2xl font-bold italic mb-4">
                  "Seu funcionário mais barato:"
                </blockquote>
                <p className="text-lg opacity-80">
                  Uma IA + centenas de divulgadores locais. <span className="text-primary font-bold">Custo? R$ 2 por cliente.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Por que empresas estão migrando
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

      {/* Final CTA - Urgência */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 md:p-12 text-primary-foreground relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <Flame className="w-16 h-16 mx-auto mb-6 opacity-80" />
                <h2 className="text-3xl md:text-5xl font-black mb-4">
                  Pare de queimar dinheiro.
                </h2>
                <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                  Enquanto você pensa, seu concorrente já está recebendo clientes por R$ 2 cada.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="text-lg px-8 py-6 bg-background text-foreground hover:bg-background/90">
                    <Link to="/auth?type=company">
                      Cadastrar Minha Empresa
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                </div>

                <p className="mt-6 text-sm opacity-70">
                  Sem contrato • Sem mensalidade • Comece com R$ 50
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ParaEmpresasPage;
