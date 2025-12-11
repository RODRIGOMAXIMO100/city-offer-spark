import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BarChart3 } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface DailyData {
  date: string;
  clicks: number;
}

const chartConfig = {
  clicks: {
    label: 'Cliques',
    color: 'hsl(var(--primary))',
  },
};

export default function PerformanceChart() {
  const { profile } = useAuth();
  const [data, setData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7 | 15 | 30>(7);

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile, period]);

  const fetchData = async () => {
    if (!profile) return;
    
    setLoading(true);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    
    // Get clicks data
    const { data: clicks, error: clicksError } = await supabase
      .from('offer_clicks')
      .select('created_at, offer_id, click_type')
      .gte('created_at', startDate.toISOString());

    // Get my offers
    const { data: myOffers } = await supabase
      .from('offers')
      .select('id, views_count, created_at')
      .eq('company_id', profile.id);

    if (clicksError) {
      console.error('Error fetching clicks:', clicksError);
      setLoading(false);
      return;
    }

    const myOfferIds = new Set(myOffers?.map(o => o.id) || []);
    
    // Filter clicks for my offers only (MAIN clicks)
    const myClicks = clicks?.filter(c => 
      myOfferIds.has(c.offer_id) && c.click_type === 'MAIN'
    ) || [];

    // Group by day
    const dailyMap: Record<string, number> = {};
    
    // Initialize all days in period
    for (let i = period - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dailyMap[key] = 0;
    }

    // Count clicks by day
    myClicks.forEach(click => {
      const key = click.created_at.split('T')[0];
      if (dailyMap[key] !== undefined) {
        dailyMap[key] += 1;
      }
    });
    
    // Convert to array and format for chart
    const chartData: DailyData[] = Object.entries(dailyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, clicks]) => ({
        date: new Date(date).toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit' 
        }),
        clicks,
      }));

    setData(chartData);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Desempenho
          </CardTitle>
          <div className="flex gap-1">
            {([7, 15, 30] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'outline'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setPeriod(p)}
              >
                {p}d
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="var(--color-clicks)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
                  name="Cliques"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            Sem dados para exibir
          </div>
        )}
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-primary rounded" />
            <span className="text-muted-foreground">Cliques por dia</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
