import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Loader2, MessageCircle, Radio, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// "Clientes usando cupom agora": quem tocou em "Estou na loja" ou "Pedir online" (no WhatsApp ou
// na página do cupom) aparece aqui na hora, com o botão Confirmar uso. Atualiza sozinho.

interface Pedido {
  id: string;
  code: string;
  customer_name: string | null;
  uso_canal: 'loja' | 'online' | null;
  uso_solicitado_em: string;
  cliente_atendido: 'sim' | 'nao' | null;
  cliente_respondeu_em: string | null;
  contestacao_status: 'aberta' | 'aceita' | 'negada' | null;
  offers: { title: string } | null;
}

const PRAZO_H = 48;
const faltaPrazo = (s: string | null) => {
  if (!s) return '';
  const h = Math.max(0, PRAZO_H - (Date.now() - new Date(s).getTime()) / 36e5);
  return h >= 1 ? `${Math.floor(h)} h` : `${Math.max(1, Math.round(h * 60))} min`;
};

const nomeCurto = (n?: string | null) => {
  const p = (n || '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return 'Cliente';
  return p.length > 1 ? `${p[0]} ${p[p.length - 1][0].toUpperCase()}.` : p[0];
};

const haQuanto = (s: string) => {
  const min = Math.max(0, Math.round((Date.now() - new Date(s).getTime()) / 60000));
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  return `há ${h} h`;
};

// bipe curto quando chega cliente novo (sem arquivo de áudio)
const bipe = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.16;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.start(t); o.stop(t + 0.15);
    });
  } catch { /* navegador sem áudio */ }
};

export default function ClientesUsandoAgora({ onConfirmado }: { onConfirmado?: () => void }) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [lista, setLista] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [contestar, setContestar] = useState<Pedido | null>(null);
  const [motivo, setMotivo] = useState('');
  const [enviandoContestacao, setEnviandoContestacao] = useState(false);
  const vistos = useRef<Set<string> | null>(null);

  const carregar = async () => {
    if (!profile?.id) return;
    const desde = new Date(Date.now() - 12 * 36e5).toISOString();
    const desdeCliente = new Date(Date.now() - PRAZO_H * 36e5).toISOString();
    const { data } = await supabase
      .from('coupons')
      .select('id, code, customer_name, uso_canal, uso_solicitado_em, cliente_atendido, cliente_respondeu_em, contestacao_status, offers(title)' as any)
      .eq('company_id', profile.id)
      .eq('status', 'ISSUED')
      .not('uso_solicitado_em' as any, 'is', null)
      .or(`uso_solicitado_em.gte.${desde},and(cliente_atendido.eq.sim,cliente_respondeu_em.gte.${desdeCliente})`)
      .order('uso_solicitado_em' as any, { ascending: false })
      .limit(40);
    const rows = ((data as any) || []) as Pedido[];
    const chaves = rows.map((r) => `${r.id}:${r.uso_solicitado_em}`);
    if (vistos.current && chaves.some((k) => !vistos.current!.has(k))) {
      bipe();
      toast({ title: 'Cliente usando cupom agora', description: 'Confira e toque em Confirmar uso.' });
    }
    vistos.current = new Set(chaves);
    setLista(rows);
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const confirmar = async (p: Pedido) => {
    setConfirmando(p.id);
    const { data, error } = await supabase.functions.invoke('redeem-coupon', { body: { code: p.code } });
    setConfirmando(null);
    if (error || data?.error) {
      let msg = data?.error || 'Não deu para confirmar agora.';
      try { const b = await (error as any)?.context?.json(); if (b?.error) msg = b.error; } catch { /* padrão */ }
      toast({ title: 'Não confirmou', description: msg, variant: 'destructive' });
      carregar();
      return;
    }
    toast({ title: 'Cupom confirmado!', description: `${nomeCurto(p.customer_name)} · ${p.offers?.title ?? ''}` });
    setLista((l) => l.filter((x) => x.id !== p.id));
    onConfirmado?.();
  };

  const enviarContestacao = async () => {
    if (!contestar) return;
    setEnviandoContestacao(true);
    const { data, error } = await (supabase.rpc as any)('contestar_cupom', { p_coupon_id: contestar.id, p_motivo: motivo });
    setEnviandoContestacao(false);
    if (error || !data?.ok) {
      toast({ title: 'Não deu para contestar', description: data?.motivo || 'Tente de novo.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Contestação enviada', description: 'O Clilin vai analisar e te responder. Enquanto isso, nada é cobrado.' });
    setContestar(null);
    setMotivo('');
    carregar();
  };

  return (
    <Card className="border-company/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Radio className="h-5 w-5 text-company animate-pulse" />
          Clientes usando cupom agora
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Quando o cliente toca em "Estou na loja" ou "Pedir online", ele aparece aqui na hora. Confira e confirme.
          Se o cliente disser que foi atendido, o uso vale como confirmado e você tem 48 horas para contestar.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {carregando ? (
          <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : lista.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Ninguém usando cupom agora. Esta lista atualiza sozinha.</p>
        ) : (
          lista.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{nomeCurto(p.customer_name)}</p>
                  <Badge variant={p.uso_canal === 'online' ? 'secondary' : 'default'} className="gap-1">
                    {p.uso_canal === 'online' ? <><MessageCircle className="h-3 w-3" /> Pedido online</> : <><Store className="h-3 w-3" /> Na loja</>}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{haQuanto(p.uso_solicitado_em)}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{p.offers?.title}</p>
                <p className="font-mono text-lg tracking-widest">{p.code}</p>
                {p.cliente_atendido === 'sim' && p.contestacao_status !== 'aberta' && (
                  <p className="mt-1 flex items-start gap-1.5 text-xs text-warning">
                    <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    O cliente disse que foi atendido. Se você não contestar, o uso é confirmado sozinho em {faltaPrazo(p.cliente_respondeu_em)}.
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:w-44">
                {p.contestacao_status === 'aberta' ? (
                  <Badge variant="outline" className="justify-center py-2">Contestação em análise</Badge>
                ) : (
                  <>
                    <Button onClick={() => confirmar(p)} disabled={confirmando === p.id} className="h-12">
                      {confirmando === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar uso</>}
                    </Button>
                    {p.cliente_atendido === 'sim' && (
                      <Button variant="ghost" size="sm" onClick={() => { setContestar(p); setMotivo(''); }} className="text-muted-foreground">
                        Não atendi este cliente
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={!!contestar} onOpenChange={(o) => !o && setContestar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" /> Contestar uso do cupom</DialogTitle>
            <DialogDescription>
              {contestar ? `${nomeCurto(contestar.customer_name)} disse que foi atendido com o cupom ${contestar.code}.` : ''} Conte o que aconteceu e, se tiver, cite a prova
              (por exemplo: o cliente não apareceu, o pedido não foi feito, conversa no WhatsApp). Enquanto o Clilin analisa, nada é cobrado.
            </DialogDescription>
          </DialogHeader>
          <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={4} maxLength={1000} placeholder="Ex.: o cliente não veio à loja hoje. Tenho o caixa do dia sem esse pedido." />
          <p className="text-xs text-muted-foreground">
            Contestação falsa ou repetida pode levar à suspensão da conta, conforme os Termos de Uso.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setContestar(null)}>Cancelar</Button>
            <Button onClick={enviarContestacao} disabled={motivo.trim().length < 10 || enviandoContestacao}>
              {enviandoContestacao ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar contestação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
