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
  leads: number;
}

const chartConfig = {
  views: {
    label: 'Views',
    color: 'hsl(var(--muted-foreground))',
  },
  leads: {
    label: 'Leads',
    color: 'hsl(var(--secondary))',
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

    // Get leads and views data in parallel
    const [leadsResult, viewsResult] = await Promise.all([
      supabase
        .from('leads')
        .select('created_at, offer_id')
        .in('offer_id', myOfferIds)
        .eq('is_valid', true)
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('offer_views')
        .select('created_at, offer_id')
        .in('offer_id', myOfferIds)
        .gte('created_at', startDate.toISOString())
    ]);

    if (leadsResult.error) {
      console.error('Error fetching leads:', leadsResult.error);
    }
    if (viewsResult.error) {
      console.error('Error fetching views:', viewsResult.error);
    }

    const myLeads = leadsResult.data || [];
    const myViews = viewsResult.data || [];

    // Group by day using UTC dates consistently
    const dailyMap: Record<string, { views: number; leads: number }> = {};
    
    // Initialize all days in period (use UTC)
    for (let i = period - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      // Use local date string to match user's timezone
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      dailyMap[key] = { views: 0, leads: 0 };
    }

    // Count leads by day (convert from UTC to local)
    myLeads.forEach(lead => {
      const leadDate = new Date(lead.created_at);
      const key = `${leadDate.getFullYear()}-${String(leadDate.getMonth() + 1).padStart(2, '0')}-${String(leadDate.getDate()).padStart(2, '0')}`;
      if (dailyMap[key]) {
        dailyMap[key].leads += 1;
      }
    });

    // Count views by day (convert from UTC to local)
    myViews.forEach(view => {
      const viewDate = new Date(view.created_at);
      const key = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(viewDate.getDate()).padStart(2, '0')}`;
      if (dailyMap[key]) {
        dailyMap[key].views += 1;
      }
    });
    
    // Convert to array and format for chart
    const chartData: DailyData[] = Object.entries(dailyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, values]) => ({
        date: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit' 
        }),
        views: values.views,
        leads: values.leads,
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
                  dataKey="leads"
                  stroke="var(--color-leads)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: 'hsl(var(--secondary))' }}
                  name="Leads"
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
            <div className="w-3 h-0.5 bg-secondary rounded" />
            <span className="text-muted-foreground">Leads</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
