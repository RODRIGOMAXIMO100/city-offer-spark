import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  FileText
} from "lucide-react";
import logo from "@/assets/logo.png";

const scoreComponents = [
  {
    name: "CTR Esperado",
    weight: 40,
    description: "Taxa de cliques vs visualizações comparada com a média da cidade",
    tips: ["Crie títulos atrativos", "Ofereça descontos reais", "Use tags relevantes"],
    color: "bg-primary"
  },
  {
    name: "Qualidade da Oferta",
    weight: 30,
    description: "Baseado no percentual de desconto e completude da oferta",
    tips: ["Desconto de 50%+ = máximo", "Adicione descrição completa", "Use pelo menos 3 tags"],
    color: "bg-secondary"
  },
  {
    name: "Reputação da Empresa",
    weight: 20,
    description: "Instagram vinculado e tempo na plataforma",
    tips: ["Vincule seu Instagram", "Mantenha ofertas ativas", "Tempo na plataforma conta"],
    color: "bg-accent"
  },
  {
    name: "Relevância Local",
    weight: 10,
    description: "Performance das suas ofertas na sua cidade específica",
    tips: ["Foque em ofertas locais", "Conheça seu público", "Adapte às tendências"],
    color: "bg-affiliate"
  }
];

const cpcExamples = [
  { bid: 4, score: 8.0, rank: 32, realCpc: 4, position: 1 },
  { bid: 8, score: 5.0, rank: 40, realCpc: 7, position: 2 },
  { bid: 10, score: 4.0, rank: 40, realCpc: 9, position: 3 },
];

const earningsExamples = [
  { cpc: 4, company: "R$ 0,40", platform: "R$ 0,20", affiliate: "R$ 0,20", affiliateBase: 2 },
  { cpc: 8, company: "R$ 0,80", platform: "R$ 0,40", affiliate: "R$ 0,40", affiliateBase: 4 },
  { cpc: 12, company: "R$ 1,20", platform: "R$ 0,60", affiliate: "R$ 0,60", affiliateBase: 6 },
  { cpc: 15, company: "R$ 1,50", platform: "R$ 0,75", affiliate: "R$ 0,75", affiliateBase: 7.5 },
];

