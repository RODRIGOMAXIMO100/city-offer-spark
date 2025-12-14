import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import {
  LogOut, 
  Users, 
  Building2, 
  UserCheck, 
  Megaphone,
  DollarSign,
  Shield,
  TrendingUp,
  Ban,
  Eye,
  RefreshCw,
  BarChart3,
  Banknote,
  FileText,
  CreditCard,
  Phone,
  Tags,
  Landmark,
  CalendarIcon
} from 'lucide-react';
import { AdminBlog } from './admin/AdminBlog';
import { formatBalance, CONFIG } from '@/types/database';
import AdminFilters from './admin/AdminFilters';
import AdminPagination, { usePagination } from './admin/AdminPagination';
import AdminAnalytics from './admin/AdminAnalytics';
import AdminWithdrawals from './admin/AdminWithdrawals';
import AdminSecurityAdvanced from './admin/AdminSecurityAdvanced';
import AdminAlerts from './admin/AdminAlerts';
import UserDetailModal from './admin/UserDetailModal';
import { exportUsers, exportOffers, exportTransactions } from './admin/AdminExport';
import AdminPayments from './admin/AdminPayments';
import AdminFraudManagement from './admin/AdminFraudManagement';
import AdminLeads from './admin/AdminLeads';
import { AdminNiches } from './admin/AdminNiches';
import AdminFinanceiro from './admin/AdminFinanceiro';


interface Stats {
  // Financeiro
  receita: number;           // LEAD_COST (o que empresas pagaram)
  custos: number;            // LEAD_EARNING (o que afiliados receberam)
  margem: number;            // receita - custos
  margemPercent: number;     // (margem/receita) * 100
  
  // Volume
  leads: number;             // Leads no período
  conversao: number;         // (leads/views) * 100
  
  // Atividade
  empresasAtivas: number;    // Empresas que receberam leads no período
  divulgadoresAtivos: number; // Divulgadores que geraram leads no período
  totalEmpresas: number;     // Total de empresas cadastradas
  totalDivulgadores: number; // Total de divulgadores cadastrados
  
  // Caixa
  depositos: number;         // DEPOSIT no período
  saquesPendentes: number;   // Saques PENDING + APPROVED
  saldoEmpresas: number;     // Soma balance de COMPANY
  saldoAfiliados: number;    // Soma balance de AFFILIATE
}

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  city: string;
  balance: number;
  created_at: string;
  role?: string;
  telefone?: string;
  instagram_url?: string;
  cpf?: string;
  cnpj?: string;
  razao_social?: string;
  endereco_fiscal?: string;
  pix_key?: string;
  pix_tipo?: string;
}

interface OfferData {
  id: string;
  title: string;
  city: string;
  clicks_count: number;
  views_count: number;
  leads_count: number;
  active: boolean;
  expires_at: string;
  company_name?: string;
}

interface TransactionData {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
  user_name?: string;
}

interface RateLimitData {
  id: string;
  ip_address: string;
  click_count: number;
  blocked: boolean;
  first_click_at: string;
  last_click_at: string;
}

