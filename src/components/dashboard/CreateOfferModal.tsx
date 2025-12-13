import { useState, useRef, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useOffers } from '@/hooks/useOffers';
import { LinkType, Offer } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MessageCircle, Globe, Loader2, CalendarIcon, Star, ExternalLink, AlertTriangle, ImagePlus, X, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface CreateOfferModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  activeOffersCount?: number;
  maxOffers?: number;
  editOffer?: Offer | null;
}

const LINK_TYPES: { value: LinkType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'WHATSAPP', label: 'WhatsApp', icon: <MessageCircle className="h-4 w-4" />, color: 'bg-green-500' },
  { value: 'SITE', label: 'Site/Cardápio', icon: <Globe className="h-4 w-4" />, color: 'bg-blue-500' },
];

// Phone number formatting helpers
const formatPhoneNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{0,4})(\d{0,4})/, (_, p1, p2, p3) => {
      let result = '';
      if (p1) result += `(${p1}`;
      if (p2) result += `) ${p2}`;
      if (p3) result += `-${p3}`;
      return result;
    });
  }
  return numbers.replace(/(\d{2})(\d{0,5})(\d{0,4})/, (_, p1, p2, p3) => {
    let result = '';
    if (p1) result += `(${p1}`;
    if (p2) result += `) ${p2}`;
    if (p3) result += `-${p3}`;
    return result;
  });
};

const extractPhoneFromWaMe = (link: string): string => {
  const match = link.match(/wa\.me\/55(\d{10,11})/);
  return match ? formatPhoneNumber(match[1]) : '';
};

const isValidBrazilianPhone = (phone: string): boolean => {
  const numbers = phone.replace(/\D/g, '');
  return numbers.length >= 10 && numbers.length <= 11;
};

const getWhatsAppLink = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');
  return `https://wa.me/55${numbers}`;
};

const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 200;
const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

