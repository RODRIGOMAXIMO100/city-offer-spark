import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Zap } from 'lucide-react';

interface AffiliateLevel {
  id: number;
  name: string;
  min_clicks: number;
  commission_multiplier: number;
  badge_color: string;
  benefits: string[];
}

interface AffiliateStats {
  total_clicks: number;
  total_earnings: number;
  current_level_id: number;
  level_progress: number;
  clicks_this_month: number;
  rank_position: number | null;
}

interface AffiliateLevelProps {
  affiliateId: string;
}

export default function AffiliateLevel({ affiliateId }: AffiliateLevelProps) {
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [currentLevel, setCurrentLevel] = useState<AffiliateLevel | null>(null);
  const [nextLevel, setNextLevel] = useState<AffiliateLevel | null>(null);
  const [allLevels, setAllLevels] = useState<AffiliateLevel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all levels
        const { data: levels } = await supabase
          .from('affiliate_levels')
          .select('*')
          .order('min_clicks', { ascending: true });

        if (levels) {
          setAllLevels(levels);
        }

        // Fetch affiliate stats
        const { data: statsData } = await supabase
          .from('affiliate_stats')
          .select('*')
          .eq('affiliate_id', affiliateId)
          .maybeSingle();

        if (statsData) {
          setStats(statsData);

          // Set current level
          const current = levels?.find(l => l.id === statsData.current_level_id);
          setCurrentLevel(current || levels?.[0] || null);

          // Set next level
          const currentIndex = levels?.findIndex(l => l.id === statsData.current_level_id) ?? 0;
          if (levels && currentIndex < levels.length - 1) {
            setNextLevel(levels[currentIndex + 1]);
          }
        } else {
          // Create initial stats for new affiliate
          await supabase.from('affiliate_stats').insert({
            affiliate_id: affiliateId,
            total_clicks: 0,
            total_earnings: 0,
            current_level_id: 1,
          });

          setStats({
            total_clicks: 0,
            total_earnings: 0,
            current_level_id: 1,
            level_progress: 0,
            clicks_this_month: 0,
            rank_position: null,
          });
          setCurrentLevel(levels?.[0] || null);
          setNextLevel(levels?.[1] || null);
        }
      } catch (error) {
        console.error('Error fetching level data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (affiliateId) {
      fetchData();
    }
  }, [affiliateId]);

  const getLevelIcon = (levelName: string) => {
    switch (levelName) {
      case 'Bronze':
        return <Star className="h-5 w-5" />;
      case 'Prata':
        return <Zap className="h-5 w-5" />;
      case 'Ouro':
        return <Trophy className="h-5 w-5" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };

  // O nível sobe pelo total de cupons usados por clientes que vieram do seu link (affiliate_stats.total_clicks)
  const usadosTotal = stats?.total_clicks || 0;
  const calculateProgress = () => {
    if (!stats || !currentLevel || !nextLevel) return 0;
    const noNivel = usadosTotal - currentLevel.min_clicks;
    const precisa = nextLevel.min_clicks - currentLevel.min_clicks;
    return Math.min(Math.max((noNivel / precisa) * 100, 0), 100);
  };

  // Comissão: 50% da taxa do cupom usado, vezes o multiplicador do nível (Bronze 50% até Diamante 70%)
  const pctNivel = (mult?: number) => Math.round(50 * (mult || 1));
  const getRealCommission = () => {
    const pct = pctNivel(currentLevel?.commission_multiplier);
    // Exemplo: oferta de R$ 39, taxa de 12% = R$ 4,68
    const exemplo = (4.68 * pct / 100).toFixed(2).replace('.', ',');
    return { percent: `${pct}%`, exemplo: `R$ ${exemplo}` };
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-affiliate/20 to-affiliate/5">
        <CardContent className="p-4">
          <div className="animate-pulse flex items-center gap-3">
            <div className="h-12 w-12 bg-muted rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-24 mb-2"></div>
              <div className="h-2 bg-muted rounded w-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const commission = getRealCommission();

  return (
    <Card className="overflow-hidden" data-tour="level">
      <CardContent className="p-0">
        {/* Current Level Banner */}
        <div 
          className="p-3 sm:p-4 text-primary-foreground"
          style={{ 
            background: `linear-gradient(135deg, ${currentLevel?.badge_color || '#CD7F32'}, ${currentLevel?.badge_color || '#CD7F32'}99)` 
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="bg-card/20 p-2 rounded-full shrink-0">
                {getLevelIcon(currentLevel?.name || 'Bronze')}
              </div>
              <div>
                <p className="text-xs sm:text-sm opacity-80">Seu nível</p>
                <p className="text-lg sm:text-xl font-bold">{currentLevel?.name || 'Bronze'}</p>
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-1 ml-11 sm:ml-0">
              <Badge className="bg-card/20 text-primary-foreground border-card/30 w-fit">
                {commission.percent} da taxa de cada cupom usado
              </Badge>
              <span className="text-xs sm:text-sm font-semibold">Ex.: oferta de R$ 39 rende {commission.exemplo}</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="p-3 sm:p-4 space-y-4">
          {/* Monthly Stats - Main focus */}
          <div className="bg-affiliate/10 rounded-lg p-3 border border-affiliate/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">📅 Meta do Mês</p>
              <Badge variant="outline" className="text-[10px] text-affiliate border-affiliate">
                Zera dia 1
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-affiliate">{stats?.clicks_this_month || 0}</p>
              <p className="text-xs text-muted-foreground">cupons usados este mês</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-center">
            <div className="bg-muted/50 rounded-lg py-2 px-1">
              <p className="text-base sm:text-lg font-bold">{stats?.total_clicks || 0}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Cupons usados no total</p>
            </div>
            <div className="bg-muted/50 rounded-lg py-2 px-1">
              <p className="text-base sm:text-lg font-bold">
                {stats?.rank_position ? `#${stats.rank_position}` : '-'}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Ranking</p>
            </div>
          </div>

          {/* Progresso para o próximo nível (pelo total de cupons usados) */}
          {nextLevel && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progresso para {nextLevel.name}</span>
                <span className="font-medium">
                  {usadosTotal} / {nextLevel.min_clicks} cupons usados
                </span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Faltam {Math.max(0, nextLevel.min_clicks - usadosTotal)} cupons usados para subir de nível
              </p>
            </div>
          )}

          {/* Benefits */}
          {currentLevel?.benefits && currentLevel.benefits.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Seus benefícios:</p>
              <div className="flex flex-wrap gap-2">
                {currentLevel.benefits.map((benefit, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    ✓ {benefit}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* All Levels - Monthly goals */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm font-medium">Níveis:</p>
              <p className="text-[10px] text-muted-foreground">A comissão sobe a cada nível</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {allLevels.map((level) => {
                const isUnlocked = usadosTotal >= level.min_clicks;
                const isCurrent = level.id === currentLevel?.id;
                const levelPercent = pctNivel(level.commission_multiplier);
                const levelRange = level.min_clicks === 0 ? 'desde o início' : `${level.min_clicks}+ cupons`;
                
                return (
                  <div
                    key={level.id}
                    className={`p-2 rounded-lg text-center ${
                      isCurrent 
                        ? 'ring-2 ring-affiliate bg-affiliate/10' 
                        : isUnlocked 
                          ? 'bg-muted' 
                          : 'bg-muted/30 opacity-50'
                    }`}
                  >
                    <div 
                      className="h-7 w-7 sm:h-8 sm:w-8 rounded-full mx-auto flex items-center justify-center text-primary-foreground mb-1"
                      style={{ backgroundColor: level.badge_color }}
                    >
                      {getLevelIcon(level.name)}
                    </div>
                    <p className="text-xs font-medium">{level.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {levelRange}
                    </p>
                    <p className="text-[10px] font-semibold text-affiliate mt-0.5">
                      {levelPercent}%
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
