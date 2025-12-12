import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCentsToBRL } from '@/types/database';
import { 
  Ban, ShieldAlert, ListX, Bell, Search, UserX, 
  Snowflake, DollarSign, CheckCircle, XCircle, AlertTriangle,
  Plus, Trash2, Eye, RefreshCw
} from 'lucide-react';

interface BannedUser {
  id: string;
  name: string;
  email?: string;
  cpf?: string;
  balance: number;
  banned: boolean;
  banned_at?: string;
  banned_reason?: string;
  balance_frozen: boolean;
}

interface BlacklistEntry {
  id: string;
  type: string;
  value: string;
  reason?: string;
  created_at: string;
}

interface FraudAlert {
  id: string;
  user_id?: string;
  alert_type: string;
  severity: string;
  title: string;
  description?: string;
  data?: unknown;
  resolved: boolean;
  created_at: string;
  profiles?: { name: string; email?: string } | null;
}

export default function AdminFraudManagement() {
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Ban modal state
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<BannedUser | null>(null);
  const [banReason, setBanReason] = useState('');
  const [freezeBalance, setFreezeBalance] = useState(true);
  const [confiscateBalance, setConfiscateBalance] = useState(false);

  // Blacklist modal state
  const [blacklistModalOpen, setBlacklistModalOpen] = useState(false);
  const [blacklistType, setBlacklistType] = useState('cpf');
  const [blacklistValue, setBlacklistValue] = useState('');
  const [blacklistReason, setBlacklistReason] = useState('');

  // Confirm dialogs
  const [unbanConfirmOpen, setUnbanConfirmOpen] = useState(false);
  const [deleteBlacklistConfirmOpen, setDeleteBlacklistConfirmOpen] = useState(false);
  const [selectedBlacklistId, setSelectedBlacklistId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch banned/frozen users
      const { data: users } = await supabase
        .from('profiles')
        .select('id, name, email, cpf, balance, banned, banned_at, banned_reason, balance_frozen')
        .or('banned.eq.true,balance_frozen.eq.true')
        .order('banned_at', { ascending: false });

      setBannedUsers(users || []);

      // Fetch blacklist
      const { data: blacklistData } = await supabase
        .from('fraud_blacklist')
        .select('*')
        .order('created_at', { ascending: false });

      setBlacklist(blacklistData || []);

      // Fetch fraud alerts
      const { data: alertsData } = await supabase
        .from('fraud_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Map alerts with profile info if needed
      setAlerts((alertsData || []).map(a => ({
        ...a,
        profiles: null
      })) as FraudAlert[]);
    } catch (error) {
      console.error('Error fetching fraud data:', error);
      toast.error('Erro ao carregar dados de fraude');
    }
    setLoading(false);
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) {
      toast.error('Informe o motivo do banimento');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      // Update profile
      const updateData: Record<string, unknown> = {
        banned: true,
        banned_at: new Date().toISOString(),
        banned_reason: banReason,
        banned_by: adminProfile?.id,
        balance_frozen: freezeBalance,
      };

      if (confiscateBalance) {
        updateData.balance = 0;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;

      // Create ban history record
      await supabase.from('user_bans').insert({
        user_id: selectedUser.id,
        banned_by: adminProfile?.id,
        reason: banReason,
        balance_at_ban: selectedUser.balance,
        action_type: 'BAN',
        evidence: { confiscated: confiscateBalance, frozen: freezeBalance }
      });

      // Create notification for user
      await supabase.from('notifications').insert({
        user_id: selectedUser.id,
        type: 'ACCOUNT_BANNED',
        title: '⚠️ Conta Suspensa',
        message: `Sua conta foi suspensa por violação dos termos de uso. Motivo: ${banReason}`,
        data: { reason: banReason }
      });

      toast.success('Usuário banido com sucesso');
      setBanModalOpen(false);
      setSelectedUser(null);
      setBanReason('');
      fetchData();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Erro ao banir usuário');
    }
  };

  const handleUnbanUser = async () => {
    if (!selectedUser) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      const { error } = await supabase
        .from('profiles')
        .update({
          banned: false,
          banned_at: null,
          banned_reason: null,
          banned_by: null,
          balance_frozen: false,
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Create unban history
      await supabase.from('user_bans').insert({
        user_id: selectedUser.id,
        banned_by: adminProfile?.id,
        reason: 'Desbloqueio manual pelo admin',
        balance_at_ban: selectedUser.balance,
        action_type: 'UNBAN'
      });

      toast.success('Usuário desbloqueado com sucesso');
      setUnbanConfirmOpen(false);
      setSelectedUser(null);
      fetchData();
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error('Erro ao desbloquear usuário');
    }
  };

  const handleAddToBlacklist = async () => {
    if (!blacklistValue.trim()) {
      toast.error('Informe o valor para blacklist');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      const { error } = await supabase.from('fraud_blacklist').insert({
        type: blacklistType,
        value: blacklistValue.trim(),
        reason: blacklistReason || null,
        added_by: adminProfile?.id
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('Este valor já está na blacklist');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Adicionado à blacklist');
      setBlacklistModalOpen(false);
      setBlacklistValue('');
      setBlacklistReason('');
      fetchData();
    } catch (error) {
      console.error('Error adding to blacklist:', error);
      toast.error('Erro ao adicionar à blacklist');
    }
  };

  const handleRemoveFromBlacklist = async () => {
    if (!selectedBlacklistId) return;

    try {
      const { error } = await supabase
        .from('fraud_blacklist')
        .delete()
        .eq('id', selectedBlacklistId);

      if (error) throw error;

      toast.success('Removido da blacklist');
      setDeleteBlacklistConfirmOpen(false);
      setSelectedBlacklistId(null);
      fetchData();
    } catch (error) {
      console.error('Error removing from blacklist:', error);
      toast.error('Erro ao remover da blacklist');
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      const { error } = await supabase
        .from('fraud_alerts')
        .update({
          resolved: true,
          resolved_by: adminProfile?.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      toast.success('Alerta marcado como resolvido');
      fetchData();
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Erro ao resolver alerta');
    }
  };

  const getSeverityBadge = (severity: string) => {
    const config: Record<string, { class: string; label: string }> = {
      'LOW': { class: 'bg-blue-500', label: 'Baixa' },
      'MEDIUM': { class: 'bg-yellow-500', label: 'Média' },
      'HIGH': { class: 'bg-orange-500', label: 'Alta' },
      'CRITICAL': { class: 'bg-red-500', label: 'Crítica' }
    };
    const c = config[severity] || config['LOW'];
    return <Badge className={`${c.class} text-white`}>{c.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, string> = {
      'cpf': 'CPF',
      'email': 'Email',
      'phone': 'Telefone',
      'pix_key': 'Chave Pix'
    };
    return <Badge variant="outline">{config[type] || type}</Badge>;
  };

  const filteredBannedUsers = bannedUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.cpf?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-500" />
            Gestão Anti-Fraude
          </h2>
          <p className="text-muted-foreground text-sm">
            Gerencie banimentos, blacklist e alertas de fraude
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="banned" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="banned" className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            <span className="hidden sm:inline">Banidos</span>
            {bannedUsers.length > 0 && (
              <Badge variant="destructive" className="ml-1">{bannedUsers.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="blacklist" className="flex items-center gap-2">
            <ListX className="h-4 w-4" />
            <span className="hidden sm:inline">Blacklist</span>
            {blacklist.length > 0 && (
              <Badge variant="secondary" className="ml-1">{blacklist.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alertas</span>
            {alerts.filter(a => !a.resolved).length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {alerts.filter(a => !a.resolved).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Banned Users Tab */}
        <TabsContent value="banned">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Usuários Banidos/Congelados</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : filteredBannedUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum usuário banido ou congelado
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Saldo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBannedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{user.cpf || '-'}</TableCell>
                          <TableCell>{formatCentsToBRL(user.balance)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {user.banned && (
                                <Badge variant="destructive" className="w-fit">
                                  <Ban className="h-3 w-3 mr-1" />
                                  Banido
                                </Badge>
                              )}
                              {user.balance_frozen && (
                                <Badge variant="secondary" className="w-fit">
                                  <Snowflake className="h-3 w-3 mr-1" />
                                  Congelado
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm">
                            {user.banned_reason || '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setUnbanConfirmOpen(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Desbanir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blacklist Tab */}
        <TabsContent value="blacklist">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Blacklist de Fraude</CardTitle>
                <Button onClick={() => setBlacklistModalOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              <CardDescription>
                CPFs, emails, telefones e chaves Pix bloqueados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : blacklist.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum item na blacklist
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blacklist.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{getTypeBadge(entry.type)}</TableCell>
                          <TableCell className="font-mono text-sm">{entry.value}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm">
                            {entry.reason || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(entry.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => {
                                setSelectedBlacklistId(entry.id);
                                setDeleteBlacklistConfirmOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Alertas de Fraude</CardTitle>
              <CardDescription>
                Alertas automáticos de atividades suspeitas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : alerts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum alerta de fraude
                </p>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border ${
                        alert.resolved 
                          ? 'bg-muted/30 border-muted' 
                          : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getSeverityBadge(alert.severity)}
                            <span className="text-sm text-muted-foreground">
                              {new Date(alert.created_at).toLocaleString('pt-BR')}
                            </span>
                            {alert.resolved && (
                              <Badge variant="outline" className="text-green-600">
                                Resolvido
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-semibold">{alert.title}</h4>
                          {alert.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {alert.description}
                            </p>
                          )}
                          {alert.profiles && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Usuário: {alert.profiles.name} ({alert.profiles.email})
                            </p>
                          )}
                        </div>
                        {!alert.resolved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolver
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ban User Modal */}
      <Dialog open={banModalOpen} onOpenChange={setBanModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              Banir Usuário
            </DialogTitle>
            <DialogDescription>
              {selectedUser && `Banir ${selectedUser.name} (${selectedUser.email})`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo do Banimento *</Label>
              <Textarea
                placeholder="Descreva o motivo do banimento..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Congelar Saldo</Label>
                <p className="text-xs text-muted-foreground">
                  Impede saques mas mantém o saldo
                </p>
              </div>
              <Switch
                checked={freezeBalance}
                onCheckedChange={setFreezeBalance}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-red-500">Confiscar Saldo</Label>
                <p className="text-xs text-muted-foreground">
                  Zera o saldo do usuário (irreversível)
                </p>
              </div>
              <Switch
                checked={confiscateBalance}
                onCheckedChange={setConfiscateBalance}
              />
            </div>

            {selectedUser && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Saldo atual:</strong> {formatCentsToBRL(selectedUser.balance)}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBanModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleBanUser}>
              <Ban className="h-4 w-4 mr-2" />
              Confirmar Banimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Blacklist Modal */}
      <Dialog open={blacklistModalOpen} onOpenChange={setBlacklistModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListX className="h-5 w-5" />
              Adicionar à Blacklist
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={blacklistType} onValueChange={setBlacklistType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="pix_key">Chave Pix</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor *</Label>
              <Input
                placeholder={
                  blacklistType === 'cpf' ? '123.456.789-00' :
                  blacklistType === 'email' ? 'email@exemplo.com' :
                  blacklistType === 'phone' ? '(31) 99999-9999' :
                  'Chave Pix'
                }
                value={blacklistValue}
                onChange={(e) => setBlacklistValue(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Textarea
                placeholder="Motivo do bloqueio..."
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBlacklistModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddToBlacklist}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unban Confirmation Dialog */}
      <AlertDialog open={unbanConfirmOpen} onOpenChange={setUnbanConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desbanir Usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser && (
                <>
                  Você está prestes a desbanir <strong>{selectedUser.name}</strong>.
                  O usuário poderá voltar a usar a plataforma normalmente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnbanUser}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Blacklist Confirmation Dialog */}
      <AlertDialog open={deleteBlacklistConfirmOpen} onOpenChange={setDeleteBlacklistConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover da Blacklist?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta entrada será removida da blacklist. Novos cadastros com estes dados serão permitidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveFromBlacklist} className="bg-red-500 hover:bg-red-600">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
