import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { DocPage, type DocSection } from "@/components/docs/DocPage";

const UPDATED = "1 de novembro de 2026";

const sections: DocSection[] = [
  {
    id: "aceitacao",
    title: "Aceitação",
    blocks: [
      "O Clilin é operado pela **Maximo Aceleradora de Produtos Digitais Ltda - ME**, CNPJ 40.695.326/0001-03 (\"Clilin\" ou \"nós\").",
      "Ao criar uma conta ou usar o Clilin, você concorda com estes Termos de Uso e com a nossa Política de Privacidade. Se não concordar com alguma parte, não use a plataforma.",
      "Contas de empresa e de divulgador são para maiores de 18 anos. Ao se cadastrar, você declara ter 18 anos ou mais e capacidade para aceitar estes termos.",
    ],
  },
  {
    id: "servico",
    title: "O que é o Clilin",
    blocks: [
      "O Clilin é uma plataforma de **ofertas locais com cupom**. Ela conecta três tipos de usuário:",
      {
        list: [
          ["Empresas", "publicam ofertas da sua cidade e pagam só pelos cupons usados e conferidos na loja."],
          ["Divulgadores", "indicam as ofertas da cidade pelo próprio link e ganham uma comissão por cupom usado por quem veio desse link."],
          ["Clientes", "pegam cupons de graça, recebem o código no WhatsApp e usam na loja."],
        ],
      },
    ],
  },
  {
    id: "conta",
    title: "Cadastro e conta",
    blocks: [
      {
        list: [
          "Os dados do cadastro precisam ser verdadeiros, completos e atualizados.",
          "Cada pessoa pode ter **uma conta de divulgador por CPF**. Empresas se cadastram com o CNPJ ou com o CPF do responsável.",
          "Para pegar cupom não é preciso criar conta: basta informar nome e WhatsApp.",
          "Você é responsável por guardar sua senha e por tudo que acontecer na sua conta. Se perceber uso indevido, avise a gente na hora.",
        ],
      },
    ],
  },
  {
    id: "empresas",
    title: "Ofertas e cobrança das empresas",
    blocks: [
      {
        list: [
          ["Taxa", "por cupom usado, a empresa paga **15% do preço com desconto da oferta, com mínimo de R$ 3**. A taxa de cada cupom fica definida no momento em que ele é emitido."],
          ["Quando cobra", "só quando a empresa confere o código no painel e o cupom é usado. Visita, clique e cupom pego e não usado não são cobrados."],
          ["Pré-pago", "a empresa coloca saldo no painel e cada cupom usado é descontado com **10% de desconto**. Sem saldo para o próximo cupom, as ofertas ficam pausadas para novos cupons. Os cupons já entregues continuam valendo."],
          ["Pós-pago", "quando combinado com o Clilin, os cupons usados no período entram numa fatura."],
          ["Oferta", "a empresa define o que é a promoção, os preços, as fotos, a validade da oferta e do cupom e o canal de atendimento. A empresa é obrigada a cumprir o desconto anunciado para quem apresentar um cupom válido."],
          ["Saldo", "o saldo é usado dentro da plataforma e não é convertido em dinheiro, ressalvado o direito de arrependimento de 7 dias para compras online ainda não usadas (art. 49 do Código de Defesa do Consumidor)."],
        ],
      },
      "O Clilin pode recusar ou pausar ofertas com conteúdo ilegal, enganoso, ofensivo ou que viole direitos de terceiros.",
    ],
  },
  {
    id: "cupons",
    title: "Cupons",
    blocks: [
      {
        list: [
          "Cada cupom tem um código único, vale para uma oferta de uma loja e pode ser usado **uma única vez**, dentro da validade.",
          "O código é mostrado na tela e enviado para o WhatsApp informado. Quem pega o cupom autoriza esse envio.",
          "Há limite de cupons por WhatsApp e por aparelho para evitar abuso.",
          "O cupom é pessoal. A loja pode pedir o nome de quem pegou para conferir.",
          "Quem responde pelo produto ou serviço, pelo atendimento e pela entrega do desconto é a empresa que publicou a oferta.",
        ],
      },
    ],
  },
  {
    id: "divulgadores",
    title: "Comissão dos divulgadores",
    blocks: [
      {
        list: [
          ["Link", "cada divulgador tem um link para cada oferta. O cupom pego por esse link fica ligado ao divulgador."],
          ["Comissão", "quando o cupom é usado e conferido pela loja, o divulgador recebe **50% da taxa** do cupom, podendo chegar a **70%** conforme o seu nível no mês."],
          ["Pós-pago", "quando a empresa paga por fatura, a comissão fica retida até a fatura ser paga."],
          ["Saque", "o saldo pode ser sacado via Pix a partir de R$ 100, para uma chave Pix do próprio titular da conta. Os tributos seguem a legislação brasileira."],
          ["Divulgação honesta", "o divulgador fala a verdade sobre a oferta, não manda mensagens em massa para quem não conhece e segue as regras das redes sociais e de publicidade."],
        ],
      },
    ],
  },
  {
    id: "fraude",
    title: "Fraude e penalidades",
    blocks: [
      "São proibidos, entre outros:",
      {
        list: [
          "Pegar cupons com nome ou telefone falso, ou em nome de outras pessoas sem autorização.",
          "Conferir cupom sem que o cliente tenha usado a oferta, ou combinar isso entre empresa e divulgador.",
          "Usar robôs, automação ou mais de uma conta.",
          "Anunciar desconto falso ou enganoso.",
          "Tentar burlar ou testar os sistemas de segurança da plataforma.",
        ],
      },
      "Quando há suspeita, o Clilin pode, conforme a gravidade:",
      {
        list: [
          "Cancelar cupons e anular comissões.",
          "Congelar o saldo de forma preventiva enquanto analisa.",
          "Reter saques por até 30 dias para análise.",
          "Suspender ou encerrar a conta, com perda das comissões obtidas por fraude.",
          "Bloquear CPF, e-mail, chave Pix e dispositivos ligados à fraude.",
        ],
      },
      "Você é avisado da decisão e pode pedir revisão por e-mail. Fraude comprovada pode ser comunicada às autoridades.",
    ],
  },
  {
    id: "responsabilidades",
    title: "Responsabilidades",
    blocks: [
      "**Empresas:** garantem que as ofertas são verdadeiras e legais, que têm os direitos sobre fotos e textos e que vão honrar o desconto para quem apresentar cupom válido. Respondem pelo produto ou serviço perante o consumidor.",
      "**Divulgadores:** divulgam de forma honesta e transparente e só usam contas próprias.",
      "O Clilin organiza as ofertas, emite e confere os cupons e calcula taxas e comissões. O Clilin não vende os produtos ou serviços das empresas. O envio pelo WhatsApp depende do funcionamento do WhatsApp, que não é do Clilin.",
    ],
  },
  {
    id: "limitacao",
    title: "Limitação de responsabilidade",
    blocks: [
      "O Clilin não garante vendas nem resultado comercial. O Clilin também não responde pelos produtos, serviços e atendimento das empresas nem pelo conteúdo que cada divulgador escolhe publicar.",
    ],
  },
  {
    id: "alteracoes",
    title: "Alterações destes termos",
    blocks: [
      "Podemos atualizar estes termos. Mudanças importantes são avisadas por e-mail ou na plataforma antes de valerem. Continuar usando o Clilin depois disso significa concordar com a nova versão.",
    ],
  },
  {
    id: "lei",
    title: "Lei aplicável e foro",
    blocks: [
      "Estes termos seguem as leis do Brasil. Fica eleito o foro do domicílio do usuário, quando ele for consumidor, e o foro de Belo Horizonte (MG) nos demais casos.",
    ],
  },
  {
    id: "contato",
    title: "Contato",
    blocks: ["Dúvidas sobre estes termos: **contato@clilin.com**."],
  },
];

export default function TermsPage() {
  return (
    <>
      <SEOHead
        title="Termos de Uso | Clilin"
        description="Regras do Clilin para empresas, divulgadores e clientes: ofertas, cupons, taxa por cupom usado, comissões, saques e prevenção de fraude."
        canonicalUrl="/termos"
      />
      <DocPage
        title="Termos de Uso"
        subtitle="As regras para empresas, divulgadores e clientes, escritas para serem entendidas."
        updated={UPDATED}
        sections={sections}
        after={
          <p className="text-sm text-muted-foreground border-t border-border pt-6">
            Veja também a <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link> e a página de{" "}
            <Link to="/transparencia" className="text-primary hover:underline">Transparência</Link>.
          </p>
        }
      />
    </>
  );
}
