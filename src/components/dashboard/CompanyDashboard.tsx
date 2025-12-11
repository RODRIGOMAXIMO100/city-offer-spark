import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOffers } from '@/hooks/useOffers';
import { formatCredits } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Coins, PlusCircle, LogOut, Eye, MousePointer, TrendingUp, Loader2, Instagram, Check, Clock, Trash2, Info, Star, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CreateOfferModal from './CreateOfferModal';
import PerformanceChart from './PerformanceChart';
import FiscalDataModal from './FiscalDataModal';
import logo from '@/assets/logo.png';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function CompanyDashboard() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { offers, loading, fetchMyOffers, deleteOffer } = useOffers();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFiscalModal, setShowFiscalModal] = useState(false);
  const [instagramUrl, setInstagramUrl] = useState(profile?.instagram_url || '');
  const [savingInstagram, setSavingInstagram] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleBuyCredits = () => {
    if (!profile?.cnpj || !profile?.razao_social) {
      setShowFiscalModal(true);
    } else {
      alert('Funcionalidade de compra de créditos em breve!');
    }
  };

  const handleFiscalDataSaved = () => {
    setShowFiscalModal(false);
    alert('Funcionalidade de compra de créditos em breve!');
  };

  const handleDeleteOffer = async (offerId: string) => {
    setDeletingId(offerId);
    await deleteOffer(offerId);
    setDeletingId(null);
  };

  useEffect(() => {
    fetchMyOffers();
  }, []);

  useEffect(() => {
    setInstagramUrl(profile?.instagram_url || '');
  }, [profile?.instagram_url]);

  // Calculate total spent from actual offer data (dynamic CPC)
  const totalClicks = offers.reduce((acc, o) => acc + o.clicks_count, 0);
  const totalViews = offers.reduce((acc, o) => acc + o.views_count, 0);

  const handleOfferCreated = () => {
    setShowCreateModal(false);
    fetchMyOffers();
    refreshProfile();
  };

  const formatInstagramUrl = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return '';
    
    if (trimmed.startsWith('@')) {
      return `https://instagram.com/${trimmed.slice(1)}`;
    }
    if (!trimmed.includes('instagram.com') && !trimmed.startsWith('http')) {
      return `https://instagram.com/${trimmed}`;
    }
    if (trimmed.includes('instagram.com') && !trimmed.startsWith('http')) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const saveInstagram = async () => {
    if (!profile) return;
    
    setSavingInstagram(true);
    const formattedUrl = formatInstagramUrl(instagramUrl);
    
    const { error } = await supabase
      .from('profiles')
      .update({ instagram_url: formattedUrl || null })
      .eq('id', profile.id);

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Instagram salvo!',
        description: 'Os clientes poderão conhecer seu estabelecimento.',
      });
      refreshProfile();
    }
    setSavingInstagram(false);
  };

  const getExpirationInfo = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diff <= 0) return { text: 'Expirada', color: 'text-destructive' };
    if (days < 1) return { text: 'Últimas horas!', color: 'text-destructive' };
    if (days <= 3) return { text: `${days}d restantes`, color: 'text-orange-500' };
    if (days <= 7) return { text: `${days}d restantes`, color: 'text-yellow-500' };
    return { text: `${days}d restantes`, color: 'text-muted-foreground' };
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-500';
    if (score >= 5) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getScoreTip = (score: number) => {
    if (score >= 7) return 'Excelente! Você paga menos por clique.';
    if (score >= 5) return 'Bom! Melhore descrição e desconto para pagar menos.';
    return 'Adicione descrição, Instagram e aumente o desconto!';
  };

  return (
    <div className="min-h-screen bg-company-muted pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={logo} alt="clilin" className="h-8" />
            <Badge variant="outline" className="text-company border-company">
              Empresa
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right mr-2">
              <p className="text-xs text-muted-foreground">Saldo</p>
              <div className="flex items-center gap-1 text-company font-bold">
                <Coins className="h-4 w-4" />
                {formatCredits(profile?.balance || 0)}
              </div>
            </div>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
              onClick={handleBuyCredits}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Instagram Profile Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              Perfil do Instagram
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="@seu_estabelecimento ou URL"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
              />
              <Button 
                onClick={saveInstagram} 
                disabled={savingInstagram}
                size="sm"
              >
                {savingInstagram ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Os clientes poderão conhecer seu estabelecimento antes de acessar a oferta.
            </p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Eye className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{totalViews}</p>
              <p className="text-xs text-muted-foreground">Visualizações</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MousePointer className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{totalClicks}</p>
              <p className="text-xs text-muted-foreground">Cliques</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">
                {totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-xs text-muted-foreground">CTR</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart */}
        <PerformanceChart />

        {/* Pricing Explanation Card */}
        <Card className="bg-gradient-to-r from-company/10 to-company/5 border-company/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-company/20 p-2 rounded-full shrink-0">
                <Info className="h-5 w-5 text-company" />
              </div>
              <div className="space-y-2">
                <p className="font-bold text-foreground">Sistema de Leilão Inteligente</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong className="text-foreground">CPC dinâmico:</strong> pague entre 4-15 C$ por clique</li>
                  <li>• <strong className="text-foreground">Offer Score alto = paga menos</strong></li>
                  <li>• <strong className="text-foreground">Divisão 50/50:</strong> metade vai para divulgadores</li>
                  <li>• <strong className="text-foreground">Melhore:</strong> descrição, desconto, Instagram</li>
                </ul>
                <Button variant="link" asChild className="h-auto p-0 text-company">
                  <Link to="/transparencia">
                    Entenda como funciona <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Offer Button */}
        <Button
          onClick={() => setShowCreateModal(true)}
          className="w-full py-6 bg-company hover:bg-company/90 text-company-foreground font-bold shadow-lg"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          CRIAR NOVA OFERTA
        </Button>

        {/* My Offers */}
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
            Minhas Ofertas
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : offers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Você ainda não criou nenhuma oferta.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique no botão acima para começar!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <TooltipProvider>
                {offers.map((offer) => {
                  const expInfo = getExpirationInfo(offer.expires_at);
                  const offerScore = (offer as any).current_offer_score || 5;
                  const maxBid = (offer as any).max_cpc_bid || 5;
                  
                  return (
                    <Card key={offer.id} className={`${!offer.active ? 'opacity-60' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-bold text-foreground">{offer.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={`flex items-center gap-1 text-sm ${getScoreColor(offerScore)}`}>
                                    <Star className="h-4 w-4 fill-current" />
                                    <span className="font-bold">{offerScore.toFixed(1)}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium">Offer Score</p>
                                  <p className="text-xs">{getScoreTip(offerScore)}</p>
                                </TooltipContent>
                              </Tooltip>
                              <span className="text-xs text-muted-foreground">
                                Lance: {maxBid} C$
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-1 text-xs ${expInfo.color}`}>
                              <Clock className="h-3 w-3" />
                              {expInfo.text}
                            </div>
                            <Badge variant={offer.active ? 'default' : 'secondary'}>
                              {offer.active ? 'Ativa' : 'Pausada'}
                            </Badge>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                  disabled={deletingId === offer.id}
                                >
                                  {deletingId === offer.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deletar oferta?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. A oferta "{offer.title}" será permanentemente removida.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteOffer(offer.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Deletar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {offer.tags?.slice(0, 4).join(', ')}
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                          <div className="bg-muted rounded-lg p-2">
                            <p className="font-bold">{offer.views_count}</p>
                            <p className="text-xs text-muted-foreground">Views</p>
                          </div>
                          <div className="bg-muted rounded-lg p-2">
                            <p className="font-bold">{offer.clicks_count}</p>
                            <p className="text-xs text-muted-foreground">Cliques</p>
                          </div>
                          <div className="bg-muted rounded-lg p-2">
                            <p className="font-bold">
                              {offer.views_count > 0 
                                ? ((offer.clicks_count / offer.views_count) * 100).toFixed(1) 
                                : 0}%
                            </p>
                            <p className="text-xs text-muted-foreground">CTR</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>

      {/* Create Offer Modal */}
      <CreateOfferModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleOfferCreated}
      />

      {/* Fiscal Data Modal */}
      <FiscalDataModal
        open={showFiscalModal}
        onClose={() => setShowFiscalModal(false)}
        onSuccess={handleFiscalDataSaved}
      />
    </div>
  );
}