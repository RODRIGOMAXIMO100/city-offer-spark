import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Target, Hash, Download, CalendarClock, ExternalLink, Send, ClipboardList, RefreshCw, Zap, Hourglass } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useReachConfig } from '@/hooks/useReachConfig';
import AffiliateSocialAccounts from './AffiliateSocialAccounts';
import SubmitPostModal from './SubmitPostModal';
import {
  reachDb, networkLabel, formatViews, formatDateTime, formatDay, reachErrorMessage, uploadProof,
  postStatusLabel, isCounting, type Mission, type SocialAccount, type CampaignPost,
} from '@/lib/reach';

export default function AffiliateMissions() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const { config } = useReachConfig();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [myPosts, setMyPosts] = useState<(CampaignPost & { campaign_title?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<Mission | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [newViews, setNewViews] = useState('');
  const [newProof, setNewProof] = useState<File | null>(null);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    const [acc, mis, posts] = await Promise.all([
      reachDb.from('affiliate_social_accounts').select('*').eq('affiliate_id', profile.id).order('created_at'),
      reachDb.rpc('get_reach_missions'),
      reachDb.from('campaign_posts').select('*').eq('affiliate_id', profile.id).order('submitted_at', { ascending: false }).limit(30),
    ]);
    setAccounts((acc.data ?? []) as SocialAccount[]);
    const missionList = (mis.data ?? []) as Mission[];
    setMissions(missionList);
    const titles = new Map(missionList.map((m) => [m.id, m.title]));
    setMyPosts(((posts.data ?? []) as CampaignPost[]).map((p) => ({ ...p, campaign_title: titles.get(p.campaign_id) })));
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => { load(); }, [load]);

  const saveViews = async (postId: string) => {
    if (!user) return;
    try {
      const proofPath = newProof ? await uploadProof(user.id, newProof) : null;
      const { error } = await reachDb.rpc('update_campaign_post_views', {
        p_post_id: postId,
        p_reported_views: newViews ? parseInt(newViews, 10) : null,
        p_proof_path: proofPath,
      });
      if (error) throw error;
      toast({ title: 'Visualizações atualizadas' });
      setUpdating(null); setNewViews(''); setNewProof(null);
      load();
    } catch (err) {
      toast({ title: 'Não deu para atualizar', description: reachErrorMessage(err), variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>;
  }

  const now = Date.now();

  return (
    <div className="space-y-5">
      <AffiliateSocialAccounts accounts={accounts} onChange={load} />

      <div className="space-y-3">
        <h2 data-tour="missions" className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Target className="h-4 w-4" /> Missões para você ({missions.length})
        </h2>

        {missions.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">
            Nenhuma missão aberta em {profile?.city || 'sua cidade'} agora. Assim que uma empresa lançar uma campanha, ela aparece aqui.
          </CardContent></Card>
        ) : missions.map((m) => {
          const started = new Date(m.starts_at).getTime() <= now;
          const postingOpen = new Date(m.ends_at).getTime() >= now;
          const bonusUntil = new Date(m.starts_at).getTime() + config.early_hours * 3600_000;
          const bonusOpen = now <= bonusUntil;
          return (
            <Card key={m.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {m.company_avatar ? (
                    <img src={m.company_avatar} alt="" className="h-10 w-10 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-affiliate-muted flex items-center justify-center text-affiliate font-bold">
                      {m.company_name?.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{m.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.company_name}</p>
                  </div>
                </div>

                <div className="rounded-md bg-affiliate-muted p-3 space-y-1">
                  <p className="text-sm flex items-start gap-1">
                    <Hash className="h-4 w-4 text-affiliate shrink-0 mt-0.5" />
                    <span>Fale <strong>{m.keyword}</strong> no vídeo e escreva na legenda, junto com <strong>#publi</strong>.</span>
                  </p>
                  {m.briefing && (
                    <div className="pt-1">
                      <p className="text-xs font-semibold text-foreground">Roteiro da empresa</p>
                      <p className="text-xs text-muted-foreground whitespace-pre-line">{m.briefing}</p>
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1"><CalendarClock className="h-3 w-3" />Onda: poste entre {formatDateTime(m.starts_at)} e {formatDateTime(m.ends_at)}</p>
                  {started && bonusOpen && (
                    <p className="flex items-center gap-1 font-medium text-foreground">
                      <Zap className="h-3 w-3 text-highlight" /> Poste até {formatDateTime(new Date(bonusUntil).toISOString())} e ganhe {Math.round(config.early_bonus * 100)}% a mais de pontos
                    </p>
                  )}
                  {!started && (
                    <p className="flex items-center gap-1"><Zap className="h-3 w-3 text-highlight" /> Quem postar nas primeiras {config.early_hours} horas ganha {Math.round(config.early_bonus * 100)}% a mais de pontos</p>
                  )}
                  <p>Redes: {m.networks.map(networkLabel).join(', ')}</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {m.my_posts.map((p) => (
                    <Badge key={p.id} variant="outline">{networkLabel(p.network)}: {postStatusLabel(p)}</Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  {m.kit_url && (
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <a href={m.kit_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4 mr-1" />Material</a>
                    </Button>
                  )}
                  <Button size="sm" className="flex-1 bg-affiliate text-affiliate-foreground hover:bg-affiliate/90"
                    disabled={!started} onClick={() => setSubmitting(m)}>
                    <Send className="h-4 w-4 mr-1" /> {started ? (postingOpen ? 'Enviar meu post' : 'Enviar post atrasado') : 'Ainda não começou'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4 text-affiliate" /> Meus posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {myPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Os posts que você enviar aparecem aqui com o resultado da conferência.</p>
          ) : myPosts.map((p) => (
            <div key={p.id} className="rounded-md border border-border p-2.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.campaign_title || 'Missão encerrada'}</p>
                  <p className="text-xs text-muted-foreground">
                    {networkLabel(p.network)} · {postStatusLabel(p)}
                    {p.status === 'APPROVED' && ` · ${formatViews(p.points)} pontos`}
                    {p.status === 'PENDING' && p.reported_views > 0 && ` · ${formatViews(p.reported_views)} visualizações informadas`}
                  </p>
                  {isCounting(p) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Hourglass className="h-3 w-3" /> Visualizações contam até {formatDay(p.count_at)}. Nesse dia, atualize o número e o print.
                    </p>
                  )}
                  {p.early_bonus && p.status !== 'REJECTED' && (
                    <p className="text-xs text-foreground flex items-center gap-1"><Zap className="h-3 w-3 text-highlight" /> Bônus de quem postou cedo</p>
                  )}
                  {p.status === 'REJECTED' && p.rejection_reason && (
                    <p className="text-xs text-destructive">{p.rejection_reason}</p>
                  )}
                </div>
                <a href={p.post_url} target="_blank" rel="noopener noreferrer" className="text-affiliate shrink-0" aria-label="Abrir post">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              {p.status === 'PENDING' && (
                updating === p.id ? (
                  <div className="space-y-2">
                    <Input type="number" min={0} value={newViews} onChange={(e) => setNewViews(e.target.value)} placeholder="Visualizações agora" />
                    <input type="file" accept="image/*" className="text-xs" onChange={(e) => setNewProof(e.target.files?.[0] ?? null)} />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setUpdating(null)}>Cancelar</Button>
                      <Button size="sm" className="flex-1" onClick={() => saveViews(p.id)}>Salvar</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { setUpdating(p.id); setNewViews(String(p.reported_views || '')); }}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Atualizar visualizações
                  </Button>
                )
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <SubmitPostModal
        mission={submitting}
        accounts={accounts}
        onClose={() => setSubmitting(null)}
        onSubmitted={() => { setSubmitting(null); load(); }}
      />
    </div>
  );
}
