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
  views: number;
  clicks: number;
}

const chartConfig = {
  views: {
    label: 'Views',
    color: 'hsl(var(--muted-foreground))',
  },
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
    
    // Get my offers first
    const { data: myOffers } = await supabase
      .from('offers')
      .select('id')
      .eq('company_id', profile.id);

    const myOfferIds = myOffers?.map(o => o.id) || [];
    
    if (myOfferIds.length === 0) {
      setData([]);
      setLoading(false);
      return;
    }

    // Get clicks and views data in parallel
    const [clicksResult, viewsResult] = await Promise.all([
      supabase
        .from('offer_clicks')
        .select('created_at, offer_id, click_type')
        .in('offer_id', myOfferIds)
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('offer_views')
        .select('created_at, offer_id')
        .in('offer_id', myOfferIds)
        .gte('created_at', startDate.toISOString())
    ]);

    if (clicksResult.error) {
      console.error('Error fetching clicks:', clicksResult.error);
    }
    if (viewsResult.error) {
      console.error('Error fetching views:', viewsResult.error);
    }

    // Filter MAIN clicks only
    const myClicks = clicksResult.data?.filter(c => c.click_type === 'MAIN') || [];
    const myViews = viewsResult.data || [];

    // Group by day
    const dailyMap: Record<string, { views: number; clicks: number }> = {};
    
    // Initialize all days in period
    for (let i = period - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dailyMap[key] = { views: 0, clicks: 0 };
    }

    // Count clicks by day
    myClicks.forEach(click => {
      const key = click.created_at.split('T')[0];
      if (dailyMap[key]) {
        dailyMap[key].clicks += 1;
      }
    });

    // Count views by day
    myViews.forEach(view => {
      const key = view.created_at.split('T')[0];
      if (dailyMap[key]) {
        dailyMap[key].views += 1;
      }
    });
    
    // Convert to array and format for chart
    const chartData: DailyData[] = Object.entries(dailyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, values]) => ({
        date: new Date(date).toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit' 
        }),
        views: values.views,
        clicks: values.clicks,
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
                  dataKey="views"
                  stroke="var(--color-views)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--muted-foreground))', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: 'hsl(var(--muted-foreground))' }}
                  name="Views"
                />
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
            <div className="w-3 h-0.5 bg-muted-foreground rounded" />
            <span className="text-muted-foreground">Views</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-primary rounded" />
            <span className="text-muted-foreground">Cliques</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