export default function CreateOfferModal({ 
  open, 
  onClose, 
  onSuccess, 
  activeOffersCount = 0,
  maxOffers = 3,
  editOffer = null
}: CreateOfferModalProps) {
  const { profile } = useAuth();
  const { createOffer, updateOffer } = useOffers();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!editOffer;
  const canCreate = activeOffersCount < maxOffers || isEditing;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_old: '',
    price_new: '',
    link_destination: '',
    link_type: 'WHATSAPP' as LinkType,
    expires_at: addDays(new Date(), 7),
  });
  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (editOffer && open) {
      // Convert MENU type to SITE for compatibility
      const linkType = editOffer.link_type === 'MENU' ? 'SITE' : editOffer.link_type;
      
      setFormData({
        title: editOffer.title,
        description: editOffer.description || '',
        price_old: editOffer.price_old.toString(),
        price_new: editOffer.price_new.toString(),
        link_destination: linkType === 'WHATSAPP' ? '' : editOffer.link_destination,
        link_type: linkType,
        expires_at: new Date(editOffer.expires_at),
      });
      
      // Extract phone number from wa.me link if WhatsApp
      if (editOffer.link_type === 'WHATSAPP') {
        setPhoneNumber(extractPhoneFromWaMe(editOffer.link_destination));
      } else {
        setPhoneNumber('');
      }
      
      setExistingImages((editOffer as any).images || []);
      setNewImages([]);
      setPreviewUrls([]);
    } else if (!editOffer && open) {
      // Reset form for new offer
      setFormData({
        title: '',
        description: '',
        price_old: '',
        price_new: '',
        link_destination: '',
        link_type: 'WHATSAPP',
        expires_at: addDays(new Date(), 7),
      });
      setPhoneNumber('');
      setExistingImages([]);
      setNewImages([]);
      setPreviewUrls([]);
    }
  }, [editOffer, open]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + newImages.length + files.length;
    
    if (totalImages > MAX_IMAGES) {
      alert(`Máximo de ${MAX_IMAGES} imagens permitidas`);
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > MAX_IMAGE_SIZE) {
        alert(`${file.name} excede 2MB`);
        return false;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert(`${file.name} não é um formato válido (JPG, PNG, WebP)`);
        return false;
      }
      return true;
    });

    setNewImages(prev => [...prev, ...validFiles]);
    
    // Create preview URLs
    validFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      setPreviewUrls(prev => [...prev, url]);
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || (!canCreate && !isEditing)) return;

    // Validate WhatsApp phone number
    if (formData.link_type === 'WHATSAPP' && !isValidBrazilianPhone(phoneNumber)) {
      alert('Por favor, insira um número de WhatsApp válido com DDD');
      return;
    }

    setLoading(true);

    // Get the final link destination
    const finalLinkDestination = formData.link_type === 'WHATSAPP' 
      ? getWhatsAppLink(phoneNumber) 
      : formData.link_destination;

    let result;
    if (isEditing && editOffer) {
      result = await updateOffer(editOffer.id, {
        title: formData.title,
        description: formData.description || undefined,
        price_old: parseFloat(formData.price_old),
        price_new: parseFloat(formData.price_new),
        link_destination: finalLinkDestination,
        link_type: formData.link_type,
        expires_at: formData.expires_at.toISOString(),
        newImages: newImages,
        existingImages: existingImages,
      });
    } else {
      result = await createOffer({
        title: formData.title,
        description: formData.description || undefined,
        price_old: parseFloat(formData.price_old),
        price_new: parseFloat(formData.price_new),
        link_destination: finalLinkDestination,
        link_type: formData.link_type,
        city: profile.city,
        expires_at: formData.expires_at.toISOString(),
        max_cpc_bid: 7,
        images: newImages,
      });
    }

    setLoading(false);

    if (result) {
      // Cleanup preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      onSuccess();
    }
  };

  const minDate = addDays(new Date(), 1);
  const maxDate = addDays(new Date(), 30);

  // Calculate discount percentage
  const discount = formData.price_old && formData.price_new
    ? Math.round((1 - parseFloat(formData.price_new) / parseFloat(formData.price_old)) * 100)
    : 0;

  // Show warning if limit reached and not editing
  if (!canCreate && !isEditing) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-500">
              <AlertTriangle className="h-5 w-5" />
              Limite Atingido
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center space-y-4">
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <p className="text-sm text-foreground font-medium mb-2">
                Você já possui {activeOffersCount} ofertas ativas!
              </p>
              <p className="text-xs text-muted-foreground">
                Cada empresa pode ter até {maxOffers} ofertas ativas por vez. 
                Delete uma oferta existente para criar uma nova.
              </p>
            </div>
            <Button onClick={onClose} variant="outline" className="w-full">
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const totalImages = existingImages.length + newImages.length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg sm:text-xl">
            {isEditing ? 'Editar Oferta' : 'Criar Nova Oferta'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Images Section */}
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">
              <ImagePlus className="h-4 w-4" />
              Imagens (opcional, até 3)
            </Label>
            <div className="flex flex-wrap gap-2">
              {/* Existing Images */}
              {existingImages.map((url, index) => (
                <div key={`existing-${index}`} className="relative group">
                  <img 
                    src={url} 
                    alt={`Imagem ${index + 1}`} 
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {/* New Images */}
              {previewUrls.map((url, index) => (
                <div key={`new-${index}`} className="relative group">
                  <img 
                    src={url} 
                    alt={`Nova imagem ${index + 1}`} 
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {/* Add Button */}
              {totalImages < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors"
                >
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Adicionar</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              JPG, PNG ou WebP • Máx 2MB cada • {totalImages}/{MAX_IMAGES} imagens
            </p>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-sm">
              Título do Anúncio *
            </Label>
            <Input
              id="title"
              placeholder="Ex: Combo Família - 2 Pizzas + Refri"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value.slice(0, MAX_TITLE_LENGTH) })}
              required
              className="text-sm"
            />
            <div className="flex justify-end">
              <span className={cn(
                "text-[10px]",
                formData.title.length > MAX_TITLE_LENGTH * 0.9 ? "text-orange-500" : "text-muted-foreground"
              )}>
                {formData.title.length}/{MAX_TITLE_LENGTH}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm">
              Descrição (opcional)
            </Label>
            <Textarea
              id="description"
              placeholder="Detalhes da oferta que ajudam a convencer o cliente..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value.slice(0, MAX_DESCRIPTION_LENGTH) })}
              rows={2}
              className="text-sm resize-none"
            />
            <div className="flex justify-end">
              <span className={cn(
                "text-[10px]",
                formData.description.length > MAX_DESCRIPTION_LENGTH * 0.9 ? "text-orange-500" : "text-muted-foreground"
              )}>
                {formData.description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
          </div>

          {/* Preview */}
          {formData.title && (
            <div className="border rounded-lg p-3 bg-muted/30">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-medium">
                Preview do Anúncio
              </p>
              <div className="flex gap-3">
                {(existingImages[0] || previewUrls[0]) && (
                  <img 
                    src={existingImages[0] || previewUrls[0]} 
                    alt="Preview" 
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{formData.title}</h4>
                  {formData.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {formData.description}
                    </p>
                  )}
                  {formData.price_old && formData.price_new && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground line-through">
                        R$ {parseFloat(formData.price_old).toFixed(2)}
                      </span>
                      <span className="text-sm font-bold text-secondary">
                        R$ {parseFloat(formData.price_new).toFixed(2)}
                      </span>
                      {discount > 0 && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          -{discount}%
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {profile?.city}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price_old" className="text-sm">Preço Original *</Label>
              <Input
                id="price_old"
                type="number"
                step="0.01"
                min="0"
                placeholder="120.00"
                value={formData.price_old}
                onChange={(e) => setFormData({ ...formData, price_old: e.target.value })}
                required
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price_new" className="text-sm">Preço Promocional *</Label>
              <Input
                id="price_new"
                type="number"
                step="0.01"
                min="0"
                placeholder="89.90"
                className="border-secondary bg-secondary/5 text-sm"
                value={formData.price_new}
                onChange={(e) => setFormData({ ...formData, price_new: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Discount Feedback */}
          {discount > 0 && (
            <div className={cn(
              "p-2 rounded-lg text-xs text-center font-medium",
              discount >= 30 ? "bg-green-500/10 text-green-600" :
              discount >= 20 ? "bg-yellow-500/10 text-yellow-600" :
              "bg-orange-500/10 text-orange-600"
            )}>
              {discount >= 30 ? '🔥 Desconto excelente! Sua oferta terá mais destaque.' :
               discount >= 20 ? '👍 Bom desconto! Continue assim.' :
               '💡 Dica: Descontos de 30%+ melhoram sua nota e reduzem o CPC.'}
            </div>
          )}

          {/* Link Type */}
          <div className="space-y-1.5">
            <Label className="text-sm">Destino do Clique *</Label>
            <div className="grid grid-cols-2 gap-2">
              {LINK_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, link_type: type.value })}
                  className={cn(
                    "p-2.5 rounded-lg border-2 transition-all flex flex-col items-center gap-1",
                    formData.link_type === type.value
                      ? `border-primary ${type.color} text-white`
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  {type.icon}
                  <span className="text-[10px] sm:text-xs font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Link Input - Conditional based on type */}
          {formData.link_type === 'WHATSAPP' ? (
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm">Número do WhatsApp *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(31) 99999-9999"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                maxLength={16}
                className="text-sm"
              />
              {isValidBrazilianPhone(phoneNumber) && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  Link: wa.me/55{phoneNumber.replace(/\D/g, '')}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="link" className="text-sm">Link do Site ou Cardápio *</Label>
              <Input
                id="link"
                type="url"
                placeholder="https://meusite.com.br"
                value={formData.link_destination}
                onChange={(e) => setFormData({ ...formData, link_destination: e.target.value })}
                required
                className="text-sm"
              />
            </div>
          )}

          {/* Expiration Date */}
          <div className="space-y-1.5">
            <Label className="text-sm">Data de Expiração *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-sm",
                    !formData.expires_at && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.expires_at ? (
                    format(formData.expires_at, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.expires_at}
                  onSelect={(date) => date && setFormData({ ...formData, expires_at: date })}
                  disabled={(date) => date < minDate || date > maxDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <p className="text-[10px] text-muted-foreground">
              Mínimo: amanhã • Máximo: 30 dias
            </p>
          </div>

          {/* CPL Info */}
          <div className="p-3 bg-company/5 border border-company/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-company" />
              <span className="font-medium text-xs">CPL Automático</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Seu custo por lead qualificado (R$ 1,00 - R$ 3,00) é calculado automaticamente com base na <strong>Nota da Oferta</strong>.
            </p>
            <p className="text-[9px] text-amber-600 dark:text-amber-400 mt-1 italic">
              Valores atuais, sujeitos a alteração conforme política da plataforma.
            </p>
            <Link 
              to="/transparencia" 
              target="_blank"
              className="flex items-center gap-1 text-[10px] text-primary hover:underline mt-1.5"
            >
              <ExternalLink className="h-3 w-3" />
              Entenda como funciona
            </Link>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-company hover:bg-company/90">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Salvando...' : 'Criando...'}
                </>
              ) : (
                isEditing ? 'Salvar Alterações' : 'Publicar Oferta'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
