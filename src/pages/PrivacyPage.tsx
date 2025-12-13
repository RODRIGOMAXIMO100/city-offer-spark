import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/landing/Footer';
import logo from '@/assets/logo.png';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Link to="/">
            <img src={logo} alt="clilin" className="h-8" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-display font-bold mb-2">Política de Privacidade</h1>
        <p className="text-muted-foreground mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          {/* Resumo LGPD */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-primary mb-3">🔒 Compromisso com a LGPD</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              A clilin está em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong>. 
              Tratamos seus dados pessoais com transparência, segurança e respeito aos seus direitos. 
              Você tem controle total sobre suas informações.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">1. Introdução e Definições</h2>
            <p className="text-muted-foreground leading-relaxed">
              Esta Política de Privacidade descreve como a <strong>clilin</strong> ("nós", "nosso" ou "Plataforma") 
              coleta, utiliza, armazena, compartilha e protege os dados pessoais dos usuários em conformidade 
              com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018).
            </p>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">1.1. Definições Importantes</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Dado Pessoal:</strong> Informação relacionada a pessoa natural identificada ou identificável.</li>
              <li><strong>Dado Pessoal Sensível:</strong> Dado sobre origem racial, convicção religiosa, opinião política, saúde, vida sexual, dado genético ou biométrico.</li>
              <li><strong>Titular:</strong> Pessoa natural a quem se referem os dados pessoais (você).</li>
              <li><strong>Controlador:</strong> Pessoa que decide sobre o tratamento dos dados (clilin).</li>
              <li><strong>Operador:</strong> Pessoa que realiza o tratamento em nome do controlador.</li>
              <li><strong>Tratamento:</strong> Toda operação realizada com dados pessoais (coleta, uso, armazenamento, etc.).</li>
              <li><strong>ANPD:</strong> Autoridade Nacional de Proteção de Dados.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">2. Dados que Coletamos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Coletamos apenas os dados necessários para a prestação dos nossos serviços, seguindo o princípio da minimização:
            </p>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">2.1. Dados de Cadastro</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Nome completo</strong> (para identificação e emissão de documentos)</li>
              <li><strong>CPF</strong> (para verificação de identidade e prevenção de fraudes)</li>
              <li><strong>E-mail</strong> (para comunicação e acesso à conta)</li>
              <li><strong>Telefone</strong> (para contato e verificação)</li>
              <li><strong>Cidade de atuação</strong> (para exibição de ofertas relevantes)</li>
              <li><strong>Dados bancários/PIX</strong> (para processamento de saques - apenas divulgadores)</li>
              <li><strong>CNPJ e razão social</strong> (apenas empresas)</li>
              <li><strong>URL do Instagram</strong> (opcional, para verificação de perfil)</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">2.2. Dados de Uso e Navegação</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Endereço IP</strong> (para segurança e geolocalização)</li>
              <li><strong>User Agent</strong> (informações do navegador e dispositivo)</li>
              <li><strong>Fingerprint do dispositivo</strong> (para prevenção de fraudes)</li>
              <li><strong>Timezone do navegador</strong> (para verificação de localização)</li>
              <li><strong>Histórico de leads e interações</strong> (para cálculo de comissões)</li>
              <li><strong>Data, hora e duração de acesso</strong></li>
              <li><strong>Páginas visitadas e ofertas visualizadas</strong></li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">2.3. Dados de Transações Financeiras</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Histórico de compra de créditos</li>
              <li>Histórico de ganhos e comissões</li>
              <li>Solicitações e histórico de saques</li>
              <li>Registros de ofertas criadas e compartilhadas</li>
              <li>Leads gerados e conversões</li>
            </ul>

            <div className="bg-muted/50 border border-border rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>⚠️ Dados Sensíveis:</strong> Não coletamos dados pessoais sensíveis (origem racial, 
                convicção religiosa, opinião política, saúde, vida sexual, dados genéticos ou biométricos).
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">3. Bases Legais para Tratamento (Art. 7º LGPD)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Tratamos seus dados pessoais com base nas seguintes hipóteses legais previstas na LGPD:
            </p>
            <div className="mt-4 space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold">Execução de Contrato (Art. 7º, V)</h4>
                <p className="text-sm text-muted-foreground">
                  Para prestação dos serviços da plataforma: cadastro, exibição de ofertas, 
                  processamento de leads qualificados, cálculo e pagamento de comissões.
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold">Legítimo Interesse (Art. 7º, IX)</h4>
                <p className="text-sm text-muted-foreground">
                  Para prevenção de fraudes, segurança da plataforma, melhoria dos serviços 
                  e comunicações relevantes sobre sua conta.
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold">Cumprimento de Obrigação Legal (Art. 7º, II)</h4>
                <p className="text-sm text-muted-foreground">
                  Para atender obrigações fiscais, tributárias e regulatórias, incluindo 
                  retenção de dados financeiros conforme legislação aplicável.
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold">Consentimento (Art. 7º, I)</h4>
                <p className="text-sm text-muted-foreground">
                  Para envio de comunicações de marketing e newsletters (quando aplicável). 
                  Você pode revogar este consentimento a qualquer momento.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">4. Finalidades do Tratamento</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos seus dados para as seguintes finalidades específicas:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li><strong>Prestação do Serviço:</strong> Operar a plataforma, conectar usuários e processar transações.</li>
              <li><strong>Identificação e Autenticação:</strong> Verificar sua identidade e proteger sua conta.</li>
              <li><strong>Prevenção de Fraudes:</strong> Detectar e prevenir leads fraudulentos, múltiplas contas e uso indevido.</li>
              <li><strong>Processamento Financeiro:</strong> Gerenciar créditos, calcular comissões e processar saques.</li>
              <li><strong>Comunicação:</strong> Enviar notificações sobre transações, ofertas e atualizações importantes.</li>
              <li><strong>Melhoria Contínua:</strong> Analisar uso para aprimorar a experiência e desenvolver novos recursos.</li>
              <li><strong>Conformidade Legal:</strong> Cumprir obrigações fiscais, tributárias e regulatórias.</li>
              <li><strong>Defesa em Processos:</strong> Exercer direitos em processos judiciais, administrativos ou arbitrais.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">5. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Não vendemos, alugamos ou comercializamos seus dados pessoais.</strong> Podemos 
              compartilhar informações apenas nas seguintes situações:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-3 text-muted-foreground">
              <li>
                <strong>Entre Usuários da Plataforma:</strong> Nome da empresa é visível nas ofertas; 
                informações básicas do divulgador podem ser compartilhadas com empresas para fins de comissão.
              </li>
              <li>
                <strong>Prestadores de Serviço (Operadores):</strong> Parceiros que nos auxiliam na operação 
                (hospedagem, processamento de pagamentos, análise de dados), sempre sob contratos que 
                garantem a proteção dos dados.
              </li>
              <li>
                <strong>Autoridades Competentes:</strong> Quando exigido por lei, ordem judicial, 
                investigação policial ou requisição da ANPD.
              </li>
              <li>
                <strong>Proteção de Direitos:</strong> Para proteger nossos direitos, segurança, 
                propriedade ou de terceiros em caso de fraude ou atividade ilegal.
              </li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">5.1. Nossos Parceiros e Operadores</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Supabase:</strong> Infraestrutura e banco de dados (servidores no Brasil e exterior)</li>
              <li><strong>Asaas:</strong> Processamento de pagamentos e transferências PIX</li>
              <li><strong>Cloudflare:</strong> Segurança e CDN</li>
              <li><strong>OpenAI:</strong> Funcionalidades de IA do chat (dados anonimizados)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">6. Transferência Internacional de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Alguns de nossos prestadores de serviço podem processar dados em servidores localizados 
              fora do Brasil. Nestas situações, garantimos que:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Os países de destino possuem legislação de proteção de dados adequada, ou</li>
              <li>Existem cláusulas contratuais que garantem proteção equivalente à LGPD, ou</li>
              <li>O controlador oferece garantias de observância dos princípios da LGPD</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">7. Segurança dos Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Implementamos medidas técnicas e administrativas para proteger seus dados contra 
              acesso não autorizado, perda, alteração ou destruição:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li><strong>Criptografia em trânsito:</strong> HTTPS/TLS em todas as comunicações</li>
              <li><strong>Criptografia em repouso:</strong> Dados sensíveis criptografados no banco de dados</li>
              <li><strong>Autenticação segura:</strong> Senhas com hash, tokens JWT</li>
              <li><strong>Controle de acesso:</strong> Permissões baseadas em função (RBAC)</li>
              <li><strong>Monitoramento:</strong> Detecção de atividades suspeitas em tempo real</li>
              <li><strong>Backups:</strong> Cópias de segurança regulares e redundantes</li>
              <li><strong>Logs de auditoria:</strong> Registro de acessos e modificações</li>
            </ul>

            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-destructive mb-2">🚨 Incidentes de Segurança</h4>
              <p className="text-sm text-muted-foreground">
                Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, 
                comunicaremos a ANPD e os titulares afetados em prazo razoável, conforme Art. 48 da LGPD.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">8. Retenção e Eliminação de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mantemos seus dados apenas pelo tempo necessário para as finalidades informadas:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li><strong>Dados de conta ativa:</strong> Enquanto você mantiver conta na plataforma</li>
              <li><strong>Dados financeiros:</strong> 5 anos após a transação (obrigação fiscal)</li>
              <li><strong>Logs de segurança:</strong> 6 meses a 2 anos (conforme tipo)</li>
              <li><strong>Dados de fraude:</strong> Permanentemente na blacklist (legítimo interesse)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Após o término do tratamento, os dados serão eliminados, anonimizados ou mantidos 
              apenas para cumprimento de obrigação legal ou defesa em processos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">9. Seus Direitos como Titular (Art. 18 LGPD)</h2>
            <p className="text-muted-foreground leading-relaxed">
              A LGPD garante a você os seguintes direitos, que podem ser exercidos a qualquer momento:
            </p>
            <div className="grid gap-4 mt-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-2">✓ Confirmação e Acesso</h4>
                <p className="text-sm text-muted-foreground">
                  Confirmar se tratamos seus dados e obter acesso a eles.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-2">✓ Correção</h4>
                <p className="text-sm text-muted-foreground">
                  Solicitar correção de dados incompletos, inexatos ou desatualizados.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-2">✓ Anonimização, Bloqueio ou Eliminação</h4>
                <p className="text-sm text-muted-foreground">
                  Solicitar anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-2">✓ Portabilidade</h4>
                <p className="text-sm text-muted-foreground">
                  Solicitar portabilidade dos dados a outro fornecedor de serviço.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-2">✓ Eliminação</h4>
                <p className="text-sm text-muted-foreground">
                  Solicitar eliminação dos dados tratados com consentimento.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-2">✓ Informação sobre Compartilhamento</h4>
                <p className="text-sm text-muted-foreground">
                  Saber com quais entidades públicas e privadas seus dados foram compartilhados.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-2">✓ Revogação do Consentimento</h4>
                <p className="text-sm text-muted-foreground">
                  Revogar o consentimento a qualquer momento, de forma fácil e gratuita.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-2">✓ Oposição</h4>
                <p className="text-sm text-muted-foreground">
                  Opor-se ao tratamento realizado com fundamento em legítimo interesse.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-2">✓ Revisão de Decisões Automatizadas</h4>
                <p className="text-sm text-muted-foreground">
                  Solicitar revisão de decisões tomadas unicamente com base em tratamento automatizado.
                </p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Para exercer qualquer desses direitos, entre em contato com nosso Encarregado (DPO) 
              através do e-mail informado ao final desta política. Responderemos em até 15 dias.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">10. Cookies e Tecnologias de Rastreamento</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos cookies e tecnologias similares para:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li><strong>Cookies Essenciais:</strong> Necessários para funcionamento da plataforma (autenticação, sessão)</li>
              <li><strong>Cookies de Segurança:</strong> Prevenção de fraudes e proteção contra ataques</li>
              <li><strong>Cookies de Preferências:</strong> Lembrar suas configurações e preferências</li>
              <li><strong>Cookies Analíticos:</strong> Entender como você usa a plataforma (anonimizados)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Você pode configurar seu navegador para recusar cookies, mas isso pode afetar 
              algumas funcionalidades da plataforma. Cookies essenciais e de segurança são 
              necessários para o funcionamento e não podem ser desativados.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">11. Decisões Automatizadas</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos sistemas automatizados para:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li><strong>Detecção de Fraude:</strong> Análise automática de padrões de cliques suspeitos</li>
              <li><strong>Score de Risco:</strong> Cálculo automático de score de fraude para saques</li>
              <li><strong>Bloqueio Preventivo:</strong> Bloqueio automático de contas com comportamento suspeito</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Você tem direito de solicitar revisão humana de qualquer decisão automatizada que 
              afete seus interesses, incluindo bloqueios e score de fraude.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">12. Menores de Idade</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nossos serviços são destinados exclusivamente a maiores de 18 anos. Não coletamos 
              intencionalmente dados de crianças ou adolescentes. Se identificarmos que um menor 
              criou uma conta, ela será imediatamente encerrada e os dados eliminados.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">13. Alterações nesta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar esta Política de Privacidade periodicamente. Alterações significativas 
              serão comunicadas por e-mail ou aviso na plataforma com pelo menos 15 dias de antecedência. 
              A data da última atualização está indicada no topo desta página.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">14. Encarregado de Proteção de Dados (DPO)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Conforme exigido pela LGPD, nomeamos um Encarregado pelo Tratamento de Dados Pessoais (DPO), 
              responsável por:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Receber reclamações e comunicações dos titulares</li>
              <li>Receber comunicações da ANPD e adotar providências</li>
              <li>Orientar funcionários e contratados sobre práticas de proteção de dados</li>
            </ul>
            
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mt-6">
              <h4 className="font-semibold text-primary mb-3">📧 Contato do Encarregado (DPO)</h4>
              <p className="text-muted-foreground">
                <strong>E-mail:</strong>{' '}
                <a href="mailto:dpo@clilin.com" className="text-primary hover:underline">
                  dpo@clilin.com
                </a>
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>E-mail alternativo:</strong>{' '}
                <a href="mailto:privacidade@clilin.com" className="text-primary hover:underline">
                  privacidade@clilin.com
                </a>
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Prazo de resposta: até 15 dias úteis
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">15. Reclamações e Denúncias</h2>
            <p className="text-muted-foreground leading-relaxed">
              Se você acredita que seus direitos foram violados ou deseja fazer uma reclamação:
            </p>
            <ol className="list-decimal pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Entre em contato com nosso DPO através do e-mail dpo@clilin.com</li>
              <li>Aguarde nossa resposta em até 15 dias úteis</li>
              <li>
                Se não ficar satisfeito com a resposta, você pode registrar reclamação junto à 
                <strong> Autoridade Nacional de Proteção de Dados (ANPD)</strong> através do site{' '}
                <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  www.gov.br/anpd
                </a>
              </li>
            </ol>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
