import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, TrendingUp, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCreditsToReal } from '@/types/database';

interface RankingEntry {
  affiliate_id: string;
  profile_name: string;
  clicks: number;
  earnings: number;
  level_name: string;
  badge_color: string;
}

interface AffiliateRankingProps {
  currentAffiliateId?: string;
}

export default function AffiliateRanking({ currentAffiliateId }: AffiliateRankingProps) {
  const [weeklyRanking, setWeeklyRanking] = useState<RankingEntry[]>([]);
  const [monthlyRanking, setMonthlyRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPosition, setCurrentPosition] = useState<{ weekly: number | null; monthly: number | null }>({
    weekly: null,
    monthly: null,
  });

  useEffect(() => {
    fetchRankings();
  }, [currentAffiliateId]);

  const fetchRankings = async () => {
    setLoading(true);

    try {
      // Fetch affiliate stats with profile info and level
      const { data: stats } = await supabase
        .from('affiliate_stats')
        .select(`
          affiliate_id,
          clicks_this_week,
          clicks_this_month,
          total_earnings,
          current_level_id,
          profiles!affiliate_stats_affiliate_id_fkey(name),
          affiliate_levels!affiliate_stats_current_level_id_fkey(name, badge_color)
        `)
        .order('clicks_this_week', { ascending: false })
        .limit(50);

      if (stats) {
        // Weekly ranking (top 10)
        const weekly = stats
          .filter(s => (s.clicks_this_week || 0) > 0)
          .sort((a, b) => (b.clicks_this_week || 0) - (a.clicks_this_week || 0))
          .slice(0, 10)
          .map(s => ({
            affiliate_id: s.affiliate_id,
            profile_name: (s.profiles as { name: string })?.name || 'Anônimo',
            clicks: s.clicks_this_week || 0,
            earnings: s.total_earnings || 0,
            level_name: (s.affiliate_levels as { name: string })?.name || 'Bronze',
            badge_color: (s.affiliate_levels as { badge_color: string })?.badge_color || '#CD7F32',
          }));

        // Monthly ranking (top 10)
        const monthly = [...stats]
          .filter(s => (s.clicks_this_month || 0) > 0)
          .sort((a, b) => (b.clicks_this_month || 0) - (a.clicks_this_month || 0))
          .slice(0, 10)
          .map(s => ({
            affiliate_id: s.affiliate_id,
            profile_name: (s.profiles as { name: string })?.name || 'Anônimo',
            clicks: s.clicks_this_month || 0,
            earnings: s.total_earnings || 0,
            level_name: (s.affiliate_levels as { name: string })?.name || 'Bronze',
            badge_color: (s.affiliate_levels as { badge_color: string })?.badge_color || '#CD7F32',
          }));

        setWeeklyRanking(weekly);
        setMonthlyRanking(monthly);

        // Find current user position
        if (currentAffiliateId) {
          const weeklyPos = weekly.findIndex(r => r.affiliate_id === currentAffiliateId);
          const monthlyPos = monthly.findIndex(r => r.affiliate_id === currentAffiliateId);
          
          setCurrentPosition({
            weekly: weeklyPos >= 0 ? weeklyPos + 1 : null,
            monthly: monthlyPos >= 0 ? monthlyPos + 1 : null,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching rankings:', error);
    }

    setLoading(false);
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center font-bold text-muted-foreground">{position}</span>;
    }
  };

  const getPositionStyle = (position: number, isCurrentUser: boolean) => {
    let baseClass = 'flex items-center gap-3 p-3 rounded-lg transition-colors';
    
    if (isCurrentUser) {
      baseClass += ' bg-affiliate/20 border border-affiliate';
    } else if (position === 1) {
      baseClass += ' bg-yellow-500/10';
    } else if (position === 2) {
      baseClass += ' bg-gray-500/10';
    } else if (position === 3) {
      baseClass += ' bg-amber-500/10';
    } else {
      baseClass += ' bg-muted/30';
    }
    
    return baseClass;
  };

  const RankingList = ({ data, period }: { data: RankingEntry[]; period: 'weekly' | 'monthly' }) => {
    if (data.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum dado de ranking disponível ainda.
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {data.map((entry, index) => {
          const position = index + 1;
          const isCurrentUser = entry.affiliate_id === currentAffiliateId;
          
          return (
            <div
              key={entry.affiliate_id}
              className={getPositionStyle(position, isCurrentUser)}
            >
              <div className="flex items-center justify-center w-8">
                {getPositionIcon(position)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium truncate ${isCurrentUser ? 'text-affiliate' : ''}`}>
                    {entry.profile_name}
                    {isCurrentUser && <span className="text-xs ml-1">(você)</span>}
                  </span>
                  <Badge 
                    variant="outline" 
                    className="text-xs shrink-0"
                    style={{ borderColor: entry.badge_color, color: entry.badge_color }}
                  >
                    {entry.level_name}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCreditsToReal(entry.earnings)} ganhos
                </p>
              </div>
              
              <div className="text-right shrink-0">
                <p className="font-bold">{entry.clicks}</p>
                <p className="text-xs text-muted-foreground">cliques</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-affiliate"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <CardTitle className="text-lg">Ranking de Afiliados</CardTitle>
        </div>
        {currentPosition.weekly && (
          <div className="flex items-center gap-2 text-sm text-affiliate">
            <TrendingUp className="h-4 w-4" />
            Sua posição: #{currentPosition.weekly} esta semana
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weekly">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="weekly">Semanal</TabsTrigger>
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekly">
            <RankingList data={weeklyRanking} period="weekly" />
          </TabsContent>
          
          <TabsContent value="monthly">
            <RankingList data={monthlyRanking} period="monthly" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
