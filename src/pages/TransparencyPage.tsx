import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/landing/Footer";
import { 
  ArrowRight, 
  TrendingUp, 
  Star, 
  DollarSign, 
  Users, 
  Target,
  Zap,
  Award,
  ArrowLeft,
  Calculator,
  BarChart3,
  Percent,
  CheckCircle2,
  Info,
  Instagram,
  FileText,
  AlertCircle
} from "lucide-react";
import logo from "@/assets/logo.png";
import { PRICING_DISCLAIMER } from "@/types/database";

const scoreComponents = [
  {
    name: "Taxa de Conversão",
    weight: 40,
    description: "Taxa de leads vs visualizações comparada com a média da cidade",
    tips: ["Crie títulos atrativos", "Ofereça descontos reais", "Adicione imagens de qualidade"],
    color: "bg-primary"
  },
  {
    name: "Qualidade da Oferta",
    weight: 35,
    description: "Baseado no percentual de desconto e completude da oferta",
    tips: ["Desconto de 30%+ = máximo", "Adicione descrição completa", "Preços claros e atrativos"],
    color: "bg-secondary"
  },
  {
    name: "Reputação da Empresa",
    weight: 25,
    description: "Instagram vinculado e tempo na plataforma",
    tips: ["Vincule seu Instagram", "Mantenha ofertas ativas", "Tempo na plataforma conta"],
    color: "bg-accent"
  }
];


// FASE 1: taxa = 15% do preco (min R$3). Divulgador 50% base (Bronze), ate 70% (Diamante).
// CPL de R$ 1,00 a R$ 3,00
const earningsExamples = [
  { cpl: 2000, company: "R$ 3,00", platform: "R$ 1,50", affiliate: "R$ 1,50", affiliateBase: 150 },
  { cpl: 5000, company: "R$ 7,50", platform: "R$ 3,75", affiliate: "R$ 3,75", affiliateBase: 375 },
  { cpl: 10000, company: "R$ 15,00", platform: "R$ 7,50", affiliate: "R$ 7,50", affiliateBase: 750 },
];

// Niveis alinhados com o banco: fatia = share base (0.50) x commission_multiplier
const levelMultipliers = [
  { name: "Bronze", multiplier: "", commission: "50%", leads: "0", color: "bg-amber-600" },
  { name: "Prata", multiplier: "", commission: "55%", leads: "10", color: "bg-gray-400" },
  { name: "Ouro", multiplier: "", commission: "60%", leads: "30", color: "bg-yellow-500" },
  { name: "Platina", multiplier: "", commission: "65%", leads: "75", color: "bg-cyan-500" },
  { name: "Diamante", multiplier: "", commission: "70%", leads: "150", color: "bg-blue-500" },
];

