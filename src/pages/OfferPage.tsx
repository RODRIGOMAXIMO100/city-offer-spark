import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Offer, CONFIG } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, MessageCircle, Globe, FileText, MapPin, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OfferPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const affiliateId = searchParams.get('ref');

  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [buttonReady, setButtonReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const fetchOffer = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          profiles!offers_company_id_fkey(name)
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        toast({
          title: 'Oferta não encontrada',
          description: 'Esta oferta pode ter expirado ou sido removida.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setOffer(data as Offer);
      setLoading(false);

      // Increment view
      await supabase
        .from('offers')
        .update({ views_count: data.views_count + 1 })
        .eq('id', id);

      // Anti-fraud delay
      setTimeout(() => setButtonReady(true), CONFIG.TIME_TO_INTERACTIVE);
    };

    fetchOffer();
  }, [id, navigate, toast]);

  // Countdown timer
  useEffect(() => {
    if (!offer) return;

    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(offer.expires_at);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expirada');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [offer]);

  const handleClick = async () => {
    if (!buttonReady || !offer || processing) return;

    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-click', {
        body: {
          offerId: offer.id,
          affiliateId,
          clientIp: '',
          userAgent: navigator.userAgent,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        toast({
          title: 'Erro',
          description: data.error,
          variant: 'destructive',
        });
        setProcessing(false);
        return;
      }

      // Redirect to destination
      window.location.href = data.redirectUrl;
    } catch (err) {
      console.error('Error processing click:', err);
      toast({
        title: 'Erro ao processar',
        description: 'Tente novamente em alguns segundos.',
        variant: 'destructive',
      });
      setProcessing(false);
    }
  };

  const getLinkIcon = () => {
    switch (offer?.link_type) {
      case 'WHATSAPP':
        return <MessageCircle className="h-5 w-5" />;
      case 'MENU':
        return <FileText className="h-5 w-5" />;
      case 'SITE':
        return <Globe className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  const getLinkText = () => {
    switch (offer?.link_type) {
      case 'WHATSAPP':
        return 'Pedir no WhatsApp';
      case 'MENU':
        return 'Ver Cardápio';
      case 'SITE':
        return 'Acessar Site';
      default:
        return 'Acessar';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!offer) {
    return null;
  }

  const discount = Math.round((1 - offer.price_new / offer.price_old) * 100);

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 overflow-hidden animate-fade-in">
        {/* Header with discount badge */}
        <div className="bg-gradient-to-r from-secondary to-secondary/80 p-4 text-secondary-foreground">
          <div className="flex justify-between items-start">
            <Badge variant="destructive" className="text-sm font-bold px-3 py-1">
              -{discount}% OFF
            </Badge>
            <div className="flex items-center gap-1 text-sm opacity-90">
              <Clock className="h-4 w-4" />
              {timeLeft}
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Company */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium">{offer.profiles?.name || 'Empresa'}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            {offer.title}
          </h1>

          {/* Description */}
          {offer.description && (
            <p className="text-muted-foreground">
              {offer.description}
            </p>
          )}

          {/* Prices */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground line-through">
                  De R$ {offer.price_old.toFixed(2)}
                </p>
                <p className="text-3xl font-extrabold text-secondary">
                  R$ {offer.price_new.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Economia de</p>
                <p className="text-lg font-bold text-destructive">
                  R$ {(offer.price_old - offer.price_new).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {offer.city}
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleClick}
            disabled={!buttonReady || processing}
            className={`w-full py-6 text-lg font-bold transition-all ${
              buttonReady && !processing
                ? 'bg-secondary hover:bg-secondary/90 shadow-lg hover:shadow-xl'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processando...
              </>
            ) : buttonReady ? (
              <>
                {getLinkIcon()}
                <span className="ml-2">{getLinkText()}</span>
              </>
            ) : (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Carregando...
              </>
            )}
          </Button>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>✓ Oferta verificada</span>
            <span>•</span>
            <span>{offer.clicks_count} pessoas aproveitaram</span>
          </div>
        </CardContent>
      </Card>

      {/* Powered by */}
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <span className="text-xs text-muted-foreground">
          Powered by <span className="font-bold text-primary">clilin</span>
        </span>
      </div>
    </div>
  );
}