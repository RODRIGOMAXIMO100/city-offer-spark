import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOffers } from '@/hooks/useOffers';
import { formatCreditsToReal, CONFIG } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Banknote, LogOut, Share2, Copy, Check, TrendingUp, Loader2, MapPin, Instagram, Clock, History, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PaymentDataModal from './PaymentDataModal';
import AffiliateLevel from './AffiliateLevel';
import AffiliateRanking from './AffiliateRanking';
import NotificationBell from './NotificationBell';
import AffiliateTutorial from './AffiliateTutorial';
import logo from '@/assets/logo.png';

interface Withdrawal {
  id: string;
  amount_brl: number;
  status: string;
  requested_at: string;
  rejection_reason: string | null;
}

interface Earning {
  id: string;
  amount: number;
  created_at: string;
  offer_title: string | null;
}

export default function AffiliateDashboard() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { offers, loading } = useOffers(profile?.city);
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [showWithdrawals, setShowWithdrawals] = useState(false);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [showEarnings, setShowEarnings] = useState(false);

  // Fetch withdrawal history
  useEffect(() => {
    const fetchWithdrawals = async () => {
      if (!profile?.id) return;
      
      const { data } = await supabase
        .from('withdrawals')
        .select('id, amount_brl, status, requested_at, rejection_reason')
        .eq('user_id', profile.id)
        .order('requested_at', { ascending: false })
        .limit(10);

      if (data) {
        setWithdrawals(data);
      }
    };

    fetchWithdrawals();
  }, [profile?.id]);

  // Fetch earnings history
  useEffect(() => {
    const fetchEarnings = async () => {
      if (!profile?.id) return;
      
      const { data } = await supabase
        .from('transactions')
        .select('id, amount, created_at, offer_id, offers(title)')
        .eq('user_id', profile.id)
        .eq('type', 'CLICK_EARNING')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setEarnings(data.map(t => ({
          id: t.id,
          amount: t.amount,
          created_at: t.created_at,
          offer_title: t.offers?.title || null,
        })));
      }
    };

    fetchEarnings();
  }, [profile?.id]);

  const handleWithdraw = async () => {
    const balance = profile?.balance || 0;
    const balanceBrl = balance * CONFIG.CREDIT_VALUE_BRL;

    if (balanceBrl < CONFIG.MIN_WITHDRAW_BRL) {
      toast({
        title: 'Saldo insuficiente',
        description: `Mínimo para saque: R$ ${CONFIG.MIN_WITHDRAW_BRL.toFixed(2)}`,
        variant: 'destructive',
      });
      return;
    }
    
    if (!profile?.cpf || !profile?.pix_key || !profile?.nome_completo) {
      setShowPaymentModal(true);
      return;
    }

    // Check for pending withdrawals
    const pendingWithdrawal = withdrawals.find(w => w.status === 'PENDING' || w.status === 'PROCESSING');
    if (pendingWithdrawal) {
      toast({
        title: 'Saque pendente',
        description: 'Você já tem um saque aguardando aprovação.',
        variant: 'destructive',
      });
      return;
    }

    setWithdrawing(true);

    try {
      const { data, error } = await supabase.functions.invoke('request-withdrawal', {
        body: { amount: balance },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Erro',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Saque solicitado!',
        description: data.message,
      });

      // Refresh profile to update balance
      await refreshProfile();

      // Add to local withdrawals list
      setWithdrawals(prev => [{
        id: data.withdrawal.id,
        amount_brl: data.withdrawal.amount_brl,
        status: 'PENDING',
        requested_at: new Date().toISOString(),
        rejection_reason: null,
      }, ...prev]);

    } catch (err) {
      console.error('Error requesting withdrawal:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível solicitar o saque. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const handlePaymentDataSaved = () => {
    setShowPaymentModal(false);
    toast({
      title: 'Dados salvos!',
      description: 'Agora você pode solicitar o saque.',
    });
  };

  const sortedOffers = [...offers].sort((a, b) => {
    const scoreA = a.views_count > 0 ? (a.clicks_count / a.views_count) * 100 : 0;
    const scoreB = b.views_count > 0 ? (b.clicks_count / b.views_count) * 100 : 0;
    return scoreB - scoreA;
  });

  const copyLink = async (offerId: string) => {
    const link = `${window.location.origin}/offer/${offerId}?ref=${profile?.id}`;
    
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(offerId);
      toast({
        title: 'Link copiado!',
        description: 'Compartilhe com seus seguidores e ganhe comissão.',
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({
        title: 'Erro ao copiar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const openInstagram = (instagramUrl: string) => {
    window.open(instagramUrl, '_blank');
  };

  const getScore = (offer: typeof offers[0]) => {
    if (offer.views_count === 0) return 0;
    return ((offer.clicks_count / offer.views_count) * 100).toFixed(1);
  };

  const getExpirationInfo = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diff <= 0) return { text: 'Expirada', color: 'bg-destructive', urgent: true };
    if (days < 1) return { text: `${hours}h restantes!`, color: 'bg-destructive', urgent: true };
    if (days <= 3) return { text: `${days}d restantes`, color: 'bg-orange-500', urgent: true };
    if (days <= 7) return { text: `${days}d restantes`, color: 'bg-yellow-500', urgent: false };
    return { text: `${days}d restantes`, color: 'bg-muted', urgent: false };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Pendente</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="text-blue-500 border-blue-500">Aprovado</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-500">Pago</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-affiliate-muted pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {/* Top row: Logo + Logout */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <img src={logo} alt="clilin" className="h-8" />
              <Badge variant="outline" className="text-affiliate border-affiliate text-xs">
                Divulgador
              </Badge>
            </div>
            <Button size="icon" variant="outline" onClick={signOut} className="shrink-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Balance row */}
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2 mb-2">
            <Banknote className="h-5 w-5 text-affiliate shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Saldo disponível</p>
              <p className="font-bold text-affiliate">
                {formatCreditsToReal(profile?.balance || 0)}
              </p>
            </div>
            <Button
              size="sm"
              className="bg-affiliate hover:bg-affiliate/90 text-affiliate-foreground shrink-0"
              onClick={handleWithdraw}
              disabled={withdrawing}
            >
              {withdrawing ? (
                <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
              ) : null}
              <span className="hidden sm:inline">Sacar PIX</span>
              <span className="sm:hidden">PIX</span>
            </Button>
          </div>

          {/* Action buttons row */}
          <div className="flex gap-1.5 sm:gap-2 flex-wrap">
            <AffiliateTutorial />
            {profile?.id && <NotificationBell userId={profile.id} />}
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setShowEarnings(!showEarnings); setShowWithdrawals(false); }}
              className="flex-1 sm:flex-none min-w-0"
            >
              <Coins className="h-4 w-4 sm:mr-1.5 shrink-0" />
              <span className="hidden sm:inline">Ganhos</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setShowWithdrawals(!showWithdrawals); setShowEarnings(false); }}
              className="flex-1 sm:flex-none min-w-0"
            >
              <History className="h-4 w-4 sm:mr-1.5 shrink-0" />
              <span className="hidden sm:inline">Saques</span>
            </Button>
          </div>

          {/* Earnings History */}
          {showEarnings && (
            <div className="mt-3 bg-affiliate/10 rounded-lg p-2 sm:p-3">
              <div className="flex justify-between items-center mb-2 gap-2">
                <p className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-affiliate shrink-0" />
                  <span className="truncate">Histórico de Ganhos</span>
                </p>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  Total: <strong className="text-affiliate">{formatCreditsToReal(earnings.reduce((sum, e) => sum + e.amount, 0))}</strong>
                </p>
              </div>
              {earnings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum ganho registrado ainda.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {earnings.map((e) => (
                    <div key={e.id} className="flex justify-between items-center text-sm bg-background rounded p-2 gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-affiliate">{formatCreditsToReal(e.amount)}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {e.offer_title || 'Oferta'}
                        </p>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">{formatDate(e.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Withdrawal History */}
          {showWithdrawals && withdrawals.length > 0 && (
            <div className="mt-3 bg-muted/30 rounded-lg p-2 sm:p-3">
              <p className="text-xs sm:text-sm font-medium mb-2">Histórico de Saques</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {withdrawals.map((w) => (
                  <div key={w.id} className="flex justify-between items-center text-sm bg-background rounded p-2 gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">R$ {w.amount_brl.toFixed(2)}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{formatDate(w.requested_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {getStatusBadge(w.status)}
                      {w.rejection_reason && (
                        <p className="text-[10px] sm:text-xs text-destructive mt-1 max-w-[120px] truncate">{w.rejection_reason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Affiliate Level Card */}
        {profile?.id && (
          <AffiliateLevel affiliateId={profile.id} />
        )}

        {/* Ranking Section */}
        {profile?.id && (
          <AffiliateRanking currentAffiliateId={profile.id} />
        )}

        {/* Info Card - Earnings Explanation */}
        <Card className="bg-gradient-to-r from-affiliate to-affiliate/80 text-affiliate-foreground border-0">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-3 rounded-full shrink-0">
                <Share2 className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <p className="font-bold text-lg">Divisão 50/50 - Transparência Total!</p>
                <ul className="text-sm opacity-95 space-y-1">
                  <li>• <strong>R$ 0,20 a R$ 0,50 por clique</strong> - você recebe 50% do CPC!</li>
                  <li>• <strong>Bônus de nível até +50%</strong> - pode chegar a R$ 0,75/clique!</li>
                  <li>• <strong>Saque mínimo: R$ 30,00</strong> via PIX instantâneo</li>
                  <li>• <strong><a href="/transparencia" className="underline">Veja como funciona →</a></strong></li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Ofertas em <strong>{profile?.city}</strong></span>
        </div>

        {/* Offers List */}
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
            Ofertas Disponíveis
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : sortedOffers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  Nenhuma oferta disponível em {profile?.city} no momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedOffers.map((offer, index) => {
                const discount = Math.round((1 - offer.price_new / offer.price_old) * 100);
                const expInfo = getExpirationInfo(offer.expires_at);
                
                return (
                  <Card key={offer.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      {/* Rank Badge & Expiration */}
                      <div className="flex justify-between items-center mb-2">
                        {index < 3 && (
                          <Badge 
                            className={`${
                              index === 0 ? 'bg-yellow-500' : 
                              index === 1 ? 'bg-gray-400' : 
                              'bg-amber-600'
                            }`}
                          >
                            #{index + 1} Top
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={`ml-auto flex items-center gap-1 ${expInfo.urgent ? 'border-destructive text-destructive' : ''}`}
                        >
                          <Clock className="h-3 w-3" />
                          {expInfo.text}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-foreground">{offer.title}</h3>
                          <p className="text-sm text-muted-foreground">{offer.profiles?.name}</p>
                        </div>
                        <Badge variant="destructive" className="shrink-0">
                          -{discount}%
                        </Badge>
                      </div>

                      {/* Instagram Button */}
                      {offer.profiles?.instagram_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mb-3 text-pink-500 border-pink-500/30 hover:bg-pink-500/10"
                          onClick={() => openInstagram(offer.profiles!.instagram_url!)}
                        >
                          <Instagram className="mr-2 h-4 w-4" />
                          Conhecer no Instagram
                          <span className="ml-2 text-xs text-muted-foreground">(grátis)</span>
                        </Button>
                      )}

                      <div className="flex items-center gap-4 text-sm mb-3">
                        <span className="line-through text-muted-foreground">
                          R$ {offer.price_old.toFixed(2)}
                        </span>
                        <span className="font-bold text-secondary text-lg">
                          R$ {offer.price_new.toFixed(2)}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 text-center text-[10px] sm:text-xs">
                        <div className="bg-muted rounded-lg py-1.5 sm:py-2 px-1">
                          <p className="font-bold text-sm sm:text-base">{offer.views_count}</p>
                          <p className="text-muted-foreground">Views</p>
                        </div>
                        <div className="bg-muted rounded-lg py-1.5 sm:py-2 px-1">
                          <p className="font-bold text-sm sm:text-base">{offer.clicks_count}</p>
                          <p className="text-muted-foreground">Cliques</p>
                        </div>
                        <div className="bg-affiliate/10 rounded-lg py-1.5 sm:py-2 px-1">
                          <div className="flex items-center justify-center gap-0.5">
                            <TrendingUp className="h-3 w-3 text-affiliate" />
                            <p className="font-bold text-sm sm:text-base text-affiliate">{getScore(offer)}%</p>
                          </div>
                          <p className="text-muted-foreground">CTR</p>
                        </div>
                      </div>

                      {/* Commission - Dynamic based on offer */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-affiliate/10 rounded-lg p-2 mb-3 gap-0.5 sm:gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">Sua comissão base (50%)</span>
                        <span className="font-bold text-affiliate text-sm sm:text-base">
                          R$ 0,20 - R$ 0,50/clique
                        </span>
                      </div>

                      {/* Copy Button */}
                      <Button
                        onClick={() => copyLink(offer.id)}
                        className="w-full bg-foreground hover:bg-foreground/90"
                      >
                        {copiedId === offer.id ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Link Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            COPIAR LINK DE DIVULGAÇÃO
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Payment Data Modal */}
      <PaymentDataModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentDataSaved}
      />
    </div>
  );
}
