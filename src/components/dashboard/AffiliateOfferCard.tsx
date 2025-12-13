import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, Check, Clock, Instagram, TrendingUp, DollarSign, Flame, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Generate a random 6-character code
const generateShortCode = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

interface Offer {
  id: string;
  title: string;
  description?: string;
  price_old: number;
  price_new: number;
  expires_at: string;
  views_count: number;
  clicks_count: number;
  images?: string[];
  current_offer_score?: number;
  ctr_score?: number;
  quality_score?: number;
  reputation_score?: number;
  profiles?: {
    name: string;
    instagram_url?: string;
  };
}

interface AffiliateOfferCardProps {
  offer: Offer;
  profileId: string;
  index: number;
}

export function AffiliateOfferCard({ offer, profileId, index }: AffiliateOfferCardProps) {
  const [copied, setCopied] = useState(false);
  const [shortLink, setShortLink] = useState<string | null>(null);
  const [isLoadingLink, setIsLoadingLink] = useState(true);

  const longLink = `${window.location.origin}/oferta/${offer.id}?ref=${profileId}`;

  // Pre-load short link on component mount
  useEffect(() => {
    const loadShortLink = async () => {
      try {
        // Check if short link already exists
        const { data: existingLink } = await supabase
          .from('short_links')
          .select('code')
          .eq('offer_id', offer.id)
          .eq('affiliate_id', profileId)
          .maybeSingle();

        if (existingLink?.code) {
          setShortLink(`${window.location.origin}/o/${existingLink.code}`);
          setIsLoadingLink(false);
          return;
        }

        // Create new short link in background
        let code = generateShortCode();
        let attempts = 0;
        while (attempts < 5) {
          const { error } = await supabase
            .from('short_links')
            .insert({
              code,
              offer_id: offer.id,
              affiliate_id: profileId
            });
          
          if (!error) {
            setShortLink(`${window.location.origin}/o/${code}`);
            break;
          }
          code = generateShortCode();
          attempts++;
        }
      } catch (err) {
        console.error('Error loading short link:', err);
      } finally {
        setIsLoadingLink(false);
      }
    };

    loadShortLink();
  }, [offer.id, profileId]);

  const discount = Math.round((1 - offer.price_new / offer.price_old) * 100);
  const offerScore = offer.current_offer_score || 5;
  // CPL calculation: R$ 1.00 to R$ 3.00 based on score
  const cplCents = Math.round((14 - offerScore) * 33.33);
  const affiliateEarning = (cplCents * 0.30) / 100; // Base 30% commission
  const leadRate = offer.views_count > 0 ? (((offer as any).leads_count || 0) / offer.views_count * 100).toFixed(1) : "0";
  const isHot = parseFloat(leadRate) > 2;

  const getExpirationInfo = () => {
    const now = new Date();
    const expires = new Date(offer.expires_at);
    const diffMs = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return { text: "Expirada", urgent: true };
    if (diffDays === 1) return { text: "Último dia!", urgent: true };
    if (diffDays <= 3) return { text: `${diffDays} dias`, urgent: true };
    return { text: `${diffDays} dias`, urgent: false };
  };

  const expInfo = getExpirationInfo();

  // Helper function to copy text with iOS/mobile fallback
  const copyToClipboard = (text: string): boolean => {
    // Try modern clipboard API first (works on desktop)
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    
    // Always use fallback method for reliability on mobile
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    } catch (err) {
      textArea.remove();
      return false;
    }
  };

  // SYNCHRONOUS copy - no await before clipboard access (iOS compatible)
  const copyLink = () => {
    const linkToCopy = shortLink || longLink;
    
    const success = copyToClipboard(linkToCopy);
    
    if (success) {
      setCopied(true);
      toast.success(shortLink ? "Link curto copiado!" : "Link copiado!", {
        description: linkToCopy
      });
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Não foi possível copiar", {
        description: linkToCopy,
        action: {
          label: "Copiar",
          onClick: () => copyToClipboard(linkToCopy)
        }
      });
    }
  };

  const openInstagram = () => {
    if (offer.profiles?.instagram_url) {
      let url = offer.profiles.instagram_url;
      if (!url.startsWith('http')) {
        url = url.startsWith('@') 
          ? `https://instagram.com/${url.substring(1)}`
          : `https://instagram.com/${url}`;
      }
      window.open(url, '_blank');
    }
  };

  const imageUrl = offer.images && offer.images.length > 0 
    ? offer.images[0] 
    : null;

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50 h-full flex flex-col">
      {/* Image Header */}
      <div className="relative aspect-[16/9] bg-muted overflow-hidden flex-shrink-0">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={offer.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
            <span className="text-4xl">🏷️</span>
          </div>
        )}
        
        {/* Overlay Badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Top Left - Ranking */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {index < 3 && (
            <Badge 
              className={`text-xs font-bold shadow-lg ${
                index === 0 ? 'bg-yellow-500 text-yellow-950' : 
                index === 1 ? 'bg-gray-300 text-gray-800' : 
                'bg-amber-600 text-white'
              }`}
            >
              #{index + 1} Top
            </Badge>
          )}
          {isHot && (
            <Badge className="bg-orange-500 text-white text-xs font-bold shadow-lg">
              <Flame className="h-3 w-3 mr-1" />
              Hot
            </Badge>
          )}
        </div>

        {/* Top Right - Discount */}
        <Badge 
          className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-sm font-bold px-2 py-1 shadow-lg"
        >
          -{discount}%
        </Badge>

        {/* Bottom - Title & Company */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-bold text-white text-base sm:text-lg line-clamp-2 drop-shadow-lg min-h-[2.5rem]">
            {offer.title}
          </h3>
          <p className="text-white/80 text-sm truncate mt-0.5">
            {offer.profiles?.name}
          </p>
        </div>
      </div>

      <CardContent className="p-3 sm:p-4 flex flex-col flex-1">
        {/* Price Row - Fixed height */}
        <div className="flex items-center justify-between min-h-[2.5rem]">
          <div className="flex items-baseline gap-2">
            <span className="text-muted-foreground line-through text-xs sm:text-sm">
              R$ {offer.price_old.toFixed(2)}
            </span>
            <span className="text-secondary font-bold text-lg sm:text-xl whitespace-nowrap leading-tight">
              R$ {offer.price_new.toFixed(2)}
            </span>
          </div>
          <Badge 
            variant="outline" 
            className={`flex items-center gap-1 text-xs shrink-0 ${expInfo.urgent ? 'border-destructive text-destructive' : 'border-muted-foreground/50'}`}
          >
            <Clock className="h-3 w-3" />
            {expInfo.text}
          </Badge>
        </div>

        {/* Commission Highlight */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between bg-affiliate/15 rounded-lg p-3 cursor-help border border-affiliate/30 mt-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-affiliate/20 flex items-center justify-center shrink-0">
                    <DollarSign className="h-4 w-4 text-affiliate" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Seu ganho por lead</p>
                    <p className="font-bold text-affiliate text-sm sm:text-base leading-tight">
                      R$ {affiliateEarning.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    Taxa: {leadRate}%
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[240px]">
              <p className="font-bold mb-2">Como seu ganho é calculado</p>
              <div className="space-y-1 text-xs">
                <p>📊 Nota da oferta: <strong>{offerScore.toFixed(1)}</strong></p>
                <p>💰 CPL total: R$ {(cplCents / 100).toFixed(2)}</p>
                <p>✨ Sua parte (30% base): <strong className="text-affiliate">R$ {affiliateEarning.toFixed(2)}</strong></p>
              </div>
              <p className="text-[10px] mt-2 text-muted-foreground border-t border-border pt-2">
                💡 Seu bônus de nível pode aumentar esse valor em até 50%!
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1 min-h-3" />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={copyLink}
            disabled={isLoadingLink}
            className="flex-1 bg-foreground hover:bg-foreground/90 h-11 font-semibold"
          >
            {isLoadingLink ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copiar Link
              </>
            )}
          </Button>
          
          {offer.profiles?.instagram_url && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 border-pink-500/50 text-pink-500 hover:bg-pink-500 hover:text-white shrink-0"
                    onClick={openInstagram}
                  >
                    <Instagram className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ver Instagram da empresa</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
