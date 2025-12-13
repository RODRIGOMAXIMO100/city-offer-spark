import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Clock, RefreshCw, Eye, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCreditsToReal } from '@/types/database';

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  amount_brl: number;
  status: string;
  pix_key: string;
  pix_tipo: string;
  cpf: string;
  nome_completo: string;
  fraud_score: number;
  fraud_reasons: string[];
  requested_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  profiles?: {
    name: string;
    email: string;
    city: string;
    balance: number;
    created_at: string;
  };
}

interface AffiliateStats {
  totalClicks: number;
  totalEarnings: number;
  uniqueOffers: number;
  uniqueIps: number;
}

export default function AdminWithdrawals() {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStats | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'>('PENDING');

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('withdrawals')
        .select(`
          *,
          profiles!withdrawals_user_id_fkey(name, email, city, balance, created_at)
        `)
        .order('requested_at', { ascending: false });

      if (filter !== 'ALL') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os saques.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAffiliateStats = async (userId: string) => {
    try {
      // Get click stats
      const { data: clicks } = await supabase
        .from('offer_clicks')
        .select('offer_id, client_ip')
        .eq('affiliate_id', userId)
        .eq('click_type', 'MAIN');

      // Get earnings (CLICK_EARNING + LEAD_EARNING)
      const { data: earnings } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', userId)
        .in('type', ['CLICK_EARNING', 'LEAD_EARNING']);

      const uniqueOffers = new Set(clicks?.map(c => c.offer_id)).size;
      const uniqueIps = new Set(clicks?.map(c => c.client_ip)).size;
      const totalEarnings = earnings?.reduce((acc, t) => acc + t.amount, 0) || 0;

      setAffiliateStats({
        totalClicks: clicks?.length || 0,
        totalEarnings,
        uniqueOffers,
        uniqueIps,
      });
    } catch (error) {
      console.error('Error fetching affiliate stats:', error);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [filter]);

  const handleViewDetails = async (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    await fetchAffiliateStats(withdrawal.user_id);
  };

  const handleApprove = async (withdrawal: Withdrawal) => {
    setProcessing(withdrawal.id);
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({
          status: 'APPROVED',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', withdrawal.id);

      if (error) throw error;

      toast({
        title: 'Saque aprovado',
        description: `Saque de R$ ${withdrawal.amount_brl.toFixed(2)} aprovado. Realize o pagamento PIX.`,
      });

      fetchWithdrawals();
      setSelectedWithdrawal(null);
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar o saque.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectionReason.trim()) return;

    setProcessing(selectedWithdrawal.id);
    try {
      // Update withdrawal status
      const { error: withdrawalError } = await supabase
        .from('withdrawals')
        .update({
          status: 'REJECTED',
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', selectedWithdrawal.id);

      if (withdrawalError) throw withdrawalError;

      // Refund balance
      const { error: refundError } = await supabase
        .from('profiles')
        .update({ 
          balance: (selectedWithdrawal.profiles?.balance || 0) + selectedWithdrawal.amount 
        })
        .eq('id', selectedWithdrawal.user_id);

      if (refundError) throw refundError;

      // Record refund transaction
      await supabase.from('transactions').insert({
        user_id: selectedWithdrawal.user_id,
        amount: selectedWithdrawal.amount,
        type: 'DEPOSIT',
        description: `Estorno de saque rejeitado: ${rejectionReason}`,
      });

      toast({
        title: 'Saque rejeitado',
        description: 'O saldo foi devolvido ao usuário.',
      });

      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedWithdrawal(null);
      fetchWithdrawals();
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível rejeitar o saque.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkCompleted = async (withdrawal: Withdrawal) => {
    setProcessing(withdrawal.id);
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({
          status: 'COMPLETED',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', withdrawal.id);

      if (error) throw error;

      toast({
        title: 'Saque concluído',
        description: 'O pagamento foi marcado como realizado.',
      });

      fetchWithdrawals();
    } catch (error) {
      console.error('Error completing withdrawal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar como concluído.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleProcessPix = async (withdrawal: Withdrawal) => {
    setProcessing(withdrawal.id);
    try {
      const { data, error } = await supabase.functions.invoke('process-withdrawal-pix', {
        body: { withdrawal_id: withdrawal.id },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: 'PIX enviado!',
        description: 'A transferência foi iniciada via Asaas.',
      });

      fetchWithdrawals();
    } catch (error: any) {
      console.error('Error processing PIX:', error);
      toast({
        title: 'Erro ao processar PIX',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const getFraudScoreColor = (score: number) => {
    if (score >= 50) return 'text-destructive bg-destructive/10';
    if (score >= 25) return 'text-orange-500 bg-orange-500/10';
    return 'text-green-500 bg-green-500/10';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="text-blue-500 border-blue-500"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'PROCESSING':
        return <Badge variant="outline" className="text-purple-500 border-purple-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processando</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Concluído</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
          <h2 className="text-xl font-bold">Solicitações de Saque</h2>
          <p className="text-sm text-muted-foreground">Gerencie as solicitações de saque dos afiliados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchWithdrawals}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === 'ALL' ? 'Todos' : f === 'PENDING' ? 'Pendentes' : f === 'APPROVED' ? 'Aprovados' : f === 'PROCESSING' ? 'Processando' : f === 'COMPLETED' ? 'Concluídos' : 'Rejeitados'}
          </Button>
        ))}
      </div>

      {/* Withdrawals Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma solicitação de saque encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Afiliado</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="hidden sm:table-cell">PIX</TableHead>
                    <TableHead className="hidden md:table-cell">Fraud Score</TableHead>
                    <TableHead className="hidden lg:table-cell">Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{w.nome_completo}</p>
                          <p className="text-xs text-muted-foreground hidden sm:block">{w.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-sm">
                        R$ {w.amount_brl.toFixed(2)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="text-sm">
                          <p>{w.pix_tipo}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[100px] md:max-w-[150px]">{w.pix_key}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className={getFraudScoreColor(w.fraud_score)}>
                          <Shield className="h-3 w-3 mr-1" />
                          {w.fraud_score}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm hidden lg:table-cell">
                        {formatDate(w.requested_at)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(w.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(w)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {w.status === 'PENDING' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApprove(w)}
                                disabled={processing === w.id}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                {processing === w.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedWithdrawal(w);
                                  setShowRejectModal(true);
                                }}
                                disabled={processing === w.id}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {w.status === 'APPROVED' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleProcessPix(w)}
                                disabled={processing === w.id}
                                className="bg-purple-500 hover:bg-purple-600"
                              >
                                {processing === w.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pagar PIX'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkCompleted(w)}
                                disabled={processing === w.id}
                              >
                                Manual
                              </Button>
                            </>
                          )}
                          {w.status === 'PROCESSING' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleMarkCompleted(w)}
                              disabled={processing === w.id}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              {processing === w.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Concluir'}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={!!selectedWithdrawal && !showRejectModal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Saque</DialogTitle>
            <DialogDescription>
              Análise completa da solicitação de saque
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              {/* Fraud Score Alert */}
              {selectedWithdrawal.fraud_score >= 25 && (
                <div className={`p-4 rounded-lg ${selectedWithdrawal.fraud_score >= 50 ? 'bg-destructive/10 border border-destructive' : 'bg-orange-500/10 border border-orange-500'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className={selectedWithdrawal.fraud_score >= 50 ? 'text-destructive' : 'text-orange-500'} />
                    <span className="font-bold">Alerta de Fraude - Score: {selectedWithdrawal.fraud_score}</span>
                  </div>
                  <ul className="text-sm space-y-1">
                    {selectedWithdrawal.fraud_reasons.map((reason, i) => (
                      <li key={i}>• {reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* User Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Dados do Afiliado</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Nome:</strong> {selectedWithdrawal.nome_completo}</p>
                    <p><strong>CPF:</strong> {selectedWithdrawal.cpf}</p>
                    <p><strong>Email:</strong> {selectedWithdrawal.profiles?.email}</p>
                    <p><strong>Cidade:</strong> {selectedWithdrawal.profiles?.city}</p>
                    <p><strong>Conta criada:</strong> {selectedWithdrawal.profiles?.created_at ? formatDate(selectedWithdrawal.profiles.created_at) : '-'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Dados do Saque</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Valor:</strong> R$ {selectedWithdrawal.amount_brl.toFixed(2)}</p>
                    <p><strong>Tipo PIX:</strong> {selectedWithdrawal.pix_tipo}</p>
                    <p><strong>Chave PIX:</strong> {selectedWithdrawal.pix_key}</p>
                    <p><strong>Solicitado em:</strong> {formatDate(selectedWithdrawal.requested_at)}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedWithdrawal.status)}</p>
                  </div>
                </div>
              </div>

              {/* Affiliate Stats */}
              {affiliateStats && (
                <div>
                  <h4 className="font-semibold mb-2">Estatísticas do Afiliado</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-muted p-3 rounded-lg text-center">
                      <p className="text-lg font-bold">{affiliateStats.totalClicks}</p>
                      <p className="text-xs text-muted-foreground">Cliques Totais</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-center">
                      <p className="text-lg font-bold">{formatCreditsToReal(affiliateStats.totalEarnings)}</p>
                      <p className="text-xs text-muted-foreground">Ganhos Totais</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-center">
                      <p className="text-lg font-bold">{affiliateStats.uniqueOffers}</p>
                      <p className="text-xs text-muted-foreground">Ofertas Diferentes</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-center">
                      <p className="text-lg font-bold">{affiliateStats.uniqueIps}</p>
                      <p className="text-xs text-muted-foreground">IPs Únicos</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedWithdrawal.status === 'PENDING' && (
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedWithdrawal(null)}>
                    Fechar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectModal(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                  <Button
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => handleApprove(selectedWithdrawal)}
                    disabled={processing === selectedWithdrawal.id}
                  >
                    {processing === selectedWithdrawal.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Aprovar Saque
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={() => setShowRejectModal(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Saque</DialogTitle>
            <DialogDescription>
              O saldo será devolvido ao afiliado. Informe o motivo da rejeição.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Motivo da rejeição..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processing === selectedWithdrawal?.id}
            >
              {processing === selectedWithdrawal?.id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
