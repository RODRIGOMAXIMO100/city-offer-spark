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
          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">1. Introdução</h2>
            <p className="text-muted-foreground leading-relaxed">
              A clilin está comprometida em proteger sua privacidade. Esta Política de Privacidade 
              explica como coletamos, usamos, armazenamos e protegemos suas informações pessoais 
              quando você utiliza nossa plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">2. Dados que Coletamos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Coletamos os seguintes tipos de informações:
            </p>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">2.1 Dados de Cadastro</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Nome completo ou nome da empresa</li>
              <li>Endereço de e-mail</li>
              <li>Cidade de atuação</li>
              <li>Chave PIX (para saques)</li>
              <li>URL do Instagram (opcional)</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">2.2 Dados de Uso</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Endereço IP</li>
              <li>Informações do navegador (User Agent)</li>
              <li>Fingerprint do dispositivo (para anti-fraude)</li>
              <li>Histórico de cliques e interações</li>
              <li>Data e hora de acesso</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">2.3 Dados de Transações</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Histórico de créditos (compras e ganhos)</li>
              <li>Ofertas criadas e compartilhadas</li>
              <li>Registros de cliques válidos e bloqueados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">3. Como Usamos seus Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos suas informações para:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li><strong>Prestação do Serviço:</strong> Operar a plataforma e conectar empresas, divulgadores e clientes.</li>
              <li><strong>Prevenção de Fraudes:</strong> Detectar e prevenir cliques fraudulentos e uso indevido.</li>
              <li><strong>Processamento de Pagamentos:</strong> Gerenciar créditos, comissões e saques.</li>
              <li><strong>Comunicação:</strong> Enviar notificações sobre ofertas, transações e atualizações importantes.</li>
              <li><strong>Melhorias:</strong> Analisar uso para melhorar a experiência da plataforma.</li>
              <li><strong>Conformidade Legal:</strong> Cumprir obrigações legais e regulatórias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">4. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Não vendemos seus dados pessoais. Podemos compartilhar informações nas seguintes situações:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li><strong>Entre Usuários:</strong> Nome da empresa é visível nas ofertas; nome do divulgador pode ser compartilhado com empresas para fins de comissão.</li>
              <li><strong>Prestadores de Serviço:</strong> Com parceiros que nos ajudam a operar a plataforma (hospedagem, processamento de pagamentos).</li>
              <li><strong>Requisitos Legais:</strong> Quando exigido por lei, ordem judicial ou autoridade governamental.</li>
              <li><strong>Proteção de Direitos:</strong> Para proteger nossos direitos, privacidade, segurança ou propriedade.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">5. Segurança dos Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados, incluindo:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
              <li>Autenticação segura</li>
              <li>Controle de acesso baseado em funções</li>
              <li>Monitoramento contínuo de atividades suspeitas</li>
              <li>Backups regulares</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">6. Retenção de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mantemos seus dados pelo tempo necessário para fornecer nossos serviços e cumprir 
              obrigações legais. Dados de transações financeiras são mantidos conforme exigido pela 
              legislação tributária brasileira. Você pode solicitar a exclusão de seus dados pessoais 
              a qualquer momento, sujeito a restrições legais.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">7. Seus Direitos (LGPD)</h2>
            <p className="text-muted-foreground leading-relaxed">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li><strong>Acesso:</strong> Solicitar uma cópia dos seus dados pessoais.</li>
              <li><strong>Correção:</strong> Solicitar correção de dados incompletos ou incorretos.</li>
              <li><strong>Exclusão:</strong> Solicitar a exclusão dos seus dados pessoais.</li>
              <li><strong>Portabilidade:</strong> Solicitar transferência dos seus dados para outro serviço.</li>
              <li><strong>Revogação:</strong> Retirar seu consentimento a qualquer momento.</li>
              <li><strong>Informação:</strong> Saber com quem seus dados foram compartilhados.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">8. Cookies e Tecnologias Similares</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos cookies e tecnologias similares para:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Manter você conectado à sua conta</li>
              <li>Lembrar suas preferências</li>
              <li>Analisar o uso da plataforma</li>
              <li>Prevenir fraudes</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Você pode configurar seu navegador para recusar cookies, mas isso pode afetar 
              algumas funcionalidades da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">9. Menores de Idade</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nossos serviços não são destinados a menores de 18 anos. Não coletamos intencionalmente 
              dados de menores. Se tomarmos conhecimento de que coletamos dados de um menor, 
              tomaremos medidas para excluí-los.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">10. Alterações nesta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar esta Política de Privacidade periodicamente. Alterações significativas 
              serão comunicadas por e-mail ou através de aviso na plataforma. Recomendamos que você 
              revise esta política regularmente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold mb-4">11. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para exercer seus direitos ou esclarecer dúvidas sobre esta Política de Privacidade, 
              entre em contato com nosso Encarregado de Proteção de Dados:{' '}
              <a href="mailto:privacidade@clilin.com" className="text-primary hover:underline">
                privacidade@clilin.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
