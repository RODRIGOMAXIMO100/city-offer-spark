import { useState } from 'react';
import { Loader2, MessageCircle, Store, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

// Botões de uso do cupom: o cliente avisa que vai usar agora ("Estou na loja" ou "Pedir online").
// A loja vê na hora no painel (e no WhatsApp) e confirma com um toque.
export type CanalUso = 'loja' | 'online';

export async function chamarCupom(id: string, acao: 'ver' | CanalUso) {
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
}

export default function CupomAcoes({ id, canalInicial = null, lojaNome, pedirLinkInicial = null, onPedirLink }: Props) {
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
