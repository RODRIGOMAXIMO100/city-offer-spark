import { Helmet } from 'react-helmet-async';
import ClilinChat from '@/components/chat/ClilinChat';

// clilin.com/chat: o chat da Clilin, no jeito do ChatGPT. Aberto, sem login.
export default function ChatPage() {
  return (
    <>
      <Helmet>
        <title>Clilin: pergunte e ache ofertas da sua cidade</title>
        <meta
          name="description"
          content="Converse com a Clilin e ache ofertas de negócios de Belo Horizonte com cupom grátis no WhatsApp. Pizza, salão, academia e muito mais."
        />
        <link rel="canonical" href="https://clilin.com/chat" />
        <meta property="og:title" content="Clilin: pergunte e ache ofertas da sua cidade" />
        <meta property="og:url" content="https://clilin.com/chat" />
      </Helmet>
      <ClilinChat />
    </>
  );
}
