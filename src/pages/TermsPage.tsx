import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { DocPage, type DocSection } from "@/components/docs/DocPage";

const UPDATED = "31 de outubro de 2026";

const sections: DocSection[] = [
  {
    id: "aceitacao",
    title: "Aceitação",
    blocks: [
      "O Clilin é operado pela **Maximo Aceleradora de Produtos Digitais Ltda - ME**, CNPJ 40.695.326/0001-03 (\"Clilin\" ou \"nós\").",
      "Ao criar uma conta ou usar o Clilin, você concorda com estes Termos de Uso e com a nossa Política de Privacidade. Se não concordar com alguma parte, não use a plataforma.",
      "O Clilin é destinado a maiores de 18 anos. Ao se cadastrar, você declara ter 18 anos ou mais e capacidade para aceitar estes termos.",
    ],
  },
  {
    id: "servico",
    title: "O que é o Clilin",
    blocks: [
      "O Clilin é uma plataforma de **campanhas de alcance com gente de verdade**. Ela conecta dois tipos de usuário:",
      {
        list: [
          ["Empresas", "criam campanhas com uma assinatura (o nome ou a frase da campanha), um roteiro, as cidades atendidas, uma janela de postagem e uma meta de visualizações. Pagam só pelo alcance verificado."],
          ["Divulgadores", "recebem missões das campanhas, postam no próprio perfil nas redes sociais e acumulam pontos pelas visualizações verificadas. Os melhores de cada liga ganham prêmios em dinheiro todo mês."],
        ],
      },
      {
        note: "**Ofertas, cupons e captação de clientes:** este módulo está em breve. Quando for lançado, terá regras próprias, que serão publicadas nesta página antes de começar a valer.",
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
          "Os perfis de redes sociais cadastrados pelo divulgador precisam ser **dele**, estar **abertos** (públicos) e ter atividade real.",
          "Você é responsável por guardar sua senha e por tudo que acontecer na sua conta. Se perceber uso indevido, avise a gente na hora.",
        ],
      },
    ],
  },
  {
    id: "empresas",
    title: "Créditos e campanhas das empresas",
    blocks: [
      {
        list: [
          ["Preço", "R$ 5 a cada mil visualizações verificadas. 1 crédito vale R$ 1 e corresponde a 200 visualizações verificadas."],
          ["Meta mínima", "cada campanha tem meta de pelo menos 20 mil visualizações (R$ 100)."],
          ["Reserva", "ao criar a campanha, o valor da meta fica reservado no seu saldo de créditos."],
          ["Cobrança", "o crédito é debitado conforme os posts são aprovados na verificação. Post reprovado não é cobrado."],
          ["Sobra", "se a meta não for atingida até o fim da campanha, os créditos que sobraram voltam para o seu saldo. Se a meta for passada, o alcance extra não é cobrado."],
          ["Créditos", "créditos são usados dentro da plataforma e não são convertidos em dinheiro, ressalvado o direito de arrependimento de 7 dias para compras online ainda não usadas (art. 49 do Código de Defesa do Consumidor)."],
        ],
      },
      "O Clilin pode recusar ou pausar campanhas com conteúdo ilegal, enganoso, ofensivo, que viole direitos de terceiros ou as regras das redes sociais.",
    ],
  },
  {
    id: "missoes",
    title: "Missões e posts dos divulgadores",
    blocks: [
      {
        list: [
          "O post é feito **no perfil do próprio divulgador**, com o nome da marca na legenda e a identificação **#publi**, dentro da janela da campanha.",
          "Valem posts no feed e Reels do Instagram, TikTok, Kwai, YouTube Shorts, Facebook e X. Stories e Status não valem, porque somem e não dá para conferir depois.",
          "O post precisa sair dentro da janela da missão e continuar no ar durante o período de verificação.",
          "O divulgador envia o link do post e, quando pedido, o print das visualizações. Print editado ou de outro post é fraude.",
          "Cada post passa por leitura automática dos dados públicos e conferência da equipe. Só entram na conta os posts aprovados.",
          "O divulgador **não recebe por post**. O que conta são os pontos que levam ao ranking e aos prêmios.",
        ],
      },
    ],
  },
  {
    id: "premios",
    title: "Pontos, ligas e prêmios",
    blocks: [
      {
        list: [
          ["Pontos", "cada visualização verificada vale 1 ponto."],
          ["Ciclo", "o ranking é mensal. No começo de cada mês, os pontos começam do zero."],
          ["Ligas", "Bronze (até 1 mil seguidores), Prata (de 1 mil a 5 mil) e Ouro (acima de 5 mil). Cada divulgador disputa com quem tem o seu tamanho."],
          ["Mínimo", "para concorrer no mês, é preciso fazer pelo menos 2 mil pontos."],
          ["Fundo", "35% de tudo que as empresas consomem no mês forma o fundo de prêmios."],
          ["Prêmios", "os 3 primeiros de cada liga são premiados. Os valores de referência são R$ 150, R$ 80 e R$ 50. Se o fundo do mês não cobrir esses valores, todos são ajustados na mesma proporção. O que sobrar do fundo passa para o mês seguinte."],
          ["Sem sorteio", "ganha quem fica no topo da sua liga. Não há sorteio nem pagamento para participar."],
        ],
      },
      "O prêmio é creditado no saldo do divulgador e pode ser sacado via Pix a partir de R$ 100, para uma chave Pix do próprio titular da conta. Os tributos sobre prêmios seguem a legislação brasileira.",
      "As regras de premiação podem ser ajustadas. Mudanças valem a partir do ciclo seguinte e são avisadas antes na plataforma.",
    ],
  },
  {
    id: "fraude",
    title: "Fraude e penalidades",
    blocks: [
      "São proibidos, entre outros:",
      {
        list: [
          "Comprar visualizações, seguidores ou engajamento, ou usar robôs e automação.",
          "Usar perfis falsos, de terceiros ou criar mais de uma conta.",
          "Editar prints, enviar post de outra pessoa ou apagar o post antes do fim da verificação.",
          "Divulgar sem #publi ou de forma enganosa.",
          "Tentar burlar ou testar os sistemas de segurança da plataforma.",
        ],
      },
      "Quando há suspeita, o Clilin pode, conforme a gravidade:",
      {
        list: [
          "Reprovar o post e anular os pontos.",
          "Congelar o saldo de forma preventiva enquanto analisa.",
          "Reter saques por até 30 dias para análise.",
          "Suspender ou encerrar a conta, com perda dos pontos e prêmios obtidos por fraude.",
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
      "**Empresas:** garantem que o material, o roteiro e a assinatura da campanha são verdadeiros, legais e que têm os direitos de uso. Respondem pelo que anunciam perante o consumidor.",
      "**Divulgadores:** postam de forma honesta e transparente, com #publi, seguem as regras das redes sociais e da publicidade e só usam perfis próprios.",
      "O Clilin organiza as campanhas, verifica os posts e apura o ranking. O Clilin não é parceiro nem representante e não tem vínculo com o Instagram, TikTok, Kwai, YouTube, Facebook ou X. Mudanças nessas redes, como bloqueios, quedas ou mudanças de alcance, podem afetar as campanhas.",
    ],
  },
  {
    id: "conteudo",
    title: "Conteúdo e métricas",
    blocks: [
      "O divulgador continua dono do seu post. Ao participar de uma missão, autoriza o Clilin e a empresa da campanha a ver e usar o link, o @ e as métricas públicas do post para a verificação e para mostrar o resultado da campanha no painel da empresa.",
      "A empresa garante que tem os direitos sobre o material que envia e autoriza os divulgadores a usá-lo nos posts da campanha.",
    ],
  },
  {
    id: "limitacao",
    title: "Limitação de responsabilidade",
    blocks: [
      "O Clilin não garante vendas nem resultado comercial: o que é vendido é alcance verificado. O Clilin também não responde pelos produtos e serviços das empresas anunciantes nem pelo conteúdo que cada divulgador escolhe postar além da missão.",
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
        description="Regras do Clilin para empresas e divulgadores: créditos, campanhas, missões, pontos, ligas, prêmios e prevenção de fraude."
        canonicalUrl="/termos"
      />
      <DocPage
        title="Termos de Uso"
        subtitle="As regras do jogo para empresas e divulgadores, escritas para serem entendidas."
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
