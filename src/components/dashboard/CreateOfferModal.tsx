import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useOffers } from '@/hooks/useOffers';
import { LinkType } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MessageCircle, FileText, Globe, Loader2, CalendarIcon, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateOfferModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const LINK_TYPES: { value: LinkType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'WHATSAPP', label: 'WhatsApp', icon: <MessageCircle className="h-4 w-4" />, color: 'bg-green-500' },
  { value: 'MENU', label: 'Cardápio', icon: <FileText className="h-4 w-4" />, color: 'bg-red-500' },
  { value: 'SITE', label: 'Site', icon: <Globe className="h-4 w-4" />, color: 'bg-blue-500' },
];

export default function CreateOfferModal({ open, onClose, onSuccess }: CreateOfferModalProps) {
  const { profile } = useAuth();
  const { createOffer } = useOffers();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_old: '',
    price_new: '',
    link_destination: '',
    link_type: 'WHATSAPP' as LinkType,
    expires_at: addDays(new Date(), 7),
    max_cpc_bid: 5,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);

    const result = await createOffer({
      title: formData.title,
      description: formData.description || undefined,
      price_old: parseFloat(formData.price_old),
      price_new: parseFloat(formData.price_new),
      link_destination: formData.link_destination,
      link_type: formData.link_type,
      city: profile.city,
      expires_at: formData.expires_at.toISOString(),
      max_cpc_bid: formData.max_cpc_bid,
    });

    setLoading(false);

    if (result) {
      setFormData({
        title: '',
        description: '',
        price_old: '',
        price_new: '',
        link_destination: '',
        link_type: 'WHATSAPP',
        expires_at: addDays(new Date(), 7),
        max_cpc_bid: 5,
      });
      onSuccess();
    }
  };

  const minDate = addDays(new Date(), 1);
  const maxDate = addDays(new Date(), 30);

  // Estimate CPC based on bid (simplified estimation)
  const getEstimatedCpc = () => {
    const minCpc = 4;
    const estimatedLow = Math.max(minCpc, formData.max_cpc_bid - 2);
    const estimatedHigh = formData.max_cpc_bid;
    return { low: estimatedLow, high: estimatedHigh };
  };

  const estimatedCpc = getEstimatedCpc();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Oferta</DialogTitle>
          <DialogDescription>
            Crie uma oferta para divulgar seu negócio. Você paga apenas por clique.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Oferta *</Label>
            <Input
              id="title"
              placeholder="Ex: Combo Família - 2 Pizzas + Refri"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Detalhes da oferta..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="price_old">Preço Original *</Label>
              <Input
                id="price_old"
                type="number"
                step="0.01"
                placeholder="120.00"
                value={formData.price_old}
                onChange={(e) => setFormData({ ...formData, price_old: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_new">Preço Promocional *</Label>
              <Input
                id="price_new"
                type="number"
                step="0.01"
                placeholder="89.90"
                className="border-secondary bg-secondary/5"
                value={formData.price_new}
                onChange={(e) => setFormData({ ...formData, price_new: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Dynamic CPC Bid Section */}
          <div className="space-y-3 p-4 bg-company/5 border border-company/20 rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-company" />
                Lance Máximo por Clique
              </Label>
              <span className="font-bold text-company">{formData.max_cpc_bid} C$</span>
            </div>
            
            <Slider
              value={[formData.max_cpc_bid]}
              onValueChange={(value) => setFormData({ ...formData, max_cpc_bid: value[0] })}
              min={4}
              max={15}
              step={1}
              className="w-full"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>4 C$ (mín)</span>
              <span>15 C$ (máx)</span>
            </div>

            <div className="bg-background rounded p-2 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>CPC estimado: </span>
                <span className="font-bold text-foreground">
                  {estimatedCpc.low}-{estimatedCpc.high} C$
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Quanto melhor sua oferta, menos você paga!
              </p>
            </div>
          </div>

          {/* Expiration Date Picker */}
          <div className="space-y-2">
            <Label>Data de Expiração *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
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
            <p className="text-xs text-muted-foreground">
              Mínimo: amanhã • Máximo: 30 dias
            </p>
          </div>

          <div className="space-y-2">
            <Label>Destino do Clique *</Label>
            <div className="grid grid-cols-3 gap-2">
              {LINK_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, link_type: type.value })}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                    formData.link_type === type.value
                      ? `border-primary ${type.color} text-white`
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {type.icon}
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Link *</Label>
            <Input
              id="link"
              type="url"
              placeholder={
                formData.link_type === 'WHATSAPP'
                  ? 'https://wa.me/5531999999999'
                  : 'https://seu-site.com'
              }
              value={formData.link_destination}
              onChange={(e) => setFormData({ ...formData, link_destination: e.target.value })}
              required
            />
          </div>

          <div className="bg-muted rounded-lg p-3 text-sm">
            <p className="font-medium">💡 Sistema de Leilão Inteligente</p>
            <p className="text-muted-foreground text-xs mt-1">
              Ofertas com melhor desempenho pagam menos por clique. Seu CPC real depende do seu Offer Score!
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Publicar Oferta'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}