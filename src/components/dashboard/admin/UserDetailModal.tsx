import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCredits, formatCreditsToReal } from '@/types/database';
import { User, History, Megaphone, Plus, Minus, AlertTriangle } from 'lucide-react';

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

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

interface Offer {
  id: string;
  title: string;
  clicks_count: number;
  views_count: number;
  active: boolean;
  created_at: string;
}

interface UserDetailModalProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

export default function UserDetailModal({ user, open, onOpenChange, onUserUpdated }: UserDetailModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceAction, setBalanceAction] = useState<'add' | 'remove'>('add');

  useEffect(() => {
    if (user && open) {
      fetchUserData();
    }
  }, [user, open]);

  const fetchUserData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch user transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setTransactions(txData || []);

      // Fetch user offers if company
      if (user.role === 'COMPANY') {
        const { data: offerData } = await supabase
          .from('offers')
          .select('id, title, clicks_count, views_count, active, created_at')
          .eq('company_id', user.id)
          .order('created_at', { ascending: false });

        setOffers(offerData || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
    setLoading(false);
  };

  const handleBalanceChange = async () => {
    if (!user || !balanceAmount) return;

    const amount = parseInt(balanceAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    const finalAmount = balanceAction === 'add' ? amount : -amount;
    const newBalance = user.balance + finalAmount;

    if (newBalance < 0) {
      toast.error('Saldo não pode ficar negativo');
      return;
    }

    try {
      // Update balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', user.id);

      if (balanceError) throw balanceError;

      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: Math.abs(finalAmount),
          type: balanceAction === 'add' ? 'DEPOSIT' : 'WITHDRAW',
          description: `Ajuste manual pelo admin: ${balanceAction === 'add' ? 'adição' : 'remoção'} de ${formatCredits(Math.abs(finalAmount))}`
        });

      if (txError) throw txError;

      toast.success(`Saldo ${balanceAction === 'add' ? 'adicionado' : 'removido'} com sucesso`);
      setBalanceAmount('');
      onUserUpdated();
      fetchUserData();
    } catch (error) {
      console.error('Error updating balance:', error);
      toast.error('Erro ao atualizar saldo');
    }
  };

  const getTransactionBadge = (type: string) => {
    const config: Record<string, { color: string, label: string }> = {
      'DEPOSIT': { color: 'bg-green-500', label: 'Depósito' },
      'CLICK_COST': { color: 'bg-red-500', label: 'Custo Clique' },
      'CLICK_EARNING': { color: 'bg-blue-500', label: 'Ganho Clique' },
      'WITHDRAW': { color: 'bg-orange-500', label: 'Saque' },
      'PLATFORM_FEE': { color: 'bg-purple-500', label: 'Taxa' }
    };
    const c = config[type] || { color: 'bg-muted', label: type };
    return <Badge className={`${c.color} text-white`}>{c.label}</Badge>;
  };

  const getRoleBadge = (role?: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'outline', label: string }> = {
      'COMPANY': { variant: 'default', label: 'Empresa' },
      'AFFILIATE': { variant: 'secondary', label: 'Afiliado' },
      'CLIENT': { variant: 'outline', label: 'Cliente' }
    };
    const config = variants[role || ''] || { variant: 'outline', label: role || 'N/A' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Usuário
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <History className="h-4 w-4 mr-2" />
              Transações
            </TabsTrigger>
            {user.role === 'COMPANY' && (
              <TabsTrigger value="offers">
                <Megaphone className="h-4 w-4 mr-2" />
                Ofertas
              </TabsTrigger>
            )}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Nome</Label>
                    <p className="font-medium">{user.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tipo</Label>
                    <p>{getRoleBadge(user.role)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{user.email || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Telefone</Label>
                    <p className="font-medium">{user.telefone || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Cidade</Label>
                    <p className="font-medium">{user.city}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Cadastro</Label>
                    <p className="font-medium">{new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  {user.instagram_url && (
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Instagram</Label>
                      <p className="font-medium">{user.instagram_url}</p>
                    </div>
                  )}
                  {user.cpf && (
                    <div>
                      <Label className="text-muted-foreground">CPF</Label>
                      <p className="font-medium">{user.cpf}</p>
                    </div>
                  )}
                  {user.cnpj && (
                    <div>
                      <Label className="text-muted-foreground">CNPJ</Label>
                      <p className="font-medium">{user.cnpj}</p>
                    </div>
                  )}
                  {user.razao_social && (
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Razão Social</Label>
                      <p className="font-medium">{user.razao_social}</p>
                    </div>
                  )}
                  {user.pix_key && (
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Chave Pix ({user.pix_tipo})</Label>
                      <p className="font-medium">{user.pix_key}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Balance Management */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label className="text-muted-foreground">Saldo Atual</Label>
                    <p className="text-2xl font-bold">{formatCredits(user.balance)}</p>
                    <p className="text-sm text-muted-foreground">{formatCreditsToReal(user.balance)}</p>
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label>Ajustar Saldo (créditos)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 100"
                      value={balanceAmount}
                      onChange={(e) => setBalanceAmount(e.target.value)}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setBalanceAction('add')}
                    className={balanceAction === 'add' ? 'bg-green-100 border-green-500' : ''}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setBalanceAction('remove')}
                    className={balanceAction === 'remove' ? 'bg-red-100 border-red-500' : ''}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleBalanceChange} disabled={!balanceAmount}>
                    {balanceAction === 'add' ? 'Adicionar' : 'Remover'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <p className="text-center text-muted-foreground py-4">Carregando...</p>
                ) : transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Nenhuma transação encontrada</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>{getTransactionBadge(tx.type)}</TableCell>
                          <TableCell>{formatCredits(tx.amount)}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{tx.description || '-'}</TableCell>
                          <TableCell>{new Date(tx.created_at).toLocaleString('pt-BR')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Offers Tab (Companies only) */}
          {user.role === 'COMPANY' && (
            <TabsContent value="offers">
              <Card>
                <CardContent className="pt-6">
                  {loading ? (
                    <p className="text-center text-muted-foreground py-4">Carregando...</p>
                  ) : offers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Nenhuma oferta encontrada</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Cliques</TableHead>
                          <TableHead>Views</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Criada</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {offers.map((offer) => (
                          <TableRow key={offer.id}>
                            <TableCell className="font-medium max-w-[200px] truncate">{offer.title}</TableCell>
                            <TableCell>{offer.clicks_count}</TableCell>
                            <TableCell>{offer.views_count}</TableCell>
                            <TableCell>
                              <Badge variant={offer.active ? 'default' : 'secondary'}>
                                {offer.active ? 'Ativa' : 'Inativa'}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(offer.created_at).toLocaleDateString('pt-BR')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
