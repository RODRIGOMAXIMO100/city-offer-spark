import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, TrendingDown, Users, MousePointerClick, DollarSign, Megaphone } from 'lucide-react';
import { formatCredits, CONFIG } from '@/types/database';

interface AnalyticsData {
  clicksByDay: { date: string; clicks: number }[];
  usersByRole: { name: string; value: number; color: string }[];
  earningsByDay: { date: string; earnings: number }[];
  offersByDay: { date: string; offers: number }[];
}

const COLORS = {
  company: 'hsl(221, 83%, 53%)',
  affiliate: 'hsl(152, 69%, 40%)',
  client: 'hsl(258, 90%, 66%)'
};

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('30');
  const [data, setData] = useState<AnalyticsData>({
    clicksByDay: [],
    usersByRole: [],
    earningsByDay: [],
    offersByDay: []
  });
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState({
    clicks: { current: 0, previous: 0 },
    users: { current: 0, previous: 0 },
    earnings: { current: 0, previous: 0 },
    offers: { current: 0, previous: 0 }
  });

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const days = parseInt(period);
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

    try {
      // Fetch clicks by day
      const { data: clicks } = await supabase
        .from('offer_clicks')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      const clicksByDay = groupByDay(clicks || [], 'created_at', days);

      // Fetch previous period clicks for comparison
      const { data: prevClicks } = await supabase
        .from('offer_clicks')
        .select('created_at')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // Fetch users by role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role');

      const companies = roles?.filter(r => r.role === 'COMPANY').length || 0;
      const affiliates = roles?.filter(r => r.role === 'AFFILIATE').length || 0;
      const clients = roles?.filter(r => r.role === 'CLIENT').length || 0;

      const usersByRole = [
        { name: 'Empresas', value: companies, color: COLORS.company },
        { name: 'Afiliados', value: affiliates, color: COLORS.affiliate },
        { name: 'Clientes', value: clients, color: COLORS.client }
      ];

      // Fetch new users in period
      const { data: newUsers } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      const { data: prevUsers } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // Fetch offers created
      const { data: offers } = await supabase
        .from('offers')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      const { data: prevOffers } = await supabase
        .from('offers')
        .select('created_at')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      const offersByDay = groupByDay(offers || [], 'created_at', days);

      // Calculate earnings (platform fee per click)
      const currentClicks = clicks?.length || 0;
      const previousClicks = prevClicks?.length || 0;
      const currentEarnings = currentClicks * CONFIG.CPC_PLATFORM_PROFIT;
      const previousEarnings = previousClicks * CONFIG.CPC_PLATFORM_PROFIT;

      const earningsByDay = clicksByDay.map(d => ({
        date: d.date,
        earnings: d.clicks * CONFIG.CPC_PLATFORM_PROFIT
      }));

      setData({
        clicksByDay,
        usersByRole,
        earningsByDay,
        offersByDay
      });

      setComparison({
        clicks: { current: currentClicks, previous: previousClicks },
        users: { current: newUsers?.length || 0, previous: prevUsers?.length || 0 },
        earnings: { current: currentEarnings, previous: previousEarnings },
        offers: { current: offers?.length || 0, previous: prevOffers?.length || 0 }
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
    setLoading(false);
  };

  const groupByDay = (items: { created_at: string }[], _field: string, days: number) => {
    const result: Record<string, number> = {};
    const now = new Date();
    
    // Initialize all days with 0
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = date.toISOString().split('T')[0];
      result[key] = 0;
    }

    // Count items per day
    items.forEach(item => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      if (result[date] !== undefined) {
        result[date]++;
      }
    });

    return Object.entries(result).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      clicks: count,
      offers: count
    }));
  };

  const getPercentChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const ComparisonCard = ({ 
    title, 
    current, 
    previous, 
    icon: Icon, 
    format = (v: number) => v.toString() 
  }: { 
    title: string; 
    current: number; 
    previous: number; 
    icon: React.ElementType;
    format?: (v: number) => string;
  }) => {
    const change = getPercentChange(current, previous);
    const isPositive = change >= 0;
    
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{format(current)}</p>
            </div>
            <Icon className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span>{isPositive ? '+' : ''}{change}% vs período anterior</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-end">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ComparisonCard 
          title="Cliques" 
          current={comparison.clicks.current} 
          previous={comparison.clicks.previous}
          icon={MousePointerClick}
        />
        <ComparisonCard 
          title="Novos Usuários" 
          current={comparison.users.current} 
          previous={comparison.users.previous}
          icon={Users}
        />
        <ComparisonCard 
          title="Ganhos" 
          current={comparison.earnings.current} 
          previous={comparison.earnings.previous}
          icon={DollarSign}
          format={formatCredits}
        />
        <ComparisonCard 
          title="Novas Ofertas" 
          current={comparison.offers.current} 
          previous={comparison.offers.previous}
          icon={Megaphone}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clicks Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cliques por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.clicksByDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.2)"
                  name="Cliques"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Users Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.usersByRole}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.usersByRole.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Earnings Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ganhos por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.earningsByDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [formatCredits(value), 'Ganhos']}
                />
                <Line 
                  type="monotone" 
                  dataKey="earnings" 
                  stroke="hsl(152, 69%, 40%)"
                  strokeWidth={2}
                  dot={false}
                  name="Ganhos"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Offers Created */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ofertas Criadas por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.offersByDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="clicks" 
                  fill="hsl(258, 90%, 66%)"
                  radius={[4, 4, 0, 0]}
                  name="Ofertas"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
