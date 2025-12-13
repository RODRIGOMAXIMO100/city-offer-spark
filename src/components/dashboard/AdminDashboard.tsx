import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  LogOut, 
  Users, 
  Building2, 
  UserCheck, 
  Megaphone,
  DollarSign,
  MousePointerClick,
  Shield,
  TrendingUp,
  Ban,
  Eye,
  RefreshCw,
  BarChart3,
  Banknote,
  FileText,
  CreditCard
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

interface Stats {
  totalCompanies: number;
  totalAffiliates: number;
  totalClients: number;
  totalOffers: number;
  totalClicks: number;
  platformEarnings: number;
  blockedIPs: number;
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
    totalCompanies: 0,
    totalAffiliates: 0,
    totalClients: 0,
    totalOffers: 0,
    totalClicks: 0,
    platformEarnings: 0,
    blockedIPs: 0
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

  // Modal state
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

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
      const { data: roles } = await supabase.from('user_roles').select('role');
      const companies = roles?.filter(r => r.role === 'COMPANY').length || 0;
      const affiliates = roles?.filter(r => r.role === 'AFFILIATE').length || 0;
      const clients = roles?.filter(r => r.role === 'CLIENT').length || 0;

      const { count: offersCount } = await supabase.from('offers').select('*', { count: 'exact', head: true });
      const { count: clicksCount } = await supabase.from('offer_clicks').select('*', { count: 'exact', head: true });
      const platformEarnings = (clicksCount || 0) * CONFIG.CPC_PLATFORM_PROFIT;
      const { count: blockedCount } = await supabase.from('click_rate_limits').select('*', { count: 'exact', head: true }).eq('blocked', true);

      setStats({
        totalCompanies: companies,
        totalAffiliates: affiliates,
        totalClients: clients,
        totalOffers: offersCount || 0,
        totalClicks: clicksCount || 0,
        platformEarnings,
        blockedIPs: blockedCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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
      'AFFILIATE': { variant: 'secondary', label: 'Afiliado' },
      'CLIENT': { variant: 'outline', label: 'Cliente' },
      'ADMIN': { variant: 'destructive', label: 'Admin' }
    };
    const config = variants[role] || { variant: 'outline', label: role };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTransactionBadge = (type: string) => {
    const config: Record<string, { color: string, label: string }> = {
      'DEPOSIT': { color: 'bg-green-500', label: 'Depósito' },
      'CLICK_COST': { color: 'bg-red-500', label: 'Custo Clique' },
      'CLICK_EARNING': { color: 'bg-blue-500', label: 'Ganho Clique' },
      'LEAD_COST': { color: 'bg-red-600', label: 'Custo Lead' },
      'LEAD_EARNING': { color: 'bg-blue-600', label: 'Ganho Lead' },
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
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 text-center">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-company" />
              <p className="text-xl sm:text-2xl font-bold">{stats.totalCompanies}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Empresas</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 text-center">
              <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-affiliate" />
              <p className="text-xl sm:text-2xl font-bold">{stats.totalAffiliates}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Afiliados</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 text-center">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-client" />
              <p className="text-xl sm:text-2xl font-bold">{stats.totalClients}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Clientes</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 text-center">
              <Megaphone className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-primary" />
              <p className="text-xl sm:text-2xl font-bold">{stats.totalOffers}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Ofertas</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 text-center">
              <MousePointerClick className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-accent-foreground" />
              <p className="text-xl sm:text-2xl font-bold">{stats.totalClicks}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Cliques</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 text-center">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-green-500" />
              <p className="text-xl sm:text-2xl font-bold">{formatBalance(stats.platformEarnings)}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Ganhos</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow col-span-2 sm:col-span-1">
            <CardContent className="p-3 sm:p-4 text-center">
              <Ban className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-destructive" />
              <p className="text-xl sm:text-2xl font-bold">{stats.blockedIPs}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">IPs Bloqueados</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4" onValueChange={resetFilters}>
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-9">
              <TabsTrigger value="users" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <Users className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Usuários</span>
              </TabsTrigger>
              <TabsTrigger value="offers" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <Megaphone className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Ofertas</span>
              </TabsTrigger>
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
              <TabsTrigger value="fraud" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <Ban className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Anti-Fraude</span>
              </TabsTrigger>
              <TabsTrigger value="blog" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <FileText className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Blog</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <Shield className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Segurança</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <BarChart3 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Analytics</span>
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
                        <TableHead>Cliques</TableHead>
                        <TableHead className="hidden lg:table-cell">Views</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Expira</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offersPagination.paginatedItems.map((offer) => (
                        <TableRow key={offer.id}>
                          <TableCell className="font-medium max-w-[150px] sm:max-w-[200px] truncate">{offer.title}</TableCell>
                          <TableCell className="hidden sm:table-cell">{offer.company_name}</TableCell>
                          <TableCell className="hidden md:table-cell">{offer.city}</TableCell>
                          <TableCell>{offer.clicks_count}</TableCell>
                          <TableCell className="hidden lg:table-cell">{offer.views_count}</TableCell>
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
                      ))}
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

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AdminAnalytics />
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
