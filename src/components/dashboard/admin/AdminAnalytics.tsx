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
import { TrendingUp, TrendingDown, Users, MousePointerClick, DollarSign, Megaphone, Eye, Target, Shield } from 'lucide-react';
import { formatCredits, CONFIG } from '@/types/database';

interface AnalyticsData {
  leadsByDay: { date: string; leads: number }[];
  clicksByDay: { date: string; clicks: number }[];
  usersByRole: { name: string; value: number; color: string }[];
  earningsByDay: { date: string; earnings: number }[];
  offersByDay: { date: string; offers: number }[];
  clicksByType: { name: string; value: number; color: string }[];
  topOffers: { name: string; leads: number }[];
  topAffiliates: { name: string; earnings: number }[];
  conversionRate: number;
  totalViews: number;
  totalLeads: number;
}

const COLORS = {
  company: 'hsl(221, 83%, 53%)',
  affiliate: 'hsl(152, 69%, 40%)',
  client: 'hsl(258, 90%, 66%)',
  main: 'hsl(152, 69%, 40%)',
  instagram: 'hsl(330, 80%, 60%)',
  duplicate: 'hsl(0, 72%, 51%)'
};

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('30');
  const [data, setData] = useState<AnalyticsData>({
    leadsByDay: [],
    clicksByDay: [],
    usersByRole: [],
    earningsByDay: [],
    offersByDay: [],
    clicksByType: [],
    topOffers: [],
    topAffiliates: [],
    conversionRate: 0,
    totalViews: 0,
    totalLeads: 0
  });
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState({
    leads: { current: 0, previous: 0 },
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
      // Fetch leads
      const { data: leads } = await supabase
        .from('leads')
        .select('created_at, affiliate_id, offer_id, is_valid')
        .eq('is_valid', true)
        .gte('created_at', startDate.toISOString());

      const { data: prevLeads } = await supabase
        .from('leads')
        .select('created_at')
        .eq('is_valid', true)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      const allLeads = leads || [];
      const leadsByDay = groupByDayLeads(allLeads, 'created_at', days);

      // Fetch ALL clicks (for tracking purposes only)
      const { data: clicks } = await supabase
        .from('offer_clicks')
        .select('created_at, click_type, affiliate_id, offer_id')
        .gte('created_at', startDate.toISOString());

      // Filter by type
      const allClicks = clicks || [];
      const mainClicks = allClicks.filter(c => c.click_type === 'MAIN');
      const instagramClicks = allClicks.filter(c => c.click_type === 'INSTAGRAM');
      const duplicateClicks = allClicks.filter(c => c.click_type === 'DUPLICATE');

      // Click type distribution
      const clicksByType = [
        { name: 'Pagos (MAIN)', value: mainClicks.length, color: COLORS.main },
        { name: 'Instagram', value: instagramClicks.length, color: COLORS.instagram },
        { name: 'Duplicados', value: duplicateClicks.length, color: COLORS.duplicate }
      ].filter(c => c.value > 0);

      const clicksByDay = groupByDay(mainClicks, 'created_at', days);

      // Fetch previous period clicks for comparison
      const { data: prevClicks } = await supabase
        .from('offer_clicks')
        .select('created_at, click_type')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      const prevPaidClicks = prevClicks?.filter(c => c.click_type === 'MAIN') || [];

      // Fetch users by role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role');

      const companies = roles?.filter(r => r.role === 'COMPANY').length || 0;
      const affiliates = roles?.filter(r => r.role === 'AFFILIATE').length || 0;
      const clients = roles?.filter(r => r.role === 'CLIENT').length || 0;

      const usersByRole = [
        { name: 'Empresas', value: companies, color: COLORS.company },
        { name: 'Divulgadores', value: affiliates, color: COLORS.affiliate },
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

      // Calculate earnings based on leads (PPL model)
      const CPL_AVERAGE = 200; // R$ 2.00 average CPL in cents
      const PLATFORM_FEE = 0.40; // 40% platform fee
      const currentLeadsCount = allLeads.length;
      const previousLeadsCount = prevLeads?.length || 0;
      const currentEarnings = Math.round(currentLeadsCount * CPL_AVERAGE * PLATFORM_FEE);
      const previousEarnings = Math.round(previousLeadsCount * CPL_AVERAGE * PLATFORM_FEE);

      const earningsByDay = leadsByDay.map(d => ({
        date: d.date,
        earnings: Math.round(d.leads * CPL_AVERAGE * PLATFORM_FEE)
      }));

      // Fetch total views and leads for conversion rate
      const { data: allOffers } = await supabase
        .from('offers')
        .select('views_count, leads_count, title');

      const totalViews = allOffers?.reduce((sum, o) => sum + o.views_count, 0) || 0;
      const totalLeads = allOffers?.reduce((sum, o) => sum + (o.leads_count || 0), 0) || 0;
      const conversionRate = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0;

      // Top 5 offers by leads
      const topOffers = (allOffers || [])
        .sort((a, b) => (b.leads_count || 0) - (a.leads_count || 0))
        .slice(0, 5)
        .map(o => ({ name: o.title.substring(0, 25) + (o.title.length > 25 ? '...' : ''), leads: o.leads_count || 0 }));

      // Top 5 affiliates by earnings from leads
      const affiliateEarnings: Record<string, number> = {};
      allLeads.forEach(lead => {
        if (lead.affiliate_id) {
          affiliateEarnings[lead.affiliate_id] = (affiliateEarnings[lead.affiliate_id] || 0) + Math.round(CPL_AVERAGE * 0.30);
        }
      });

      const topAffiliateIds = Object.entries(affiliateEarnings)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      let topAffiliates: { name: string; earnings: number }[] = [];
      if (topAffiliateIds.length > 0) {
        const { data: affiliateProfiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', topAffiliateIds.map(([id]) => id));

        topAffiliates = topAffiliateIds.map(([id, earnings]) => {
          const profile = affiliateProfiles?.find(p => p.id === id);
          return {
            name: profile?.name?.substring(0, 20) || 'Desconhecido',
            earnings
          };
        });
      }

      setData({
        leadsByDay,
        clicksByDay,
        usersByRole,
        earningsByDay,
        offersByDay,
        clicksByType,
        topOffers,
        topAffiliates,
        conversionRate,
        totalViews,
        totalLeads
      });

      setComparison({
        leads: { current: currentLeadsCount, previous: previousLeadsCount },
        clicks: { current: mainClicks.length, previous: prevPaidClicks.length },
        users: { current: newUsers?.length || 0, previous: prevUsers?.length || 0 },
        earnings: { current: currentEarnings, previous: previousEarnings },
        offers: { current: offers?.length || 0, previous: prevOffers?.length || 0 }
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
    setLoading(false);
  };

  const groupByDayLeads = (items: { created_at: string }[], _field: string, days: number) => {
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
      leads: count
    }));
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <ComparisonCard 
          title="Leads" 
          current={comparison.leads.current} 
          previous={comparison.leads.previous}
          icon={Users}
        />
        <ComparisonCard 
          title="Cliques (Anti-fraude)" 
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
          title="Ganhos (PPL)" 
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

      {/* Conversion Rate & Leads */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Leads</p>
                <p className="text-3xl font-bold text-secondary">{data.totalLeads.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-muted-foreground mt-1">Leads válidos gerados</p>
              </div>
              <Users className="h-10 w-10 text-secondary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-3xl font-bold text-primary">{data.conversionRate.toFixed(2)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Views → Leads</p>
              </div>
              <Target className="h-10 w-10 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Views</p>
                <p className="text-3xl font-bold">{data.totalViews.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-muted-foreground mt-1">Todas as ofertas</p>
              </div>
              <Eye className="h-10 w-10 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.leadsByDay}>
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
                  dataKey="leads" 
                  stroke="hsl(var(--secondary))" 
                  fill="hsl(var(--secondary) / 0.2)"
                  name="Leads"
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

        {/* Top 5 Offers by Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 Ofertas por Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topOffers.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sem dados
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.topOffers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                    width={120}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="leads" 
                    fill="hsl(var(--secondary))"
                    radius={[0, 4, 4, 0]}
                    name="Leads"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top 5 Affiliates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 Divulgadores por Ganhos</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topAffiliates.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sem dados
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.topAffiliates} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [formatCredits(value), 'Ganhos']}
                  />
                  <Bar 
                    dataKey="earnings" 
                    fill="hsl(152, 69%, 40%)"
                    radius={[0, 4, 4, 0]}
                    name="Ganhos"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
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

        {/* Click Type Distribution - For fraud monitoring only */}
        {data.clicksByType.length > 0 && (
          <Card className="border-dashed border-muted-foreground/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Tracking de Cliques (Anti-fraude)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Apenas para monitoramento de fraude. O modelo PPL cobra por leads, não cliques.
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.clicksByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.clicksByType.map((entry, index) => (
                      <Cell key={`cell-type-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [value, 'Cliques']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                {data.clicksByType.map((type) => (
                  <div key={type.name} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: type.color }}
                    />
                    <span>{type.name}: {type.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
