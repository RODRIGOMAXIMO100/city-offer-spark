import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Ticket, Check } from 'lucide-react';

interface CouponModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerId: string;
  offerTitle: string;
}

const formatPhoneInput = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

export default function CouponModal({ open, onOpenChange, offerId, offerTitle }: CouponModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName(''); setPhone(''); setCode(null); setExpiresAt(null); setError(null); setCopied(false);
  };

  const handleSubmit = async () => {
    setError(null);
    const nameParts = name.trim().split(/\s+/).filter(w => w.length >= 2);
    if (nameParts.length < 2) return setError('Informe seu nome completo');
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 11) return setError('WhatsApp inválido');

    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('issue-coupon', {
        body: {
          offer_id: offerId,
          customer_name: name.trim(),
          customer_phone: digits,
        },
      });
      if (fnError) throw fnError;
      if (data?.error) { setError(data.error); return; }
      setCode(data.code);
      setExpiresAt(data.expires_at);
      // Persist for later retrieval
      try {
        const store = JSON.parse(localStorage.getItem('clilin_coupons') || '{}');
        store[offerId] = { code: data.code, expires_at: data.expires_at };
        localStorage.setItem('clilin_coupons', JSON.stringify(store));
      } catch {}
    } catch (e: any) {
      setError(e?.message || 'Erro ao gerar cupom');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: 'Código copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-secondary" />
            Pegar cupom
          </DialogTitle>
          <DialogDescription className="line-clamp-2">{offerTitle}</DialogDescription>
        </DialogHeader>

        {!code ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coupon-name">Nome completo</Label>
              <Input id="coupon-name" placeholder="Ex: Maria Silva" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon-phone">WhatsApp</Label>
              <Input
                id="coupon-phone"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                maxLength={16}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando…</> : 'Gerar cupom'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Mostre o código no estabelecimento na hora do atendimento.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-secondary/10 border-2 border-dashed border-secondary rounded-xl p-6 text-center">
              <p className="text-xs uppercase text-muted-foreground mb-2">Seu código</p>
              <p className="text-4xl font-black tracking-widest text-secondary select-all">{code}</p>
              {expiresAt && (
                <p className="text-xs text-muted-foreground mt-3">
                  Válido até {new Date(expiresAt).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
            <Button onClick={handleCopy} variant="outline" className="w-full">
              {copied ? <><Check className="mr-2 h-4 w-4" />Copiado!</> : <><Copy className="mr-2 h-4 w-4" />Copiar código</>}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Apresente este código no estabelecimento para resgatar o desconto.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
