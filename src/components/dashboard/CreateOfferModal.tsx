import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOffers } from '@/hooks/useOffers';
import { LinkType } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MessageCircle, FileText, Globe, Loader2 } from 'lucide-react';

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
      });
      onSuccess();
    }
  };

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
            <p className="font-medium">💡 Custo por clique: 5 créditos</p>
            <p className="text-muted-foreground text-xs mt-1">
              Você só paga quando alguém clica para acessar sua oferta.
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