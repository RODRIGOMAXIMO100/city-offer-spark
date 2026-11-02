import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Ticket, Check, MessageCircle, Store } from 'lucide-react';

interface CouponModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerId: string;
  offerTitle: string;
  /** Divulgador que trouxe o cliente (?ref= do link) */
  affiliateId?: string | null;
  companyName?: string | null;
  /** WhatsApp da loja (quando a oferta usa WhatsApp) */
  storeWhatsapp?: string | null;
}

// "31999998888", "+55 (31) 99999-8888" ou link wa.me -> "5531999998888"
const toWaNumber = (raw?: string | null): string | null => {
  if (!raw) return null;
  const fromLink = raw.match(/wa\.me\/(\d+)/)?.[1] ?? raw.match(/phone=(\d+)/)?.[1];
  const digits = (fromLink ?? raw).replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits.startsWith('55') && digits.length >= 12 ? digits : `55${digits}`;
};

const formatPhoneInput = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

export default function CouponModal({ open, onOpenChange, offerId, offerTitle, affiliateId, companyName, storeWhatsapp }: CouponModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sentToWhatsapp, setSentToWhatsapp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storeWa = toWaNumber(storeWhatsapp);

  const reset = () => {
    setName(''); setPhone(''); setCode(null); setExpiresAt(null); setError(null); setCopied(false); setSentToWhatsapp(false);
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
          affiliate_id: affiliateId || null,
        },
      });
      if (fnError) {
        // Erros da função (limite diário, oferta pausada...) chegam no corpo da resposta
        let msg = 'Não deu para gerar o cupom. Tente de novo.';
        try {
          const ctx = (fnError as { context?: Response }).context;
          const body = ctx ? await ctx.json() : null;
          if (body?.error) msg = body.error;
        } catch { /* mantém a mensagem padrão */ }
        setError(msg);
        return;
      }
      if (data?.error) { setError(data.error); return; }
      setCode(data.code);
      setExpiresAt(data.expires_at);
      setSentToWhatsapp(!!data.whatsapp_sent);
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
            Pegar meu cupom
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
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando…</> : 'Quero meu cupom'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              O cupom chega no seu WhatsApp. Grátis, sem cadastro.
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
              {sentToWhatsapp ? 'Também mandamos o cupom no seu WhatsApp.' : 'Guarde este código: tire um print ou copie.'}
            </p>
            <div className="rounded-xl bg-muted/50 p-3 space-y-2 text-sm">
              <p className="font-semibold">Como usar</p>
              <p className="flex items-start gap-2">
                <Store className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <span>Vá até {companyName || 'a loja'} e mostre o código na hora de pagar.</span>
              </p>
              {storeWa && (
                <p className="flex items-start gap-2">
                  <MessageCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>Ou mande o código para a loja no WhatsApp para pedir.</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground">A loja confirma o cupom no Clilin. Cada cupom vale uma vez.</p>
            </div>
            {storeWa && (
              <Button asChild className="w-full">
                <a
                  href={`https://wa.me/${storeWa}?text=${encodeURIComponent(`Oi! Quero usar o cupom ${code} do Clilin: ${offerTitle}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" /> Mandar o código para a loja
                </a>
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
