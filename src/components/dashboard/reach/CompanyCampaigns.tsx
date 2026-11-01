import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Megaphone, PlusCircle, ExternalLink, Eye, Hash, CalendarClock, ChevronDown, ChevronUp, MapPin, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { formatCentsToBRL } from '@/types/database';
import CreateCampaignModal from './CreateCampaignModal';
import {
  reachDb, formatViews, formatDateTime, formatDay, networkLabel, reachErrorMessage,
  CAMPAIGN_STATUS_LABEL, postStatusLabel, isCounting, type Campaign, type CampaignPost,
} from '@/lib/reach';

interface Props {
  onNeedCredits: () => void;
}

export default function CompanyCampaigns({ onNeedCredits }: Props) {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [posts, setPosts] = useState<Record<string, CampaignPost[]>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [finishing, setFinishing] = useState<Campaign | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    const { data, error } = await reachDb
      .from('campaigns')
      .select('*')
      .eq('company_id', profile.id)
      .order('created_at', { ascending: false });
    if (!error) {
      setCampaigns((data ?? []) as Campaign[]);
      const ids = (data ?? []).map((c: Campaign) => c.id);
      if (ids.length) {
        const { data: p } = await reachDb
          .from('campaign_posts')
          .select('*')
          .in('campaign_id', ids)
          .order('submitted_at', { ascending: false });
        const grouped: Record<string, CampaignPost[]> = {};
        (p ?? []).forEach((row: CampaignPost) => {
          (grouped[row.campaign_id] ||= []).push(row);
        });
        setPosts(grouped);
      }
    }
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => { load(); }, [load]);

  const handleFinish = async () => {
    if (!finishing) return;
    setBusy(true);
    const { data, error } = await reachDb.rpc('finish_campaign', { p_campaign_id: finishing.id });
    setBusy(false);
    setFinishing(null);
    if (error) {
      toast({ title: 'Não deu para encerrar', description: reachErrorMessage(error), variant: 'destructive' });
      return;
    }
    toast({ title: 'Campanha encerrada', description: `${formatCentsToBRL(Number(data) || 0)} voltaram para o seu saldo.` });
    await refreshProfile();
    load();
  };

  return (
    <div className="space-y-4">
      <Card data-tour="campaigns" className="bg-gradient-to-r from-company to-company/80 text-company-foreground border-0">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="bg-company-foreground/20 p-2.5 rounded-full shrink-0">
              <Megaphone className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-base sm:text-lg">Faça uma onda com a sua marca</p>
              <p className="text-xs sm:text-sm opacity-95">
                Dezenas de pessoas reais postam sobre a sua marca no mesmo dia, cada uma no próprio perfil. Você paga só pelas visualizações verificadas.
              </p>
            </div>
          </div>
          <Button variant="secondary" className="w-full" onClick={() => setShowCreate(true)}>
            <PlusCircle className="h-4 w-4 mr-2" /> Nova campanha
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : campaigns.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">
          Você ainda não tem campanhas. Crie a primeira e acompanhe o alcance por aqui.
        </CardContent></Card>
      ) : (
        campaigns.map((c) => {
          const list = posts[c.id] ?? [];
          const approved = list.filter((p) => p.status === 'APPROVED');
          const counting = list.filter((p) => isCounting(p)).length;
          const pending = list.filter((p) => p.status === 'PENDING').length;
          const people = new Set(list.filter((p) => p.status !== 'REJECTED').map((p) => p.affiliate_id)).size;
          const pct = Math.min(100, Math.round((c.verified_views / c.goal_views) * 100));
          const isOpen = expanded === c.id;
          return (
            <Card key={c.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Hash className="h-3 w-3" />{c.keyword}</p>
                  </div>
                  <Badge variant={c.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className={c.status === 'ACTIVE' ? 'bg-company text-company-foreground' : ''}>
                    {CAMPAIGN_STATUS_LABEL[c.status]}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1"><Eye className="h-4 w-4 text-company" />{formatViews(c.verified_views)} visualizações</span>
                    <span className="text-muted-foreground">meta {formatViews(c.goal_views)}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="rounded-md bg-muted p-2">
                    <p className="text-sm font-bold flex items-center justify-center gap-1"><Users className="h-3.5 w-3.5 text-company" />{people}</p>
                    <p className="text-[10px] text-muted-foreground">pessoas postaram</p>
                  </div>
                  <div className="rounded-md bg-muted p-2">
                    <p className="text-sm font-bold">{approved.length}</p>
                    <p className="text-[10px] text-muted-foreground">posts aprovados</p>
                  </div>
                  <div className="rounded-md bg-muted p-2">
                    <p className="text-sm font-bold">{pending}</p>
                    <p className="text-[10px] text-muted-foreground">{counting > 0 ? `${counting} contando, ${pending - counting} em conferência` : 'em conferência'}</p>
                  </div>
                  <div className="rounded-md bg-muted p-2">
                    <p className="text-sm font-bold">{formatCentsToBRL(c.spent_cents)}</p>
                    <p className="text-[10px] text-muted-foreground">de {formatCentsToBRL(c.reserved_cents)}</p>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1"><CalendarClock className="h-3 w-3" />Onda de {formatDateTime(c.starts_at)} até {formatDateTime(c.ends_at)}</p>
                  <p>Visualizações verificadas incluem tudo o que os posts alcançaram. Você paga até o teto de cada post.</p>
                  <p className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.cities.length ? c.cities.join(', ') : 'Brasil inteiro'} · {c.networks.map(networkLabel).join(', ')}</p>
                  {c.status === 'FINISHED' && c.refunded_cents > 0 && (
                    <p>{formatCentsToBRL(c.refunded_cents)} devolvidos ao saldo.</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setExpanded(isOpen ? null : c.id)}>
                    {isOpen ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                    Mural da onda ({list.length})
                  </Button>
                  {c.status === 'ACTIVE' && (
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setFinishing(c)}>
                      Encerrar
                    </Button>
                  )}
                </div>

                {isOpen && (
                  <div className="grid gap-2 pt-1 sm:grid-cols-2">
                    {list.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhum post enviado ainda. Assim que a onda começar, os posts aparecem aqui.</p>
                    ) : list.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-xs">
                        <div className="min-w-0">
                          <p className="font-medium">{networkLabel(p.network)} · {postStatusLabel(p)}</p>
                          <p className="text-muted-foreground">
                            {p.status === 'APPROVED'
                              ? `${formatViews(p.verified_views)} visualizações`
                              : isCounting(p)
                                ? `Postado ${formatDateTime(p.submitted_at)} · conta até ${formatDay(p.count_at)}`
                                : formatDateTime(p.submitted_at)}
                          </p>
                        </div>
                        <a href={p.post_url} target="_blank" rel="noopener noreferrer" className="text-company flex items-center gap-1 shrink-0">
                          Abrir <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      <CreateCampaignModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); load(); }}
        onNeedCredits={() => { setShowCreate(false); onNeedCredits(); }}
      />

      <AlertDialog open={!!finishing} onOpenChange={(o) => !o && setFinishing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar a campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              Os divulgadores param de enviar posts e o valor que não foi usado volta para o seu saldo
              {finishing ? ` (${formatCentsToBRL(finishing.reserved_cents - finishing.spent_cents)})` : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinish} disabled={busy}>Encerrar campanha</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
