import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert, Store, Megaphone, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCentsToBRL } from '@/types/database';

// Contestações e sinais de fraude.
// Regra: o uso vale quando a loja confirma ou quando o cliente diz "Fui atendido" (a loja tem 48h
// para contestar). Aqui o admin decide as contestações e vê os padrões suspeitos de lojas e divulgadores.

interface Contestacao {
  id: string;
  code: string;
  contestado_em: string;
  contestacao_motivo: string;
  cliente_respondeu_em: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  uso_canal: string | null;
  uso_origem: string | null;
  fee_cents: number | null;
  oferta: string | null;
  loja: string | null;
  divulgador: string | null;
}
interface SinalLoja {
  id: string; nome: string; pedidos: number; pela_loja: number; pelo_cliente: number;
  contestados: number; contestacao_negada: number; cliente_nao_atendido: number; risco: number;
}
interface SinalDivulgador {
  id: string; nome: string; cupons: number; usados: number; lojas: number; telefones: number;
  telefones_repetidos: number; so_cliente_confirmou: number; contestacoes_aceitas: number; max_mesma_loja: number; risco: number;
}

const dataHora = (s: string | null) =>
  s ? new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';

const nivel = (risco: number) =>
  risco >= 10 ? { txt: 'Alto', cls: 'bg-destructive/10 text-destructive border-destructive/30' }
  : risco >= 4 ? { txt: 'Atenção', cls: 'bg-warning/10 text-warning border-warning/30' }
  : { txt: 'Normal', cls: 'bg-success/10 text-success border-success/30' };

export default function AdminContestacoes() {
  const { toast } = useToast();
  const [dias, setDias] = useState(30);
  const [carregando, setCarregando] = useState(true);
  const [contestacoes, setContestacoes] = useState<Contestacao[]>([]);
  const [lojas, setLojas] = useState<SinalLoja[]>([]);
  const [divs, setDivs] = useState<SinalDivulgador[]>([]);
  const [resolvendo, setResolvendo] = useState<string | null>(null);

  const carregar = async () => {
    setCarregando(true);
    const { data, error } = await (supabase.rpc as any)('admin_sinais_fraude', { p_dias: dias });
    setCarregando(false);
    if (error) {
      toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
      return;
    }
    setContestacoes(data?.contestacoes ?? []);
    setLojas(data?.lojas ?? []);
    setDivs(data?.divulgadores ?? []);
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dias]);

  const resolver = async (c: Contestacao, aceita: boolean) => {
    setResolvendo(c.id);
    const { data, error } = await (supabase.rpc as any)('resolver_contestacao', { p_coupon_id: c.id, p_aceita: aceita });
    setResolvendo(null);
    if (error || !data?.ok) {
      toast({ title: 'Não deu certo', description: data?.motivo || error?.message || 'Tente de novo.', variant: 'destructive' });
      return;
    }
    toast({
      title: aceita ? 'Contestação aceita' : 'Contestação negada',
      description: aceita ? 'O cupom não será cobrado.' : 'O uso foi confirmado e a loja foi cobrada.',
    });
    carregar();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Contestações e fraude</h2>
          <p className="text-sm text-muted-foreground">
            Uso confirmado pelo cliente vale como venda. A loja tem 48 horas para contestar. Decida as contestações e acompanhe os padrões suspeitos.
          </p>
        </div>
        <div className="flex gap-1">
          {[7, 30, 90].map((d) => (
            <Button key={d} size="sm" variant={dias === d ? 'default' : 'outline'} onClick={() => setDias(d)} className="rounded-full">
              {d} dias
            </Button>
          ))}
        </div>
      </div>

      {carregando ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-warning" /> Contestações abertas
                <Badge variant="secondary">{contestacoes.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contestacoes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma contestação aberta.</p>
              ) : contestacoes.map((c) => (
                <div key={c.id} className="rounded-2xl border border-border p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-mono font-semibold tracking-widest">{c.code}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="font-medium">{c.loja}</span>
                    <span className="text-muted-foreground">· {c.oferta}</span>
                    {c.fee_cents ? <Badge variant="outline">Taxa {formatCentsToBRL(c.fee_cents)}</Badge> : null}
                  </div>
                  <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    <p>Cliente: <span className="text-foreground">{c.customer_name}</span> ({c.customer_phone})</p>
                    <p>Divulgador: <span className="text-foreground">{c.divulgador || 'sem divulgador'}</span></p>
                    <p>Cliente disse que foi atendido: {dataHora(c.cliente_respondeu_em)} ({c.uso_canal === 'online' ? 'pedido online' : 'na loja'}, pelo {c.uso_origem === 'whatsapp' ? 'WhatsApp' : 'site'})</p>
                    <p>Loja contestou: {dataHora(c.contestado_em)}</p>
                  </div>
                  <blockquote className="rounded-xl bg-muted/60 px-3 py-2 text-sm text-foreground">{c.contestacao_motivo}</blockquote>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button size="sm" variant="outline" disabled={resolvendo === c.id} onClick={() => resolver(c, true)}>
                      <CheckCircle2 className="mr-1.5 h-4 w-4 text-success" /> Aceitar (não cobra a loja)
                    </Button>
                    <Button size="sm" variant="outline" disabled={resolvendo === c.id} onClick={() => resolver(c, false)}>
                      <XCircle className="mr-1.5 h-4 w-4 text-destructive" /> Negar (cobra a loja)
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><Store className="h-5 w-5 text-company" /> Lojas</CardTitle>
              <p className="text-xs text-muted-foreground">
                Sinais: muito uso confirmado só pelo cliente (a loja não confirma), contestações negadas e clientes dizendo que não foram atendidos.
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {lojas.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhum uso de cupom no período.</p>
              ) : lojas.map((l) => {
                const n = nivel(l.risco);
                return (
                  <div key={l.id} className="rounded-xl border border-border p-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{l.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.pedidos} usos pedidos · {l.pela_loja} confirmados pela loja · {l.pelo_cliente} só pelo cliente · {l.contestados} contestados ({l.contestacao_negada} negados) · {l.cliente_nao_atendido} "não fui atendido"
                      </p>
                    </div>
                    <Badge variant="outline" className={n.cls}>{n.txt}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><Megaphone className="h-5 w-5 text-affiliate" /> Divulgadores</CardTitle>
              <p className="text-xs text-muted-foreground">
                Sinais: o mesmo WhatsApp em vários cupons, muitos cupons na mesma loja, uso confirmado só pelo cliente e contestações aceitas contra ele.
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {divs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhum cupom de divulgador no período.</p>
              ) : divs.map((d) => {
                const n = nivel(d.risco);
                return (
                  <div key={d.id} className="rounded-xl border border-border p-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{d.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.cupons} cupons · {d.usados} usados · {d.lojas} lojas · {d.telefones_repetidos} WhatsApp repetidos · até {d.max_mesma_loja} na mesma loja · {d.so_cliente_confirmou} só pelo cliente · {d.contestacoes_aceitas} contestações aceitas
                      </p>
                    </div>
                    <Badge variant="outline" className={n.cls}>{n.txt}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            Para suspender uma conta, use Usuários (banir ou congelar saldo). Os Termos de Uso preveem a suspensão por fraude, com direito de defesa.
          </p>
        </>
      )}
    </div>
  );
}
