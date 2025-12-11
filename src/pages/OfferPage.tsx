import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Offer, CONFIG } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, MessageCircle, Globe, FileText, MapPin, Sparkles, Instagram, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

// Generate persistent device ID
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('clilin_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('clilin_device_id', deviceId);
  }
  return deviceId;
};

// Generate advanced fingerprint for anti-fraud
const generateAdvancedFingerprint = async (): Promise<object> => {
  const fingerprint: Record<string, any> = {
    deviceId: getDeviceId(),
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages?.join(','),
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    plugins: navigator.plugins?.length || 0,
  };

  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('clilin-fp-2024', 2, 2);
      fingerprint.canvasHash = canvas.toDataURL().slice(-50);
    }
  } catch (e) {
    fingerprint.canvasHash = 'error';
  }

  // WebGL fingerprint
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        fingerprint.webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        fingerprint.webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch (e) {
    fingerprint.webglVendor = 'error';
  }

  // Audio fingerprint
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    fingerprint.audioSampleRate = audioCtx.sampleRate;
    audioCtx.close();
  } catch (e) {
    fingerprint.audioSampleRate = 'error';
  }

  return fingerprint;
};

// Generate simple hash from fingerprint
const hashFingerprint = (fp: object): string => {
  const str = JSON.stringify(fp);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

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
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<object | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const sessionStarted = useRef(false);

  useEffect(() => {
    const fetchOffer = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          profiles!offers_company_id_fkey(name, instagram_url)
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

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        toast({
          title: 'Oferta expirada',
          description: 'Esta oferta já expirou.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setOffer(data as Offer);
      setLoading(false);

      // Increment view using SECURITY DEFINER function
      await supabase.rpc('increment_offer_views', { offer_id: id });

      // Generate advanced fingerprint
      const fp = await generateAdvancedFingerprint();
      setFingerprint(fp);

      // Start session for server-side time validation
      if (!sessionStarted.current) {
        sessionStarted.current = true;
        try {
          const { data: sessionData, error: sessionError } = await supabase.functions.invoke('start-session', {
            body: {
              offerId: id,
              deviceId: getDeviceId(),
              fingerprintHash: hashFingerprint(fp),
            },
          });

          if (!sessionError && sessionData?.sessionToken) {
            setSessionToken(sessionData.sessionToken);
            console.log('Session started:', sessionData.sessionToken.substring(0, 8));
          }
        } catch (err) {
          console.error('Error starting session:', err);
        }
      }

      // Anti-fraud delay (now also validated server-side)
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
          fingerprint: fingerprint ? hashFingerprint(fingerprint) : null,
          userAgent: navigator.userAgent,
          clickType: 'MAIN',
          sessionToken,
          deviceId: getDeviceId(),
          advancedFingerprint: fingerprint,
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

  const handleInstagramClick = async () => {
    if (!offer?.profiles?.instagram_url) return;
    
    // Record Instagram click (free, just for tracking)
    try {
      await supabase.functions.invoke('process-click', {
        body: {
          offerId: offer.id,
          affiliateId,
          fingerprint: fingerprint ? hashFingerprint(fingerprint) : null,
          userAgent: navigator.userAgent,
          clickType: 'INSTAGRAM',
        },
      });
    } catch (err) {
      console.error('Error tracking Instagram click:', err);
    }
    
    window.open(offer.profiles.instagram_url, '_blank');
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

  const getExpirationUrgency = () => {
    if (!offer) return { color: '', urgent: false };
    const now = new Date();
    const expires = new Date(offer.expires_at);
    const diff = expires.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < 1) return { color: 'text-destructive animate-pulse', urgent: true };
    if (days <= 3) return { color: 'text-orange-500', urgent: true };
    if (days <= 7) return { color: 'text-yellow-500', urgent: false };
    return { color: 'text-secondary-foreground/80', urgent: false };
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
  const urgency = getExpirationUrgency();
  const offerImages = (offer as any).images || [];
  const hasImages = offerImages.length > 0;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % offerImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + offerImages.length) % offerImages.length);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 overflow-hidden animate-fade-in">
        {/* Image Gallery */}
        {hasImages && (
          <div className="relative aspect-video bg-muted">
            <img
              src={offerImages[currentImageIndex]}
              alt={`${offer.title} - Imagem ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
            />
            {offerImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {offerImages.map((_: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
            {/* Discount Badge on Image */}
            <Badge variant="destructive" className="absolute top-3 left-3 text-sm font-bold px-3 py-1">
              -{discount}% OFF
            </Badge>
            {/* Timer on Image */}
            <div className={`absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1 text-sm text-white ${urgency.urgent ? 'animate-pulse' : ''}`}>
              <Clock className="h-4 w-4" />
              {timeLeft}
            </div>
          </div>
        )}

        {/* Header without image */}
        {!hasImages && (
          <div className="bg-gradient-to-r from-secondary to-secondary/80 p-4 text-secondary-foreground">
            <div className="flex justify-between items-start">
              <Badge variant="destructive" className="text-sm font-bold px-3 py-1">
                -{discount}% OFF
              </Badge>
              <div className={`flex items-center gap-1 text-sm ${urgency.color}`}>
                <Clock className="h-4 w-4" />
                {timeLeft}
              </div>
            </div>
          </div>
        )}

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

          {/* Instagram Button */}
          {offer.profiles?.instagram_url && (
            <Button
              variant="outline"
              className="w-full text-pink-500 border-pink-500/30 hover:bg-pink-500/10"
              onClick={handleInstagramClick}
            >
              <Instagram className="mr-2 h-5 w-5" />
              Conheça no Instagram
            </Button>
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
      </div>

      <div className="py-6 flex justify-center">
        <img src={logo} alt="clilin" className="h-8 opacity-60" />
      </div>
    </div>
  );
}