const levelMultipliers = [
  { name: "Bronze", multiplier: "1.0x", clicks: "0+", color: "bg-amber-600" },
  { name: "Prata", multiplier: "1.1x", clicks: "100+", color: "bg-gray-400" },
  { name: "Ouro", multiplier: "1.2x", clicks: "500+", color: "bg-yellow-500" },
  { name: "Diamante", multiplier: "1.3x", clicks: "1000+", color: "bg-blue-400" },
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
            Na Clilin, acreditamos em transparência. Aqui você encontra tudo sobre nosso sistema de leilão, 
            pontuação de ofertas e divisão de valores.
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
                <span className="hidden sm:inline">Leilão</span>
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

            {/* Tab 1: Leilão */}
            <TabsContent value="auction" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-bold mb-2">Sistema de Leilão Inteligente</h2>
                <p className="text-muted-foreground">Inspirado no Google Ads: pague o mínimo necessário</p>
              </div>

              {/* Formula Card */}
              <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
                    <div className="bg-card rounded-xl p-4 shadow-lg">
                      <p className="text-sm text-muted-foreground mb-1">Seu Lance</p>
                      <p className="text-2xl font-bold text-primary">8 C$</p>
                    </div>
                    <span className="text-2xl font-bold text-muted-foreground">×</span>
                    <div className="bg-card rounded-xl p-4 shadow-lg">
                      <p className="text-sm text-muted-foreground mb-1">Nota da Oferta</p>
                      <p className="text-2xl font-bold text-secondary">7.5</p>
                    </div>
                    <span className="text-2xl font-bold text-muted-foreground">=</span>
                    <div className="bg-card rounded-xl p-4 shadow-lg border-2 border-accent">
                      <p className="text-sm text-muted-foreground mb-1">Offer Rank</p>
                      <p className="text-2xl font-bold text-accent">60</p>
                    </div>
                  </div>
                  <p className="text-center mt-6 text-muted-foreground">
                    Maior Offer Rank = Melhor posição no feed dos divulgadores
                  </p>
                </CardContent>
              </Card>

              {/* How Real CPC Works */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    CPC Real: Pague Menos com Score Alto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Você define um <strong>lance máximo</strong> (4-15 C$), mas só paga o necessário 
                    para superar o concorrente. Quanto maior sua Nota da Oferta, menos você paga!
                  </p>
                  
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm font-medium mb-3">Exemplo prático na mesma cidade:</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-3">Empresa</th>
                            <th className="text-center py-2 px-3">Lance</th>
                            <th className="text-center py-2 px-3">Score</th>
                            <th className="text-center py-2 px-3">Rank</th>
                            <th className="text-center py-2 px-3">CPC Real</th>
                            <th className="text-center py-2 px-3">Posição</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cpcExamples.map((ex, i) => (
                            <tr key={i} className={i === 0 ? "bg-secondary/10" : ""}>
                              <td className="py-2 px-3 font-medium">
                                {i === 0 ? "Você ⭐" : `Concorrente ${i}`}
                              </td>
                              <td className="text-center py-2 px-3">{ex.bid} C$</td>
                              <td className="text-center py-2 px-3">{ex.score}</td>
                              <td className="text-center py-2 px-3 font-bold">{ex.rank}</td>
                              <td className="text-center py-2 px-3 text-secondary font-bold">{ex.realCpc} C$</td>
                              <td className="text-center py-2 px-3">
                                <Badge variant={i === 0 ? "default" : "secondary"}>#{ex.position}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      💡 A empresa com lance 4 C$ ganhou porque tem score 8.0! Pagou menos e ficou em 1º.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Key Points */}
              <div className="grid sm:grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-6 text-center">
                    <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h4 className="font-bold mb-1">Lance Mínimo</h4>
                    <p className="text-2xl font-bold text-primary">4 C$</p>
                    <p className="text-xs text-muted-foreground mt-1">R$ 0,40</p>
                  </CardContent>
                </Card>
                <Card className="bg-secondary/5 border-secondary/20">
                  <CardContent className="p-6 text-center">
                    <Target className="h-8 w-8 text-secondary mx-auto mb-3" />
                    <h4 className="font-bold mb-1">Lance Médio</h4>
                    <p className="text-2xl font-bold text-secondary">8 C$</p>
                    <p className="text-xs text-muted-foreground mt-1">R$ 0,80</p>
                  </CardContent>
                </Card>
                <Card className="bg-accent/5 border-accent/20">
                  <CardContent className="p-6 text-center">
                    <Award className="h-8 w-8 text-accent mx-auto mb-3" />
                    <h4 className="font-bold mb-1">Lance Máximo</h4>
                    <p className="text-2xl font-bold text-accent">15 C$</p>
                    <p className="text-xs text-muted-foreground mt-1">R$ 1,50</p>
                  </CardContent>
                </Card>
              </div>
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
                        <p className="font-medium text-sm">Desconto de 50%+</p>
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
                        <p className="font-medium text-sm">Mantenha bom CTR</p>
                        <p className="text-xs text-muted-foreground">Até +5 pontos no CTR Esperado</p>
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
                <p className="text-muted-foreground">Transparência total: 50% para você, 50% para a plataforma</p>
              </div>

              {/* Flow Diagram */}
              <Card className="bg-gradient-to-r from-company/5 via-muted to-affiliate/5">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                    <div className="bg-company text-company-foreground rounded-2xl p-6 text-center min-w-[140px]">
                      <p className="text-sm opacity-90 mb-1">Empresa paga</p>
                      <p className="text-3xl font-bold">100%</p>
                      <p className="text-xs opacity-75 mt-1">do CPC cobrado</p>
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
                        <p className="text-xs opacity-75 mt-1">comissão base</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Examples Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Exemplos de Divisão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4">CPC Cobrado</th>
                          <th className="text-center py-3 px-4">Empresa Paga</th>
                          <th className="text-center py-3 px-4">Plataforma (50%)</th>
                          <th className="text-center py-3 px-4">Divulgador (50%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {earningsExamples.map((ex, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/50">
                            <td className="py-3 px-4 font-medium">{ex.cpc} C$</td>
                            <td className="text-center py-3 px-4 text-company font-bold">{ex.company}</td>
                            <td className="text-center py-3 px-4 text-muted-foreground">{ex.platform}</td>
                            <td className="text-center py-3 px-4 text-affiliate font-bold">{ex.affiliate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    💡 O divulgador ainda pode ganhar bônus de até +30% com os multiplicadores de nível!
                  </p>
                </CardContent>
              </Card>

              {/* Why 50/50 */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3">Por que 50/50?</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                      <span><strong className="text-foreground">Sustentabilidade:</strong> mantém a plataforma funcionando com qualidade</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                      <span><strong className="text-foreground">Incentivo justo:</strong> divulgadores ganham bem por cada clique</span>
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
                <p className="text-muted-foreground">De R$ 0,20 a R$ 0,97 por clique (com bônus de nível)</p>
              </div>

              {/* Earnings Range */}
              <Card className="bg-gradient-to-r from-affiliate/10 to-affiliate/5 border-affiliate/20">
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Ganho por clique</p>
                  <div className="flex items-center justify-center gap-4">
                    <div>
                      <p className="text-4xl font-display font-bold text-affiliate">R$ 0,20</p>
                      <p className="text-xs text-muted-foreground">mínimo</p>
                    </div>
                    <span className="text-2xl text-muted-foreground">→</span>
                    <div>
                      <p className="text-4xl font-display font-bold text-affiliate">R$ 0,97</p>
                      <p className="text-xs text-muted-foreground">máximo*</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    *Com CPC máximo (15 C$) + multiplicador Diamante (1.3x)
                  </p>
                </CardContent>
              </Card>

              {/* Level Multipliers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Multiplicadores de Nível
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Quanto mais cliques você gera, maior seu nível e maior seu multiplicador de ganhos!
                  </p>
                  <div className="grid sm:grid-cols-4 gap-4">
                    {levelMultipliers.map((level, i) => (
                      <div key={i} className="text-center p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                        <div className={`w-12 h-12 ${level.color} rounded-full mx-auto mb-3 flex items-center justify-center`}>
                          <Award className="h-6 w-6 text-white" />
                        </div>
                        <p className="font-bold">{level.name}</p>
                        <p className="text-2xl font-display font-bold text-affiliate mt-1">{level.multiplier}</p>
                        <p className="text-xs text-muted-foreground">{level.clicks} cliques</p>
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
                    Baseado em CPC médio de 8 C$ (R$ 0,40 por clique base):
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="bg-card rounded-xl p-4 text-center border border-border">
                      <p className="text-sm text-muted-foreground">10 cliques/dia</p>
                      <p className="text-2xl font-bold text-affiliate mt-1">R$ 60</p>
                      <p className="text-xs text-muted-foreground">/mês</p>
                    </div>
                    <div className="bg-card rounded-xl p-4 text-center border border-border">
                      <p className="text-sm text-muted-foreground">50 cliques/dia</p>
                      <p className="text-2xl font-bold text-affiliate mt-1">R$ 300</p>
                      <p className="text-xs text-muted-foreground">/mês</p>
                    </div>
                    <div className="bg-card rounded-xl p-4 text-center border border-border">
                      <p className="text-sm text-muted-foreground">100 cliques/dia</p>
                      <p className="text-2xl font-bold text-affiliate mt-1">R$ 600</p>
                      <p className="text-xs text-muted-foreground">/mês</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    💡 Com nível Diamante (1.3x), esses valores podem ser até 30% maiores!
                  </p>
                </CardContent>
              </Card>

              {/* Important Notes */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Cliques Válidos
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Só cliques reais contam. Nosso sistema anti-fraude detecta bots, 
                      cliques repetidos e comportamentos suspeitos.
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
                      O saque mínimo é de R$ 30,00. Após atingir, solicite via PIX e 
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

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Clilin. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
