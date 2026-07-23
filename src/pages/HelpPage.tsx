import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Building2, Users, MessageCircle, DollarSign, Star, TrendingUp, Shield, HelpCircle, Calculator, Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

const HelpPage = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('company');

  useEffect(() => {
    if (role === 'COMPANY') setActiveTab('company');
    else if (role === 'AFFILIATE') setActiveTab('affiliate');
    else if (role === 'CLIENT') setActiveTab('client');
  }, [role]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Central de Ajuda | Clilin"
        description="Encontre todas as informações sobre como usar a Clilin. Guia completo para empresas, divulgadores e clientes."
      />
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Central de Ajuda</h1>
              <p className="text-xs text-muted-foreground">Estamos aqui para te ajudar a crescer! 💛</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Empresas</span>
            </TabsTrigger>
            <TabsTrigger value="affiliate" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Divulgadores</span>
            </TabsTrigger>
            <TabsTrigger value="client" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Clientes</span>
            </TabsTrigger>
          </TabsList>

          {/* EMPRESAS */}
          <TabsContent value="company" className="space-y-6">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Guia para Empresas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Conecte-se com clientes da sua comunidade! Aqui você aprende como criar ofertas incríveis e fortalecer seu negócio local. 💛
                </p>
              </CardContent>
            </Card>

            <Accordion type="single" collapsible className="space-y-2">
              <AccordionItem value="cpl" className="border rounded-lg px-4 border-primary/30 bg-primary/5">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Calculator className="h-5 w-5 text-primary" />
                    <span className="font-bold">⭐ Como funciona o pagamento por resgate</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                    <p className="text-sm font-medium text-primary mb-2">
                      💡 Você só paga por cliente que aparece na loja
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Na Clilin você paga apenas quando um cliente novo <strong>vai até a sua loja e usa o cupom</strong>. Resultado de verdade — não clique, não cadastro.
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span>📝</span>
                        <span><strong>Divulgadores locais</strong> espalham a sua oferta pela cidade</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>✅</span>
                        <span><strong>O cliente pega o cupom</strong> e leva até a sua loja</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>📱</span>
                        <span><strong>Você confirma o resgate</strong> no balcão — e só aí a taxa é cobrada</span>
                      </li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Cliques e cadastros no caminho são de graça: servem só pra você medir o alcance.
                    </p>
                  </div>
                  <p className="text-muted-foreground">
                    A taxa é 15% do preço da oferta (mínimo R$ 3,00), cobrada só quando o cliente aparece na loja. Exemplos:
                  </p>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <span className="font-medium text-green-600">Oferta de R$ 20</span>
                      <span className="font-bold text-green-600">R$ 3,00 por cliente</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <span className="font-medium text-yellow-600">Oferta de R$ 50</span>
                      <span className="font-bold text-yellow-600">R$ 7,50 por cliente</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <span className="font-medium text-blue-600">Oferta de R$ 100</span>
                      <span className="font-bold text-blue-600">R$ 15,00 por cliente</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Quanto maior o valor da oferta, maior a taxa — e mais atrativo fica para os divulgadores levarem clientes até você.
                  </p>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mt-4">
                    <p className="text-sm text-blue-600">
                      📊 <strong>Sem risco:</strong> se ninguém aparecer na loja, você não paga nada. Você investe só quando o cliente já está na sua frente.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="score" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-primary" />
                    <span>Sistema de Notas</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <p className="text-muted-foreground">
                    Sua nota é calculada com base em 3 fatores e influencia o destaque da sua oferta:
                  </p>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">Taxa de Conversão (Leads/Views)</span>
                        <span className="text-primary font-bold">40%</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Proporção entre visualizações e leads gerados. Ofertas que convertem mais têm nota maior.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">Qualidade da Oferta</span>
                        <span className="text-primary font-bold">35%</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Desconto real, descrição completa, imagens de qualidade.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">Reputação</span>
                        <span className="text-primary font-bold">25%</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Instagram vinculado, tempo na plataforma, histórico de ofertas.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="offers" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span>Regras de Ofertas</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Máximo de <strong>3 ofertas ativas</strong> simultaneamente</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>Você define a <strong>data de expiração</strong> da sua oferta</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Você pode <strong>editar ou renovar</strong> ofertas existentes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span>Ofertas só são exibidas se você tiver <strong>saldo suficiente</strong></span>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="credits" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span>Créditos e Pagamentos</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <p className="text-muted-foreground">
                    Adicione créditos para manter suas ofertas ativas:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>PIX:</strong> Confirmação instantânea, sem taxa adicional</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Cartão:</strong> Parcelamento em até 12x (com juros)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>Créditos são descontados apenas quando um cliente <strong>usa o cupom na sua loja</strong></span>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-company" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    <span>Perguntas Frequentes</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">O que é um lead válido?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Quando um usuário real preenche o formulário com nome e WhatsApp. Nosso sistema anti-fraude verifica automaticamente a autenticidade do contato.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Como recebo os leads captados?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Todos os leads aparecem no seu dashboard com nome e WhatsApp. Você pode iniciar uma conversa diretamente ou exportar em CSV.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Por que minha oferta não aparece?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Verifique se: 1) Você tem saldo suficiente; 2) A oferta não expirou; 3) A oferta está marcada como ativa.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Posso alterar o preço depois de criar a oferta?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Sim! Você pode editar todos os detalhes da oferta a qualquer momento.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">O que acontece se meu saldo acabar?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Suas ofertas ficam pausadas automaticamente e voltam a aparecer quando você adicionar créditos.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* DIVULGADORES */}
          <TabsContent value="affiliate" className="space-y-6">
            <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  Guia para Divulgadores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Ajude negócios locais a crescerem e seja recompensado por isso! Entenda como funciona o sistema de comissões e níveis. 💛
                </p>
              </CardContent>
            </Card>

            <Accordion type="single" collapsible className="space-y-2">
              <AccordionItem value="withdrawal" className="border rounded-lg px-4 border-yellow-500/30 bg-yellow-500/5">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-yellow-500" />
                    <span className="font-bold">⭐ Regras de Saque</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                      <span className="text-muted-foreground">Saque Mínimo</span>
                      <span className="font-bold text-primary text-lg">R$ 100,00</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                      <span className="text-muted-foreground">Método</span>
                      <span className="font-bold">PIX Instantâneo</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                      <span className="text-muted-foreground">Prazo de Análise</span>
                      <span className="font-bold">Até 48h úteis</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 mt-4">
                    <p className="text-sm font-medium mb-2">📋 Dados Necessários:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• CPF válido</li>
                      <li>• Nome completo (igual ao CPF)</li>
                      <li>• Chave PIX (CPF, e-mail, telefone ou aleatória)</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="commission" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span>Como Funciona a Comissão</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-center text-lg font-bold text-green-600 mb-2">
                      Ganhe 50% da taxa por cliente que você leva à loja! 🚀
                    </p>
                    <p className="text-center text-sm text-muted-foreground">
                      Comece com 50% da taxa e chegue a 70% subindo de nível
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
                    <p className="text-sm text-blue-600">
                      📝 <strong>Você ganha por resultado:</strong> a comissão cai na sua conta quando o cliente que você indicou vai até a loja e usa o cupom — não por clique.
                    </p>
                  </div>
                  <div className="grid gap-3 mt-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <span>Bronze (base)</span>
                      <span className="font-bold text-orange-600">50% da taxa</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-400/10 border border-slate-400/20">
                      <span>Prata (10 resgates)</span>
                      <span className="font-bold text-slate-600">55% da taxa</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <span>Ouro (30 resgates)</span>
                      <span className="font-bold text-yellow-600">60% da taxa</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Dica:</strong> Quanto mais clientes você leva até a loja, mais rápido sobe de nível e maior sua comissão!
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="levels" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span>Sistema de Níveis</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <p className="text-muted-foreground">
                    Quanto mais clientes você leva até a loja, maior sua comissão:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🥉</span>
                        <div>
                          <span className="font-medium">Bronze</span>
                          <p className="text-xs text-muted-foreground">0 resgates</p>
                        </div>
                      </div>
                      <span className="font-bold text-orange-600">50%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-400/10 border border-slate-400/20">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🥈</span>
                        <div>
                          <span className="font-medium">Prata</span>
                          <p className="text-xs text-muted-foreground">10 resgates</p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-600">55%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🥇</span>
                        <div>
                          <span className="font-medium">Ouro</span>
                          <p className="text-xs text-muted-foreground">30 resgates</p>
                        </div>
                      </div>
                      <span className="font-bold text-yellow-600">60%</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="valid-leads" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <span>O que conta como cliente</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <p className="text-muted-foreground">
                    Para gerar comissão, o cliente precisa:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Pegar o cupom e <strong>usar na loja</strong> (resgate confirmado pelo lojista)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Ser um <strong>cliente novo</strong> (1 resgate por telefone/oferta)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Passar pela <strong>validação anti-fraude</strong> (sessão válida, dispositivo real)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Ter <strong>telefone válido</strong> no formato brasileiro</span>
                    </li>
                  </ul>
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mt-4">
                    <p className="text-sm text-red-600">
                      ⚠️ Leads fraudulentos (dados falsos, auto-cadastro, bots) são automaticamente bloqueados e podem resultar em banimento.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-affiliate" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-green-500" />
                    <span>Perguntas Frequentes</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">Quando recebo meu saque?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Após solicitar, o saque passa por análise (até 48h úteis). Aprovado, o PIX é instantâneo.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Por que meu saque foi rejeitado?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Possíveis motivos: dados incorretos, CPF inválido, chave PIX não pertence a você, ou atividade suspeita detectada.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Como aumento meu nível?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Levando clientes até a loja! Quanto mais pessoas usam o cupom que você indicou, mais rápido você sobe de nível.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Posso divulgar em qualquer lugar?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Sim, desde que seja de forma ética. Grupos de WhatsApp, redes sociais, e-mail são ótimos canais. Evite spam.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* CLIENTES */}
          <TabsContent value="client" className="space-y-6">
            <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                  Guia para Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Descubra ofertas incríveis e apoie os negócios da sua comunidade! Aqui você aprende a usar a Clilin. 💛
                </p>
              </CardContent>
            </Card>

            <Accordion type="single" collapsible className="space-y-2">
              <AccordionItem value="how-it-works" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-blue-500" />
                    <span>Como Funciona a Clilin</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <span className="text-2xl">1️⃣</span>
                      <div>
                        <p className="font-medium">Pergunte o que você quer</p>
                        <p className="text-sm text-muted-foreground">
                          Digite no chat: "Quero pizza", "Busco desconto em academia", "Preciso de um pet shop"
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <span className="text-2xl">2️⃣</span>
                      <div>
                        <p className="font-medium">A IA busca as melhores ofertas</p>
                        <p className="text-sm text-muted-foreground">
                          Nossa inteligência artificial encontra ofertas relevantes na sua cidade
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <span className="text-2xl">3️⃣</span>
                      <div>
                        <p className="font-medium">Escolha e aproveite</p>
                        <p className="text-sm text-muted-foreground">
                          Clique na oferta que te interessar e seja direcionado para a empresa
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="chat-tips" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                    <span>Dicas para Usar o Chat</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Seja específico: "Pizza com desconto" é melhor que só "comida"</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Você pode perguntar várias vezes para encontrar mais opções</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>A IA entende português naturalmente, escreva como preferir</span>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="security-client" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-500" />
                    <span>Segurança e Confiança</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Todas as empresas são <strong>verificadas</strong> antes de entrar na plataforma</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Empresas com <strong>Instagram vinculado</strong> são mais confiáveis</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Descontos são <strong>reais</strong> - mostramos preço antigo e novo</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Você é direcionado diretamente para o <strong>canal oficial</strong> da empresa (WhatsApp, site ou cardápio)</span>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-client" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-blue-500" />
                    <span>Perguntas Frequentes</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">A Clilin é gratuita?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Sim! Para clientes, a Clilin é 100% gratuita. Você só aproveita os descontos.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Preciso criar conta?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Para usar o chat e ver ofertas, sim. Mas é rápido e simples!
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Como sei se a empresa é confiável?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Empresas com Instagram vinculado passaram por verificação. Você pode conferir o perfil antes de entrar em contato.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">E se o desconto não for real?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Denuncie! Ofertas enganosas são removidas e a empresa pode ser banida da plataforma.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>

        {/* Contact Section */}
        <Card className="mt-8">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Ainda tem dúvidas?</h3>
            <p className="text-muted-foreground mb-4">
              Visite nossa página de transparência ou entre em contato conosco.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/transparencia')}>
                Página de Transparência
              </Button>
              <Button variant="outline" onClick={() => navigate('/termos')}>
                Termos de Uso
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default HelpPage;
