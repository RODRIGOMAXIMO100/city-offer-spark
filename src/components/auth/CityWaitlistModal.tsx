import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Bell, Loader2, Heart } from 'lucide-react';

interface CityWaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cityId: string;
  cityName: string;
  stateName: string;
  role: string;
}

export default function CityWaitlistModal({ 
  open, 
  onOpenChange, 
  cityId, 
  cityName, 
  stateName,
  role 
}: CityWaitlistModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || phone.replace(/\D/g, '').length < 10) {
      toast({
        title: "Preencha os campos obrigatórios",
        description: "Nome, email e WhatsApp com DDD.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('city_waitlist')
        .insert({
          city_id: cityId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.replace(/\D/g, '') || null,
          role
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Seu pré-cadastro já estava feito",
            description: "Vamos te chamar no WhatsApp assim que abrirmos aí."
          });
          setSuccess(true);
          return;
        }
        throw error;
      }

      setSuccess(true);
      toast({
        title: "Pré-cadastro feito",
        description: `Vamos te chamar no WhatsApp quando o Clilin abrir em ${cityName}.`
      });
    } catch (error) {
      console.error('Error joining waitlist:', error);
      toast({
        title: "Não deu para fazer o pré-cadastro",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setName('');
    setEmail('');
    setPhone('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {success ? (
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Pré-cadastro feito!</h3>
            <p className="text-muted-foreground mb-4">
              Você está no pré-cadastro de <strong>{cityName} - {stateName}</strong>. Quando o Clilin abrir na sua
              cidade, a gente te chama no WhatsApp para terminar o cadastro.
            </p>
            <Button onClick={handleClose}>Fechar</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary">
                <MapPin className="h-5 w-5" />
                <span className="font-medium">{cityName} - {stateName}</span>
              </div>
              <DialogTitle className="text-xl">
                Estamos começando por Belo Horizonte
              </DialogTitle>
              <DialogDescription>
                {role === 'COMPANY'
                  ? 'Faça o pré-cadastro do seu negócio. Quando o Clilin abrir na sua cidade, você é dos primeiros a publicar ofertas.'
                  : role === 'AFFILIATE'
                    ? 'Faça seu pré-cadastro de divulgador. Quando o Clilin abrir na sua cidade, você é dos primeiros a divulgar e ganhar.'
                    : 'Faça seu pré-cadastro. Quando o Clilin abrir na sua cidade, você fica sabendo primeiro.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">{role === 'COMPANY' ? 'Seu nome e o nome do negócio *' : 'Seu nome *'}</Label>
                <Input
                  id="name"
                  placeholder={role === 'COMPANY' ? 'Ex.: Ana, Pizzaria do Bairro' : 'Como podemos te chamar?'}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Seu email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp *</Label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  maxLength={15}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Fazer pré-cadastro
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Sem spam: só te chamamos quando abrirmos na sua cidade.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
