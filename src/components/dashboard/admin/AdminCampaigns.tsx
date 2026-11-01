import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, ExternalLink, CheckCircle2, XCircle, RefreshCw, Image as ImageIcon, BadgeCheck, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCentsToBRL } from '@/types/database';
import {
  reachDb, networkLabel, formatViews, formatDateTime, formatMonth, reachErrorMessage, LEAGUES, leagueFor,
  CAMPAIGN_STATUS_LABEL, type Campaign, type CampaignPost, type SocialAccount, type PrizeCycle,
} from '@/lib/reach';

type PendingPost = CampaignPost & {
  campaigns: Pick<Campaign, 'title' | 'keyword' | 'starts_at' | 'ends_at'> | null;
  profiles: { name: string; nome_completo: string | null; city: string } | null;
  affiliate_social_accounts: Pick<SocialAccount, 'handle' | 'followers' | 'verified'> | null;
};

type AdminCampaign = Campaign & { profiles: { name: string } | null };
type AdminAccount = SocialAccount & { profiles: { name: string; nome_completo: string | null; city: string } | null };

const yesNo = (v: boolean | null | undefined) => (v === true ? 'sim' : v === false ? 'não' : 'não lido');

function PendingPosts() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await reachDb
      .from('campaign_posts')
      .select('*, campaigns(title, keyword, starts_at, ends_at), profiles!campaign_posts_affiliate_id_fkey(name, nome_completo, city), affiliate_social_accounts(handle, followers, verified)')
      .eq('status', 'PENDING')
      .order('submitted_at', { ascending: true })
      .limit(50);
    setPosts((data ?? []) as PendingPost[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openProof = async (path: string) => {
    const { data, error } = await supabase.storage.from('post-proofs').createSignedUrl(path, 300);
    if (error || !data) {
      toast({ title: 'Não deu para abrir o print', variant: 'destructive' });
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener');
  };

  const recheck = async (id: string) => {
    setBusy(id);
    await supabase.functions.invoke('check-post', { body: { post_id: id } });
    setBusy(null);
    load();
  };

  const review = async (p: PendingPost, approve: boolean) => {
    setBusy(p.id);
    const v = views[p.id] ?? String(p.auto_check?.views ?? p.reported_views ?? '');
    const { error } = await reachDb.rpc('review_campaign_post', {
      p_post_id: p.id,
      p_approve: approve,
      p_verified_views: approve ? parseInt(v || '0', 10) : null,
      p_reason: approve ? null : reasons[p.id] || null,
    });
    setBusy(null);
    if (error) {
      toast({ title: 'Não deu para salvar', description: reachErrorMessage(error), variant: 'destructive' });
      return;
    }
    toast({ title: approve ? 'Post aprovado' : 'Post recusado' });
    load();
  };

  if (loading) return <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;
  if (posts.length === 0) return <p className="text-sm text-muted-foreground py-6 text-center">Nenhum post esperando conferência. 🎉</p>;

  return (
    <div className="space-y-3">
      {posts.map((p) => {
        const ac = p.auto_check ?? {};
        const suggested = views[p.id] ?? String(ac.views ?? p.reported_views ?? '');
        return (
          <Card key={p.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{p.campaigns?.title} <span className="text-muted-foreground font-normal">· {p.campaigns?.keyword}</span></p>
                  <p className="text-xs text-muted-foreground">
                    {p.profiles?.nome_completo || p.profiles?.name} ({p.profiles?.city}) · {networkLabel(p.network)} @{p.affiliate_social_accounts?.handle}
                    {' '}· {formatViews(p.affiliate_social_accounts?.followers)} seguidores
                    {p.affiliate_social_accounts?.verified && ' · perfil conferido'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Enviado {formatDateTime(p.submitted_at)} · janela {p.campaigns && `${formatDateTime(p.campaigns.starts_at)} a ${formatDateTime(p.campaigns.ends_at)}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a href={p.post_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-1" />Post</a>
                  </Button>
                  {p.proof_path && (
                    <Button size="sm" variant="outline" onClick={() => openProof(p.proof_path!)}><ImageIcon className="h-4 w-4 mr-1" />Print</Button>
                  )}
                </div>
              </div>

              <div className="rounded-md bg-muted p-2.5 text-xs space-y-0.5">
                <p className="font-medium flex items-center justify-between">
                  Leitura automática {ac.checked_at ? `(${formatDateTime(ac.checked_at)})` : '(ainda não feita)'}
                  <Button size="sm" variant="ghost" className="h-6 px-2" disabled={busy === p.id} onClick={() => recheck(p.id)}>
                    <RefreshCw className="h-3 w-3 mr-1" />Ler de novo
                  </Button>
                </p>
                <p>Post encontrado: {yesNo(ac.exists)} · Autor confere: {yesNo(ac.author_matches)}{ac.author ? ` (@${ac.author})` : ''}</p>
                <p>Palavra-chave: {yesNo(ac.has_keyword)} · #publi: {yesNo(ac.has_publi)} · Visualizações lidas: {ac.views != null ? formatViews(ac.views) : 'não disponível'}</p>
                {ac.caption && <p className="text-muted-foreground line-clamp-2">Legenda: {ac.caption}</p>}
                {ac.note && <p className="text-muted-foreground">{ac.note}</p>}
                <p>Visualizações informadas pelo divulgador: {formatViews(p.reported_views)}</p>
              </div>

              <div className="grid gap-2 sm:grid-cols-[1fr_auto] items-end">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground" htmlFor={`v-${p.id}`}>Visualizações verificadas (viram pontos e cobrança)</label>
                  <Input id={`v-${p.id}`} type="number" min={0} value={suggested}
                    onChange={(e) => setViews((s) => ({ ...s, [p.id]: e.target.value }))} />
                </div>
                <Button disabled={busy === p.id || suggested === ''} onClick={() => review(p, true)}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto] items-end">
                <Input placeholder="Motivo da recusa (o divulgador vê)" value={reasons[p.id] ?? ''}
                  onChange={(e) => setReasons((s) => ({ ...s, [p.id]: e.target.value }))} />
                <Button variant="outline" disabled={busy === p.id} onClick={() => review(p, false)}>
                  <XCircle className="h-4 w-4 mr-1" /> Recusar
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function CampaignsList() {
  const { toast } = useToast();
  const [rows, setRows] = useState<AdminCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState<AdminCampaign | null>(null);

  const load = useCallback(async () => {
    const { data } = await reachDb.from('campaigns').select('*, profiles(name)').order('created_at', { ascending: false }).limit(100);
    setRows((data ?? []) as AdminCampaign[]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const finish = async () => {
    if (!finishing) return;
    const { error } = await reachDb.rpc('finish_campaign', { p_campaign_id: finishing.id });
    setFinishing(null);
    if (error) toast({ title: 'Não deu para encerrar', description: reachErrorMessage(error), variant: 'destructive' });
    else { toast({ title: 'Campanha encerrada e saldo devolvido' }); load(); }
  };

  if (loading) return <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-2">
      {rows.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma campanha criada ainda.</p>}
      {rows.map((c) => {
        const overdue = c.status === 'ACTIVE' && new Date(c.ends_at).getTime() + 3 * 864e5 < Date.now();
        return (
          <Card key={c.id}>
            <CardContent className="p-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <div className="min-w-0">
                <p className="font-medium">{c.title} <span className="text-muted-foreground">· {c.profiles?.name}</span></p>
                <p className="text-xs text-muted-foreground">
                  {formatViews(c.verified_views)} de {formatViews(c.goal_views)} visualizações · {formatCentsToBRL(c.spent_cents)} de {formatCentsToBRL(c.reserved_cents)}
                  {' '}· até {formatDateTime(c.ends_at)} · {c.cities.length ? c.cities.join(', ') : 'Brasil inteiro'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {overdue && <Badge variant="destructive">Prazo encerrado</Badge>}
                <Badge variant="secondary">{CAMPAIGN_STATUS_LABEL[c.status]}</Badge>
                {c.status === 'ACTIVE' && <Button size="sm" variant="outline" onClick={() => setFinishing(c)}>Encerrar</Button>}
              </div>
            </CardContent>
          </Card>
        );
      })}
      <AlertDialog open={!!finishing} onOpenChange={(o) => !o && setFinishing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar "{finishing?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Posts ainda em conferência serão recusados e o saldo não usado volta para a empresa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={finish}>Encerrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SocialAccountsReview() {
  const { toast } = useToast();
  const [rows, setRows] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const { data } = await reachDb.from('affiliate_social_accounts')
      .select('*, profiles(name, nome_completo, city)')
      .order('verified', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(100);
    setRows((data ?? []) as AdminAccount[]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (a: AdminAccount, verified: boolean) => {
    const f = followers[a.id];
    const { error } = await reachDb.rpc('verify_social_account', {
      p_account_id: a.id, p_followers: f ? parseInt(f, 10) : null, p_verified: verified,
    });
    if (error) toast({ title: 'Não deu para salvar', description: reachErrorMessage(error), variant: 'destructive' });
    else load();
  };

  if (loading) return <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-2">
      {rows.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">Nenhum perfil cadastrado ainda.</p>}
      {rows.map((a) => (
        <Card key={a.id}>
          <CardContent className="p-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="min-w-0">
              <p className="font-medium flex items-center gap-1">
                {networkLabel(a.network)} @{a.handle}
                {a.verified && <BadgeCheck className="h-4 w-4 text-affiliate" />}
              </p>
              <p className="text-xs text-muted-foreground">
                {a.profiles?.nome_completo || a.profiles?.name} ({a.profiles?.city}) · liga {LEAGUES[leagueFor(a.followers)].label}
                {a.profile_url && <> · <a className="underline" href={a.profile_url} target="_blank" rel="noopener noreferrer">abrir perfil</a></>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input className="w-28 h-8" type="number" min={0} placeholder={String(a.followers)}
                value={followers[a.id] ?? ''} onChange={(e) => setFollowers((s) => ({ ...s, [a.id]: e.target.value }))} />
              <Button size="sm" variant="outline" onClick={() => save(a, true)}>Conferido</Button>
              {a.verified && <Button size="sm" variant="ghost" onClick={() => save(a, false)}>Desfazer</Button>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PrizeCycles() {
  const { toast } = useToast();
  const [cycles, setCycles] = useState<PrizeCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState<PrizeCycle | null>(null);

  const load = useCallback(async () => {
    const { data } = await reachDb.from('prize_cycles').select('*').order('period_start', { ascending: false }).limit(12);
    setCycles((data ?? []) as PrizeCycle[]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const close = async () => {
    if (!closing) return;
    const monthEnded = new Date(closing.period_start + 'T00:00:00').getTime() < new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const { data, error } = await reachDb.rpc('close_prize_cycle', { p_cycle_id: closing.id, p_force: !monthEnded });
    setClosing(null);
    if (error) {
      toast({ title: 'Não deu para fechar o ciclo', description: reachErrorMessage(error), variant: 'destructive' });
      return;
    }
    const r = data as { winners: number; paid_cents: number; carried_cents: number };
    toast({
      title: 'Ciclo fechado 🏆',
      description: `${r.winners} premiado(s), ${formatCentsToBRL(r.paid_cents)} pagos no saldo, ${formatCentsToBRL(r.carried_cents)} passam para o próximo mês.`,
    });
    load();
  };

  if (loading) return <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-2">
      {cycles.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">O primeiro ciclo é criado quando o primeiro post for aprovado.</p>}
      {cycles.map((c) => (
        <Card key={c.id}>
          <CardContent className="p-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <div>
              <p className="font-medium flex items-center gap-1"><Trophy className="h-4 w-4" /> {formatMonth(c.period_start)}</p>
              <p className="text-xs text-muted-foreground">
                Fundo {formatCentsToBRL(c.pool_cents)} + {formatCentsToBRL(c.carried_in_cents)} do mês anterior
                {c.status === 'CLOSED' && ` · ${formatCentsToBRL(c.paid_cents)} pagos`}
              </p>
            </div>
            {c.status === 'OPEN'
              ? <Button size="sm" onClick={() => setClosing(c)}>Fechar e premiar</Button>
              : <Badge variant="secondary">Fechado</Badge>}
          </CardContent>
        </Card>
      ))}
      <AlertDialog open={!!closing} onOpenChange={(o) => !o && setClosing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar o ranking de {closing && formatMonth(closing.period_start)}?</AlertDialogTitle>
            <AlertDialogDescription>
              Os melhores de cada liga que bateram a meta recebem o prêmio no saldo agora. Isso não pode ser desfeito.
              Posts aprovados depois disso contam para o mês seguinte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={close}>Fechar e premiar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export type AdminCampaignsTab = 'posts' | 'campaigns' | 'accounts' | 'prizes';

const TAB_HEADER: Record<AdminCampaignsTab, { title: string; text: string }> = {
  posts: { title: 'Conferir posts', text: 'Abra cada post, compare com o print e aprove as visualizações ou recuse com o motivo.' },
  campaigns: { title: 'Campanhas', text: 'Todas as campanhas das empresas, com meta, visualizações verificadas e valor consumido.' },
  accounts: { title: 'Aprovar perfis', text: 'Confira se o perfil é da pessoa, está aberto e tem seguidores reais. É isso que define a liga.' },
  prizes: { title: 'Prêmios do mês', text: 'Ranking de cada liga, fundo do mês e fechamento do ciclo com o pagamento dos prêmios.' },
};

export default function AdminCampaigns({ tab = 'posts' }: { tab?: AdminCampaignsTab }) {
  const header = TAB_HEADER[tab];
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-display font-bold">{header.title}</h2>
        <p className="text-sm text-muted-foreground">{header.text}</p>
      </div>
      <Tabs key={tab} defaultValue={tab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="posts">Posts para conferir</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="accounts">Perfis dos divulgadores</TabsTrigger>
          <TabsTrigger value="prizes">Prêmios</TabsTrigger>
        </TabsList>
        <TabsContent value="posts"><PendingPosts /></TabsContent>
        <TabsContent value="campaigns"><CampaignsList /></TabsContent>
        <TabsContent value="accounts"><SocialAccountsReview /></TabsContent>
        <TabsContent value="prizes"><PrizeCycles /></TabsContent>
      </Tabs>
    </div>
  );
}

