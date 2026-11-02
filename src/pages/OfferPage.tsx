import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import { supabase } from '@/integrations/supabase/client';
import { Offer, CONFIG } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, MessageCircle, Globe, FileText, MapPin, Store, Instagram, ChevronLeft, ChevronRight, ArrowLeft, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CouponModal from '@/components/offer/CouponModal';
import { Link } from 'react-router-dom';
import { BrandLogo } from '@/components/brand/BrandLogo';

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
  
  // Lead form states
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [showCouponModal, setShowCouponModal] = useState(false);

  const sessionStarted = useRef(false);

  useEffect(() => {
    const fetchOffer = async () => {
      if (!id) return;

      const { data: offerData, error } = await supabase
        .from('offers')
        .select('*')
        .eq('id', id)
        .single();

      let data: any = offerData;
      if (offerData?.company_id) {
        const { data: company } = await supabase
          .from('company_public_profiles')
          .select('name, instagram_url, avatar_url')
          .eq('id', offerData.company_id)
          .maybeSingle();
        data = { ...offerData, profiles: company };
      }

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

  // Format phone as user types
  const formatPhoneInput = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value);
    setLeadPhone(formatted);
    setFormError(null);
  };

  const validateForm = (): boolean => {
    // Validate name (at least 2 words)
    const nameParts = leadName.trim().split(/\s+/).filter(w => w.length >= 2);
    if (nameParts.length < 2) {
      setFormError('Por favor, informe seu nome completo');
      return false;
    }

    // Validate phone
    const phoneDigits = leadPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setFormError('Número de WhatsApp inválido');
      return false;
    }

    return true;
  };

  const handleSubmitLead = async () => {
    if (!buttonReady || !offer || processing) return;
    
    if (!validateForm()) return;

    setProcessing(true);
    setFormError(null);

    try {
      const timezoneOffset = new Date().getTimezoneOffset();

      const { data, error } = await supabase.functions.invoke('process-lead', {
        body: {
          offerId: offer.id,
          affiliateId,
          name: leadName.trim(),
          phoneWhatsapp: leadPhone.replace(/\D/g, ''),
          fingerprint: fingerprint ? hashFingerprint(fingerprint) : null,
          userAgent: navigator.userAgent,
          sessionToken,
          deviceId: getDeviceId(),
          timezoneOffset,
        },
      });

      if (error) throw error;

      if (data.error) {
        setFormError(data.error);
        setProcessing(false);
        return;
      }

      // Redirect to destination
      window.location.href = data.redirectUrl;
    } catch (err) {
      console.error('Error processing lead:', err);
      toast({
        title: 'Erro ao processar',
        description: 'Tente novamente em alguns segundos.',
        variant: 'destructive',
      });
      setProcessing(false);
    }
  };

  const handleInstagramClick = () => {
    if (!offer?.profiles?.instagram_url) return;
    
    // Open URL first (before async call) to avoid popup blocker on mobile
    window.open(offer.profiles.instagram_url, '_blank');
    
    // Record Instagram click (free, just for tracking) - fire and forget
    supabase.functions.invoke('process-click', {
      body: {
        offerId: offer.id,
        affiliateId,
        fingerprint: fingerprint ? hashFingerprint(fingerprint) : null,
        userAgent: navigator.userAgent,
        clickType: 'INSTAGRAM',
      },
    }).catch(err => console.error('Error tracking Instagram click:', err));
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
    if (days <= 3) return { color: 'text-warning', urgent: true };
    if (days <= 7) return { color: 'text-warning', urgent: false };
    return { color: 'text-muted-foreground', urgent: false };
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

  const brl = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const aproveitaram = Number((offer as any).leads_count || offer.clicks_count || 0);
  const voltar = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/ofertas');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>{`${offer.title} | Clilin`}</title>
        <meta
          name="description"
          content={
            (offer.description?.slice(0, 155) ||
              `Oferta em ${offer.city} por R$ ${offer.price_new.toFixed(2)} (de R$ ${offer.price_old.toFixed(2)}). Aproveite no Clilin.`)
          }
        />
        <link rel="canonical" href={`https://clilin.com/oferta/${offer.id}`} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={`${offer.title} | Clilin`} />
        <meta
          property="og:description"
          content={
            (offer.description?.slice(0, 200) ||
              `Oferta em ${offer.city} por R$ ${offer.price_new.toFixed(2)} (de R$ ${offer.price_old.toFixed(2)}).`)
          }
        />
        <meta property="og:url" content={`https://clilin.com/oferta/${offer.id}`} />
        {hasImages && <meta property="og:image" content={offerImages[0]} />}
        {hasImages && <meta name="twitter:image" content={offerImages[0]} />}
      </Helmet>
      {/* Topo */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={voltar} className="text-muted-foreground hover:text-foreground -ml-2">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
          <Link to="/" aria-label="Clilin">
            <BrandLogo className="h-7" />
          </Link>
        </div>
      </div>

      <main className="flex-1 px-4 py-6">
        <div className="max-w-md mx-auto rounded-3xl border border-border bg-card overflow-hidden shadow-lg animate-fade-in">
          {/* Foto (ou capa da marca quando a oferta não tem foto) */}
          <div className="relative aspect-[16/10] bg-muted">
            {hasImages ? (
              <>
                <img
                  src={offerImages[currentImageIndex]}
                  alt={`${offer.title} - Imagem ${currentImageIndex + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {offerImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      aria-label="Imagem anterior"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-foreground/50 hover:bg-foreground/70 text-primary-foreground rounded-full p-2 transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      aria-label="Próxima imagem"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground/50 hover:bg-foreground/70 text-primary-foreground rounded-full p-2 transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {offerImages.map((_: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          aria-label={`Ir para imagem ${index + 1}`}
                          className={`w-2 h-2 rounded-full transition-colors ${index === currentImageIndex ? 'bg-card' : 'bg-card/50'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 via-affiliate/10 to-highlight/15">
                <BrandLogo variant="mark" className="h-20 opacity-90" />
              </div>
            )}
            {discount > 0 && (
              <span className="absolute top-3 left-3 rounded-full bg-highlight text-highlight-foreground px-3 py-1 text-sm font-bold shadow-sm">
                -{discount}%
              </span>
            )}
            <span
              className={`absolute top-3 right-3 rounded-full bg-card/90 backdrop-blur-sm px-3 py-1 flex items-center gap-1 text-sm font-medium ${urgency.urgent ? 'text-destructive' : 'text-foreground'}`}
            >
              <Clock className="h-4 w-4" />
              {timeLeft}
            </span>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Loja */}
            <div className="flex items-center gap-2.5">
              {offer.profiles?.avatar_url ? (
                <img
                  src={offer.profiles.avatar_url}
                  alt={offer.profiles?.name || 'Loja'}
                  className="h-9 w-9 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Store className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-foreground leading-tight truncate">{offer.profiles?.name || 'Negócio local'}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {offer.city}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold text-foreground leading-tight">{offer.title}</h1>
              {offer.description && <p className="text-muted-foreground">{offer.description}</p>}
            </div>

            {/* Preço */}
            <div className="rounded-2xl bg-muted/60 p-4 flex items-end justify-between gap-3">
              <div>
                {offer.price_old > offer.price_new && (
                  <p className="text-sm text-muted-foreground line-through">De {brl(offer.price_old)}</p>
                )}
                <p className="font-display text-3xl font-bold text-primary">{brl(offer.price_new)}</p>
              </div>
              {offer.price_old > offer.price_new && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Você economiza</p>
                  <p className="font-bold text-affiliate">{brl(offer.price_old - offer.price_new)}</p>
                </div>
              )}
            </div>

            {offer.profiles?.instagram_url && (
              <Button variant="outline" className="w-full rounded-full" onClick={handleInstagramClick}>
                <Instagram className="mr-2 h-4 w-4" />
                Conheça no Instagram
              </Button>
            )}

            {/* Como funciona */}
            <div className="rounded-2xl border border-border p-4 text-sm">
              <p className="font-semibold text-foreground mb-2">Como funciona</p>
              <ol className="space-y-1.5 text-muted-foreground">
                {[
                  'Toque em "Quero meu cupom" e informe seu nome e WhatsApp.',
                  'O cupom chega no seu WhatsApp na hora. É grátis.',
                  'Na hora de usar, toque em "Estou na loja" ou "Pedir online". A loja confirma na hora.',
                ].map((t, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="h-5 w-5 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ol>
            </div>

            <Button
              type="button"
              onClick={() => setShowCouponModal(true)}
              disabled={timeLeft === 'Expirada'}
              className="w-full h-14 rounded-full text-base font-bold shadow-lg shadow-primary/25"
            >
              <Ticket className="mr-2 h-5 w-5" />
              {timeLeft === 'Expirada' ? 'Oferta encerrada' : 'Quero meu cupom'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Ao pegar o cupom, você concorda com os{' '}
              <Link to="/termos" className="text-primary hover:underline">Termos de Uso</Link> e a{' '}
              <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
            </p>

            {aproveitaram > 0 && (
              <p className="text-xs text-center text-muted-foreground">
                {aproveitaram} {aproveitaram === 1 ? 'pessoa já se interessou' : 'pessoas já se interessaram'} por esta oferta
              </p>
            )}
          </div>
        </div>
      </main>

      <footer className="py-6 flex justify-center">
        <Link to="/" aria-label="Clilin">
          <BrandLogo className="h-7 opacity-70" />
        </Link>
      </footer>

      {offer && (
        <CouponModal
          open={showCouponModal}
          onOpenChange={setShowCouponModal}
          offerId={offer.id}
          offerTitle={offer.title}
          affiliateId={affiliateId}
          companyName={offer.profiles?.name}
          storeWhatsapp={offer.link_type === 'WHATSAPP' ? offer.link_destination : null}
        />
      )}
    </div>
  );
}