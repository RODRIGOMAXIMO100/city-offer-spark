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
import { formatCentsToBRL } from '@/types/database';
import { User, History, Megaphone, Plus, Minus, AlertTriangle, Ban, Snowflake } from 'lucide-react';
import BanUserModal from './BanUserModal';

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
  banned?: boolean;
  banned_at?: string;
  banned_reason?: string;
  balance_frozen?: boolean;
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
  const [banModalOpen, setBanModalOpen] = useState(false);

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
          type: 'ADMIN_ADJUSTMENT' as any,
          description: `Ajuste manual: ${balanceAction === 'add' ? '+' : '-'}${formatCentsToBRL(Math.abs(finalAmount))}`
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
      'CLICK_COST': { color: 'bg-red-400', label: 'Custo Clique' },
      'CLICK_EARNING': { color: 'bg-blue-400', label: 'Ganho Clique' },
      'LEAD_COST': { color: 'bg-red-500', label: 'Custo Lead' },
      'LEAD_EARNING': { color: 'bg-blue-500', label: 'Ganho Lead' },
      'WITHDRAW': { color: 'bg-orange-500', label: 'Saque' },
      'PLATFORM_FEE': { color: 'bg-purple-500', label: 'Taxa' },
      'ADMIN_ADJUSTMENT': { color: 'bg-slate-600', label: 'Ajuste Manual' }
    };
    const c = config[type] || { color: 'bg-muted', label: type };
    return <Badge className={`${c.color} text-white`}>{c.label}</Badge>;
  };

  const getRoleBadge = (role?: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'outline', label: string }> = {
      'COMPANY': { variant: 'default', label: 'Empresa' },
      'AFFILIATE': { variant: 'secondary', label: 'Divulgador' },
      'CLIENT': { variant: 'outline', label: 'Cliente' }
    };
    const config = variants[role || ''] || { variant: 'outline', label: role || 'N/A' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
            Detalhes do Usuário
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-2 sm:mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="text-xs sm:text-sm px-2 sm:px-4">
              <User className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs sm:text-sm px-2 sm:px-4">
              <History className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Transações</span>
            </TabsTrigger>
            {user.role === 'COMPANY' && (
              <TabsTrigger value="offers" className="text-xs sm:text-sm px-2 sm:px-4">
                <Megaphone className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Ofertas</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs sm:text-sm">Nome</Label>
                    <p className="font-medium text-sm sm:text-base">{user.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs sm:text-sm">Tipo</Label>
                    <p>{getRoleBadge(user.role)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs sm:text-sm">Email</Label>
                    <p className="font-medium text-sm sm:text-base break-all">{user.email || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs sm:text-sm">Telefone</Label>
                    <p className="font-medium text-sm sm:text-base">{user.telefone || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs sm:text-sm">Cidade</Label>
                    <p className="font-medium text-sm sm:text-base">{user.city}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs sm:text-sm">Cadastro</Label>
                    <p className="font-medium text-sm sm:text-base">{new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  {user.instagram_url && (
                    <div className="col-span-1 sm:col-span-2">
                      <Label className="text-muted-foreground text-xs sm:text-sm">Instagram</Label>
                      <p className="font-medium text-sm sm:text-base break-all">{user.instagram_url}</p>
                    </div>
                  )}
                  {user.cpf && (
                    <div>
                      <Label className="text-muted-foreground text-xs sm:text-sm">CPF</Label>
                      <p className="font-medium text-sm sm:text-base">{user.cpf}</p>
                    </div>
                  )}
                  {user.cnpj && (
                    <div>
                      <Label className="text-muted-foreground text-xs sm:text-sm">CNPJ</Label>
                      <p className="font-medium text-sm sm:text-base">{user.cnpj}</p>
                    </div>
                  )}
                  {user.razao_social && (
                    <div className="col-span-1 sm:col-span-2">
                      <Label className="text-muted-foreground text-xs sm:text-sm">Razão Social</Label>
                      <p className="font-medium text-sm sm:text-base">{user.razao_social}</p>
                    </div>
                  )}
                  {user.pix_key && (
                    <div className="col-span-1 sm:col-span-2">
                      <Label className="text-muted-foreground text-xs sm:text-sm">Chave Pix ({user.pix_tipo})</Label>
                      <p className="font-medium text-sm sm:text-base break-all">{user.pix_key}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ban Status */}
            {(user.banned || user.balance_frozen) && (
              <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold text-red-600">Status de Restrição</h3>
                  </div>
                  <div className="space-y-2">
                    {user.banned && (
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">
                          <Ban className="h-3 w-3 mr-1" />
                          Conta Banida
                        </Badge>
                        {user.banned_at && (
                          <span className="text-xs text-muted-foreground">
                            em {new Date(user.banned_at).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    )}
                    {user.balance_frozen && (
                      <Badge variant="secondary">
                        <Snowflake className="h-3 w-3 mr-1" />
                        Saldo Congelado
                      </Badge>
                    )}
                    {user.banned_reason && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <strong>Motivo:</strong> {user.banned_reason}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Balance Management */}
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="mb-4">
                  <Label className="text-muted-foreground text-xs sm:text-sm">Saldo Atual</Label>
                  <p className="text-xl sm:text-2xl font-bold">{formatCentsToBRL(user.balance)}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Ajustar Saldo (centavos)</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="number"
                      placeholder="Ex: 100"
                      value={balanceAmount}
                      onChange={(e) => setBalanceAmount(e.target.value)}
                      className="flex-1"
                    />
                    <div className="flex gap-2">
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
                      <Button onClick={handleBalanceChange} disabled={!balanceAmount} className="flex-1 sm:flex-none">
                        {balanceAction === 'add' ? 'Adicionar' : 'Remover'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Ban Button */}
                {!user.banned && (
                  <div className="pt-4 border-t">
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setBanModalOpen(true)}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Banir Usuário
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                {loading ? (
                  <p className="text-center text-muted-foreground py-4 text-sm">Carregando...</p>
                ) : transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4 text-sm">Nenhuma transação encontrada</p>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead className="hidden sm:table-cell">Descrição</TableHead>
                          <TableHead className="hidden md:table-cell">Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>{getTransactionBadge(tx.type)}</TableCell>
                            <TableCell className="text-sm">{formatCentsToBRL(tx.amount)}</TableCell>
                            <TableCell className="max-w-[150px] truncate text-sm hidden sm:table-cell">{tx.description || '-'}</TableCell>
                            <TableCell className="text-xs hidden md:table-cell">{new Date(tx.created_at).toLocaleDateString('pt-BR')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Offers Tab (Companies only) */}
          {user.role === 'COMPANY' && (
            <TabsContent value="offers">
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  {loading ? (
                    <p className="text-center text-muted-foreground py-4 text-sm">Carregando...</p>
                  ) : offers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4 text-sm">Nenhuma oferta encontrada</p>
                  ) : (
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[120px]">Título</TableHead>
                            <TableHead>Cliques</TableHead>
                            <TableHead className="hidden sm:table-cell">Views</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="hidden md:table-cell">Criada</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {offers.map((offer) => (
                            <TableRow key={offer.id}>
                              <TableCell className="font-medium max-w-[120px] sm:max-w-[200px] truncate text-sm">{offer.title}</TableCell>
                              <TableCell className="text-sm">{offer.clicks_count}</TableCell>
                              <TableCell className="text-sm hidden sm:table-cell">{offer.views_count}</TableCell>
                              <TableCell>
                                <Badge variant={offer.active ? 'default' : 'secondary'} className="text-xs">
                                  {offer.active ? 'Ativa' : 'Inativa'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs hidden md:table-cell">{new Date(offer.created_at).toLocaleDateString('pt-BR')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Ban User Modal */}
        <BanUserModal
          user={user}
          open={banModalOpen}
          onOpenChange={setBanModalOpen}
          onUserBanned={onUserUpdated}
        />
      </DialogContent>
    </Dialog>
  );
}