export default function TransparencyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="clilin" className="h-8" />
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Começar Agora</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-4">
            <Info className="h-3 w-3 mr-1" />
            Transparência Total
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4">
            Entenda como <span className="text-primary">funciona</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Na Clilin, acreditamos em transparência. Aqui você encontra tudo sobre o pagamento por resgate, 
            a nota das ofertas e a divisão de valores.
          </p>
        </div>
      </section>

      {/* Tabs Content */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue="auction" className="space-y-8">
            <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full gap-2 h-auto p-2 bg-muted/50">
              <TabsTrigger value="auction" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Pagamento</span>
              </TabsTrigger>
              <TabsTrigger value="score" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Nota da Oferta</span>
              </TabsTrigger>
              <TabsTrigger value="division" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Percent className="h-4 w-4" />
                <span className="hidden sm:inline">Divisão</span>
              </TabsTrigger>
              <TabsTrigger value="earnings" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Ganhos</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Pagamento por resgate */}
            <TabsContent value="auction" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-bold mb-2">Você só paga por resultado</h2>
                <p className="text-muted-foreground">Nada de mensalidade nem cobrança por clique. Você paga apenas quando um cliente novo vai até a sua loja e usa o cupom.</p>

                <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-amber-600 dark:text-amber-400">{PRICING_DISCLAIMER.short}</span>
                </div>
              </div>

              <Card className="bg-gradient-to-br from-secondary/5 via-primary/5 to-secondary/5 border-primary/20">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Como funciona o pagamento por resgate
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/50 rounded-xl text-center">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-lg">📣</span></div>
                      <p className="text-sm font-medium mb-1">1. Divulgadores espalham</p>
                      <p className="text-xs text-muted-foreground">Pessoas da cidade compartilham a sua oferta</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl text-center">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-lg">🎟️</span></div>
                      <p className="text-sm font-medium mb-1">2. Cliente pega o cupom</p>
                      <p className="text-xs text-muted-foreground">E leva até a sua loja pra usar</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl text-center">
                      <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-lg">✅</span></div>
                      <p className="text-sm font-medium mb-1">3. Você confirma</p>
                      <p className="text-xs text-muted-foreground">Só aí a taxa é cobrada</p>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-muted-foreground">
                    <strong className="text-foreground">Cliques e cadastros no caminho são de graça.</strong> Servem só pra você medir o alcance da campanha — você nunca paga por eles.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    A taxa é 15% do preço da oferta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    A taxa é 15% do preço da oferta, com mínimo de R$ 3,00, e só é cobrada quando o cliente aparece na loja e usa o cupom. Quanto maior o valor da oferta, mais atrativo fica para os divulgadores.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/50 rounded-xl text-center">
                      <p className="text-sm font-medium mb-1">Oferta de R$ 20</p>
                      <p className="text-2xl font-bold text-secondary">R$ 3,00</p>
                      <p className="text-xs text-muted-foreground mt-1">taxa mínima</p>
                    </div>
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-center">
                      <p className="text-sm font-medium mb-1">Oferta de R$ 50</p>
                      <p className="text-2xl font-bold text-primary">R$ 7,50</p>
                      <p className="text-xs text-muted-foreground mt-1">15% do preço</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl text-center">
                      <p className="text-sm font-medium mb-1">Oferta de R$ 100</p>
                      <p className="text-2xl font-bold text-accent">R$ 15,00</p>
                      <p className="text-xs text-muted-foreground mt-1">15% do preço</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-secondary/5 to-primary/5 border-secondary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                    Por que isso é bom pra você
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/50 rounded-xl text-center">
                      <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-2"><Users className="h-5 w-5 text-secondary" /></div>
                      <p className="font-bold text-secondary">Cliente de verdade</p>
                      <p className="text-xs text-muted-foreground mt-2">Gente que apareceu na sua loja, não só um clique</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl text-center">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2"><Target className="h-5 w-5 text-primary" /></div>
                      <p className="font-bold text-primary">Sem risco</p>
                      <p className="text-xs text-muted-foreground mt-2">Ninguém apareceu? Você não paga nada</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl text-center">
                      <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-2"><Zap className="h-5 w-5 text-accent" /></div>
                      <p className="font-bold text-accent">Você no controle</p>
                      <p className="text-xs text-muted-foreground mt-2">Ajusta o preço da oferta quando quiser</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Nota da Oferta */}
            <TabsContent value="score" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-bold mb-2">Entenda a Nota da Oferta</h2>
                <p className="text-muted-foreground">Sua nota de 0 a 10 que determina quanto você paga</p>
              </div>

              {/* Score Scale */}
              <Card className="bg-gradient-to-r from-destructive/10 via-yellow-500/10 to-secondary/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-destructive">Ruim (0-4)</span>
                    <span className="text-sm font-medium text-yellow-500">Bom (5-6)</span>
                    <span className="text-sm font-medium text-secondary">Excelente (7-10)</span>
                  </div>
                  <div className="h-4 rounded-full bg-gradient-to-r from-destructive via-yellow-500 to-secondary" />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>0</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </CardContent>
              </Card>

              {/* Components */}
              <div className="grid md:grid-cols-2 gap-6">
                {scoreComponents.map((comp, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${comp.color}`} />
                          {comp.name}
                        </CardTitle>
                        <Badge variant="outline" className="text-lg font-bold">
                          {comp.weight}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{comp.description}</p>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs font-medium mb-2">Como melhorar:</p>
                        <ul className="space-y-1">
                          {comp.tips.map((tip, j) => (
                            <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                              <CheckCircle2 className="h-3 w-3 text-secondary shrink-0 mt-0.5" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {/* Progress bar */}
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${comp.color}`} 
                          style={{ width: `${comp.weight}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Tips Card */}
              <Card className="bg-secondary/5 border-secondary/20">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                    Dicas para aumentar seu Score
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Instagram className="h-5 w-5 text-pink-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Vincule seu Instagram</p>
                        <p className="text-xs text-muted-foreground">+2 pontos na Reputação</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Percent className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Desconto de 30%+</p>
                        <p className="text-xs text-muted-foreground">+3 pontos na Qualidade</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Descrição completa</p>
                        <p className="text-xs text-muted-foreground">+1 ponto na Qualidade</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <BarChart3 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Mantenha boa conversão</p>
                        <p className="text-xs text-muted-foreground">Até +5 pontos na Taxa de Conversão</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Divisão */}
            <TabsContent value="division" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-bold mb-2">Divisão de Valores</h2>
                <p className="text-muted-foreground">Sistema progressivo: de 50% a 70% para você conforme evolui</p>
              </div>

              {/* Flow Diagram */}
              <Card className="bg-gradient-to-r from-company/5 via-muted to-affiliate/5">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                    <div className="bg-company text-company-foreground rounded-2xl p-6 text-center min-w-[140px]">
                      <p className="text-sm opacity-90 mb-1">Empresa paga</p>
                      <p className="text-3xl font-bold">100%</p>
                      <p className="text-xs opacity-75 mt-1">da taxa</p>
                    </div>
                    
                    <ArrowRight className="h-8 w-8 text-muted-foreground rotate-90 md:rotate-0" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted rounded-2xl p-6 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Plataforma</p>
                        <p className="text-3xl font-bold">50%</p>
                        <p className="text-xs text-muted-foreground mt-1">operação + tech</p>
                      </div>
                      <div className="bg-affiliate text-affiliate-foreground rounded-2xl p-6 text-center">
                        <p className="text-sm opacity-90 mb-1">Divulgador</p>
                        <p className="text-3xl font-bold">50%</p>
                        <p className="text-xs opacity-75 mt-1">comissão base*</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-center mt-4 text-sm text-muted-foreground">
                    * Com níveis, a comissão pode chegar a <strong className="text-affiliate">70%</strong> (Nível Diamante)
                  </p>
                </CardContent>
              </Card>

              {/* Level Progression Card */}
              <Card className="border-affiliate/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-affiliate" />
                    Progressão de Comissões
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Quanto mais clientes você leva à loja, maior sua comissão! Comece com 50% e chegue a 70%.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {levelMultipliers.map((level, i) => (
                      <div key={i} className={`text-center p-4 rounded-xl border-2 ${i === 2 ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-border bg-muted/30'}`}>
                        <div className={`w-10 h-10 ${level.color} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                          <Award className="h-5 w-5 text-white" />
                        </div>
                        <p className="font-bold">{level.name}</p>
                        <p className="text-2xl font-display font-bold text-affiliate mt-1">{level.commission}</p>
                        <p className="text-xs text-muted-foreground">{level.leads} resgates</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Examples Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Exemplos de Divisão (Nível Bronze - 50%)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4">Preço da oferta</th>
                          <th className="text-center py-3 px-4">Empresa Paga</th>
                          <th className="text-center py-3 px-4">Plataforma (50%)</th>
                          <th className="text-center py-3 px-4">Divulgador (50%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {earningsExamples.map((ex, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/50">
                            <td className="py-3 px-4 font-medium">R$ {(ex.cpl / 100).toFixed(2).replace('.', ',')}</td>
                            <td className="text-center py-3 px-4 text-company font-bold">{ex.company}</td>
                            <td className="text-center py-3 px-4 text-muted-foreground">{ex.platform}</td>
                            <td className="text-center py-3 px-4 text-affiliate font-bold">{ex.affiliate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    💡 No nível Ouro (60%), o divulgador ganharia R$ 1,80, R$ 4,50 e R$ 9,00 respectivamente!
                  </p>
                </CardContent>
              </Card>

              {/* Why 30% base */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3">Por que 50% base com progressão?</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                      <span><strong className="text-foreground">Meritocracia:</strong> quem mais divulga, mais ganha (até 70%)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                      <span><strong className="text-foreground">Sustentabilidade:</strong> mantém a plataforma funcionando com qualidade</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                      <span><strong className="text-foreground">Incentivo claro:</strong> Bronze 50% → Ouro 60% → Diamante 70%</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                      <span><strong className="text-foreground">Transparência:</strong> sem taxas escondidas ou surpresas</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 4: Ganhos */}
            <TabsContent value="earnings" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-bold mb-2">Ganhos do Divulgador</h2>
                <p className="text-muted-foreground">Você leva 70% ou mais da recompensa por cada cliente na loja</p>
              </div>

              {/* Earnings Range */}
              <Card className="bg-gradient-to-r from-affiliate/10 to-affiliate/5 border-affiliate/20">
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Ganho por cliente na loja</p>
                  <div className="flex items-center justify-center gap-4">
                    <div>
                      <p className="text-4xl font-display font-bold text-affiliate">R$ 1,50</p>
                      <p className="text-xs text-muted-foreground">mínimo (oferta de R$ 20)</p>
                    </div>
                    <span className="text-2xl text-muted-foreground">→</span>
                    <div>
                      <p className="text-4xl font-display font-bold text-affiliate">R$ 10,50</p>
                      <p className="text-xs text-muted-foreground">exemplo (oferta de R$ 100)*</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    *Oferta de R$ 100 → taxa R$ 15,00 × nível Diamante (70%)
                  </p>
                </CardContent>
              </Card>

              {/* Level Multipliers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Sistema de Níveis e Comissões
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Quanto mais clientes você leva à loja, maior seu nível e sua comissão!
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {levelMultipliers.map((level, i) => (
                      <div key={i} className={`text-center p-4 rounded-xl transition-colors ${i === 2 ? 'bg-yellow-500/10 border-2 border-yellow-500/30' : 'bg-muted/50 hover:bg-muted'}`}>
                        <div className={`w-12 h-12 ${level.color} rounded-full mx-auto mb-3 flex items-center justify-center`}>
                          <Award className="h-6 w-6 text-white" />
                        </div>
                        <p className="font-bold">{level.name}</p>
                        <p className="text-2xl font-display font-bold text-affiliate mt-1">{level.commission}</p>
                        <p className="text-xs text-muted-foreground">{level.leads} resgates</p>
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground">Oferta R$ 50 (taxa R$ 7,50) =</p>
                          <p className="text-sm font-bold text-affiliate">
                            R$ {(7.50 * parseFloat(level.commission) / 100).toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Earnings Simulator */}
              <Card className="bg-secondary/5 border-secondary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-secondary" />
                    Simulador de Ganhos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Baseado em ofertas de R$ 50 → taxa R$ 7,50 (R$ 3,75 por cliente no Bronze - 50%):
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="bg-card rounded-xl p-4 text-center border border-border">
                      <p className="text-sm text-muted-foreground">10 resgates/mês</p>
                      <p className="text-2xl font-bold text-affiliate mt-1">R$ 38</p>
                      <p className="text-xs text-muted-foreground">(Bronze)</p>
                    </div>
                    <div className="bg-card rounded-xl p-4 text-center border border-border">
                      <p className="text-sm text-muted-foreground">30 resgates/mês</p>
                      <p className="text-2xl font-bold text-affiliate mt-1">R$ 113</p>
                      <p className="text-xs text-muted-foreground">(Bronze)</p>
                    </div>
                    <div className="bg-card rounded-xl p-4 text-center border border-border">
                      <p className="text-sm text-muted-foreground">60 resgates/mês</p>
                      <p className="text-2xl font-bold text-affiliate mt-1">R$ 225</p>
                      <p className="text-xs text-muted-foreground">(Bronze)</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-sm text-center">
                      💡 Com nível <strong className="text-yellow-600">Ouro (60%)</strong>, os mesmos 60 resgates/mês = <strong className="text-affiliate">R$ 270/mês</strong>!
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Important Notes */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      O que conta
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Só clientes reais que resgatam o cupom na loja contam. Nosso sistema anti-fraude 
                      detecta duplicados e comportamentos suspeitos.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-secondary" />
                      Saque Mínimo
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      O saque mínimo é de R$ 100,00. Após atingir, solicite via PIX e 
                      receba em até 24 horas úteis.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-display font-bold mb-4">Pronto para começar?</h2>
          <p className="text-muted-foreground mb-6">
            Seja empresa ou divulgador, a Clilin é para você.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-company hover:bg-company/90">
              <Link to="/auth?role=COMPANY">
                Sou Empresa
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-affiliate text-affiliate hover:bg-affiliate hover:text-affiliate-foreground">
              <Link to="/auth?role=AFFILIATE">
                Sou Divulgador
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
