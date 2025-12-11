import { useState, useEffect } from 'react';
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
  AlertTriangle,
  Ban,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { formatCreditsToReal, formatCredits, CONFIG } from '@/types/database';

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
}

interface OfferData {
  id: string;
  title: string;
  city: string;
  clicks_count: number;
  views_count: number;
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
  const [rateLimits, setRateLimits] = useState<RateLimitData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchOffers(),
      fetchTransactions(),
      fetchRateLimits()
    ]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      // Buscar contagem de usuários por role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role');

      const companies = roles?.filter(r => r.role === 'COMPANY').length || 0;
      const affiliates = roles?.filter(r => r.role === 'AFFILIATE').length || 0;
      const clients = roles?.filter(r => r.role === 'CLIENT').length || 0;

      // Buscar ofertas
      const { count: offersCount } = await supabase
        .from('offers')
        .select('*', { count: 'exact', head: true });

      // Buscar cliques
      const { count: clicksCount } = await supabase
        .from('offer_clicks')
        .select('*', { count: 'exact', head: true });

      // Calcular ganhos da plataforma (2 créditos por clique)
      const platformEarnings = (clicksCount || 0) * CONFIG.CPC_PLATFORM_PROFIT;

      // IPs bloqueados
      const { count: blockedCount } = await supabase
        .from('click_rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('blocked', true);

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
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

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
      const { data } = await supabase
        .from('offers')
        .select(`
          *,
          profiles:company_id (name)
        `)
        .order('created_at', { ascending: false });

      const offersData = data?.map(o => ({
        ...o,
        company_name: o.profiles?.name || 'N/A'
      })) || [];

      setOffers(offersData);
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles:user_id (name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      const transactionsData = data?.map(t => ({
        ...t,
        user_name: t.profiles?.name || 'N/A'
      })) || [];

      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchRateLimits = async () => {
    try {
      const { data } = await supabase
        .from('click_rate_limits')
        .select('*')
        .order('last_click_at', { ascending: false })
        .limit(100);

      setRateLimits(data || []);
    } catch (error) {
      console.error('Error fetching rate limits:', error);
    }
  };

  const handleDeactivateOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ active: false })
        .eq('id', offerId);

      if (error) throw error;
      toast.success('Oferta desativada');
      fetchOffers();
    } catch (error) {
      toast.error('Erro ao desativar oferta');
    }
  };

  const handleBlockIP = async (id: string, blocked: boolean) => {
    try {
      const { error } = await supabase
        .from('click_rate_limits')
        .update({ blocked: !blocked })
        .eq('id', id);

      if (error) throw error;
      toast.success(blocked ? 'IP desbloqueado' : 'IP bloqueado');
      fetchRateLimits();
      fetchStats();
    } catch (error) {
      toast.error('Erro ao atualizar bloqueio');
    }
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
      'WITHDRAW': { color: 'bg-orange-500', label: 'Saque' },
      'PLATFORM_FEE': { color: 'bg-purple-500', label: 'Taxa Plataforma' }
    };
    const c = config[type] || { color: 'bg-gray-500', label: type };
    return <Badge className={`${c.color} text-white`}>{c.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-destructive" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Painel Admin</h1>
              <p className="text-sm text-muted-foreground">{profile?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchAllData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Building2 className="h-6 w-6 mx-auto mb-2 text-company" />
              <p className="text-2xl font-bold">{stats.totalCompanies}</p>
              <p className="text-xs text-muted-foreground">Empresas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <UserCheck className="h-6 w-6 mx-auto mb-2 text-affiliate" />
              <p className="text-2xl font-bold">{stats.totalAffiliates}</p>
              <p className="text-xs text-muted-foreground">Afiliados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-client" />
              <p className="text-2xl font-bold">{stats.totalClients}</p>
              <p className="text-xs text-muted-foreground">Clientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Megaphone className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.totalOffers}</p>
              <p className="text-xs text-muted-foreground">Ofertas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MousePointerClick className="h-6 w-6 mx-auto mb-2 text-accent-foreground" />
              <p className="text-2xl font-bold">{stats.totalClicks}</p>
              <p className="text-xs text-muted-foreground">Cliques</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{formatCredits(stats.platformEarnings)}</p>
              <p className="text-xs text-muted-foreground">Ganhos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Ban className="h-6 w-6 mx-auto mb-2 text-destructive" />
              <p className="text-2xl font-bold">{stats.blockedIPs}</p>
              <p className="text-xs text-muted-foreground">IPs Bloqueados</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="offers">
              <Megaphone className="h-4 w-4 mr-2" />
              Ofertas
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <DollarSign className="h-4 w-4 mr-2" />
              Transações
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Segurança
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Todos os Usuários ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email || '-'}</TableCell>
                        <TableCell>{getRoleBadge(user.role || 'N/A')}</TableCell>
                        <TableCell>{user.city}</TableCell>
                        <TableCell>{formatCredits(user.balance)}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Offers Tab */}
          <TabsContent value="offers">
            <Card>
              <CardHeader>
                <CardTitle>Todas as Ofertas ({offers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Cliques</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expira</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offers.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{offer.title}</TableCell>
                        <TableCell>{offer.company_name}</TableCell>
                        <TableCell>{offer.city}</TableCell>
                        <TableCell>{offer.clicks_count}</TableCell>
                        <TableCell>{offer.views_count}</TableCell>
                        <TableCell>
                          <Badge variant={offer.active ? 'default' : 'secondary'}>
                            {offer.active ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(offer.expires_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          {offer.active && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeactivateOffer(offer.id)}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Últimas Transações</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium">{tx.user_name}</TableCell>
                        <TableCell>{getTransactionBadge(tx.type)}</TableCell>
                        <TableCell>{formatCredits(tx.amount)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{tx.description || '-'}</TableCell>
                        <TableCell>{new Date(tx.created_at).toLocaleString('pt-BR')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Rate Limits & Anti-Fraude
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP</TableHead>
                      <TableHead>Cliques</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Primeiro Clique</TableHead>
                      <TableHead>Último Clique</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rateLimits.map((rl) => (
                      <TableRow key={rl.id} className={rl.blocked ? 'bg-destructive/10' : ''}>
                        <TableCell className="font-mono">{rl.ip_address}</TableCell>
                        <TableCell>{rl.click_count}</TableCell>
                        <TableCell>
                          <Badge variant={rl.blocked ? 'destructive' : 'outline'}>
                            {rl.blocked ? 'Bloqueado' : 'Normal'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(rl.first_click_at || '').toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{new Date(rl.last_click_at || '').toLocaleString('pt-BR')}</TableCell>
                        <TableCell>
                          <Button 
                            variant={rl.blocked ? 'outline' : 'destructive'} 
                            size="sm"
                            onClick={() => handleBlockIP(rl.id, rl.blocked || false)}
                          >
                            {rl.blocked ? 'Desbloquear' : 'Bloquear'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {rateLimits.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhum registro de rate limit encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
