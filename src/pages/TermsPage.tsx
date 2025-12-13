import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/landing/Footer';
import logo from '@/assets/logo.png';

export default function TermsPage() {
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
        <h1 className="text-4xl font-display font-bold mb-2">Termos de Uso</h1>
        <p className="text-muted-foreground mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao acessar e utilizar a plataforma clilin, você concorda em cumprir e estar vinculado a estes 
              Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar 
              nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground leading-relaxed">
              O clilin é uma plataforma de marketing de ofertas locais que conecta três tipos de usuários:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li><strong>Empresas:</strong> Criam e publicam ofertas de seus produtos e serviços.</li>
              <li><strong>Divulgadores (Afiliados):</strong> Compartilham ofertas e recebem comissões por leads qualificados.</li>
              <li><strong>Clientes:</strong> Encontram e aproveitam ofertas locais.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">3. Cadastro e Conta</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para utilizar determinadas funcionalidades, você deve criar uma conta fornecendo informações 
              verdadeiras, precisas e completas. Você é responsável por manter a confidencialidade de suas 
              credenciais e por todas as atividades realizadas em sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">4. Sistema de Créditos</h2>
            <p className="text-muted-foreground leading-relaxed">
              O clilin opera com um sistema de créditos:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Empresas adquirem créditos para publicar ofertas e pagar por cliques.</li>
              <li>Divulgadores ganham créditos por cliques válidos em suas divulgações.</li>
              <li>Créditos podem ser convertidos em valores monetários conforme as regras da plataforma.</li>
              <li>A plataforma implementa sistemas anti-fraude para garantir a integridade dos cliques.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">5. Política Anti-Fraude</h2>
            <p className="text-muted-foreground leading-relaxed">
              O clilin utiliza sistemas automatizados avançados para detectar e prevenir fraudes, incluindo:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Limite de 1 clique válido por IP por oferta a cada 24 horas.</li>
              <li>Detecção de auto-cliques por divulgadores.</li>
              <li>Limite de taxa global de 50 cliques por hora para prevenir ataques de bots.</li>
              <li>Verificação de geolocalização (apenas cliques do Brasil são válidos).</li>
              <li>Bloqueio de VPNs, proxies e IPs de data centers suspeitos.</li>
              <li>Análise de padrões de comportamento suspeito (intervalos regulares, concentração de cliques).</li>
              <li>Verificação de timezone do navegador para detectar falsificação de localização.</li>
              <li>Fingerprinting de dispositivo para detectar múltiplos cliques do mesmo aparelho.</li>
              <li>Score de fraude automático para solicitações de saque.</li>
            </ul>
            
            <h3 className="text-xl font-display font-semibold mt-6 mb-3">5.1. Comportamentos Proibidos</h3>
            <p className="text-muted-foreground leading-relaxed">
              São expressamente proibidos e resultarão em penalidades:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Clicar em seus próprios links de afiliado ou solicitar que terceiros cliquem.</li>
              <li>Usar VPN, proxy ou qualquer ferramenta para mascarar localização.</li>
              <li>Utilizar bots, scripts ou automação para gerar cliques.</li>
              <li>Criar múltiplas contas para obter vantagens indevidas.</li>
              <li>Fazer spam ou divulgação enganosa de ofertas.</li>
              <li>Falsificar informações de cadastro (CPF, dados bancários, etc).</li>
              <li>Tentar burlar ou testar os sistemas de segurança da plataforma.</li>
              <li>Qualquer outra ação que prejudique a integridade do sistema.</li>
            </ul>

            <h3 className="text-xl font-display font-semibold mt-6 mb-3">5.2. Cadastros Suspeitos ou Falsos</h3>
            <p className="text-muted-foreground leading-relaxed">
              São considerados cadastros suspeitos e estão sujeitos a análise e penalidades:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Dados pessoais inconsistentes ou comprovadamente falsos (CPF, nome, endereço).</li>
              <li>Múltiplas contas com dados similares ou originadas do mesmo dispositivo/IP.</li>
              <li>Cadastros realizados através de VPN, proxy ou IPs suspeitos.</li>
              <li>Padrão de comportamento atípico imediatamente após o cadastro.</li>
              <li>Dados bancários (PIX) incompatíveis com o titular da conta.</li>
              <li>Informações que não podem ser verificadas ou confirmadas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">6. Penalidades por Fraude</h2>
            <p className="text-muted-foreground leading-relaxed">
              Em caso de detecção de atividade fraudulenta ou suspeita, a plataforma reserva-se o direito de aplicar as seguintes penalidades:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li><strong>Advertência:</strong> Para infrações leves ou primeira ocorrência.</li>
              <li><strong>Congelamento de Saldo:</strong> Bloqueio preventivo do saldo para análise detalhada.</li>
              <li><strong>Suspensão Temporária:</strong> Bloqueio do acesso à conta por período determinado.</li>
              <li><strong>Banimento Permanente:</strong> Exclusão definitiva da plataforma.</li>
              <li><strong>Confisco de Saldo:</strong> Perda total dos créditos acumulados em casos graves.</li>
              <li><strong>Inclusão em Blacklist:</strong> CPF, email e dados bancários são bloqueados permanentemente.</li>
            </ul>

            <h3 className="text-xl font-display font-semibold mt-6 mb-3">6.1. Processo de Análise e Penalização</h3>
            <p className="text-muted-foreground leading-relaxed">
              Ao detectar comportamento suspeito, a plataforma seguirá o seguinte processo:
            </p>
            <ul className="list-decimal pl-6 mt-4 space-y-3 text-muted-foreground">
              <li>
                <strong>Bloqueio Preventivo de Saldo:</strong> Ao identificar atividade suspeita, o saldo do usuário 
                será imediatamente bloqueado para análise detalhada. O usuário será notificado sobre o bloqueio.
              </li>
              <li>
                <strong>Período de Análise:</strong> A equipe de segurança realizará análise completa do histórico 
                de cliques, padrões de comportamento, dados cadastrais e qualquer evidência relevante.
              </li>
              <li>
                <strong>Decisão Final:</strong>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Se a fraude for confirmada: <strong>BANIMENTO PERMANENTE</strong> e confisco total do saldo.</li>
                  <li>Se for falso positivo: Desbloqueio do saldo e continuidade normal da conta.</li>
                </ul>
              </li>
              <li>
                <strong>Comunicação:</strong> O usuário será notificado por email e/ou notificação na plataforma 
                sobre a decisão final e as razões da mesma.
              </li>
            </ul>

            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mt-6">
              <h4 className="font-semibold text-destructive mb-2">⚠️ BANIMENTO IMEDIATO</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Em casos de fraude evidente ou grave, a plataforma reserva-se o direito de aplicar 
                <strong> banimento imediato SEM período de análise prévia</strong>, incluindo:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground text-sm">
                <li>Uso comprovado de bots, scripts ou automação.</li>
                <li>Múltiplas contas confirmadas do mesmo usuário.</li>
                <li>Dados cadastrais comprovadamente falsos ou de terceiros.</li>
                <li>Tentativas deliberadas de burlar os sistemas de segurança.</li>
                <li>Reincidência após advertência ou suspensão anterior.</li>
              </ul>
            </div>

            <p className="text-muted-foreground leading-relaxed mt-6">
              <strong>Retenção de Saques:</strong> O clilin reserva-se o direito de reter saques por até 
              <strong> 30 dias úteis</strong> para análise de fraude. Usuários com comportamento suspeito ou 
              score de fraude elevado terão seus saques submetidos a verificação manual adicional.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong>Medidas Legais:</strong> Em casos de fraude comprovada, a plataforma pode tomar medidas 
              legais cabíveis, incluindo notificação às autoridades competentes, registro de boletim de 
              ocorrência e ações judiciais para recuperação de valores e danos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">7. Direitos da Plataforma</h2>
            <p className="text-muted-foreground leading-relaxed">
              A plataforma clilin reserva-se os seguintes direitos para proteção do ecossistema:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Bloquear saldos preventivamente sempre que houver suspeita de fraude ou irregularidade.</li>
              <li>Reter solicitações de saque por até 30 dias para análise e verificação.</li>
              <li>Banir usuários sem aviso prévio em casos de fraude evidente ou grave.</li>
              <li>Invalidar cliques e leads considerados fraudulentos, mesmo após creditados.</li>
              <li>Compartilhar informações com autoridades competentes em caso de crime ou investigação.</li>
              <li>Adicionar CPF, email, telefone, dados PIX e dispositivos em lista negra permanente.</li>
              <li>Solicitar documentação adicional para verificação de identidade a qualquer momento.</li>
              <li>Recusar saques sem justificativa detalhada em casos de investigação ativa.</li>
              <li>Alterar limites de saque, valores mínimos e regras de comissionamento a qualquer momento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">8. Responsabilidades das Empresas</h2>
            <p className="text-muted-foreground leading-relaxed">
              As empresas são responsáveis por:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Garantir que as ofertas publicadas sejam verdadeiras e cumpridas.</li>
              <li>Manter créditos suficientes para suas campanhas ativas.</li>
              <li>Responder aos clientes de forma adequada e profissional.</li>
              <li>Cumprir todas as leis aplicáveis de proteção ao consumidor.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">9. Responsabilidades dos Divulgadores</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os divulgadores são responsáveis por:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Divulgar ofertas de forma ética e transparente.</li>
              <li>Não utilizar práticas enganosas ou spam.</li>
              <li>Não gerar cliques artificiais ou fraudulentos.</li>
              <li>Identificar-se como divulgadores quando exigido por lei.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">10. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              O clilin atua como intermediário e não se responsabiliza pela qualidade, segurança ou 
              legalidade das ofertas publicadas, nem pela capacidade das empresas de cumpri-las. 
              Recomendamos que os usuários avaliem cuidadosamente as ofertas antes de aproveitá-las.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">11. Modificações nos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações 
              significativas serão comunicadas por e-mail ou através da plataforma. O uso continuado 
              após as modificações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">12. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para dúvidas sobre estes Termos de Uso, entre em contato através do e-mail:{' '}
              <a href="mailto:contato@clilin.com" className="text-primary hover:underline">
                contato@clilin.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
