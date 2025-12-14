import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Megaphone, 
  DollarSign, 
  Zap, 
  Users, 
  TrendingUp, 
  Shield, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  Star,
  Clock,
  Smartphone,
  Share2,
  Award,
  Calculator
} from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Footer } from "@/components/landing/Footer";

const ParaDivulgadoresPage = () => {
  const earnings = [
    { perfil: "Iniciante", leadsdia: 10, leadsmes: 300, ganho: "R$ 450" },
    { perfil: "Intermediário", leadsdia: 50, leadsmes: 1500, ganho: "R$ 2.250" },
    { perfil: "Dedicado", leadsdia: 100, leadsmes: 3000, ganho: "R$ 4.500" },
    { perfil: "Profissional", leadsdia: 200, leadsmes: 6000, ganho: "R$ 9.000", highlight: true },
    { perfil: "Top Divulgador", leadsdia: 500, leadsmes: 15000, ganho: "R$ 22.500", highlight: true },
  ];

  const comparisons = [
    { 
      tradicional: "Comissão de 5-10% da venda", 
      clilin: "Comissão de 30-50% do lead",
      icon: DollarSign
    },
    { 
      tradicional: "Pagamento em 30-60 dias", 
      clilin: "PIX em 24h (mín R$ 100)",
      icon: Clock
    },
    { 
      tradicional: "Precisa criar conteúdo", 
      clilin: "Só copiar e compartilhar link",
      icon: Share2
    },
    { 
      tradicional: "Precisa ter audiência enorme", 
      clilin: "Qualquer pessoa pode começar",
      icon: Users
    },
    { 
      tradicional: "Depende de alguém comprar", 
      clilin: "Ganha só por indicar interesse",
      icon: TrendingUp
    },
    { 
      tradicional: "Programa complicado", 
      clilin: "Cadastro em 2 minutos",
      icon: Zap
    },
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: "Até R$ 1,50 por indicação",
      description: "Cada pessoa que clica no seu link e demonstra interesse = dinheiro no seu bolso. Automático."
    },
    {
      icon: Zap,
      title: "PIX em 24 horas",
      description: "Saque mínimo de R$ 100. Pediu, caiu na conta. Sem esperar 30-60 dias."
    },
    {
      icon: Share2,
      title: "Só compartilhar",
      description: "Não precisa criar conteúdo. Não precisa convencer ninguém a comprar. Só indicar."
    },
    {
      icon: Award,
      title: "Sistema de níveis",
      description: "Quanto mais você divulga, maior sua comissão. Bronze 30%, Prata 40%, Ouro 50%."
    },
    {
      icon: Smartphone,
      title: "Ofertas locais",
      description: "Indique pizzarias, mecânicas, salões da sua cidade. Coisas que sua rede realmente quer."
    },
    {
      icon: Shield,
      title: "Sem risco",
      description: "Gratuito pra começar. Sem investimento. Sem taxa. Só cadastrar e divulgar."
    }
  ];

  const faqs = [
    {
      question: "Preciso ter muitos seguidores?",
      answer: "Não. Você pode divulgar no WhatsApp da família, grupos de amigos, vizinhos. Qualquer pessoa pode começar."
    },
    {
      question: "Como funciona a comissão?",
      answer: "Você ganha de 30% a 50% do valor que a empresa paga por cada lead. Quanto mais você divulga, maior sua porcentagem."
    },
    {
      question: "Quando recebo o dinheiro?",
      answer: "Assim que atingir R$ 100, pode sacar via PIX. O dinheiro cai em até 24h."
    },
    {
      question: "Preciso vender alguma coisa?",
      answer: "Não! Você ganha quando alguém demonstra interesse (clica no link). Não precisa vender nada."
    },
    {
      question: "É gratuito?",
      answer: "Sim, 100% gratuito. Sem taxa de cadastro, sem mensalidade, sem pegadinha."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Para Divulgadores | Clilin - Ganhe até R$ 22.500/mês indicando negócios"
        description="Ganhe dinheiro indicando negócios da sua cidade. Comissão de até 50%. PIX em 24h. Sem precisar criar conteúdo ou ter milhões de seguidores."
        keywords={["ganhar dinheiro online", "divulgador", "renda extra", "indicar negócios", "comissão por lead"]}
      />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-background to-background" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-10 w-72 h-72 bg-accent/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-2 mb-8">
              <Megaphone className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">Para Divulgadores</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              Ganhe{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                R$ 9.000/mês
              </span>{" "}
              indicando negócios da sua cidade
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Sem criar conteúdo. Sem ter milhões de seguidores. <strong className="text-foreground">Só indicar.</strong>{" "}
              Comissão de até <strong className="text-accent">50%</strong> em PIX instantâneo.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg" className="text-lg px-8 py-6 bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link to="/auth?type=affiliate">
                  Começar a Ganhar Agora
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link to="#calculator">
                  Calcular meus ganhos
                  <Calculator className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-4">
                <div className="text-2xl md:text-3xl font-black text-accent">50%</div>
                <div className="text-sm text-muted-foreground">Comissão máx</div>
              </div>
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-4">
                <div className="text-2xl md:text-3xl font-black text-accent">24h</div>
                <div className="text-sm text-muted-foreground">PIX na conta</div>
              </div>
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-4">
                <div className="text-2xl md:text-3xl font-black text-accent">R$ 0</div>
                <div className="text-sm text-muted-foreground">Pra começar</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Earnings Table */}
      <section id="calculator" className="py-20 bg-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Quanto você pode ganhar?
            </h2>
            <p className="text-xl text-muted-foreground">
              Matemática simples. CPL R$ 3,00 x Comissão 50% = <strong className="text-foreground">R$ 1,50 por lead</strong>
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="grid grid-cols-4 bg-accent/10">
                <div className="p-4 font-bold text-center">Perfil</div>
                <div className="p-4 font-bold text-center">Leads/dia</div>
                <div className="p-4 font-bold text-center">Leads/mês</div>
                <div className="p-4 font-bold text-center">Ganho Mensal</div>
              </div>
              
              {earnings.map((row, index) => (
                <div 
                  key={index} 
                  className={`grid grid-cols-4 border-t border-border ${
                    row.highlight ? 'bg-accent/10' : ''
                  }`}
                >
                  <div className="p-4 text-center font-medium">
                    {row.perfil}
                    {row.highlight && <Star className="w-4 h-4 text-accent inline ml-2" />}
                  </div>
                  <div className="p-4 text-center">{row.leadsdia}</div>
                  <div className="p-4 text-center">{row.leadsmes.toLocaleString()}</div>
                  <div className={`p-4 text-center font-bold ${row.highlight ? 'text-accent text-lg' : ''}`}>
                    {row.ganho}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-muted-foreground mt-4 text-sm">
              *Baseado em CPL R$ 3,00 com comissão nível Ouro (50%)
            </p>
          </div>
        </div>
      </section>

      {/* How it works simple */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Como funciona
            </h2>
            <p className="text-xl text-muted-foreground">
              3 passos. Sem complicação.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold">
                  1
                </div>
                <Share2 className="w-12 h-12 text-accent mx-auto mb-4 mt-4" />
                <h3 className="text-xl font-bold mb-2">Escolha uma oferta</h3>
                <p className="text-muted-foreground">
                  Pizzaria, mecânica, salão... Ofertas da sua cidade que sua rede vai querer.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold">
                  2
                </div>
                <Smartphone className="w-12 h-12 text-accent mx-auto mb-4 mt-4" />
                <h3 className="text-xl font-bold mb-2">Compartilhe o link</h3>
                <p className="text-muted-foreground">
                  WhatsApp, Instagram, grupos... Onde preferir. Só copiar e mandar.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold">
                  3
                </div>
                <DollarSign className="w-12 h-12 text-accent mx-auto mb-4 mt-4" />
                <h3 className="text-xl font-bold mb-2">Ganhe por cada clique</h3>
                <p className="text-muted-foreground">
                  Alguém clicou e demonstrou interesse? Até R$ 1,50 na sua conta. Automático.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Por que a Clilin é diferente
            </h2>
            <p className="text-xl text-muted-foreground">
              Programas de afiliados tradicionais vs Divulgador Clilin
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="grid grid-cols-3 bg-muted/50">
                <div className="p-4 font-semibold text-center"></div>
                <div className="p-4 font-semibold text-center text-destructive">Modelo Tradicional</div>
                <div className="p-4 font-semibold text-center text-accent">Divulgador Clilin</div>
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
                  <div className="p-4 flex items-center gap-2 bg-accent/5">
                    <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-sm font-medium">{item.clilin}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key difference */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20 rounded-2xl p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-black mb-8 text-center">
                A diferença que muda tudo
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-destructive/20">
                  <h3 className="text-xl font-bold mb-4 text-destructive">Programas tradicionais</h3>
                  <p className="text-lg mb-4">
                    Você indica um produto de R$ 100
                  </p>
                  <p className="text-lg mb-4">
                    A pessoa <strong>precisa comprar</strong>
                  </p>
                  <p className="text-lg">
                    Você ganha 5% = <strong className="text-destructive">R$ 5</strong>
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    (em 30-60 dias)
                  </p>
                </div>

                <div className="bg-card/50 backdrop-blur rounded-xl p-6 border border-accent/20">
                  <h3 className="text-xl font-bold mb-4 text-accent">Divulgador Clilin</h3>
                  <p className="text-lg mb-4">
                    Você indica uma pizzaria
                  </p>
                  <p className="text-lg mb-4">
                    A pessoa <strong>só demonstra interesse</strong>
                  </p>
                  <p className="text-lg">
                    Você ganha = <strong className="text-accent text-2xl">R$ 1,50</strong>
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    (PIX em 24h)
                  </p>
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-xl">
                  <strong>Não precisa vender.</strong> Só indicar. A empresa fecha a venda, você ganha mesmo assim.
                </p>
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
              Tudo que você precisa saber
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="bg-card border border-border rounded-xl p-6 hover:border-accent/50 transition-colors"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Real examples */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Exemplos reais
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="text-4xl mb-4">🍕</div>
              <h3 className="font-bold mb-2">Pizzaria do bairro</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Você manda no grupo da família: "Gente, pizzaria do João tá com 30% de desconto"
              </p>
              <p className="text-accent font-bold">
                5 pessoas clicam = R$ 7,50
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="font-bold mb-2">Mecânica</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Seu vizinho pergunta de mecânico. Você manda o link da oferta.
              </p>
              <p className="text-accent font-bold">
                1 clique = R$ 1,50
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="text-4xl mb-4">💇</div>
              <h3 className="font-bold mb-2">Salão de beleza</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Você posta no status: "Salão da Maria com 40% off"
              </p>
              <p className="text-accent font-bold">
                20 pessoas clicam = R$ 30
              </p>
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
            <div className="bg-gradient-to-br from-accent to-accent/80 rounded-3xl p-8 md:p-12 text-accent-foreground">
              <Star className="w-12 h-12 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-black mb-4">
                500 leads por mês = R$ 22.500
              </h2>
              <p className="text-xl opacity-90 mb-4">
                Não é promessa. É matemática.
              </p>
              <p className="text-lg opacity-80 mb-8 max-w-2xl mx-auto">
                Cadastro gratuito. Sem investimento. Comece agora e receba seu primeiro PIX em 24h.
              </p>
              
              <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-6">
                <Link to="/auth?type=affiliate">
                  Quero Ser Divulgador
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>

              <p className="mt-6 text-sm opacity-70">
                Divulgadores na sua cidade já estão ganhando. Não fique de fora.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ParaDivulgadoresPage;
