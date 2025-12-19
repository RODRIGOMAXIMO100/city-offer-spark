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
import SignupForm from "@/components/auth/SignupForm";

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
      title: "Relacionamento direto",
      description: "Cliente no seu WhatsApp. Você constrói o relacionamento. Clientes viram fãs."
    },
    {
      icon: DollarSign,
      title: "Investimento justo",
      description: "R$ 1 a R$ 3 por cliente interessado. Taxa fixa, sem surpresas."
    },
    {
      icon: TrendingUp,
      title: "Seu lucro intocado",
      description: "Zero porcentagem da venda. Tudo que você vende é seu."
    },
    {
      icon: Users,
      title: "Comunidade que indica",
      description: "Pessoas da sua cidade indicando seu negócio com genuinidade."
    },
    {
      icon: Zap,
      title: "IA trabalhando por você",
      description: "Inteligência artificial conectando clientes ao seu negócio 24h."
    },
    {
      icon: Shield,
      title: "Liberdade total",
      description: "Sem contrato. Sem mensalidade. Você cresce no seu ritmo."
    }
  ];

  const faqs = [
    {
      question: "Quanto custa para começar?",
      answer: "Você deposita quanto quiser. Mínimo de R$ 100. Cada lead custa entre R$ 1 e R$ 3 dependendo da sua cidade e categoria."
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
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 via-background to-background" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-destructive/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-3 py-1.5 md:px-4 md:py-2 mb-6 md:mb-8">
              <Building2 className="w-3 h-3 md:w-4 md:h-4 text-primary" />
              <span className="text-xs md:text-sm font-bold text-primary">Para Empresas</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 md:mb-6 leading-tight">
              Sirva sua comunidade,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                construa relacionamentos
              </span>{" "}
              reais
            </h1>
            
            <p className="text-base md:text-xl text-muted-foreground mb-2 md:mb-4 max-w-4xl mx-auto">
              Seja encontrado por IA. Indicado por vizinhos. Conectado a clientes que <strong className="text-foreground">realmente querem você</strong>.
            </p>
            <p className="text-base md:text-xl mb-6 md:mb-8 max-w-4xl mx-auto">
              Receba clientes direto no WhatsApp. <strong className="text-primary">Construa relacionamentos, não apenas vendas.</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8 md:mb-12">
              <Button 
                size="lg" 
                className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                onClick={() => document.getElementById('cadastro')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Building2 className="mr-2 w-4 h-4 md:w-5 md:h-5" />
                Começar a Servir
                <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>

            {/* Comparativo rápido */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 max-w-4xl mx-auto">
              <div className="bg-destructive/10 backdrop-blur border border-destructive/30 rounded-xl p-3 md:p-4">
                <div className="text-[10px] md:text-sm text-destructive font-bold mb-1">ANÚNCIOS</div>
                <div className="text-lg md:text-3xl font-black text-destructive">R$ 100</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">por cliente</div>
              </div>
              <div className="bg-orange-500/10 backdrop-blur border border-orange-500/30 rounded-xl p-3 md:p-4">
                <div className="text-[10px] md:text-sm text-orange-500 font-bold mb-1">DELIVERY</div>
                <div className="text-lg md:text-3xl font-black text-orange-500">27%</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">por venda</div>
              </div>
              <div className="bg-primary/10 backdrop-blur border border-primary/30 rounded-xl p-3 md:p-4">
                <div className="text-[10px] md:text-sm text-primary font-bold mb-1">CLILIN</div>
                <div className="text-lg md:text-3xl font-black text-primary">R$ 2</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">por cliente</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção: O custo das opções tradicionais */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-6">
              O custo das <span className="text-muted-foreground">opções tradicionais</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Cada caminho tem seu preço. Veja o que você pode estar pagando.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Anúncios Online */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <MousePointer className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-4">Plataformas de Anúncios</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>Paga R$ 2-5 por <strong>clique</strong> — não por interesse</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>Conversão média: <strong>2-5%</strong> dos cliques</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>Precisa de <strong>especialista</strong> pra gerenciar</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>Investimento alto para <strong>testar público</strong></span>
                </li>
              </ul>
              <div className="mt-6 p-3 bg-muted rounded-lg text-center">
                <span className="text-sm text-muted-foreground">Custo médio por cliente:</span>
                <div className="text-2xl font-black text-foreground">R$ 40 - R$ 100</div>
              </div>
            </div>

            {/* Apps de Delivery */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-4">Apps de Delivery</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>Taxa de <strong>27% por venda</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>Cliente é <strong>do marketplace</strong>, não seu</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>Compete com <strong>muitos concorrentes</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>Depende do <strong>algoritmo</strong> do app</span>
                </li>
              </ul>
              <div className="mt-6 p-3 bg-muted rounded-lg text-center">
                <span className="text-sm text-muted-foreground">Pizza R$ 80 = taxa de:</span>
                <div className="text-2xl font-black text-foreground">R$ 21,60</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção: Existe um caminho melhor */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-6">
              Existe um <span className="text-primary">caminho melhor</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              E ele coloca você no controle do seu negócio.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="bg-card border-2 border-primary rounded-2xl p-8 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-bl-xl">
                RECOMENDADO
              </div>
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-6 text-primary">Clilin</h3>
              <ul className="space-y-4 text-base">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Paga <strong>só por interesse real</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Cliente vai <strong>pro SEU WhatsApp</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Zero taxa</strong> sobre a venda</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Comunidade de divulgadores <strong>trabalhando por você</strong></span>
                </li>
              </ul>
              <div className="mt-8 p-4 bg-primary/10 rounded-xl text-center">
                <span className="text-sm text-muted-foreground">Custo por cliente interessado:</span>
                <div className="text-3xl font-black text-primary">R$ 1 - R$ 3</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabela Comparativa Tripla */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-black mb-3 md:mb-6">
              Compare você mesmo
            </h2>
            <p className="text-base md:text-xl text-muted-foreground">
              Números que falam por si
            </p>
          </div>

          {/* Mobile: Cards empilhados */}
          <div className="md:hidden space-y-4 max-w-sm mx-auto">
            {tripleComparison.map((item, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="font-bold text-sm">{item.metric}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 px-2 bg-destructive/5 rounded-lg">
                    <span className="text-xs text-destructive font-medium">Anúncios</span>
                    <span className="text-xs">{item.anuncios}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 px-2 bg-orange-500/5 rounded-lg">
                    <span className="text-xs text-orange-500 font-medium">Delivery</span>
                    <span className="text-xs">{item.delivery}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 px-2 bg-primary/10 rounded-lg">
                    <span className="text-xs text-primary font-medium">Clilin</span>
                    <span className="text-xs font-bold text-primary">{item.clilin}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Tabela */}
          <div className="hidden md:block max-w-5xl mx-auto">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
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
                  <div className="p-4 flex items-center justify-center bg-destructive/5 text-center">
                    <span className="text-xs">{item.anuncios}</span>
                  </div>
                  <div className="p-4 flex items-center justify-center bg-orange-500/5 text-center">
                    <span className="text-xs">{item.delivery}</span>
                  </div>
                  <div className="p-4 flex items-center justify-center bg-primary/5 text-center">
                    <span className="text-xs font-bold text-primary">{item.clilin}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Seção: Faça as Contas - EXPANDIDA */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-5xl font-black mb-2 md:mb-4">
                Faça as contas
              </h2>
              <p className="text-base md:text-xl text-muted-foreground">
                Cenário: Você quer <strong className="text-foreground">100 clientes</strong> esse mês
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-8">
              {/* Anúncios Online */}
              <div className="bg-card border-2 border-destructive/30 rounded-xl md:rounded-2xl p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-destructive/20 rounded-full flex items-center justify-center">
                    <XCircle className="w-4 h-4 md:w-5 md:h-5 text-destructive" />
                  </div>
                  <h3 className="text-sm md:text-lg font-bold text-destructive">Anúncios Online</h3>
                </div>
                
                <div className="space-y-2 md:space-y-4 text-xs md:text-sm">
                  <div className="flex justify-between items-center py-1.5 md:py-2 border-b border-border">
                    <span className="text-muted-foreground">100 clientes ÷ 3%</span>
                    <span className="font-mono font-bold">3.333 cliques</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 md:py-2 border-b border-border">
                    <span className="text-muted-foreground">3.333 × R$ 3</span>
                    <span className="font-mono font-bold text-destructive">R$ 10.000</span>
                  </div>
                  <div className="flex justify-between items-center py-2 md:py-3 bg-destructive/10 rounded-lg px-2 md:px-3 -mx-2 md:-mx-3">
                    <span className="font-bold text-xs md:text-sm">Por cliente:</span>
                    <span className="font-mono font-black text-destructive text-base md:text-xl">R$ 100</span>
                  </div>
                </div>
              </div>

              {/* App de Delivery */}
              <div className="bg-card border-2 border-orange-500/30 rounded-xl md:rounded-2xl p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <XCircle className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                  </div>
                  <h3 className="text-sm md:text-lg font-bold text-orange-500">App Delivery</h3>
                </div>
                
                <div className="space-y-2 md:space-y-4 text-xs md:text-sm">
                  <div className="flex justify-between items-center py-1.5 md:py-2 border-b border-border">
                    <span className="text-muted-foreground">100 × R$ 80</span>
                    <span className="font-mono font-bold">R$ 8.000</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 md:py-2 border-b border-border">
                    <span className="text-muted-foreground">Taxa 27%</span>
                    <span className="font-mono font-bold text-orange-500">- R$ 2.160</span>
                  </div>
                  <div className="flex justify-between items-center py-2 md:py-3 bg-orange-500/10 rounded-lg px-2 md:px-3 -mx-2 md:-mx-3">
                    <span className="font-bold text-xs md:text-sm">Por cliente:</span>
                    <span className="font-mono font-black text-orange-500 text-base md:text-xl">R$ 21,60</span>
                  </div>
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-2 md:mt-3 italic">
                  + cliente não é seu
                </p>
              </div>

              {/* Clilin */}
              <div className="bg-card border-2 border-primary rounded-xl md:rounded-2xl p-4 md:p-6 relative">
                <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 bg-primary text-primary-foreground text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow-lg">
                  ⚡ 50x MAIS BARATO
                </div>
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <h3 className="text-sm md:text-lg font-bold text-primary">Clilin</h3>
                </div>
                
                <div className="space-y-2 md:space-y-4 text-xs md:text-sm">
                  <div className="flex justify-between items-center py-1.5 md:py-2 border-b border-border">
                    <span className="text-muted-foreground">100 leads</span>
                    <span className="font-mono font-bold">100 clientes</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 md:py-2 border-b border-border">
                    <span className="text-muted-foreground">100 × R$ 2</span>
                    <span className="font-mono font-bold text-primary">R$ 200</span>
                  </div>
                  <div className="flex justify-between items-center py-2 md:py-3 bg-primary/10 rounded-lg px-2 md:px-3 -mx-2 md:-mx-3">
                    <span className="font-bold text-xs md:text-sm">Por cliente:</span>
                    <span className="font-mono font-black text-primary text-base md:text-xl">R$ 2</span>
                  </div>
                </div>
                <p className="text-[10px] md:text-xs text-primary mt-2 md:mt-3 font-medium">
                  ✓ Cliente vai pro SEU WhatsApp
                </p>
              </div>
            </div>

            {/* Frase de impacto */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl md:rounded-2xl p-4 md:p-8 text-center">
              <p className="text-sm md:text-2xl font-bold mb-2 md:mb-4">
                "Enquanto seu concorrente joga <span className="text-destructive">R$ 10.000/mês</span> em anúncios..."
              </p>
              <p className="text-lg md:text-3xl font-black text-primary">
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
              Por que empresas estão escolhendo a Clilin
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

      {/* Signup Section */}
      <section id="cadastro" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left: Benefits summary */}
              <div>
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-primary">Cadastro Gratuito</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-6">
                  Sirva sua comunidade. <span className="text-primary">Cresça junto.</span>
                </h2>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>R$ 1-3 por cliente real no seu WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Zero taxa sobre vendas</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Sem contrato, sem mensalidade</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Comece com apenas R$ 50</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>IA + divulgadores locais trabalhando 24h</span>
                  </li>
                </ul>
                <p className="text-muted-foreground text-sm">
                  Enquanto você lê isso, negócios da sua cidade já estão se conectando com clientes.
                </p>
              </div>

              {/* Right: Signup Form */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xl">
                <SignupForm 
                  role="COMPANY"
                  title="Cadastre sua empresa"
                  description="Crie sua conta e comece a receber clientes hoje"
                  buttonText="Cadastrar Minha Empresa"
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

export default ParaEmpresasPage;
