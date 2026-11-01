import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Wallet, Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useReachConfig } from '@/hooks/useReachConfig';
import { formatCentsToBRL } from '@/types/database';
import {
  reachDb, LEAGUES, leagueFor, formatViews, formatMonth,
  type RankingRow, type ReachLeague, type PrizeCycle,
} from '@/lib/reach';

const LEAGUE_ORDER: ReachLeague[] = ['OURO', 'PRATA', 'BRONZE'];

export default function AffiliateReachRanking() {
  const { profile } = useAuth();
  const { config } = useReachConfig();
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [cycle, setCycle] = useState<PrizeCycle | null>(null);
  const [myLeague, setMyLeague] = useState<ReachLeague>('BRONZE');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    Promise.all([
      reachDb.rpc('get_reach_ranking'),
      reachDb.from('prize_cycles').select('*').eq('period_start', period).maybeSingle(),
      reachDb.from('affiliate_social_accounts').select('followers').eq('affiliate_id', profile.id),
    ]).then(([rank, cyc, acc]) => {
      setRows((rank.data ?? []) as RankingRow[]);
      setCycle((cyc.data ?? null) as PrizeCycle | null);
      const max = ((acc.data ?? []) as { followers: number }[]).reduce((m, a) => Math.max(m, a.followers), 0);
      setMyLeague(leagueFor(max));
      setLoading(false);
    });
  }, [profile?.id]);

  if (loading) {
    return <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>;
  }

  const me = rows.find((r) => r.is_me);
  const myPoints = me?.points ?? 0;
  const goalPct = Math.min(100, Math.round((myPoints / config.min_cycle_points) * 100));
  const fund = (cycle?.pool_cents ?? 0) + (cycle?.carried_in_cents ?? 0);
  const monthLabel = formatMonth(cycle?.period_start ?? new Date().toISOString());

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-affiliate to-affiliate/80 text-affiliate-foreground border-0">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-bold flex items-center gap-2"><Trophy className="h-5 w-5" /> Ranking de {monthLabel}</p>
            <Badge variant="secondary">Liga {LEAGUES[myLeague].label}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs opacity-90">Seus pontos</p>
              <p className="text-2xl font-bold">{formatViews(myPoints)}</p>
              {me && <p className="text-xs opacity-90">{me.rank_position}º na sua liga</p>}
            </div>
            <div>
              <p className="text-xs opacity-90 flex items-center gap-1"><Wallet className="h-3 w-3" /> Fundo de prêmios</p>
              <p className="text-2xl font-bold">{formatCentsToBRL(fund)}</p>
              <p className="text-xs opacity-90">cresce com cada post aprovado</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs flex items-center gap-1"><Target className="h-3 w-3" /> Meta do mês para concorrer: {formatViews(config.min_cycle_points)} pontos</p>
            <Progress value={goalPct} className="h-2 bg-affiliate-foreground/20" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Prêmios em Pix de cada liga</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {config.prizes_cents.map((p, i) => (
            <div key={i} className="flex justify-between"><span>{i + 1}º lugar</span><strong>{formatCentsToBRL(p)}</strong></div>
          ))}
          <p className="text-xs text-muted-foreground pt-1">
            Cada visualização verificada vale 1 ponto, contando os 7 primeiros dias do post (até o teto de cada post).
            Quem posta nas primeiras {config.early_hours} horas da onda ganha {Math.round(config.early_bonus * 100)}% a mais.
            No fim do mês, quem bateu a meta e ficou no topo da sua liga recebe o prêmio no saldo e saca por Pix.
            Sem sorteio. Se o fundo do mês não cobrir todos os prêmios, eles são ajustados na mesma proporção.
          </p>
        </CardContent>
      </Card>

      {LEAGUE_ORDER.map((lg) => {
        const list = rows.filter((r) => r.league === lg);
        const top = list.slice(0, 10);
        const meOutside = list.find((r) => r.is_me && r.rank_position > 10);
        return (
          <Card key={lg}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                Liga {LEAGUES[lg].label}
                <span className="text-xs font-normal text-muted-foreground">{LEAGUES[lg].range}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {list.length === 0 ? (
                <p className="text-xs text-muted-foreground">Ninguém pontuou nessa liga ainda. Que tal ser o primeiro?</p>
              ) : [...top, ...(meOutside ? [meOutside] : [])].map((r) => (
                <div key={`${r.league}-${r.rank_position}`}
                  className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm ${r.is_me ? 'bg-affiliate-muted font-semibold' : ''}`}>
                  <span>{r.rank_position}º {r.display_name}{r.is_me ? ' (você)' : ''}</span>
                  <span className="flex items-center gap-2">
                    {formatViews(r.points)}
                    {!r.reached_goal && <span className="text-[10px] text-muted-foreground">abaixo da meta</span>}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
