import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, MessageCircle, Radio, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// "Clientes usando cupom agora": quem tocou em "Estou na loja" ou "Pedir online" (no WhatsApp ou
// na página do cupom) aparece aqui na hora, com o botão Confirmar uso. Atualiza sozinho.

interface Pedido {
  id: string;
  code: string;
  customer_name: string | null;
  uso_canal: 'loja' | 'online' | null;
  uso_solicitado_em: string;
  offers: { title: string } | null;
}

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
  const vistos = useRef<Set<string> | null>(null);

  const carregar = async () => {
    if (!profile?.id) return;
    const desde = new Date(Date.now() - 12 * 36e5).toISOString();
    const { data } = await supabase
      .from('coupons')
      .select('id, code, customer_name, uso_canal, uso_solicitado_em, offers(title)' as any)
      .eq('company_id', profile.id)
      .eq('status', 'ISSUED')
      .gte('uso_solicitado_em' as any, desde)
      .order('uso_solicitado_em' as any, { ascending: false })
      .limit(30);
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

  return (
    <Card className="border-company/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Radio className="h-5 w-5 text-company animate-pulse" />
          Clientes usando cupom agora
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Quando o cliente toca em "Estou na loja" ou "Pedir online", ele aparece aqui na hora. Confira e confirme.
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
              </div>
              <Button onClick={() => confirmar(p)} disabled={confirmando === p.id} className="h-12 sm:w-44">
                {confirmando === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar uso</>}
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
