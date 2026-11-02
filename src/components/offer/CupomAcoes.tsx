import { useState } from 'react';
import { Loader2, MessageCircle, Store, CheckCircle2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

// Botões de uso do cupom: o cliente avisa que vai usar agora ("Estou na loja" ou "Pedir online").
// A loja vê na hora no painel (e no WhatsApp) e confirma com um toque.
export type CanalUso = 'loja' | 'online';

export async function chamarCupom(id: string, acao: 'ver' | CanalUso | 'atendido' | 'nao_atendido') {
  const { data, error } = await supabase.functions.invoke('cupom', { body: { id, acao } });
  if (error) {
    let msg = 'Não deu para falar com a loja agora. Tente de novo.';
    let cupom = null;
    try {
      const ctx = (error as { context?: Response }).context;
      const body = ctx ? await ctx.json() : null;
      if (body?.error) msg = body.error;
      cupom = body?.cupom ?? null;
    } catch { /* mantém a mensagem padrão */ }
    return { erro: msg, cupom };
  }
  return { cupom: data?.cupom ?? null, erro: data?.error ?? null };
}

interface Props {
  id: string;
  /** Já avisou antes (ex.: abriu a página depois de tocar no WhatsApp) */
  canalInicial?: CanalUso | null;
  lojaNome?: string | null;
  pedirLinkInicial?: string | null;
  /** Abre o pedido online direto (link "Pedir online" do WhatsApp) */
  onPedirLink?: (link: string | null) => void;
  /** Resposta do cliente se foi atendido (null = ainda não respondeu) */
  atendidoInicial?: 'sim' | 'nao' | null;
}

// Depois de avisar a loja, o cliente diz se foi atendido. "Fui atendido" vale como uso confirmado:
// a loja tem 48 horas para contestar. "Não fui" não gera cobrança e o Clilin verifica com a loja.
function PerguntaAtendido({ id, inicial }: { id: string; inicial: 'sim' | 'nao' | null }) {
  const [resp, setResp] = useState<'sim' | 'nao' | null>(inicial);
  const [enviando, setEnviando] = useState<'sim' | 'nao' | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const responder = async (r: 'sim' | 'nao') => {
    setErro(null);
    setEnviando(r);
    const x = await chamarCupom(id, r === 'sim' ? 'atendido' : 'nao_atendido');
    setEnviando(null);
    if (x.erro) { setErro(x.erro); return; }
    setResp(r);
  };
  if (resp === 'sim') return <p className="text-sm text-muted-foreground">Obrigado por confirmar. Bom proveito!</p>;
  if (resp === 'nao') return <p className="text-sm text-muted-foreground">Sentimos muito. Obrigado por avisar, vamos verificar com a loja.</p>;
  return (
    <div className="space-y-2 border-t border-company/20 pt-3">
      <p className="text-sm font-medium text-foreground">Depois de usar, você foi atendido?</p>
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" onClick={() => responder('sim')} disabled={!!enviando} className="h-10">
          {enviando === 'sim' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ThumbsUp className="mr-1.5 h-4 w-4" /> Fui atendido</>}
        </Button>
        <Button size="sm" variant="outline" onClick={() => responder('nao')} disabled={!!enviando} className="h-10">
          {enviando === 'nao' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ThumbsDown className="mr-1.5 h-4 w-4" /> Não fui</>}
        </Button>
      </div>
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}

export default function CupomAcoes({ id, canalInicial = null, lojaNome, pedirLinkInicial = null, onPedirLink, atendidoInicial = null }: Props) {
  const [enviando, setEnviando] = useState<CanalUso | null>(null);
  const [canal, setCanal] = useState<CanalUso | null>(canalInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [pedirLink, setPedirLink] = useState<string | null>(pedirLinkInicial);

  const usar = async (c: CanalUso) => {
    setErro(null);
    setEnviando(c);
    // abre a aba antes da chamada (o navegador do celular bloqueia janela aberta depois de esperar)
    const aba = c === 'online' ? window.open('', '_blank') : null;
    const r = await chamarCupom(id, c);
    setEnviando(null);
    if (r.erro) {
      aba?.close();
      setErro(r.erro);
      return;
    }
    setCanal(c);
    const link = r.cupom?.pedir_link ?? null;
    setPedirLink(link);
    onPedirLink?.(link);
    if (c === 'online') {
      if (link && aba) aba.location.href = link;
      else aba?.close();
    }
  };

  if (canal) {
    return (
      <div className="rounded-xl border border-company/30 bg-company/5 p-4 space-y-3">
        <p className="flex items-start gap-2 font-semibold text-foreground">
          <CheckCircle2 className="h-5 w-5 text-company shrink-0 mt-0.5" />
          {canal === 'loja'
            ? `Avisamos ${lojaNome || 'a loja'}. Mostre esta tela no balcão.`
            : `Avisamos ${lojaNome || 'a loja'} do seu pedido com o cupom.`}
        </p>
        {canal === 'online' && pedirLink && (
          <Button asChild className="w-full">
            <a href={pedirLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" /> Fazer o pedido no WhatsApp da loja
            </a>
          </Button>
        )}
        {canal === 'online' && !pedirLink && (
          <p className="text-sm text-muted-foreground">Faça o pedido no canal da loja e informe o código do cupom.</p>
        )}
        <PerguntaAtendido id={id} inicial={atendidoInicial} />
        <button className="text-xs text-muted-foreground underline" onClick={() => setCanal(null)}>
          Avisar de novo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">Na hora de usar, toque em um:</p>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => usar('loja')} disabled={!!enviando} className="h-12">
          {enviando === 'loja' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Store className="mr-2 h-4 w-4" /> Estou na loja</>}
        </Button>
        <Button onClick={() => usar('online')} disabled={!!enviando} variant="outline" className="h-12">
          {enviando === 'online' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><MessageCircle className="mr-2 h-4 w-4" /> Pedir online</>}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">A loja recebe o aviso na hora e confirma o seu cupom.</p>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
    </div>
  );
}
