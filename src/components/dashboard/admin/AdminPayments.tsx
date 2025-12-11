import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, CreditCard, Clock, CheckCircle, XCircle, Search, DollarSign, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCentsToBRL } from '@/types/database';

interface Payment {
  id: string;
  profile_id: string;
  amount_brl: number;
  amount_credits: number;
  payment_method: string;
  status: string;
  asaas_payment_id: string | null;
  created_at: string;
  confirmed_at: string | null;
  profiles?: {
    name: string;
    email: string;
    city: string;
  };
}

export default function AdminPayments() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          profiles!payments_profile_id_fkey(name, email, city)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'ALL') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os pagamentos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const filteredPayments = useMemo(() => {
    if (!searchTerm) return payments;
    return payments.filter(p => 
      p.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.asaas_payment_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [payments, searchTerm]);

  const totals = useMemo(() => {
    const confirmed = payments.filter(p => p.status === 'CONFIRMED');
    const pending = payments.filter(p => p.status === 'PENDING');
    return {
      confirmedCount: confirmed.length,
      confirmedAmount: confirmed.reduce((acc, p) => acc + p.amount_brl, 0),
      pendingCount: pending.length,
      pendingAmount: pending.reduce((acc, p) => acc + p.amount_brl, 0),
    };
  }, [payments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'CONFIRMED':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Confirmado</Badge>;
      case 'FAILED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Falhou</Badge>;
      case 'REFUNDED':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Estornado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'PIX':
        return <Badge variant="outline" className="text-green-500 border-green-500">PIX</Badge>;
      case 'CREDIT_CARD':
        return <Badge variant="outline" className="text-blue-500 border-blue-500">Cartão</Badge>;
      default:
        return <Badge variant="secondary">{method}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Pagamentos das Empresas</h2>
          <p className="text-sm text-muted-foreground">Acompanhe os depósitos realizados pelas empresas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPayments}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{totals.confirmedCount}</p>
                <p className="text-xs text-muted-foreground">Confirmados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">R$ {totals.confirmedAmount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Confirmado</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{totals.pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">R$ {totals.pendingAmount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Pendente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por empresa, email ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['ALL', 'PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'Todos' : f === 'PENDING' ? 'Pendentes' : f === 'CONFIRMED' ? 'Confirmados' : f === 'FAILED' ? 'Falhos' : 'Estornados'}
            </Button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum pagamento encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Empresa</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Créditos</TableHead>
                    <TableHead className="hidden sm:table-cell">Método</TableHead>
                    <TableHead className="hidden md:table-cell">ID Asaas</TableHead>
                    <TableHead className="hidden lg:table-cell">Data</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{p.profiles?.name || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground hidden sm:block">{p.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-sm">
                        R$ {p.amount_brl.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatCentsToBRL(p.amount_credits)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {getMethodBadge(p.payment_method)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {p.asaas_payment_id ? (
                          <span className="truncate max-w-[100px] block">{p.asaas_payment_id}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-sm hidden lg:table-cell">
                        {formatDate(p.created_at)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(p.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
