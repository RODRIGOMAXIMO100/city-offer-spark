import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { DocPage, type DocSection } from "@/components/docs/DocPage";

const UPDATED = "1 de novembro de 2026";

const sections: DocSection[] = [
  {
    id: "quem-somos",
    title: "Quem cuida dos seus dados",
    blocks: [
      "O controlador dos dados pessoais tratados no Clilin é a **Maximo Aceleradora de Produtos Digitais Ltda - ME**, CNPJ 40.695.326/0001-03, empresa que opera a plataforma, nos termos da Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).",
      "Esta política explica quais dados usamos, para quê, com quem compartilhamos e como você exerce seus direitos. Pedidos sobre seus dados vão para **contato@clilin.com**.",
    ],
  },
  {
    id: "dados",
    title: "Dados que coletamos",
    blocks: [
      "**Cadastro**",
      {
        list: [
          "Nome, e-mail, telefone e cidade.",
          "CPF (divulgadores e empresas sem CNPJ), para identificação e prevenção de fraude.",
          "CNPJ e razão social (empresas).",
          "Chave Pix (divulgadores), para pagar comissões.",
        ],
      },
      "**Cupons**",
      {
        list: [
          "Nome e WhatsApp de quem pega um cupom, para enviar o código e para a loja conferir.",
          "Oferta, código, validade, data de uso e o divulgador ligado ao cupom.",
        ],
      },
      "**Ofertas e saldo**",
      {
        list: [
          "Ofertas criadas, visitas, cupons pegos e usados, saldo, taxas, comissões e saques.",
        ],
      },
      "**Uso e segurança**",
      {
        list: [
          "Endereço IP, navegador, dispositivo, data e hora de acesso, usados para segurança e prevenção de fraude.",
        ],
      },
      { note: "Não coletamos dados sensíveis (origem racial, religião, opinião política, saúde, vida sexual, dados genéticos ou biométricos)." },
    ],
  },
  {
    id: "finalidades",
    title: "Para que usamos",
    blocks: [
      {
        list: [
          ["Funcionar", "criar sua conta, emitir e enviar cupons pelo WhatsApp, conferir cupons, calcular taxas e comissões, cobrar e pagar saques."],
          ["Proteger", "detectar cupons com dados falsos, validações sem cliente, contas duplicadas e outras fraudes."],
          ["Avisar", "mandar o cupom no WhatsApp e notificações sobre sua conta, ofertas, comissões e mudanças nas regras."],
          ["Melhorar", "entender como a plataforma é usada para corrigir problemas e criar recursos."],
          ["Oferecer serviços do Grupo MAXIMO", "o Clilin é um produto do Grupo MAXIMO, a mesma empresa que opera a plataforma. Empresas cadastradas podem receber contato da MAXIMO Empresas com serviços de gestão, marketing e vendas. Para não receber, é só pedir em contato@clilin.com. Dados de clientes que pegam cupom e de divulgadores não são usados para isso."],
          ["Cumprir a lei", "guardar registros fiscais e atender pedidos de autoridades."],
        ],
      },
    ],
  },
  {
    id: "bases-legais",
    title: "Bases legais",
    blocks: [
      {
        list: [
          ["Execução de contrato (art. 7º, V)", "para prestar o serviço que você contratou ou aceitou."],
          ["Legítimo interesse (art. 7º, IX)", "para segurança, prevenção de fraude, melhoria da plataforma e para apresentar às empresas cadastradas os serviços do Grupo MAXIMO, sempre com a opção de não receber."],
          ["Obrigação legal (art. 7º, II)", "para registros fiscais e financeiros."],
          ["Consentimento (art. 7º, I)", "para comunicações de marketing, que você pode cancelar quando quiser."],
        ],
      },
    ],
  },
  {
    id: "compartilhamento",
    title: "Com quem compartilhamos",
    blocks: [
      "Não vendemos nem alugamos seus dados. Compartilhamos só o necessário:",
      {
        list: [
          ["Com a empresa da oferta", "nome e WhatsApp de quem pegou o cupom dela, para conferir e atender. A empresa não recebe CPF nem chave Pix de divulgadores."],
          ["WhatsApp (Meta)", "o número de quem pega o cupom e o texto da mensagem, para enviar o código."],
          ["Prestadores de serviço", "Supabase (banco de dados e login), Hostinger (hospedagem do site), Asaas (pagamentos e Pix) e Google (quando você entra com a conta Google). Eles tratam os dados só para prestar o serviço ao Clilin."],
          ["Autoridades", "quando a lei ou uma ordem judicial exigir, ou para defender direitos em caso de fraude."],
        ],
      },
      "Alguns desses prestadores podem guardar dados fora do Brasil. Nesses casos, exigimos garantias de proteção compatíveis com a LGPD.",
    ],
  },
  {
    id: "seguranca",
    title: "Segurança",
    blocks: [
      "Usamos conexão criptografada (HTTPS) em todo o site, senhas guardadas com hash, controle de acesso por papel (empresa, divulgador, administrador) e regras de acesso no banco de dados. Se houver um incidente que traga risco relevante, avisamos você e a ANPD, como manda o art. 48 da LGPD.",
    ],
  },
  {
    id: "retencao",
    title: "Por quanto tempo guardamos",
    blocks: [
      {
        list: [
          ["Conta", "enquanto ela estiver ativa."],
          ["Registros financeiros", "5 anos após a transação, por obrigação fiscal."],
          ["Registros de acesso", "6 meses, como pede o Marco Civil da Internet, ou mais quando houver investigação de fraude."],
          ["Dados ligados a fraude comprovada", "pelo tempo necessário para impedir novas fraudes e defender direitos."],
        ],
      },
      "Depois disso, os dados são apagados ou anonimizados.",
    ],
  },
  {
    id: "direitos",
    title: "Seus direitos",
    blocks: [
      "Pela LGPD (art. 18), você pode a qualquer momento:",
      {
        list: [
          "Confirmar se tratamos seus dados e ter acesso a eles.",
          "Corrigir dados incompletos ou desatualizados.",
          "Pedir anonimização, bloqueio ou exclusão de dados desnecessários.",
          "Pedir a portabilidade dos dados.",
          "Saber com quem compartilhamos seus dados.",
          "Revogar o consentimento e se opor a tratamentos por legítimo interesse.",
          "Pedir revisão humana de decisões automáticas, como o cancelamento de um cupom ou o bloqueio por suspeita de fraude.",
        ],
      },
      "Para exercer qualquer direito, escreva para **contato@clilin.com** com o assunto \"Privacidade\". Respondemos em até 15 dias. Se não ficar satisfeito, você pode reclamar à ANPD em gov.br/anpd.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies e armazenamento no navegador",
    blocks: [
      "Usamos apenas o armazenamento necessário para manter você conectado e lembrar preferências. Não usamos ferramentas de publicidade nem de rastreamento de terceiros no site.",
    ],
  },
  {
    id: "menores",
    title: "Menores de idade",
    blocks: [
      "O Clilin é só para maiores de 18 anos. Se identificarmos a conta de um menor, ela é encerrada e os dados apagados.",
    ],
  },
  {
    id: "alteracoes",
    title: "Alterações desta política",
    blocks: [
      "Podemos atualizar esta política. Mudanças importantes são avisadas por e-mail ou na plataforma antes de valerem. A data da última atualização fica no topo desta página.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SEOHead
        title="Política de Privacidade | Clilin"
        description="Como o Clilin trata os dados de empresas, divulgadores e de quem pega cupom: o que coletamos, para quê, com quem compartilhamos e como exercer seus direitos pela LGPD."
        canonicalUrl="/privacidade"
      />
      <DocPage
        title="Política de Privacidade"
        subtitle="O que fazemos com os seus dados, em linguagem simples e de acordo com a LGPD."
        updated={UPDATED}
        sections={sections}
        after={
          <p className="text-sm text-muted-foreground border-t border-border pt-6">
            Veja também os <Link to="/termos" className="text-primary hover:underline">Termos de Uso</Link>.
          </p>
        }
      />
    </>
  );
}
