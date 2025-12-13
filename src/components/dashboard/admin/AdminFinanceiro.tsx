import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Landmark, 
  AlertTriangle,
  CalendarIcon,
  Building2,
  UserCheck
} from 'lucide-react';
import { formatBalance, formatCredits } from '@/types/database';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface FinanceData {
  receitaBruta: number;
  pagamentosAfiliados: number;
  margemPlataforma: number;
  depositosRecebidos: number;
  saquesProcessados: number;
  saldoEmpresas: number;
  saldoAfiliados: number;
  reservaSaques: number;
  fluxoCaixa: { date: string; receita: number; custo: number; margem: number }[];
  topEmpresas: { name: string; gasto: number }[];
  topAfiliados: { name: string; ganhos: number }[];
  receitaPorTipo: { name: string; value: number; color: string }[];
}

const COLORS = {
  receita: 'hsl(152, 69%, 40%)',
  custo: 'hsl(0, 72%, 51%)',
  margem: 'hsl(221, 83%, 53%)',
  lead: 'hsl(152, 69%, 40%)',
  click: 'hsl(258, 90%, 66%)'
};

export default function AdminFinanceiro() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [data, setData] = useState<FinanceData>({
    receitaBruta: 0,
    pagamentosAfiliados: 0,
    margemPlataforma: 0,
    depositosRecebidos: 0,
    saquesProcessados: 0,
    saldoEmpresas: 0,
    saldoAfiliados: 0,
    reservaSaques: 0,
    fluxoCaixa: [],
    topEmpresas: [],
    topAfiliados: [],
    receitaPorTipo: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchFinanceData();
    }
  }, [dateRange]);

  const fetchFinanceData = async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    setLoading(true);
    const startDate = dateRange.from.toISOString();
    const endDate = dateRange.to.toISOString();

    try {
      // Fetch transactions in period
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*, profiles:user_id (name)')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const allTx = transactions || [];

      // Calculate revenue (LEAD_COST = what companies pay)
      const receitaBruta = allTx
        .filter(t => t.type === 'LEAD_COST')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Calculate affiliate payments (LEAD_EARNING = what affiliates receive)
      const pagamentosAfiliados = allTx
        .filter(t => t.type === 'LEAD_EARNING')
        .reduce((sum, t) => sum + t.amount, 0);

      // Platform margin
      const margemPlataforma = receitaBruta - pagamentosAfiliados;

      // Deposits received
      const depositosRecebidos = allTx
        .filter(t => t.type === 'DEPOSIT')
        .reduce((sum, t) => sum + t.amount, 0);

      // Withdrawals processed
      const saquesProcessados = allTx
        .filter(t => t.type === 'WITHDRAW')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Fetch company wallets balance
      const { data: companyRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'COMPANY');

      const companyUserIds = companyRoles?.map(r => r.user_id) || [];
      
      let saldoEmpresas = 0;
      if (companyUserIds.length > 0) {
        const { data: companyProfiles } = await supabase
          .from('profiles')
          .select('balance')
          .in('user_id', companyUserIds);
        saldoEmpresas = companyProfiles?.reduce((sum, p) => sum + p.balance, 0) || 0;
      }

      // Fetch affiliate wallets balance
      const { data: affiliateRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'AFFILIATE');

      const affiliateUserIds = affiliateRoles?.map(r => r.user_id) || [];
      
      let saldoAfiliados = 0;
      if (affiliateUserIds.length > 0) {
        const { data: affiliateProfiles } = await supabase
          .from('profiles')
          .select('balance')
          .in('user_id', affiliateUserIds);
        saldoAfiliados = affiliateProfiles?.reduce((sum, p) => sum + p.balance, 0) || 0;
      }

      // Pending withdrawals (reserve needed)
      const { data: pendingWithdrawals } = await supabase
        .from('withdrawals')
        .select('amount')
        .in('status', ['PENDING', 'APPROVED', 'PROCESSING']);
      
      const reservaSaques = pendingWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;

      // Cash flow by day
      const fluxoMap: Record<string, { receita: number; custo: number }> = {};
      
      // Initialize days
      const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      for (let i = 0; i <= daysDiff; i++) {
        const date = new Date(dateRange.from.getTime() + i * 24 * 60 * 60 * 1000);
        const key = date.toISOString().split('T')[0];
        fluxoMap[key] = { receita: 0, custo: 0 };
      }

      // Fill with data
      allTx.forEach(tx => {
        const date = new Date(tx.created_at).toISOString().split('T')[0];
        if (fluxoMap[date]) {
          if (tx.type === 'LEAD_COST') {
            fluxoMap[date].receita += Math.abs(tx.amount);
          } else if (tx.type === 'LEAD_EARNING') {
            fluxoMap[date].custo += tx.amount;
          }
        }
      });

      const fluxoCaixa = Object.entries(fluxoMap).map(([date, values]) => ({
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        receita: values.receita,
        custo: values.custo,
        margem: values.receita - values.custo
      }));

      // Top 5 companies by spending
      const empresaGastos: Record<string, { name: string; gasto: number }> = {};
      allTx.filter(t => t.type === 'LEAD_COST').forEach(tx => {
        const id = tx.user_id;
        const name = tx.profiles?.name || 'Desconhecido';
        if (!empresaGastos[id]) {
          empresaGastos[id] = { name, gasto: 0 };
        }
        empresaGastos[id].gasto += Math.abs(tx.amount);
      });

      const topEmpresas = Object.values(empresaGastos)
        .sort((a, b) => b.gasto - a.gasto)
        .slice(0, 5)
        .map(e => ({ name: e.name.substring(0, 20), gasto: e.gasto }));

      // Top 5 affiliates by earnings
      const afiliadoGanhos: Record<string, { name: string; ganhos: number }> = {};
      allTx.filter(t => t.type === 'LEAD_EARNING').forEach(tx => {
        const id = tx.user_id;
        const name = tx.profiles?.name || 'Desconhecido';
        if (!afiliadoGanhos[id]) {
          afiliadoGanhos[id] = { name, ganhos: 0 };
        }
        afiliadoGanhos[id].ganhos += tx.amount;
      });

      const topAfiliados = Object.values(afiliadoGanhos)
        .sort((a, b) => b.ganhos - a.ganhos)
        .slice(0, 5)
        .map(a => ({ name: a.name.substring(0, 20), ganhos: a.ganhos }));

      // Revenue by type (only leads now, but keep structure for future)
      const leadRevenue = allTx.filter(t => t.type === 'LEAD_COST').reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const clickRevenue = allTx.filter(t => t.type === 'CLICK_COST').reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const receitaPorTipo = [
        { name: 'Leads (PPL)', value: leadRevenue, color: COLORS.lead },
        { name: 'Cliques (Legado)', value: clickRevenue, color: COLORS.click }
      ].filter(r => r.value > 0);

      setData({
        receitaBruta,
        pagamentosAfiliados,
        margemPlataforma,
        depositosRecebidos,
        saquesProcessados,
        saldoEmpresas,
        saldoAfiliados,
        reservaSaques,
        fluxoCaixa,
        topEmpresas,
        topAfiliados,
        receitaPorTipo
      });

    } catch (error) {
      console.error('Error fetching finance data:', error);
    }
    setLoading(false);
  };

  const setPreset = (preset: string) => {
    const now = new Date();
    switch (preset) {
      case '7d':
        setDateRange({ from: subDays(now, 7), to: now });
        break;
      case '30d':
        setDateRange({ from: subDays(now, 30), to: now });
        break;
      case 'thisMonth':
        setDateRange({ from: startOfMonth(now), to: now });
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
      case '90d':
        setDateRange({ from: subDays(now, 90), to: now });
        break;
    }
  };

  const margemPercent = data.receitaBruta > 0 
    ? ((data.margemPlataforma / data.receitaBruta) * 100).toFixed(1) 
    : '0';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => setPreset('7d')}>7 dias</Button>
          <Button variant="outline" size="sm" onClick={() => setPreset('30d')}>30 dias</Button>
          <Button variant="outline" size="sm" onClick={() => setPreset('thisMonth')}>Este mês</Button>
          <Button variant="outline" size="sm" onClick={() => setPreset('lastMonth')}>Mês passado</Button>
          <Button variant="outline" size="sm" onClick={() => setPreset('90d')}>90 dias</Button>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'dd/MM/yy', { locale: ptBR })} - {format(dateRange.to, 'dd/MM/yy', { locale: ptBR })}
                  </>
                ) : (
                  format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })
                )
              ) : (
                'Selecionar período'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={ptBR}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Main Financial Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Bruta</p>
                <p className="text-2xl font-bold text-green-600">{formatBalance(data.receitaBruta)}</p>
                <p className="text-xs text-muted-foreground">Custo dos leads (empresas)</p>
              </div>
              <ArrowUpCircle className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagamentos Afiliados</p>
                <p className="text-2xl font-bold text-red-600">{formatBalance(data.pagamentosAfiliados)}</p>
                <p className="text-xs text-muted-foreground">Ganhos dos divulgadores</p>
              </div>
              <ArrowDownCircle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Margem da Plataforma</p>
                <p className="text-2xl font-bold text-primary">{formatBalance(data.margemPlataforma)}</p>
                <p className="text-xs text-muted-foreground">{margemPercent}% de margem</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Depósitos Recebidos</p>
                <p className="text-2xl font-bold text-blue-600">{formatBalance(data.depositosRecebidos)}</p>
                <p className="text-xs text-muted-foreground">Total no período</p>
              </div>
              <Landmark className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallet & Reserve Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Empresas</p>
                <p className="text-xl font-bold">{formatBalance(data.saldoEmpresas)}</p>
                <p className="text-xs text-muted-foreground">Total em carteira</p>
              </div>
              <Building2 className="h-6 w-6 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Afiliados</p>
                <p className="text-xl font-bold">{formatBalance(data.saldoAfiliados)}</p>
                <p className="text-xs text-muted-foreground">Total em carteira</p>
              </div>
              <UserCheck className="h-6 w-6 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saques Processados</p>
                <p className="text-xl font-bold text-orange-600">{formatBalance(data.saquesProcessados)}</p>
                <p className="text-xs text-muted-foreground">No período</p>
              </div>
              <Wallet className="h-6 w-6 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className={data.reservaSaques > 0 ? 'border-yellow-500 border' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reserva p/ Saques</p>
                <p className="text-xl font-bold text-yellow-600">{formatBalance(data.reservaSaques)}</p>
                <p className="text-xs text-muted-foreground">Pendentes + aprovados</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Fluxo de Caixa (Receita vs Custos)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.fluxoCaixa}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => formatCredits(v)} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => formatBalance(value)}
                />
                <Area 
                  type="monotone" 
                  dataKey="receita" 
                  stroke={COLORS.receita}
                  fill={COLORS.receita + '33'}
                  name="Receita (LEAD_COST)"
                />
                <Area 
                  type="monotone" 
                  dataKey="custo" 
                  stroke={COLORS.custo}
                  fill={COLORS.custo + '33'}
                  name="Custo (LEAD_EARNING)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Companies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 Empresas por Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topEmpresas.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.topEmpresas} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => formatCredits(v)} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => formatBalance(value)}
                  />
                  <Bar dataKey="gasto" fill="hsl(var(--primary))" name="Gasto" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhum dado no período</p>
            )}
          </CardContent>
        </Card>

        {/* Top Affiliates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 Afiliados por Ganhos</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topAfiliados.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.topAfiliados} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => formatCredits(v)} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => formatBalance(value)}
                  />
                  <Bar dataKey="ganhos" fill="hsl(var(--secondary))" name="Ganhos" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhum dado no período</p>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Type */}
        {data.receitaPorTipo.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Receita por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.receitaPorTipo}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.receitaPorTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => formatBalance(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
