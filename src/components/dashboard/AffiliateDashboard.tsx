import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOffers } from '@/hooks/useOffers';
import { formatCreditsToReal, CONFIG } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Banknote, LogOut, Share2, Copy, Check, TrendingUp, Loader2, MapPin, Instagram, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PaymentDataModal from './PaymentDataModal';

export default function AffiliateDashboard() {
  const { profile, signOut } = useAuth();
  const { offers, loading } = useOffers(profile?.city);
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleWithdraw = () => {
    if ((profile?.balance || 0) * CONFIG.CREDIT_VALUE_BRL < CONFIG.MIN_WITHDRAW_BRL) {
      toast({
        title: 'Saldo insuficiente',
        description: `Mínimo para saque: R$ ${CONFIG.MIN_WITHDRAW_BRL.toFixed(2)}`,
        variant: 'destructive',
      });
      return;
    }
    
    if (!profile?.cpf || !profile?.pix_key) {
      setShowPaymentModal(true);
    } else {
      alert('Funcionalidade de saque PIX em breve!');
    }
  };

  const handlePaymentDataSaved = () => {
    setShowPaymentModal(false);
    alert('Funcionalidade de saque PIX em breve!');
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

  return (
    <div className="min-h-screen bg-affiliate-muted pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {/* Top row: Logo + Logout */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-affiliate">clilin</h1>
              <Badge variant="outline" className="text-affiliate border-affiliate text-xs">
                Divulgador
              </Badge>
            </div>
            <Button size="icon" variant="outline" onClick={signOut} className="shrink-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Bottom row: Balance + Sacar */}
          <div className="flex justify-between items-center bg-muted/50 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-affiliate" />
              <div>
                <p className="text-xs text-muted-foreground">Saldo disponível</p>
                <p className="font-bold text-affiliate">
                  {formatCreditsToReal(profile?.balance || 0)}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-affiliate hover:bg-affiliate/90 text-affiliate-foreground"
              onClick={handleWithdraw}
            >
              Sacar PIX
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <Card className="bg-gradient-to-r from-affiliate to-affiliate/80 text-affiliate-foreground border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-full">
                <Share2 className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold">Ganhe {formatCreditsToReal(CONFIG.CPC_PAYOUT_AFFILIATE)} por clique!</p>
                <p className="text-sm opacity-90">
                  Copie o link das ofertas e compartilhe com seus seguidores
                </p>
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
                      <div className="grid grid-cols-3 gap-2 mb-3 text-center text-xs">
                        <div className="bg-muted rounded-lg py-2">
                          <p className="font-bold">{offer.views_count}</p>
                          <p className="text-muted-foreground">Views</p>
                        </div>
                        <div className="bg-muted rounded-lg py-2">
                          <p className="font-bold">{offer.clicks_count}</p>
                          <p className="text-muted-foreground">Cliques</p>
                        </div>
                        <div className="bg-affiliate/10 rounded-lg py-2">
                          <div className="flex items-center justify-center gap-1">
                            <TrendingUp className="h-3 w-3 text-affiliate" />
                            <p className="font-bold text-affiliate">{getScore(offer)}%</p>
                          </div>
                          <p className="text-muted-foreground">CTR</p>
                        </div>
                      </div>

                      {/* Commission */}
                      <div className="flex justify-between items-center bg-affiliate/10 rounded-lg p-2 mb-3">
                        <span className="text-sm">Sua comissão</span>
                        <span className="font-bold text-affiliate">
                          {formatCreditsToReal(CONFIG.CPC_PAYOUT_AFFILIATE)}/clique
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