export default function AdminDashboard() {
  const { signOut, profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    receita: 0,
    custos: 0,
    margem: 0,
    margemPercent: 0,
    leads: 0,
    conversao: 0,
    empresasAtivas: 0,
    divulgadoresAtivos: 0,
    totalEmpresas: 0,
    totalDivulgadores: 0,
    depositos: 0,
    saquesPendentes: 0,
    saldoEmpresas: 0,
    saldoAfiliados: 0
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [offers, setOffers] = useState<OfferData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Date range for stats
  const [statsDateRange, setStatsDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  // Modal state
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (statsDateRange?.from && statsDateRange?.to) {
      fetchStats();
    }
  }, [statsDateRange]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchOffers(),
      fetchTransactions()
    ]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const startDate = statsDateRange?.from?.toISOString();
      const endDate = statsDateRange?.to?.toISOString();
      
      // Transações no período
      let txQuery = supabase.from('transactions').select('amount, type');
      if (startDate && endDate) {
        txQuery = txQuery.gte('created_at', startDate).lte('created_at', endDate);
      }
      const { data: txData } = await txQuery;
      
      // Receita = LEAD_COST (valor absoluto)
      const receita = txData
        ?.filter(t => t.type === 'LEAD_COST')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
      
      // Custos = LEAD_EARNING
      const custos = txData
        ?.filter(t => t.type === 'LEAD_EARNING')
        .reduce((sum, t) => sum + t.amount, 0) || 0;
      
      // Margem
      const margem = receita - custos;
      const margemPercent = receita > 0 ? (margem / receita) * 100 : 0;
      
      // Depósitos no período
      const depositos = txData
        ?.filter(t => t.type === 'DEPOSIT')
        .reduce((sum, t) => sum + t.amount, 0) || 0;
      
      // Leads no período
      let leadsQuery = supabase.from('leads').select('offer_id, affiliate_id', { count: 'exact' }).eq('is_valid', true);
      if (startDate && endDate) {
        leadsQuery = leadsQuery.gte('created_at', startDate).lte('created_at', endDate);
      }
      const { data: leadsData, count: leadsCount } = await leadsQuery;
      
      // Views no período
      let viewsQuery = supabase.from('offer_views').select('*', { count: 'exact', head: true });
      if (startDate && endDate) {
        viewsQuery = viewsQuery.gte('created_at', startDate).lte('created_at', endDate);
      }
      const { count: viewsCount } = await viewsQuery;
      const totalViews = viewsCount || 0;
      
      // Taxa de conversão
      const conversao = totalViews > 0 ? ((leadsCount || 0) / totalViews) * 100 : 0;
      
      // Empresas ativas (únicas que receberam leads no período)
      const offerIds = [...new Set(leadsData?.map(l => l.offer_id) || [])];
      let empresasAtivas = 0;
      if (offerIds.length > 0) {
        const { data: offersWithCompany } = await supabase
          .from('offers')
          .select('company_id')
          .in('id', offerIds);
        empresasAtivas = new Set(offersWithCompany?.map(o => o.company_id)).size;
      }
      
      // Divulgadores ativos (únicos que geraram leads no período)
      const affiliateIds = leadsData?.map(l => l.affiliate_id).filter(Boolean) || [];
      const divulgadoresAtivos = new Set(affiliateIds).size;
      
      // Saques pendentes (PENDING + APPROVED)
      const { data: pendingWithdrawals } = await supabase
        .from('withdrawals')
        .select('amount')
        .in('status', ['PENDING', 'APPROVED']);
      const saquesPendentes = pendingWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;
      
      // Saldo por tipo de usuário
      const { data: profiles } = await supabase.from('profiles').select('id, balance');
      const { data: roles } = await supabase.from('user_roles').select('user_id, role');
      
      const profileUserMap = new Map(profiles?.map(p => [p.id, p.balance]) || []);
      const userProfileMap = new Map<string, string>();
      
      // Criar mapa user_id -> profile.id
      const { data: profilesWithUserId } = await supabase.from('profiles').select('id, user_id');
      profilesWithUserId?.forEach(p => userProfileMap.set(p.user_id, p.id));
      
      let saldoEmpresas = 0;
      let saldoAfiliados = 0;
      let totalEmpresas = 0;
      let totalDivulgadores = 0;
      
      roles?.forEach(r => {
        const profileId = userProfileMap.get(r.user_id);
        const balance = profileId ? (profileUserMap.get(profileId) || 0) : 0;
        if (r.role === 'COMPANY') {
          saldoEmpresas += balance;
          totalEmpresas++;
        }
        if (r.role === 'AFFILIATE') {
          saldoAfiliados += balance;
          totalDivulgadores++;
        }
      });

      setStats({
        receita,
        custos,
        margem,
        margemPercent,
        leads: leadsCount || 0,
        conversao,
        empresasAtivas,
        divulgadoresAtivos,
        totalEmpresas,
        totalDivulgadores,
        depositos,
        saquesPendentes,
        saldoEmpresas,
        saldoAfiliados
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const setStatsPreset = (preset: string) => {
    const now = new Date();
    switch (preset) {
      case 'today':
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        setStatsDateRange({ from: startOfToday, to: now });
        break;
      case '7d':
        setStatsDateRange({ from: subDays(now, 7), to: now });
        break;
      case '30d':
        setStatsDateRange({ from: subDays(now, 30), to: now });
        break;
      case 'thisMonth':
        setStatsDateRange({ from: startOfMonth(now), to: now });
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        setStatsDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
      case 'all':
        setStatsDateRange({ from: new Date('2020-01-01'), to: now });
        break;
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      const { data: roles } = await supabase.from('user_roles').select('user_id, role');

      const usersWithRoles = profiles?.map(p => ({
        ...p,
        role: roles?.find(r => r.user_id === p.user_id)?.role || 'N/A'
      })).filter(u => u.role !== 'ADMIN') || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchOffers = async () => {
    try {
      const { data } = await supabase.from('offers').select(`*, profiles:company_id (name)`).order('created_at', { ascending: false });
      const offersData = data?.map(o => ({ ...o, company_name: o.profiles?.name || 'N/A' })) || [];
      setOffers(offersData);
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data } = await supabase.from('transactions').select(`*, profiles:user_id (name)`).order('created_at', { ascending: false }).limit(500);
      const transactionsData = data?.map(t => ({ ...t, user_name: t.profiles?.name || 'N/A' })) || [];
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };


  // Filtered data
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesCity = cityFilter === 'all' || user.city === cityFilter;
      return matchesSearch && matchesRole && matchesCity;
    });
  }, [users, searchTerm, roleFilter, cityFilter]);

  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
      const matchesSearch = !searchTerm || 
        offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCity = cityFilter === 'all' || offer.city === cityFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && offer.active) || 
        (statusFilter === 'inactive' && !offer.active);
      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [offers, searchTerm, cityFilter, statusFilter]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = !searchTerm || 
        tx.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [transactions, searchTerm]);

  // Pagination
  const usersPagination = usePagination(filteredUsers, 15);
  const offersPagination = usePagination(filteredOffers, 15);
  const transactionsPagination = usePagination(filteredTransactions, 20);

  // Get unique cities
  const cities = useMemo(() => [...new Set(users.map(u => u.city))].sort(), [users]);

  const handleDeactivateOffer = async (offerId: string) => {
    try {
      const { error } = await supabase.from('offers').update({ active: false }).eq('id', offerId);
      if (error) throw error;
      toast.success('Oferta desativada');
      fetchOffers();
    } catch (error) {
      toast.error('Erro ao desativar oferta');
    }
  };
  const handleViewUser = (user: UserProfile) => {
    setSelectedUser(user);
    setUserModalOpen(true);
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive', label: string }> = {
      'COMPANY': { variant: 'default', label: 'Empresa' },
      'AFFILIATE': { variant: 'secondary', label: 'Divulgador' },
      'CLIENT': { variant: 'outline', label: 'Cliente' },
      'ADMIN': { variant: 'destructive', label: 'Admin' }
    };
    const config = variants[role] || { variant: 'outline', label: role };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTransactionBadge = (type: string) => {
    const config: Record<string, { color: string, label: string }> = {
      'DEPOSIT': { color: 'bg-green-500', label: 'Depósito' },
      'LEAD_COST': { color: 'bg-red-600', label: '💰 Custo Lead' },
      'LEAD_EARNING': { color: 'bg-emerald-600', label: '💰 Ganho Lead' },
      'CLICK_COST': { color: 'bg-red-300', label: '(Legado) Custo Clique' },
      'CLICK_EARNING': { color: 'bg-blue-300', label: '(Legado) Ganho Clique' },
      'WITHDRAW': { color: 'bg-orange-500', label: 'Saque' },
      'PLATFORM_FEE': { color: 'bg-purple-500', label: 'Taxa Plataforma' }
    };
    const c = config[type] || { color: 'bg-muted', label: type };
    return <Badge className={`${c.color} text-white`}>{c.label}</Badge>;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setCityFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-destructive shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">Painel Admin</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{profile?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <AdminAlerts />
              <Button variant="ghost" size="sm" onClick={fetchAllData} disabled={loading} className="hidden sm:flex">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button variant="ghost" size="icon" onClick={fetchAllData} disabled={loading} className="sm:hidden">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut} className="hidden sm:flex">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} className="sm:hidden">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Stats Date Filter */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">Período:</span>
          <div className="flex gap-1 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setStatsPreset('today')}>Hoje</Button>
            <Button variant="outline" size="sm" onClick={() => setStatsPreset('7d')}>7 dias</Button>
            <Button variant="outline" size="sm" onClick={() => setStatsPreset('30d')}>30 dias</Button>
            <Button variant="outline" size="sm" onClick={() => setStatsPreset('thisMonth')}>Este mês</Button>
            <Button variant="outline" size="sm" onClick={() => setStatsPreset('all')}>Geral</Button>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {statsDateRange?.from ? (
                  statsDateRange.to ? (
                    <>
                      {format(statsDateRange.from, 'dd/MM/yy', { locale: ptBR })} - {format(statsDateRange.to, 'dd/MM/yy', { locale: ptBR })}
                    </>
                  ) : (
                    format(statsDateRange.from, 'dd/MM/yyyy', { locale: ptBR })
                  )
                ) : (
                  'Período'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={statsDateRange}
                onSelect={setStatsDateRange}
                numberOfMonths={2}
                locale={ptBR}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Stats Cards - Linha 1: Financeiro */}
        <div className="space-y-3 mb-4 sm:mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">💰 Financeiro</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Receita</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600">{formatBalance(stats.receita)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Custos (Afiliados)</p>
                    <p className="text-lg sm:text-2xl font-bold text-red-600">{formatBalance(stats.custos)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-red-500/20 rotate-180" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Margem Bruta</p>
                    <p className={cn("text-lg sm:text-2xl font-bold", stats.margem >= 0 ? "text-blue-600" : "text-red-600")}>
                      {formatBalance(stats.margem)}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-500/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Margem %</p>
                    <p className={cn("text-lg sm:text-2xl font-bold", stats.margemPercent >= 30 ? "text-green-600" : stats.margemPercent >= 0 ? "text-yellow-600" : "text-red-600")}>
                      {stats.margemPercent.toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500/20" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Linha 2: Volume e Atividade */}
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">📊 Volume e Atividade</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Leads Gerados</p>
                    <p className="text-lg sm:text-2xl font-bold">{stats.leads}</p>
                  </div>
                  <Phone className="h-8 w-8 text-muted-foreground/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Taxa de Conversão</p>
                    <p className="text-lg sm:text-2xl font-bold">{stats.conversao.toFixed(2)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Empresas</p>
                    <p className="text-lg sm:text-2xl font-bold text-company">
                      {stats.empresasAtivas}<span className="text-sm text-muted-foreground font-normal">/{stats.totalEmpresas}</span>
                    </p>
                    <p className="text-[9px] text-muted-foreground">ativas/total</p>
                  </div>
                  <Building2 className="h-8 w-8 text-company/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Divulgadores</p>
                    <p className="text-lg sm:text-2xl font-bold text-affiliate">
                      {stats.divulgadoresAtivos}<span className="text-sm text-muted-foreground font-normal">/{stats.totalDivulgadores}</span>
                    </p>
                    <p className="text-[9px] text-muted-foreground">ativos/total</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-affiliate/20" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Linha 3: Fluxo de Caixa */}
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">🏦 Fluxo de Caixa</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Depósitos Recebidos</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600">{formatBalance(stats.depositos)}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-green-500/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow border border-orange-200 dark:border-orange-900">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">⚠️ Saques Pendentes</p>
                    <p className="text-lg sm:text-2xl font-bold text-orange-600">{formatBalance(stats.saquesPendentes)}</p>
                  </div>
                  <Banknote className="h-8 w-8 text-orange-500/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Saldo Empresas</p>
                    <p className="text-lg sm:text-2xl font-bold">{formatBalance(stats.saldoEmpresas)}</p>
                    <p className="text-[9px] text-muted-foreground">(passivo)</p>
                  </div>
                  <Building2 className="h-8 w-8 text-muted-foreground/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Saldo Afiliados</p>
                    <p className="text-lg sm:text-2xl font-bold">{formatBalance(stats.saldoAfiliados)}</p>
                    <p className="text-[9px] text-muted-foreground">(passivo)</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-muted-foreground/20" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="analytics" className="space-y-4" onValueChange={resetFilters}>
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-11">
              {/* 1. Visão Geral */}
              <TabsTrigger value="analytics" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <BarChart3 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              {/* 2. Gestão */}
              <TabsTrigger value="users" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <Users className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Usuários</span>
              </TabsTrigger>
              {/* 3-4. Operacional */}
              <TabsTrigger value="offers" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <Megaphone className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Ofertas</span>
              </TabsTrigger>
              <TabsTrigger value="leads" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <Phone className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Leads</span>
              </TabsTrigger>
              {/* 5-8. Financeiro */}
              <TabsTrigger value="transactions" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <DollarSign className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Transações</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <CreditCard className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Pagamentos</span>
              </TabsTrigger>
              <TabsTrigger value="withdrawals" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <Banknote className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Saques</span>
              </TabsTrigger>
              <TabsTrigger value="financeiro" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <Landmark className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Financeiro</span>
              </TabsTrigger>
              {/* 9-10. Segurança */}
              <TabsTrigger value="fraud" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <Ban className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Anti-Fraude</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <Shield className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Segurança</span>
              </TabsTrigger>
              {/* 11-12. Configurações */}
              <TabsTrigger value="niches" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <Tags className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Nichos</span>
              </TabsTrigger>
              <TabsTrigger value="blog" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <FileText className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Blog</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Usuários ({filteredUsers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  roleFilter={roleFilter}
                  onRoleFilterChange={setRoleFilter}
                  cityFilter={cityFilter}
                  onCityFilterChange={setCityFilter}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  cities={cities}
                  onExport={() => exportUsers(filteredUsers)}
                  showRoleFilter={true}
                  showStatusFilter={false}
                  placeholder="Buscar por nome ou email..."
                />
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Nome</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="hidden sm:table-cell">Cidade</TableHead>
                        <TableHead>Saldo</TableHead>
                        <TableHead className="hidden lg:table-cell">Cadastro</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersPagination.paginatedItems.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-muted-foreground hidden md:table-cell">{user.email || '-'}</TableCell>
                          <TableCell>{getRoleBadge(user.role || 'N/A')}</TableCell>
                          <TableCell className="hidden sm:table-cell">{user.city}</TableCell>
                          <TableCell>{formatBalance(user.balance)}</TableCell>
                          <TableCell className="hidden lg:table-cell">{new Date(user.created_at).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => handleViewUser(user)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <AdminPagination
                  currentPage={usersPagination.currentPage}
                  totalPages={usersPagination.totalPages}
                  totalItems={usersPagination.totalItems}
                  itemsPerPage={usersPagination.itemsPerPage}
                  onPageChange={usersPagination.setCurrentPage}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Offers Tab */}
          <TabsContent value="offers">
            <Card>
              <CardHeader>
                <CardTitle>Ofertas ({filteredOffers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  roleFilter={roleFilter}
                  onRoleFilterChange={setRoleFilter}
                  cityFilter={cityFilter}
                  onCityFilterChange={setCityFilter}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  cities={cities}
                  onExport={() => exportOffers(filteredOffers)}
                  showRoleFilter={false}
                  showStatusFilter={true}
                  placeholder="Buscar por título ou empresa..."
                />
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">Título</TableHead>
                        <TableHead className="hidden sm:table-cell">Empresa</TableHead>
                        <TableHead className="hidden md:table-cell">Cidade</TableHead>
                        <TableHead>Leads</TableHead>
                        <TableHead className="hidden lg:table-cell">Views</TableHead>
                        <TableHead className="hidden xl:table-cell">Conversão</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Expira</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offersPagination.paginatedItems.map((offer) => {
                        const conversionRate = offer.views_count > 0 
                          ? ((offer.leads_count || 0) / offer.views_count * 100).toFixed(1) 
                          : '0.0';
                        return (
                          <TableRow key={offer.id}>
                            <TableCell className="font-medium max-w-[150px] sm:max-w-[200px] truncate">{offer.title}</TableCell>
                            <TableCell className="hidden sm:table-cell">{offer.company_name}</TableCell>
                            <TableCell className="hidden md:table-cell">{offer.city}</TableCell>
                            <TableCell className="font-semibold text-secondary">{offer.leads_count || 0}</TableCell>
                            <TableCell className="hidden lg:table-cell">{offer.views_count}</TableCell>
                            <TableCell className="hidden xl:table-cell">{conversionRate}%</TableCell>
                            <TableCell>
                              <Badge variant={offer.active ? 'default' : 'secondary'}>
                                {offer.active ? 'Ativa' : 'Inativa'}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{new Date(offer.expires_at).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>
                              {offer.active && (
                                <Button variant="ghost" size="sm" onClick={() => handleDeactivateOffer(offer.id)}>
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <AdminPagination
                  currentPage={offersPagination.currentPage}
                  totalPages={offersPagination.totalPages}
                  totalItems={offersPagination.totalItems}
                  itemsPerPage={offersPagination.itemsPerPage}
                  onPageChange={offersPagination.setCurrentPage}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transações ({filteredTransactions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  roleFilter={roleFilter}
                  onRoleFilterChange={setRoleFilter}
                  cityFilter={cityFilter}
                  onCityFilterChange={setCityFilter}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  cities={[]}
                  onExport={() => exportTransactions(filteredTransactions)}
                  showRoleFilter={false}
                  showStatusFilter={false}
                  placeholder="Buscar por usuário ou descrição..."
                />
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[100px]">Usuário</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead className="hidden sm:table-cell">Descrição</TableHead>
                        <TableHead className="hidden md:table-cell">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionsPagination.paginatedItems.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-medium">{tx.user_name}</TableCell>
                          <TableCell>{getTransactionBadge(tx.type)}</TableCell>
                          <TableCell>{formatBalance(tx.amount)}</TableCell>
                          <TableCell className="max-w-[200px] truncate hidden sm:table-cell">{tx.description || '-'}</TableCell>
                          <TableCell className="hidden md:table-cell">{new Date(tx.created_at).toLocaleString('pt-BR')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <AdminPagination
                  currentPage={transactionsPagination.currentPage}
                  totalPages={transactionsPagination.totalPages}
                  totalItems={transactionsPagination.totalItems}
                  itemsPerPage={transactionsPagination.itemsPerPage}
                  onPageChange={transactionsPagination.setCurrentPage}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <AdminPayments />
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals">
            <AdminWithdrawals />
          </TabsContent>

          {/* Fraud Management Tab */}
          <TabsContent value="fraud">
            <AdminFraudManagement />
          </TabsContent>

          {/* Blog Tab */}
          <TabsContent value="blog">
            <AdminBlog />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <AdminSecurityAdvanced />
          </TabsContent>

          {/* Financeiro Tab */}
          <TabsContent value="financeiro">
            <AdminFinanceiro />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads">
            <AdminLeads />
          </TabsContent>

          {/* Niches Tab */}
          <TabsContent value="niches">
            <AdminNiches />
          </TabsContent>

        </Tabs>
      </main>

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        open={userModalOpen}
        onOpenChange={setUserModalOpen}
        onUserUpdated={() => {
          fetchUsers();
          fetchStats();
        }}
      />
    </div>
  );
}
