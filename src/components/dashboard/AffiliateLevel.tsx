import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Zap, Crown, Diamond } from 'lucide-react';

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
      case 'Platina':
        return <Crown className="h-5 w-5" />;
      case 'Elite':
        return <Diamond className="h-5 w-5" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };

  const calculateProgress = () => {
    if (!stats || !currentLevel || !nextLevel) return 0;
    const clicksInLevel = stats.total_clicks - currentLevel.min_clicks;
    const clicksNeeded = nextLevel.min_clicks - currentLevel.min_clicks;
    return Math.min((clicksInLevel / clicksNeeded) * 100, 100);
  };

  const getMultiplierBonus = () => {
    if (!currentLevel) return '0%';
    const bonus = (currentLevel.commission_multiplier - 1) * 100;
    return bonus > 0 ? `+${bonus.toFixed(0)}%` : '0%';
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

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Current Level Banner */}
        <div 
          className="p-4 text-white"
          style={{ 
            background: `linear-gradient(135deg, ${currentLevel?.badge_color || '#CD7F32'}, ${currentLevel?.badge_color || '#CD7F32'}99)` 
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                {getLevelIcon(currentLevel?.name || 'Bronze')}
              </div>
              <div>
                <p className="text-sm opacity-80">Seu nível</p>
                <p className="text-xl font-bold">{currentLevel?.name || 'Bronze'}</p>
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-white/30">
              {getMultiplierBonus()} comissão
            </Badge>
          </div>
        </div>

        {/* Progress */}
        <div className="p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted/50 rounded-lg py-2">
              <p className="text-lg font-bold">{stats?.total_clicks || 0}</p>
              <p className="text-xs text-muted-foreground">Cliques totais</p>
            </div>
            <div className="bg-muted/50 rounded-lg py-2">
              <p className="text-lg font-bold">{stats?.clicks_this_month || 0}</p>
              <p className="text-xs text-muted-foreground">Este mês</p>
            </div>
            <div className="bg-muted/50 rounded-lg py-2">
              <p className="text-lg font-bold">
                {stats?.rank_position ? `#${stats.rank_position}` : '-'}
              </p>
              <p className="text-xs text-muted-foreground">Ranking</p>
            </div>
          </div>

          {/* Progress to next level */}
          {nextLevel && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progresso para {nextLevel.name}</span>
                <span className="font-medium">
                  {stats?.total_clicks || 0} / {nextLevel.min_clicks} cliques
                </span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Faltam {Math.max(0, (nextLevel.min_clicks) - (stats?.total_clicks || 0))} cliques
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

          {/* All Levels */}
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">Níveis disponíveis:</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allLevels.map((level) => {
                const isUnlocked = (stats?.total_clicks || 0) >= level.min_clicks;
                const isCurrent = level.id === currentLevel?.id;
                
                return (
                  <div
                    key={level.id}
                    className={`flex-shrink-0 p-2 rounded-lg text-center ${
                      isCurrent 
                        ? 'ring-2 ring-affiliate' 
                        : isUnlocked 
                          ? 'bg-muted' 
                          : 'bg-muted/30 opacity-50'
                    }`}
                    style={{ minWidth: '80px' }}
                  >
                    <div 
                      className="h-8 w-8 rounded-full mx-auto flex items-center justify-center text-white mb-1"
                      style={{ backgroundColor: level.badge_color }}
                    >
                      {getLevelIcon(level.name)}
                    </div>
                    <p className="text-xs font-medium">{level.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {level.min_clicks > 0 ? `${level.min_clicks}+` : '0'}
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
