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
  Timer,
  Globe,
  FileText
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
      title: "Seja recompensado por ajudar",
      description: "Cada indicação fortalece um negócio local e gera saldo na sua conta."
    },
    {
      icon: Zap,
      title: "PIX em 24 horas",
      description: "Saque a partir de R$ 100. Receba o fruto do seu trabalho rapidinho."
    },
    {
      icon: Share2,
      title: "Zero criação de conteúdo",
      description: "Não precisa aparecer. Não precisa editar vídeo. Só conectar pessoas."
    },
    {
      icon: Award,
      title: "Cresça junto",
      description: "Comece com 70% e suba a cada cliente que traz. Quanto mais ajuda, mais cresce."
    },
    {
      icon: Smartphone,
      title: "Ofertas que fazem sentido",
      description: "Pizzaria, mecânica, salão... Negócios locais que você conhece e confia."
    },
    {
      icon: Shield,
      title: "Risco literalmente zero",
      description: "R$ 0 pra começar. Sem taxa. Sem pegadinha. Só propósito."
    }
  ];

  const faqs = [
    {
      question: "Preciso ter muitos seguidores?",
      answer: "Não! Você pode divulgar no WhatsApp da família, grupos de amigos, vizinhos. Qualquer pessoa pode começar. Aliás, grupos de WhatsApp convertem melhor que redes sociais."
    },
    {
      question: "Para onde o cliente vai quando clica?",
      answer: "Depende da escolha da empresa! Pode ser direto pro WhatsApp, pro site, ou pro cardápio digital. Você não precisa se preocupar com isso - a empresa já configurou o destino ideal pra ela."
    },
    {
      question: "Como funciona a comissão?",
      answer: "Você ganha 70% da recompensa que a empresa paga por cada cliente que aparece na loja. Ex.: recompensa de R$ 8, você leva R$ 5,60. Sua comissão sobe a cada nível: 10 resgates = Prata, 30 = Ouro, 75 = Platina, 150 = Diamante."
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
        description="Não precisa aparecer. Não precisa criar conteúdo. Não precisa vender NADA. Só indicar. Cada cliente que você leva à loja vira comissão na sua conta. PIX em 24h."
        keywords={["ganhar dinheiro online", "divulgador", "renda extra", "indicar negócios", "comissão por indicação", "trabalho de casa"]}
      />

      {/* Hero Section - AGRESSIVO */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-background to-background" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-10 w-72 h-72 bg-green-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1.5 md:px-4 md:py-2 mb-6 md:mb-8">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
              <span className="text-xs md:text-sm font-bold text-green-500">Oportunidade Real</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 md:mb-6 leading-tight">
              Ajude negócios locais a crescer e{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                seja recompensado
              </span>{" "}
              por isso
            </h1>
            
            <div className="max-w-3xl mx-auto space-y-2 md:space-y-4 mb-6 md:mb-8">
              <p className="text-base md:text-xl text-muted-foreground">
                ✨ Você já é referência na sua comunidade
              </p>
              <p className="text-base md:text-xl text-muted-foreground">
                ✨ Agora pode fortalecer negócios locais
              </p>
              <p className="text-base md:text-xl text-muted-foreground">
                ✨ E ser recompensado por cada conexão genuína
              </p>
              <p className="text-base md:text-xl text-foreground font-bold mt-4 md:mt-6">
                💛 Cada indicação que ajuda alguém = até <span className="text-green-500">R$ 1,50</span> na sua conta.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8 md:mb-12">
              <Button 
                size="lg" 
                className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25"
                onClick={() => document.getElementById('cadastro')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <DollarSign className="mr-2 w-4 h-4 md:w-5 md:h-5" />
                Começar a Ajudar
                <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 max-w-2xl mx-auto">
              <div className="bg-card/50 backdrop-blur border border-green-500/30 rounded-xl p-3 md:p-4">
                <div className="text-lg md:text-3xl font-black text-green-500">R$ 5,60</div>
                <div className="text-[10px] md:text-sm text-muted-foreground">por cliente</div>
              </div>
              <div className="bg-card/50 backdrop-blur border border-green-500/30 rounded-xl p-3 md:p-4">
                <div className="text-lg md:text-3xl font-black text-green-500">24h</div>
                <div className="text-[10px] md:text-sm text-muted-foreground">PIX na conta</div>
              </div>
              <div className="bg-card/50 backdrop-blur border border-green-500/30 rounded-xl p-3 md:p-4">
                <div className="text-lg md:text-3xl font-black text-green-500">R$ 0</div>
                <div className="text-[10px] md:text-sm text-muted-foreground">pra começar</div>
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
                    Manda a oferta no grupo. 3 pessoas vão até a loja e usam o cupom. <strong className="text-green-500">R$ 16,80 na sua conta.</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Destinos do Link */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="text-center mb-4">
                <p className="text-lg font-bold">
                  🎯 Para onde o cliente vai quando clica?
                </p>
                <p className="text-sm text-muted-foreground">
                  Depende da empresa! Cada uma escolhe o destino ideal:
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center text-center p-3 bg-green-500/5 rounded-xl border border-green-500/20">
                  <MessageCircle className="w-8 h-8 text-green-500 mb-2" />
                  <span className="text-xs font-bold">WhatsApp</span>
                  <span className="text-[10px] text-muted-foreground">Conversa direta</span>
                </div>
                <div className="flex flex-col items-center text-center p-3 bg-blue-500/5 rounded-xl border border-blue-500/20">
                  <Globe className="w-8 h-8 text-blue-500 mb-2" />
                  <span className="text-xs font-bold">Site</span>
                  <span className="text-[10px] text-muted-foreground">Página da empresa</span>
                </div>
                <div className="flex flex-col items-center text-center p-3 bg-purple-500/5 rounded-xl border border-purple-500/20">
                  <FileText className="w-8 h-8 text-purple-500 mb-2" />
                  <span className="text-xs font-bold">Cardápio</span>
                  <span className="text-[10px] text-muted-foreground">Menu digital</span>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3">
                Você só compartilha o link. O resto é automático!
              </p>
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
      <section id="calculator" className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-black mb-3 md:mb-6">
              Quanto você pode ganhar?
            </h2>
            <p className="text-base md:text-xl text-muted-foreground">
              Escolha seu perfil. Veja o resultado.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Mobile: Cards empilhados */}
            <div className="md:hidden space-y-3 max-w-sm mx-auto">
              {earnings.map((row, index) => (
                <div 
                  key={index} 
                  className={`bg-card border rounded-xl p-4 ${
                    row.highlight ? 'border-green-500/50 bg-green-500/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{row.emoji}</span>
                      <span className="font-bold">{row.perfil}</span>
                    </div>
                    {row.highlight && <Star className="w-4 h-4 text-green-500" />}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs text-muted-foreground">Leads/dia</div>
                      <div className="font-bold text-sm">{row.leadsdia}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Leads/mês</div>
                      <div className="font-bold text-sm">{row.leadsmes.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Ganho</div>
                      <div className={`font-black ${row.highlight ? 'text-green-500' : ''}`}>{row.ganho}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Tabela */}
            <div className="hidden md:block">
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
            </div>

            <p className="text-center text-muted-foreground mt-4 text-sm">
              *Recompensa R$ 8,00 × sua comissão 70% = R$ 5,60 por cliente na loja
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
                  O link leva pro WhatsApp, site ou cardápio - a empresa escolhe.
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
                  Comece a ajudar. <span className="text-green-500">Seja recompensado.</span>
                </h2>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>70% da recompensa por cada cliente na loja</span>
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
                    <span>Fortaleça negócios locais da sua comunidade</span>
                  </li>
                </ul>
                <p className="text-muted-foreground text-sm">
                  Enquanto você lê isso, divulgadores na sua cidade estão fazendo a diferença.
                </p>
              </div>

              {/* Right: Signup Form */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xl">
                <SignupForm 
                  role="AFFILIATE"
                  title="Crie sua conta"
                  description="Comece a fortalecer sua comunidade hoje"
                  buttonText="Começar a Ajudar"
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
