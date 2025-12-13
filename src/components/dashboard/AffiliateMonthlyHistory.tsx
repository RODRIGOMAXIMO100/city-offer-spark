import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Zap, Calendar, TrendingUp } from 'lucide-react';
import { formatCreditsToReal } from '@/types/database';

interface MonthlyHistory {
  id: string;
  month_year: string;
  leads_count: number;
  earnings: number;
  level_achieved: string | null;
}

interface AffiliateMonthlyHistoryProps {
  affiliateId: string;
}

export default function AffiliateMonthlyHistory({ affiliateId }: AffiliateMonthlyHistoryProps) {
  const [history, setHistory] = useState<MonthlyHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('affiliate_monthly_history')
          .select('*')
          .eq('affiliate_id', affiliateId)
          .order('month_year', { ascending: false })
          .limit(12);

        if (error) throw error;
        setHistory(data || []);
      } catch (error) {
        console.error('Error fetching monthly history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (affiliateId) {
      fetchHistory();
    }
  }, [affiliateId]);

  const getLevelIcon = (levelName: string | null) => {
    switch (levelName) {
      case 'Prata':
        return <Zap className="h-4 w-4" />;
      case 'Ouro':
        return <Trophy className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const getLevelColor = (levelName: string | null) => {
    switch (levelName) {
      case 'Prata':
        return '#C0C0C0';
      case 'Ouro':
        return '#FFD700';
      default:
        return '#CD7F32';
    }
  };

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-24 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-affiliate" />
            Histórico Mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-6 text-muted-foreground">
            <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum histórico ainda.</p>
            <p className="text-xs">Seus resultados mensais aparecerão aqui.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalLeads = history.reduce((sum, h) => sum + h.leads_count, 0);
  const totalEarnings = history.reduce((sum, h) => sum + h.earnings, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-affiliate" />
            Histórico Mensal
          </CardTitle>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total histórico</p>
            <p className="text-sm font-bold text-affiliate">{formatCreditsToReal(totalEarnings)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {history.map((month) => (
            <div 
              key={month.id} 
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: getLevelColor(month.level_achieved) }}
              >
                {getLevelIcon(month.level_achieved)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{formatMonthYear(month.month_year)}</p>
                  <Badge variant="secondary" className="text-[10px]">
                    {month.level_achieved || 'Bronze'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {month.leads_count} leads
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-affiliate text-sm">{formatCreditsToReal(month.earnings)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-3 text-center">
          <div className="bg-muted/50 rounded-lg py-2">
            <p className="text-lg font-bold">{totalLeads}</p>
            <p className="text-xs text-muted-foreground">Leads totais</p>
          </div>
          <div className="bg-affiliate/10 rounded-lg py-2">
            <p className="text-lg font-bold text-affiliate">{formatCreditsToReal(totalEarnings)}</p>
            <p className="text-xs text-muted-foreground">Ganhos totais</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
