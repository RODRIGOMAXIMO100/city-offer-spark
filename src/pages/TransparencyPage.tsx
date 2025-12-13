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
    tips: ["Crie títulos atrativos", "Ofereça descontos reais", "Use tags relevantes"],
    color: "bg-primary"
  },
  {
    name: "Qualidade da Oferta",
    weight: 35,
    description: "Baseado no percentual de desconto e completude da oferta",
    tips: ["Desconto de 30%+ = máximo", "Adicione descrição completa", "Use pelo menos 3 tags"],
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

// Exemplos de CPL automático baseado na nota (R$ 0,60 a R$ 1,50)
// Fórmula: CPL = 15 centavos × (14 - Nota)
const cplExamples = [
  { score: 10, cpl: 60, position: 1, reason: "Nota máxima = CPL mínimo" },
  { score: 7, cpl: 105, position: 2, reason: "Nota inicial padrão" },
  { score: 4, cpl: 150, position: 3, reason: "Nota mínima = CPL máximo" },
];

// Exemplos corrigidos: 30% base para afiliados (Plataforma 70%, Afiliado 30%)
// CPL de R$ 0,60 a R$ 1,50
const earningsExamples = [
  { cpl: 60, company: "R$ 0,60", platform: "R$ 0,42", affiliate: "R$ 0,18", affiliateBase: 18 },
  { cpl: 105, company: "R$ 1,05", platform: "R$ 0,74", affiliate: "R$ 0,31", affiliateBase: 31 },
  { cpl: 150, company: "R$ 1,50", platform: "R$ 1,05", affiliate: "R$ 0,45", affiliateBase: 45 },
];

// Níveis alinhados com banco de dados: Bronze 1.0x (30%), Prata 1.33x (~40%), Ouro 1.67x (~50%)
const levelMultipliers = [
  { name: "Bronze", multiplier: "1.0x", commission: "30%", leads: "0+", color: "bg-amber-600" },
  { name: "Prata", multiplier: "1.33x", commission: "40%", leads: "100+", color: "bg-gray-400" },
  { name: "Ouro", multiplier: "1.67x", commission: "50%", leads: "500+", color: "bg-yellow-500" },
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

            {/* Tab 1: CPL Automático */}
            <TabsContent value="auction" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-bold mb-2">Custo por Lead Qualificado</h2>
                <p className="text-muted-foreground">Você só paga quando recebe um lead com nome e WhatsApp. Sua Nota define o custo.</p>
                
                {/* Lead Qualificado Explanation */}
                <div className="max-w-2xl mx-auto mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl text-left">
                  <p className="text-sm font-medium text-primary mb-2">
                    💡 O que é um Lead Qualificado na Clilin?
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Diferente de plataformas que cobram por impressões ou cliques genéricos, na Clilin você paga apenas 
                    quando um cliente <strong>preenche seus dados</strong> (nome e WhatsApp) demonstrando interesse real:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2 p-2 bg-background rounded-lg">
                      <span className="text-lg">🤖</span>
                      <div>
                        <p className="text-xs font-medium">Via Assistente IA</p>
                        <p className="text-xs text-muted-foreground">Cliente pediu ativamente por ofertas como a sua</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-background rounded-lg">
                      <span className="text-lg">👥</span>
                      <div>
                        <p className="text-xs font-medium">Via Divulgadores</p>
                        <p className="text-xs text-muted-foreground">Indicação de confiança por alguém da sua cidade</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Disclaimer Badge */}
                <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-amber-600 dark:text-amber-400">{PRICING_DISCLAIMER.short}</span>
                </div>
              </div>

              {/* Formula Card */}
              <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
                    <div className="bg-card rounded-xl p-4 shadow-lg">
                      <p className="text-sm text-muted-foreground mb-1">Constante</p>
                      <p className="text-2xl font-bold text-primary">R$ 0,15</p>
                    </div>
                    <span className="text-2xl font-bold text-muted-foreground">×</span>
                    <div className="bg-card rounded-xl p-4 shadow-lg">
                      <p className="text-sm text-muted-foreground mb-1">(14 − Nota)</p>
                      <p className="text-2xl font-bold text-secondary">(14 − 7)</p>
                    </div>
                    <span className="text-2xl font-bold text-muted-foreground">=</span>
                    <div className="bg-card rounded-xl p-4 shadow-lg border-2 border-accent">
                      <p className="text-sm text-muted-foreground mb-1">CPL</p>
                      <p className="text-2xl font-bold text-accent">R$ 1,05</p>
                    </div>
                  </div>
                  <p className="text-center mt-6 text-muted-foreground">
                    Quanto maior sua nota, menor o custo por lead!
                  </p>
                </CardContent>
              </Card>

              {/* How CPL Works */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Custo por Lead = R$ 0,15 × (14 − Nota)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    O custo por lead é calculado automaticamente. Não há lances manuais! 
                    Sua única tarefa é <strong>melhorar a qualidade da oferta</strong> para pagar menos por cada lead qualificado.
                  </p>
                  
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm font-medium mb-3">Tabela de Custo por Nota:</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-border">
                            <th className="text-center py-2 px-3">Nota</th>
                            <th className="text-center py-2 px-3">Custo por Lead</th>
                            <th className="text-left py-2 px-3">Significado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cplExamples.map((ex, i) => (
                            <tr key={i} className={i === 0 ? "bg-secondary/10" : ""}>
                              <td className="text-center py-2 px-3 font-bold">{ex.score}</td>
                              <td className="text-center py-2 px-3 text-secondary font-bold">R$ {(ex.cpl / 100).toFixed(2).replace('.', ',')}</td>
                              <td className="py-2 px-3 text-muted-foreground">{ex.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      💡 Ofertas novas começam com Nota 7. Melhore sua oferta para pagar menos!
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Key Points */}
              <div className="grid sm:grid-cols-3 gap-4">
                <Card className="bg-secondary/5 border-secondary/20">
                  <CardContent className="p-6 text-center">
                    <Zap className="h-8 w-8 text-secondary mx-auto mb-3" />
                    <h4 className="font-bold mb-1">Nota 10</h4>
                    <p className="text-2xl font-bold text-secondary">R$ 0,60</p>
                    <p className="text-xs text-muted-foreground mt-1">por lead qualificado</p>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-6 text-center">
                    <Target className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h4 className="font-bold mb-1">Nota 7</h4>
                    <p className="text-2xl font-bold text-primary">R$ 1,05</p>
                    <p className="text-xs text-muted-foreground mt-1">por lead qualificado</p>
                  </CardContent>
                </Card>
                <Card className="bg-destructive/5 border-destructive/20">
                  <CardContent className="p-6 text-center">
                    <Award className="h-8 w-8 text-destructive mx-auto mb-3" />
                    <h4 className="font-bold mb-1">Nota 4</h4>
                    <p className="text-2xl font-bold text-destructive">R$ 1,50</p>
                    <p className="text-xs text-muted-foreground mt-1">por lead qualificado</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Comparison Section */}
              <Card className="bg-gradient-to-r from-muted/50 to-muted/30 border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Comparativo: Lead Qualificado vs Outras Métricas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                      <p className="text-xs text-muted-foreground mb-1">Redes Sociais</p>
                      <p className="font-bold text-red-500">Impressão</p>
                      <p className="text-xs text-muted-foreground mt-2">Alguém viu = Zero garantia de interesse</p>
                    </div>
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center">
                      <p className="text-xs text-muted-foreground mb-1">Google Ads</p>
                      <p className="font-bold text-yellow-600">Clique Genérico</p>
                      <p className="text-xs text-muted-foreground mt-2">Alguém clicou = Pode ser curiosidade</p>
                    </div>
                    <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-xl text-center">
                      <p className="text-xs text-muted-foreground mb-1">Clilin</p>
                      <p className="font-bold text-secondary">Lead Qualificado</p>
                      <p className="text-xs text-muted-foreground mt-2">Nome + WhatsApp = Cliente pronto para contato</p>
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
                <p className="text-muted-foreground">Sistema progressivo: de 30% a 50% para você conforme evolui</p>
              </div>

              {/* Flow Diagram */}
              <Card className="bg-gradient-to-r from-company/5 via-muted to-affiliate/5">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                    <div className="bg-company text-company-foreground rounded-2xl p-6 text-center min-w-[140px]">
                      <p className="text-sm opacity-90 mb-1">Empresa paga</p>
                      <p className="text-3xl font-bold">100%</p>
                      <p className="text-xs opacity-75 mt-1">do CPL cobrado</p>
                    </div>
                    
                    <ArrowRight className="h-8 w-8 text-muted-foreground rotate-90 md:rotate-0" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted rounded-2xl p-6 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Plataforma</p>
                        <p className="text-3xl font-bold">70%</p>
                        <p className="text-xs text-muted-foreground mt-1">operação + tech</p>
                      </div>
                      <div className="bg-affiliate text-affiliate-foreground rounded-2xl p-6 text-center">
                        <p className="text-sm opacity-90 mb-1">Divulgador</p>
                        <p className="text-3xl font-bold">30%</p>
                        <p className="text-xs opacity-75 mt-1">comissão base*</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-center mt-4 text-sm text-muted-foreground">
                    * Com níveis, a comissão pode chegar a <strong className="text-affiliate">50%</strong> (Nível Ouro)
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
                    Quanto mais leads você gera, maior sua comissão! Comece com 30% e chegue a 50%.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {levelMultipliers.map((level, i) => (
                      <div key={i} className={`text-center p-4 rounded-xl border-2 ${i === 2 ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-border bg-muted/30'}`}>
                        <div className={`w-10 h-10 ${level.color} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                          <Award className="h-5 w-5 text-white" />
                        </div>
                        <p className="font-bold">{level.name}</p>
                        <p className="text-2xl font-display font-bold text-affiliate mt-1">{level.commission}</p>
                        <p className="text-xs text-muted-foreground">{level.leads} leads</p>
                        <p className="text-xs text-muted-foreground/70">({level.multiplier})</p>
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
                    Exemplos de Divisão (Nível Bronze - 30%)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4">CPL Cobrado</th>
                          <th className="text-center py-3 px-4">Empresa Paga</th>
                          <th className="text-center py-3 px-4">Plataforma (70%)</th>
                          <th className="text-center py-3 px-4">Divulgador (30%)</th>
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
                    💡 No nível Ouro (50%), o divulgador ganharia R$ 0,30, R$ 0,53 e R$ 0,75 respectivamente!
                  </p>
                </CardContent>
              </Card>

              {/* Why 30% base */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3">Por que 30% base com progressão?</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                      <span><strong className="text-foreground">Meritocracia:</strong> quem mais divulga, mais ganha (até 50%)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                      <span><strong className="text-foreground">Sustentabilidade:</strong> mantém a plataforma funcionando com qualidade</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                      <span><strong className="text-foreground">Incentivo claro:</strong> Bronze 30% → Prata 40% → Ouro 50%</span>
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
                <p className="text-muted-foreground">De R$ 0,18 a R$ 0,75 por lead (conforme seu nível)</p>
              </div>

              {/* Earnings Range */}
              <Card className="bg-gradient-to-r from-affiliate/10 to-affiliate/5 border-affiliate/20">
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Ganho por lead</p>
                  <div className="flex items-center justify-center gap-4">
                    <div>
                      <p className="text-4xl font-display font-bold text-affiliate">R$ 0,18</p>
                      <p className="text-xs text-muted-foreground">mínimo (Bronze)</p>
                    </div>
                    <span className="text-2xl text-muted-foreground">→</span>
                    <div>
                      <p className="text-4xl font-display font-bold text-affiliate">R$ 0,75</p>
                      <p className="text-xs text-muted-foreground">máximo (Ouro)*</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    *Com CPL máximo (R$ 1,50) + nível Ouro (50%)
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
                    Quanto mais leads você gera, maior seu nível e maior sua comissão!
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {levelMultipliers.map((level, i) => (
                      <div key={i} className={`text-center p-4 rounded-xl transition-colors ${i === 2 ? 'bg-yellow-500/10 border-2 border-yellow-500/30' : 'bg-muted/50 hover:bg-muted'}`}>
                        <div className={`w-12 h-12 ${level.color} rounded-full mx-auto mb-3 flex items-center justify-center`}>
                          <Award className="h-6 w-6 text-white" />
                        </div>
                        <p className="font-bold">{level.name}</p>
                        <p className="text-2xl font-display font-bold text-affiliate mt-1">{level.commission}</p>
                        <p className="text-xs text-muted-foreground">{level.leads} leads</p>
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground">CPL R$ 1,05 =</p>
                          <p className="text-sm font-bold text-affiliate">
                            R$ {(1.05 * parseFloat(level.commission) / 100).toFixed(2).replace('.', ',')}
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
                    Baseado em CPL médio de R$ 1,05 (R$ 0,32 por lead para Bronze - 30%):
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="bg-card rounded-xl p-4 text-center border border-border">
                      <p className="text-sm text-muted-foreground">5 leads/dia</p>
                      <p className="text-2xl font-bold text-affiliate mt-1">R$ 48</p>
                      <p className="text-xs text-muted-foreground">/mês (Bronze)</p>
                    </div>
                    <div className="bg-card rounded-xl p-4 text-center border border-border">
                      <p className="text-sm text-muted-foreground">15 leads/dia</p>
                      <p className="text-2xl font-bold text-affiliate mt-1">R$ 144</p>
                      <p className="text-xs text-muted-foreground">/mês (Bronze)</p>
                    </div>
                    <div className="bg-card rounded-xl p-4 text-center border border-border">
                      <p className="text-sm text-muted-foreground">30 leads/dia</p>
                      <p className="text-2xl font-bold text-affiliate mt-1">R$ 288</p>
                      <p className="text-xs text-muted-foreground">/mês (Bronze)</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-sm text-center">
                      💡 Com nível <strong className="text-yellow-600">Ouro (50%)</strong>, os mesmos 30 leads/dia = <strong className="text-affiliate">R$ 480/mês</strong>!
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
                      Leads Válidos
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Só leads reais contam. Nosso sistema anti-fraude detecta bots, 
                      cadastros duplicados e comportamentos suspeitos.
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
