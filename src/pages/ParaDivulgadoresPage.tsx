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
  Calculator,
  AlertTriangle,
  Flame,
  MessageCircle,
  Sparkles,
  Timer
} from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Footer } from "@/components/landing/Footer";
import SignupForm from "@/components/auth/SignupForm";

const ParaDivulgadoresPage = () => {
  const earnings = [
    { perfil: "Casual", leadsdia: 10, leadsmes: 300, ganho: "R$ 450", emoji: "😊" },
    { perfil: "Ativo", leadsdia: 50, leadsmes: 1500, ganho: "R$ 2.250", emoji: "💪" },
    { perfil: "Dedicado", leadsdia: 100, leadsmes: 3000, ganho: "R$ 4.500", emoji: "🔥" },
    { perfil: "Profissional", leadsdia: 200, leadsmes: 6000, ganho: "R$ 9.000", emoji: "🚀", highlight: true },
    { perfil: "Top", leadsdia: 500, leadsmes: 15000, ganho: "R$ 22.500", emoji: "👑", highlight: true },
  ];

  const truthVsLies = [
    { 
      lie: "Crie conteúdo todo dia", 
      truth: "Só compartilha link",
      icon: Share2
    },
    { 
      lie: "Construa audiência por 2 anos", 
      truth: "Começa hoje, ganha hoje",
      icon: Timer
    },
    { 
      lie: "Espere 60 dias pra receber", 
      truth: "PIX em 24h",
      icon: Clock
    },
    { 
      lie: "Torça pro cliente comprar", 
      truth: "Ganha SÓ POR INDICAR",
      icon: DollarSign
    },
  ];

  const realExamples = [
    {
      persona: "Mãe no grupo da escola",
      action: "Compartilhou oferta de pizzaria",
      result: "47 mães clicaram",
      earning: "R$ 70,50",
      time: "em uma tarde",
      emoji: "👩‍👧‍👦"
    },
    {
      persona: "Jovem no Instagram Stories",
      action: "Postou link de barbearia",
      result: "89 cliques",
      earning: "R$ 133,50",
      time: "em 24h",
      emoji: "📱"
    },
    {
      persona: "Tio no grupo do condomínio",
      action: "Indicou mecânica de confiança",
      result: "23 vizinhos clicaram",
      earning: "R$ 34,50",
      time: "no café da manhã",
      emoji: "🏢"
    },
    {
      persona: "Estudante no grupo da facul",
      action: "Mandou oferta de hambúrguer",
      result: "156 colegas clicaram",
      earning: "R$ 234,00",
      time: "em 2 dias",
      emoji: "🎓"
    },
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: "Até R$ 1,50 por indicação",
      description: "Cada clique = dinheiro. Automático. Sem depender de venda."
    },
    {
      icon: Zap,
      title: "PIX em 24 horas",
      description: "Saque a partir de R$ 100. Sem esperar 30-60 dias."
    },
    {
      icon: Share2,
      title: "Zero criação de conteúdo",
      description: "Não precisa aparecer. Não precisa editar vídeo. Só mandar link."
    },
    {
      icon: Award,
      title: "Sistema de níveis",
      description: "Bronze 30%, Prata 40%, Ouro 50%. Quanto mais divulga, mais ganha."
    },
    {
      icon: Smartphone,
      title: "Ofertas que sua rede quer",
      description: "Pizzaria, mecânica, salão... Coisas locais que fazem sentido indicar."
    },
    {
      icon: Shield,
      title: "Risco literalmente zero",
      description: "R$ 0 pra começar. Sem taxa. Sem pegadinha. Só cadastrar."
    }
  ];

  const faqs = [
    {
      question: "Preciso ter muitos seguidores?",
      answer: "Não! Você pode divulgar no WhatsApp da família, grupos de amigos, vizinhos. Qualquer pessoa pode começar. Aliás, grupos de WhatsApp convertem melhor que redes sociais."
    },
    {
      question: "Como funciona a comissão?",
      answer: "Você ganha de 30% a 50% do valor que a empresa paga por cada lead. Começa com 30% e vai subindo conforme seu nível. 10 leads = Bronze, 50 = Prata, 100+ = Ouro."
    },
    {
      question: "Quando recebo o dinheiro?",
      answer: "Assim que atingir R$ 100, pode sacar via PIX. O dinheiro cai em até 24h. Nada de esperar 30-60 dias como em outros programas."
    },
    {
      question: "Preciso vender alguma coisa?",
      answer: "NÃO! Essa é a grande diferença. Você ganha quando alguém demonstra interesse (clica no link). A venda é problema da empresa, não seu."
    },
    {
      question: "É gratuito mesmo?",
      answer: "100% gratuito. Sem taxa de cadastro, sem mensalidade, sem 'pegadinha'. Você não investe nada, só ganha."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Para Divulgadores | Clilin - Ganhe R$ 22.500/mês só indicando"
        description="Não precisa aparecer. Não precisa criar conteúdo. Não precisa vender NADA. Só mandar um link. Cada clique = até R$ 1,50 na sua conta. PIX em 24h."
        keywords={["ganhar dinheiro online", "divulgador", "renda extra", "indicar negócios", "comissão por lead", "trabalho de casa"]}
      />

      {/* Hero Section - AGRESSIVO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-background to-background" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-10 w-72 h-72 bg-green-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-green-500" />
              <span className="text-sm font-bold text-green-500">Oportunidade Real</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              Enquanto você rola o feed, tem gente ganhando{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                R$ 22.500/mês
              </span>{" "}
              só indicando negócios
            </h1>
            
            <div className="max-w-3xl mx-auto space-y-4 mb-8">
              <p className="text-xl md:text-2xl text-muted-foreground">
                ❌ Não precisa aparecer
              </p>
              <p className="text-xl md:text-2xl text-muted-foreground">
                ❌ Não precisa criar conteúdo
              </p>
              <p className="text-xl md:text-2xl text-muted-foreground">
                ❌ Não precisa vender <strong className="text-foreground">NADA</strong>
              </p>
              <p className="text-xl md:text-2xl text-foreground font-bold mt-6">
                ✅ Só mandar um link. Cada clique = até <span className="text-green-500">R$ 1,50</span> na sua conta.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25"
                onClick={() => document.getElementById('cadastro')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <DollarSign className="mr-2 w-5 h-5" />
                Começar a Ganhar Agora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-card/50 backdrop-blur border border-green-500/30 rounded-xl p-4">
                <div className="text-2xl md:text-3xl font-black text-green-500">R$ 1,50</div>
                <div className="text-sm text-muted-foreground">por clique</div>
              </div>
              <div className="bg-card/50 backdrop-blur border border-green-500/30 rounded-xl p-4">
                <div className="text-2xl md:text-3xl font-black text-green-500">24h</div>
                <div className="text-sm text-muted-foreground">PIX na conta</div>
              </div>
              <div className="bg-card/50 backdrop-blur border border-green-500/30 rounded-xl p-4">
                <div className="text-2xl md:text-3xl font-black text-green-500">R$ 0</div>
                <div className="text-sm text-muted-foreground">pra começar</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* A VERDADE que ninguém conta */}
      <section className="py-20 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black mb-4">
                A <span className="text-destructive">VERDADE</span> que ninguém conta
              </h2>
              <p className="text-xl opacity-80">
                O que te vendem vs. A realidade Clilin
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* O que te vendem */}
              <div className="bg-destructive/20 rounded-2xl p-6 border border-destructive/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-destructive/30 rounded-full flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-destructive" />
                  </div>
                  <h3 className="text-xl font-bold text-destructive">O que te vendem</h3>
                </div>
                <ul className="space-y-4">
                  {truthVsLies.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                      <span className="opacity-80">{item.lie}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Realidade Clilin */}
              <div className="bg-green-500/20 rounded-2xl p-6 border border-green-500/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-500/30 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-green-400">Realidade Clilin</h3>
                </div>
                <ul className="space-y-4">
                  {truthVsLies.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="font-medium">{item.truth}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Por que funciona - Explicação Simples */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Por que funciona
            </h2>
            <p className="text-xl text-muted-foreground">
              Matemática simples. Sem mágica.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">💬</div>
                <div>
                  <p className="text-lg mb-2">
                    Seu vizinho pergunta: <em>"Conhece uma pizzaria boa?"</em>
                  </p>
                  <p className="text-muted-foreground">
                    Você manda o link. Ele clica. <strong className="text-green-500">R$ 1,50 no seu bolso.</strong> FIM.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">👨‍👩‍👧‍👦</div>
                <div>
                  <p className="text-lg mb-2">
                    Grupo da família reclamando que tá caro comer fora?
                  </p>
                  <p className="text-muted-foreground">
                    Manda oferta de 30% off. 15 pessoas clicam. <strong className="text-green-500">R$ 22,50 em 5 minutos.</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500/10 to-accent/10 border border-green-500/20 rounded-2xl p-6 text-center">
              <p className="text-xl font-bold">
                Não é mágica. É matemática:
              </p>
              <p className="text-2xl md:text-3xl font-black text-green-500 mt-2">
                200 cliques/dia × R$ 1,50 = R$ 9.000/mês
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Exemplos Reais Identificáveis */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Pessoas como você, ganhando
            </h2>
            <p className="text-xl text-muted-foreground">
              Exemplos reais de quanto você pode ganhar
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {realExamples.map((example, index) => (
              <div 
                key={index}
                className="bg-card border border-border rounded-2xl p-6 hover:border-green-500/50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{example.emoji}</span>
                  <h3 className="text-lg font-bold">{example.persona}</h3>
                </div>
                <p className="text-muted-foreground mb-3">{example.action}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">{example.result}</span>
                    <span className="text-xs text-muted-foreground ml-2">{example.time}</span>
                  </div>
                  <div className="text-xl font-black text-green-500">{example.earning}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabela de Ganhos */}
      <section id="calculator" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Quanto você pode ganhar?
            </h2>
            <p className="text-xl text-muted-foreground">
              Escolha seu perfil. Veja o resultado.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="grid grid-cols-5 bg-green-500/10">
                <div className="p-4 font-bold text-center text-sm">Perfil</div>
                <div className="p-4 font-bold text-center text-sm">Leads/dia</div>
                <div className="p-4 font-bold text-center text-sm">Leads/mês</div>
                <div className="p-4 font-bold text-center text-sm">Ganho</div>
                <div className="p-4 font-bold text-center text-sm"></div>
              </div>
              
              {earnings.map((row, index) => (
                <div 
                  key={index} 
                  className={`grid grid-cols-5 border-t border-border ${
                    row.highlight ? 'bg-green-500/10' : ''
                  }`}
                >
                  <div className="p-4 text-center font-medium flex items-center justify-center gap-2">
                    <span>{row.emoji}</span>
                    <span className="text-sm">{row.perfil}</span>
                  </div>
                  <div className="p-4 text-center text-sm">{row.leadsdia}</div>
                  <div className="p-4 text-center text-sm">{row.leadsmes.toLocaleString()}</div>
                  <div className={`p-4 text-center font-bold ${row.highlight ? 'text-green-500 text-lg' : ''}`}>
                    {row.ganho}
                  </div>
                  <div className="p-4 text-center">
                    {row.highlight && <Star className="w-5 h-5 text-green-500 mx-auto" />}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-muted-foreground mt-4 text-sm">
              *CPL R$ 3,00 × Comissão Ouro (50%) = R$ 1,50/lead
            </p>
          </div>
        </div>
      </section>

      {/* FOMO Section */}
      <section className="py-20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-y border-amber-500/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-full px-4 py-2 mb-6">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-amber-500">Atenção</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-6">
                Por que você deveria começar <span className="text-amber-500">AGORA</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border border-amber-500/30 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Menos concorrência = mais dinheiro</h3>
                    <p className="text-sm text-muted-foreground">
                      Quanto menos divulgadores na sua cidade, mais você ganha por oferta.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-amber-500/30 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Quem chega primeiro sobe de nível</h3>
                    <p className="text-sm text-muted-foreground">
                      Seus leads de hoje contam pro seu ranking. Comece antes de todo mundo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-amber-500/30 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Ofertas novas todo dia</h3>
                    <p className="text-sm text-muted-foreground">
                      Empresas entram na plataforma diariamente. Oportunidade constante.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-amber-500/30 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">R$ 0 pra começar</h3>
                    <p className="text-sm text-muted-foreground">
                      Literalmente zero risco. Se não funcionar pra você, não perdeu nada.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-xl font-bold text-amber-500">
                👉 Enquanto você pensa, alguém na sua cidade já está ganhando.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona - 3 Passos */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              3 passos. Sem complicação.
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <Share2 className="w-12 h-12 text-green-500 mx-auto mb-4 mt-4" />
                <h3 className="text-xl font-bold mb-2">Escolha uma oferta</h3>
                <p className="text-muted-foreground text-sm">
                  Pizzaria, mecânica, salão... Ofertas da sua cidade.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  2
                </div>
                <Smartphone className="w-12 h-12 text-green-500 mx-auto mb-4 mt-4" />
                <h3 className="text-xl font-bold mb-2">Compartilhe</h3>
                <p className="text-muted-foreground text-sm">
                  WhatsApp, Instagram, grupos... Só copiar e mandar.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  3
                </div>
                <DollarSign className="w-12 h-12 text-green-500 mx-auto mb-4 mt-4" />
                <h3 className="text-xl font-bold mb-2">Ganhe</h3>
                <p className="text-muted-foreground text-sm">
                  Cada clique = até R$ 1,50. Automático. PIX em 24h.
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
                className="bg-card border border-border rounded-xl p-6 hover:border-green-500/50 transition-colors"
              >
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
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
              Dúvidas comuns
            </h2>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <h3 className="text-lg font-bold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground text-sm">{faq.answer}</p>
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
                <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
                  <Megaphone className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-bold text-green-500">Cadastro Gratuito</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-6">
                  Comece a ganhar. <span className="text-green-500">Agora.</span>
                </h2>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Até R$ 1,50 por indicação</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>PIX em 24 horas</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Zero investimento inicial</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Não precisa criar conteúdo</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Ganha só por indicar (não precisa vender)</span>
                  </li>
                </ul>
                <p className="text-muted-foreground text-sm">
                  Enquanto você lê isso, divulgadores na sua cidade estão ganhando.
                </p>
              </div>

              {/* Right: Signup Form */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xl">
                <SignupForm 
                  role="AFFILIATE"
                  title="Crie sua conta"
                  description="Comece a ganhar dinheiro hoje mesmo"
                  buttonText="Começar a Ganhar"
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

export default ParaDivulgadoresPage;
