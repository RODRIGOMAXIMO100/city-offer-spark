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
              <li><strong>Divulgadores (Afiliados):</strong> Compartilham ofertas e recebem comissões por cliques válidos.</li>
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
              O clilin utiliza sistemas automatizados para detectar e prevenir fraudes, incluindo:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Limite de 1 clique válido por IP por oferta a cada 24 horas.</li>
              <li>Detecção de auto-cliques por divulgadores.</li>
              <li>Limite de taxa global para prevenir ataques de bots.</li>
              <li>Análise de padrões de comportamento suspeito.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Tentativas de fraude resultarão em suspensão imediata da conta e perda de créditos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">6. Responsabilidades das Empresas</h2>
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
            <h2 className="text-2xl font-display font-semibold mb-4">7. Responsabilidades dos Divulgadores</h2>
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
            <h2 className="text-2xl font-display font-semibold mb-4">8. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              O clilin atua como intermediário e não se responsabiliza pela qualidade, segurança ou 
              legalidade das ofertas publicadas, nem pela capacidade das empresas de cumpri-las. 
              Recomendamos que os usuários avaliem cuidadosamente as ofertas antes de aproveitá-las.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">9. Modificações nos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações 
              significativas serão comunicadas por e-mail ou através da plataforma. O uso continuado 
              após as modificações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">10. Contato</h2>
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
