import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOffers } from '@/hooks/useOffers';
import { formatCreditsToReal, CONFIG } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Banknote, LogOut, Share2, Copy, Check, TrendingUp, Loader2, MapPin, Instagram, Clock, History, Coins, HelpCircle, BookOpen, Settings, LayoutDashboard, BarChart3, ShoppingBag, Search, MoreVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PaymentDataModal from './PaymentDataModal';
import ProfileSettingsModal from './ProfileSettingsModal';
import AffiliateLevel from './AffiliateLevel';
import AffiliateMonthlyHistory from './AffiliateMonthlyHistory';
import AffiliateRanking from './AffiliateRanking';
import NotificationBell from './NotificationBell';
import AffiliateTutorial from './AffiliateTutorial';
import { Footer } from '@/components/landing/Footer';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { WelcomeModal, OnboardingTour, OnboardingChecklist } from '@/components/onboarding';
import { AffiliateOfferCard } from './AffiliateOfferCard';
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

function AffiliateDashboardContent() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { offers, loading } = useOffers(profile?.city);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { claimBonus, hasClaimedBonus, startTour } = useOnboarding();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [commissionMultiplier, setCommissionMultiplier] = useState<number>(1.00);

  // Fetch commission multiplier
  useEffect(() => {
    const fetchCommissionMultiplier = async () => {
      if (!profile?.id) return;
      
      const { data, error } = await supabase.rpc('get_commission_multiplier', {
        affiliate_profile_id: profile.id
      });

      if (!error && data) {
        setCommissionMultiplier(Number(data));
      }
    };

    fetchCommissionMultiplier();
  }, [profile?.id]);

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
        .in('type', ['CLICK_EARNING', 'LEAD_EARNING'])
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
    const balance = profile?.balance || 0; // já em centavos

    if (balance < CONFIG.MIN_WITHDRAW_CENTS) {
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
      
      // Claim bonus for first link copied
      if (!hasClaimedBonus('first_link_copied')) {
        claimBonus('first_link_copied');
      }
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
      {/* Header Compacto - 1 linha */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between gap-2">
          {/* Logo + Nome */}
          <div className="flex items-center gap-2 min-w-0">
            <img src={logo} alt="clilin" className="h-7 shrink-0" />
            <span className="text-sm font-medium truncate max-w-[100px] sm:max-w-none">{profile?.name}</span>
          </div>
          
          {/* Saldo + Ações */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Saldo clicável para sacar */}
            <Button 
              data-tour="balance"
              variant="ghost" 
              size="sm" 
              onClick={handleWithdraw}
              disabled={withdrawing}
              className="text-affiliate font-bold px-2 sm:px-3"
            >
              {withdrawing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Banknote className="h-4 w-4 mr-1 shrink-0" />
              )}
              {formatCreditsToReal(profile?.balance || 0)}
            </Button>
            
            {/* Dicas - botão compacto */}
            <AffiliateTutorial />
            
            {/* Notification inline */}
            {profile?.id && <NotificationBell userId={profile.id} />}
            
            {/* Menu unificado */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={() => setShowProfileSettings(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/ajuda')}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Central de Ajuda
                </DropdownMenuItem>
                <DropdownMenuItem onClick={startTour}>
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Ver Tour Guiado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="inicio" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="inicio" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Início</span>
            </TabsTrigger>
            <TabsTrigger value="ofertas" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Ofertas</span>
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Início - Stats, Nível e Ranking */}
          <TabsContent value="inicio" className="space-y-6">
            {/* Affiliate Level Card */}
            {profile?.id && (
              <div data-tour="level">
                <AffiliateLevel affiliateId={profile.id} />
              </div>
            )}

            {/* Info Card - Earnings Explanation */}
            <Card className="bg-gradient-to-r from-affiliate to-affiliate/80 text-affiliate-foreground border-0">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="bg-white/20 p-2 sm:p-3 rounded-full shrink-0">
                    <Share2 className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <p className="font-bold text-base sm:text-lg">💰 Ganhe por Lead!</p>
                    <ul className="text-xs sm:text-sm opacity-95 space-y-0.5 sm:space-y-1">
                      <li>• <strong>R$ 0,30 a R$ 1,50/lead</strong><span className="hidden sm:inline"> (pessoa que preenche nome + WhatsApp)</span></li>
                      <li>• <strong>Comissão 30%</strong><span className="hidden sm:inline"> - suba de nível e ganhe mais!</span></li>
                      <li className="hidden sm:list-item">• <strong>Bronze:</strong> 30% | <strong>Prata:</strong> 40% | <strong>Ouro:</strong> 50%</li>
                      <li>• <strong>Metas zeram dia 1</strong><span className="hidden sm:inline"> - evolua todo mês!</span></li>
                      <li>• <strong>Saque mín: R$ 100</strong> <span className="hidden sm:inline">via PIX</span></li>
                      <li>• <a href="/transparencia" className="underline font-medium">Ver detalhes →</a></li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ranking Section */}
            {profile?.id && (
              <AffiliateRanking currentAffiliateId={profile.id} />
            )}

            {/* Monthly History */}
            {profile?.id && (
              <AffiliateMonthlyHistory affiliateId={profile.id} />
            )}
          </TabsContent>

          {/* Tab Ofertas - Lista dedicada de ofertas */}
          <TabsContent value="ofertas" className="space-y-6">
            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Ofertas em <strong>{profile?.city}</strong></span>
            </div>

            {/* Offers List */}
            <div data-tour="offers">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                {sortedOffers.length} Ofertas Disponíveis
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
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  {sortedOffers.map((offer, index) => (
                    <AffiliateOfferCard
                      key={offer.id}
                      offer={{
                        ...offer,
                        current_offer_score: (offer as any).current_offer_score,
                        ctr_score: (offer as any).ctr_score,
                        quality_score: (offer as any).quality_score,
                        reputation_score: (offer as any).reputation_score,
                      }}
                      profileId={profile?.id || ''}
                      index={index}
                      commissionMultiplier={commissionMultiplier}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab Histórico - Ganhos e Saques */}
          <TabsContent value="historico" className="space-y-6">
            {/* Earnings History */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3 gap-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Coins className="h-4 w-4 text-affiliate" />
                    Histórico de Ganhos
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total: <strong className="text-affiliate">{formatCreditsToReal(earnings.reduce((sum, e) => sum + e.amount, 0))}</strong>
                  </p>
                </div>
                {earnings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum ganho registrado ainda.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {earnings.map((e) => (
                      <div key={e.id} className="flex justify-between items-center text-sm bg-muted/50 rounded-lg p-3 gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-affiliate">{formatCreditsToReal(e.amount)}</p>
                          <p className="text-xs text-muted-foreground truncate">{e.offer_title || 'Oferta'}</p>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(e.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Withdrawal History */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium flex items-center gap-2 mb-3">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Histórico de Saques
                </p>
                {withdrawals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum saque solicitado ainda.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {withdrawals.map((w) => (
                      <div key={w.id} className="flex justify-between items-center text-sm bg-muted/50 rounded-lg p-3 gap-2">
                        <div className="min-w-0">
                          <p className="font-medium">R$ {w.amount_brl.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(w.requested_at)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {getStatusBadge(w.status)}
                          {w.rejection_reason && (
                            <p className="text-xs text-destructive mt-1 max-w-[120px] truncate">{w.rejection_reason}</p>
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
      </div>

      {/* Payment Data Modal */}
      <PaymentDataModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentDataSaved}
      />

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        open={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
        userType="AFFILIATE"
      />

      <Footer />
    </div>
  );
}

export default function AffiliateDashboard() {
  return (
    <OnboardingProvider>
      <AffiliateDashboardContent />
      <WelcomeModal />
      <OnboardingTour />
      <OnboardingChecklist />
    </OnboardingProvider>
  );
}
