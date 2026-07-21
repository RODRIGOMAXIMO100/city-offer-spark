import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Eye } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar, AdminSection } from './admin/AdminSidebar';
import { AdminHeader } from './admin/AdminHeader';
import { AdminOverview } from './admin/AdminOverview';
import { AdminBlog } from './admin/AdminBlog';
import { formatBalance } from '@/types/database';
import AdminFilters from './admin/AdminFilters';
import AdminPagination, { usePagination } from './admin/AdminPagination';
import AdminAnalytics from './admin/AdminAnalytics';
import AdminWithdrawals from './admin/AdminWithdrawals';
import AdminSecurityAdvanced from './admin/AdminSecurityAdvanced';
import UserDetailModal from './admin/UserDetailModal';
import { exportUsers, exportOffers, exportTransactions } from './admin/AdminExport';
import AdminPayments from './admin/AdminPayments';
import AdminFraudManagement from './admin/AdminFraudManagement';
import AdminLeads from './admin/AdminLeads';
import { AdminNiches } from './admin/AdminNiches';
import AdminFinanceiro from './admin/AdminFinanceiro';
import AdminCities from './admin/AdminCities';
import AdminSEO from './admin/AdminSEO';
import AdminWhatsAppTemplates from './admin/AdminWhatsAppTemplates';


interface Stats {
  receita: number;
  custos: number;
  margem: number;
  margemPercent: number;
  leads: number;
  conversao: number;
  empresasAtivas: number;
  divulgadoresAtivos: number;
  totalEmpresas: number;
  totalDivulgadores: number;
  depositos: number;
  saquesPendentes: number;
  saldoEmpresas: number;
  saldoAfiliados: number;
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

export default function AdminDashboard() {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState<AdminSection>('overview');
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
      
      let txQuery = supabase.from('transactions').select('amount, type');
      if (startDate && endDate) {
        txQuery = txQuery.gte('created_at', startDate).lte('created_at', endDate);
      }
      const { data: txData } = await txQuery;
      
      const receita = txData
        ?.filter(t => t.type === 'LEAD_COST')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
      
      const custos = txData
        ?.filter(t => t.type === 'LEAD_EARNING')
        .reduce((sum, t) => sum + t.amount, 0) || 0;
      
      const margem = receita - custos;
      const margemPercent = receita > 0 ? (margem / receita) * 100 : 0;
      
      const depositos = txData
        ?.filter(t => t.type === 'DEPOSIT')
        .reduce((sum, t) => sum + t.amount, 0) || 0;
      
      let leadsQuery = supabase.from('leads').select('offer_id, affiliate_id', { count: 'exact' }).eq('is_valid', true);
      if (startDate && endDate) {
        leadsQuery = leadsQuery.gte('created_at', startDate).lte('created_at', endDate);
      }
      const { data: leadsData, count: leadsCount } = await leadsQuery;
      
      let viewsQuery = supabase.from('offer_views').select('*', { count: 'exact', head: true });
      if (startDate && endDate) {
        viewsQuery = viewsQuery.gte('created_at', startDate).lte('created_at', endDate);
      }
      const { count: viewsCount } = await viewsQuery;
      const totalViews = viewsCount || 0;
      
      const conversao = totalViews > 0 ? ((leadsCount || 0) / totalViews) * 100 : 0;
      
      const offerIds = [...new Set(leadsData?.map(l => l.offer_id) || [])];
      let empresasAtivas = 0;
      if (offerIds.length > 0) {
        const { data: offersWithCompany } = await supabase
          .from('offers')
          .select('company_id')
          .in('id', offerIds);
        empresasAtivas = new Set(offersWithCompany?.map(o => o.company_id)).size;
      }
      
      const affiliateIds = leadsData?.map(l => l.affiliate_id).filter(Boolean) || [];
      const divulgadoresAtivos = new Set(affiliateIds).size;
      
      const { data: pendingWithdrawals } = await supabase
        .from('withdrawals')
        .select('amount')
        .in('status', ['PENDING', 'APPROVED']);
      const saquesPendentes = pendingWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;
      
      const { data: profiles } = await supabase.from('profiles').select('id, balance');
      const { data: roles } = await supabase.from('user_roles').select('user_id, role');
      
      const profileUserMap = new Map(profiles?.map(p => [p.id, p.balance]) || []);
      const userProfileMap = new Map<string, string>();
      
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

  const handleSectionChange = (section: AdminSection) => {
    setCurrentSection(section);
    resetFilters();
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'overview':
        return (
          <AdminOverview
            stats={stats}
            dateRange={statsDateRange}
            onDateRangeChange={setStatsDateRange}
          />
        );
      
      case 'analytics':
        return <AdminAnalytics />;
      
      case 'users':
        return (
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
              <div className="overflow-x-auto">
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
        );
      
      case 'offers':
        return (
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Título</TableHead>
                      <TableHead className="hidden md:table-cell">Empresa</TableHead>
                      <TableHead className="hidden sm:table-cell">Cidade</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Leads</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offersPagination.paginatedItems.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell className="font-medium">{offer.title}</TableCell>
                        <TableCell className="hidden md:table-cell">{offer.company_name}</TableCell>
                        <TableCell className="hidden sm:table-cell">{offer.city}</TableCell>
                        <TableCell>{offer.views_count}</TableCell>
                        <TableCell>{offer.leads_count}</TableCell>
                        <TableCell>
                          <Badge variant={offer.active ? 'default' : 'secondary'}>
                            {offer.active ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {offer.active && (
                            <Button variant="ghost" size="sm" onClick={() => handleDeactivateOffer(offer.id)}>
                              Desativar
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
        );
      
      case 'leads':
        return <AdminLeads />;
      
      case 'transactions':
        return (
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
                cities={cities}
                onExport={() => exportTransactions(filteredTransactions)}
                showRoleFilter={false}
                showStatusFilter={false}
                placeholder="Buscar por usuário ou descrição..."
              />
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="hidden md:table-cell">Descrição</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsPagination.paginatedItems.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium">{tx.user_name}</TableCell>
                        <TableCell>{getTransactionBadge(tx.type)}</TableCell>
                        <TableCell className={tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatBalance(tx.amount)}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden md:table-cell max-w-[200px] truncate">
                          {tx.description || '-'}
                        </TableCell>
                        <TableCell>{new Date(tx.created_at).toLocaleDateString('pt-BR')}</TableCell>
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
        );
      
      case 'payments':
        return <AdminPayments />;
      
      case 'withdrawals':
        return <AdminWithdrawals />;
      
      case 'financeiro':
        return <AdminFinanceiro />;
      
      case 'fraud':
        return <AdminFraudManagement />;
      
      case 'security':
        return <AdminSecurityAdvanced />;
      
      case 'niches':
        return <AdminNiches />;
      
      case 'cities':
        return <AdminCities />;
      
      case 'blog':
        return <AdminBlog />;

      case 'seo':
        return <AdminSEO />;

      case 'wa-templates':
        return <AdminWhatsAppTemplates />;

      
      
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <AdminSidebar 
          currentSection={currentSection} 
          onSectionChange={handleSectionChange} 
        />
        
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader
            profileName={profile?.name}
            loading={loading}
            onRefresh={fetchAllData}
            onSignOut={async () => {
              await signOut();
              navigate('/', { replace: true });
            }}
          />
          
          <main className="flex-1 p-4 overflow-auto">
            {renderContent()}
          </main>
        </div>
      </div>

      <UserDetailModal
        user={selectedUser}
        open={userModalOpen}
        onOpenChange={setUserModalOpen}
        onUserUpdated={fetchUsers}
      />
    </SidebarProvider>
  );
}
