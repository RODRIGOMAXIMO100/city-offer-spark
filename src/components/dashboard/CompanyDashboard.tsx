import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOffers } from '@/hooks/useOffers';
import { formatCredits, CONFIG } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, PlusCircle, LogOut, Eye, MousePointer, TrendingUp, Loader2 } from 'lucide-react';
import CreateOfferModal from './CreateOfferModal';

export default function CompanyDashboard() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { offers, loading, fetchMyOffers } = useOffers();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchMyOffers();
  }, []);

  const totalSpent = offers.reduce((acc, o) => acc + (o.clicks_count * CONFIG.CPC_COST_COMPANY), 0);
  const totalClicks = offers.reduce((acc, o) => acc + o.clicks_count, 0);
  const totalViews = offers.reduce((acc, o) => acc + o.views_count, 0);

  const handleOfferCreated = () => {
    setShowCreateModal(false);
    fetchMyOffers();
    refreshProfile();
  };

  return (
    <div className="min-h-screen bg-company-muted pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-company">clilin</h1>
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
              onClick={() => alert('Funcionalidade de compra de créditos em breve!')}
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
              <p className="text-2xl font-bold">{totalSpent}</p>
              <p className="text-xs text-muted-foreground">C$ Gastos</p>
            </CardContent>
          </Card>
        </div>

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
              {offers.map((offer) => (
                <Card key={offer.id} className={`${!offer.active ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-foreground">{offer.title}</h3>
                      <Badge variant={offer.active ? 'default' : 'secondary'}>
                        {offer.active ? 'Ativa' : 'Pausada'}
                      </Badge>
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
                        <p className="font-bold text-destructive">
                          -{offer.clicks_count * CONFIG.CPC_COST_COMPANY}
                        </p>
                        <p className="text-xs text-muted-foreground">C$ Gastos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
    </div>
  );
}