import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CreditCard, QrCode, Copy, Check, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CONFIG } from '@/types/database';

interface AddCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  userCpfCnpj?: string;
  userName?: string;
  userEmail?: string;
}

type Step = 'amount' | 'method' | 'pix' | 'card' | 'success';
type PaymentMethod = 'PIX' | 'CREDIT_CARD';
type CardBrand = 'visa' | 'mastercard' | 'elo' | 'hipercard' | 'amex' | null;

const PRESET_AMOUNTS = [100, 200, 500, 1000];

// Detecta a bandeira do cartão baseado nos primeiros dígitos
const detectCardBrand = (cardNumber: string): CardBrand => {
  const num = cardNumber.replace(/\s/g, '');
  if (!num) return null;
  
  // Amex: começa com 34 ou 37
  if (/^3[47]/.test(num)) return 'amex';
  
  // Hipercard: começa com 606282 ou 3841
  if (/^(606282|3841)/.test(num)) return 'hipercard';
  
  // Elo: vários ranges
  if (/^(636368|438935|504175|451416|636297|5067|4576|4011|506699|509[0-9]{3})/.test(num)) return 'elo';
  
  // Mastercard: começa com 5 ou ranges 2221-2720
  if (/^5[1-5]/.test(num) || /^(222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(num)) return 'mastercard';
  
  // Visa: começa com 4
  if (/^4/.test(num)) return 'visa';
  
  return null;
};

// Componentes de ícones das bandeiras - SVGs realistas baseados nas logos oficiais
const CardBrandIcon = ({ brand, active = false, size = 'md' }: { brand: CardBrand; active?: boolean; size?: 'sm' | 'md' }) => {
  const sizeClasses = size === 'sm' ? 'w-8 h-5' : 'w-10 h-6';
  const opacityClass = active ? 'opacity-100' : 'opacity-50';
  
  const brands: Record<string, JSX.Element> = {
    visa: (
      <svg viewBox="0 0 750 471" className={`${sizeClasses} ${opacityClass} transition-opacity`}>
        <rect fill="#1A1F71" width="750" height="471" rx="40"/>
        <path fill="#FFFFFF" d="M278.2 334.2l33.4-195.8h53.4l-33.4 195.8H278.2zM524.3 142.3c-10.5-4-27-8.4-47.5-8.4c-52.4 0-89.3 26.3-89.6 64c-.3 27.9 26.4 43.4 46.5 52.7c20.7 9.5 27.6 15.6 27.5 24.1c-.1 13-16.5 18.9-31.8 18.9c-21.3 0-32.6-2.9-50-10.2l-6.9-3.1l-7.5 43.7c12.4 5.4 35.4 10.1 59.2 10.4c55.7 0 91.9-26 92.3-66.2c.2-22.1-14-38.9-44.6-52.7c-18.6-9-30-15-29.9-24.1c0-8.1 9.6-16.7 30.4-16.7c17.4-.3 30 3.5 39.8 7.4l4.8 2.2l7.3-42z"/>
        <path fill="#FFFFFF" d="M661.6 138.4h-41c-12.7 0-22.2 3.5-27.8 16.1l-78.7 177.7h55.7s9.1-23.9 11.2-29.1c6.1 0 60.3.1 68 .1c1.6 6.8 6.5 29 6.5 29h49.2l-43.1-193.8zM596.6 268.7c4.4-11.2 21.2-54.3 21.2-54.3c-.3.5 4.4-11.2 7-18.5l3.6 16.7s10.2 46.3 12.3 56.1h-44.1z"/>
        <path fill="#FFFFFF" d="M232.8 138.4l-51.9 133.6l-5.5-26.9c-9.6-30.8-39.6-64.1-73.1-80.8l47.4 169.7h56.1l83.4-195.6h-56.4z"/>
        <path fill="#F9A533" d="M131.9 138.4H46.6l-.6 3.5c66.5 16.1 110.6 54.9 128.9 101.6l-18.6-89.3c-3.2-12.2-12.5-15.5-24.4-15.8z"/>
      </svg>
    ),
    mastercard: (
      <svg viewBox="0 0 750 471" className={`${sizeClasses} ${opacityClass} transition-opacity`}>
        <rect fill="#000000" width="750" height="471" rx="40"/>
        <circle fill="#EB001B" cx="282" cy="235.5" r="117"/>
        <circle fill="#F79E1B" cx="468" cy="235.5" r="117"/>
        <path fill="#FF5F00" d="M375 141.5c-32.5 26-53.4 65.4-53.4 109.5c0 44.1 20.9 83.5 53.4 109.5c32.5-26 53.4-65.4 53.4-109.5c0-44.1-20.9-83.5-53.4-109.5z"/>
      </svg>
    ),
    elo: (
      <svg viewBox="0 0 750 471" className={`${sizeClasses} ${opacityClass} transition-opacity`}>
        <rect fill="#000000" width="750" height="471" rx="40"/>
        <ellipse fill="#FFCB05" cx="250" cy="235" rx="90" ry="90"/>
        <ellipse fill="#00A4E0" cx="375" cy="235" rx="90" ry="90"/>
        <ellipse fill="#EF4123" cx="500" cy="235" rx="90" ry="90"/>
        <text x="375" y="260" textAnchor="middle" fill="#FFFFFF" fontSize="100" fontWeight="bold" fontFamily="Arial">elo</text>
      </svg>
    ),
    hipercard: (
      <svg viewBox="0 0 750 471" className={`${sizeClasses} ${opacityClass} transition-opacity`}>
        <rect fill="#822124" width="750" height="471" rx="40"/>
        <text x="375" y="280" textAnchor="middle" fill="#FFFFFF" fontSize="140" fontWeight="bold" fontFamily="Arial, sans-serif">HIPERCARD</text>
      </svg>
    ),
    amex: (
      <svg viewBox="0 0 750 471" className={`${sizeClasses} ${opacityClass} transition-opacity`}>
        <rect fill="#006FCF" width="750" height="471" rx="40"/>
        <text x="375" y="220" textAnchor="middle" fill="#FFFFFF" fontSize="80" fontWeight="bold" fontFamily="Arial, sans-serif">AMERICAN</text>
        <text x="375" y="300" textAnchor="middle" fill="#FFFFFF" fontSize="80" fontWeight="bold" fontFamily="Arial, sans-serif">EXPRESS</text>
      </svg>
    ),
  };

  if (!brand) return null;
  return brands[brand] || null;
};

const AllCardBrands = ({ activeBrand, size = 'sm' }: { activeBrand?: CardBrand; size?: 'sm' | 'md' }) => (
  <div className="flex items-center gap-1">
    {(['visa', 'mastercard', 'elo', 'hipercard', 'amex'] as const).map((brand) => (
      <CardBrandIcon 
        key={brand} 
        brand={brand} 
        active={!activeBrand || activeBrand === brand}
        size={size}
      />
    ))}
  </div>
);

export function AddCreditsModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  userCpfCnpj,
  userName,
  userEmail 
}: AddCreditsModalProps) {
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // PIX data
  const [pixQrCode, setPixQrCode] = useState<string>('');
  const [pixCode, setPixCode] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  
  // Card data
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [installments, setInstallments] = useState(1);
  
  // Customer data (if not provided)
  const [cpfCnpj, setCpfCnpj] = useState(userCpfCnpj || '');

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('amount');
        setAmount(100);
        setCustomAmount('');
        setPaymentMethod(null);
        setPixQrCode('');
        setPixCode('');
        setPaymentId('');
        setCardNumber('');
        setCardHolder('');
        setCardExpiry('');
        setCardCvv('');
        setInstallments(1);
      }, 300);
    }
  }, [open]);

  // amount em reais, convertemos para centavos
  const amountCents = Math.floor(amount * 100);

  const handleAmountSelect = (value: number) => {
    setAmount(value);
    setCustomAmount('');
  };

  const handleCustomAmount = (value: string) => {
    const num = parseFloat(value.replace(',', '.'));
    setCustomAmount(value);
    if (!isNaN(num) && num >= CONFIG.MIN_DEPOSIT_BRL) {
      setAmount(num);
    }
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setStep(method === 'PIX' ? 'pix' : 'card');
  };

  const createPayment = async () => {
    if (!cpfCnpj && !userCpfCnpj) {
      toast.error('CPF ou CNPJ é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-asaas-payment', {
        body: {
          amount_brl: amount,
          payment_method: paymentMethod,
          customer_name: userName,
          customer_email: userEmail,
          customer_cpf_cnpj: cpfCnpj || userCpfCnpj,
          // Card data (if applicable)
          ...(paymentMethod === 'CREDIT_CARD' && {
            card_number: cardNumber,
            card_holder_name: cardHolder,
            card_expiry_month: cardExpiry.split('/')[0],
            card_expiry_year: '20' + cardExpiry.split('/')[1],
            card_cvv: cardCvv,
            installments,
          }),
        },
      });

      if (error) throw error;
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (paymentMethod === 'PIX') {
        setPixQrCode(data.pix_qr_code);
        setPixCode(data.pix_code);
        setPaymentId(data.payment_id);
        setExpiresAt(data.expires_at ? new Date(data.expires_at) : null);
      } else if (data.status === 'CONFIRMED') {
        setStep('success');
        toast.success('Pagamento confirmado!');
        onSuccess?.();
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Erro ao criar pagamento');
    } finally {
      setLoading(false);
    }
  };

  // Poll for PIX payment confirmation
  useEffect(() => {
    if (step !== 'pix' || !paymentId) return;

    const interval = setInterval(async () => {
      const { data: payment } = await supabase
        .from('payments')
        .select('status')
        .eq('id', paymentId)
        .single();

      if (payment?.status === 'CONFIRMED') {
        clearInterval(interval);
        setStep('success');
        toast.success('Pagamento confirmado!');
        onSuccess?.();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [step, paymentId, onSuccess]);

  const copyPixCode = async () => {
    await navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast.success('Código copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCardNumber = (value: string) => {
    const nums = value.replace(/\D/g, '').slice(0, 16);
    return nums.replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const nums = value.replace(/\D/g, '').slice(0, 4);
    if (nums.length > 2) {
      return nums.slice(0, 2) + '/' + nums.slice(2);
    }
    return nums;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'amount' && 'Adicionar Saldo'}
            {step === 'method' && 'Escolha o método'}
            {step === 'pix' && 'Pagar com PIX'}
            {step === 'card' && 'Pagar com Cartão'}
            {step === 'success' && 'Pagamento Confirmado!'}
          </DialogTitle>
        </DialogHeader>

        {/* Step: Amount */}
        {step === 'amount' && (
          <div className="space-y-4">
            {/* Mensagem informativa do valor mínimo */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm text-primary">
                Valor mínimo para depósito: <strong>R$ {CONFIG.MIN_DEPOSIT_BRL.toFixed(2)}</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PRESET_AMOUNTS.map((value) => (
                <Button
                  key={value}
                  variant={amount === value && !customAmount ? 'default' : 'outline'}
                  onClick={() => handleAmountSelect(value)}
                  className="h-14"
                >
                  <span className="text-lg font-semibold">R$ {value}</span>
                </Button>
              ))}
            </div>

            <div className="relative">
              <Label htmlFor="custom-amount">Outro valor</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  id="custom-amount"
                  type="text"
                  placeholder="0,00"
                  value={customAmount}
                  onChange={(e) => handleCustomAmount(e.target.value)}
                  className="pl-10"
                />
              </div>
              {customAmount && parseFloat(customAmount.replace(',', '.')) < CONFIG.MIN_DEPOSIT_BRL && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    O valor mínimo para depósito é R$ {CONFIG.MIN_DEPOSIT_BRL.toFixed(2)}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Saldo a adicionar</span>
                  <span className="text-xl font-bold">R$ {amount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {!userCpfCnpj && (
              <div>
                <Label htmlFor="cpf-cnpj">CPF ou CNPJ *</Label>
                <Input
                  id="cpf-cnpj"
                  placeholder="000.000.000-00"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            )}

            <Button 
              className="w-full" 
              size="lg"
              disabled={amount < CONFIG.MIN_DEPOSIT_BRL || (!cpfCnpj && !userCpfCnpj)}
              onClick={() => setStep('method')}
            >
              Continuar
            </Button>
          </div>
        )}

        {/* Step: Method */}
        {step === 'method' && (
          <div className="space-y-4">
            <Card 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleMethodSelect('PIX')}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">PIX</h3>
                  <p className="text-sm text-muted-foreground">Aprovação instantânea</p>
                </div>
                <Badge variant="secondary">Recomendado</Badge>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleMethodSelect('CREDIT_CARD')}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Cartão de Crédito</h3>
                  <p className="text-sm text-muted-foreground mb-2">Até 12x sem juros</p>
                  <AllCardBrands size="sm" />
                </div>
              </CardContent>
            </Card>

            <Button variant="ghost" onClick={() => setStep('amount')} className="w-full">
              Voltar
            </Button>
          </div>
        )}

        {/* Step: PIX */}
        {step === 'pix' && (
          <div className="space-y-4">
            {!pixQrCode ? (
              <Button 
                className="w-full" 
                size="lg"
                disabled={loading}
                onClick={createPayment}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando QR Code...
                  </>
                ) : (
                  `Gerar QR Code - R$ ${amount.toFixed(2)}`
                )}
              </Button>
            ) : (
              <>
                <div className="flex justify-center">
                  <img 
                    src={`data:image/png;base64,${pixQrCode}`} 
                    alt="QR Code PIX" 
                    className="w-48 h-48 rounded-lg border"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Código PIX (copia e cola)</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={pixCode} 
                      readOnly 
                      className="font-mono text-xs"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={copyPixCode}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Card className="bg-amber-500/10 border-amber-500/20">
                  <CardContent className="p-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                    <span className="text-sm">Aguardando pagamento...</span>
                  </CardContent>
                </Card>

                {expiresAt && (
                  <p className="text-xs text-center text-muted-foreground">
                    Expira em: {expiresAt.toLocaleTimeString('pt-BR')}
                  </p>
                )}
              </>
            )}

            <Button variant="ghost" onClick={() => setStep('method')} className="w-full">
              Voltar
            </Button>
          </div>
        )}

        {/* Step: Card */}
        {step === 'card' && (
          <div className="space-y-4">
            {/* Bandeiras aceitas */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <span className="text-sm text-muted-foreground">Bandeiras aceitas:</span>
              <AllCardBrands activeBrand={detectCardBrand(cardNumber)} size="sm" />
            </div>

            <div>
              <Label htmlFor="card-number">Número do Cartão</Label>
              <div className="relative">
                <Input
                  id="card-number"
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  className="pr-14"
                />
                {detectCardBrand(cardNumber) && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CardBrandIcon brand={detectCardBrand(cardNumber)} active size="sm" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="card-holder">Nome no Cartão</Label>
              <Input
                id="card-holder"
                placeholder="NOME COMPLETO"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="card-expiry">Validade</Label>
                <Input
                  id="card-expiry"
                  placeholder="MM/AA"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="card-cvv">CVV</Label>
                <Input
                  id="card-cvv"
                  placeholder="000"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                />
              </div>
            </div>

            <div>
              <Label>Parcelas</Label>
              <Select 
                value={installments.toString()} 
                onValueChange={(value) => setInstallments(Number(value))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecione o parcelamento" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}x de R$ {(amount / n).toFixed(2)} sem juros
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              disabled={loading || !cardNumber || !cardHolder || !cardExpiry || !cardCvv}
              onClick={createPayment}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                `Pagar R$ ${amount.toFixed(2)}`
              )}
            </Button>

            <Button variant="ghost" onClick={() => setStep('method')} className="w-full">
              Voltar
            </Button>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold">Pagamento Confirmado!</h3>
            <p className="text-muted-foreground">
              R$ {amount.toFixed(2)} foram adicionados ao seu saldo.
            </p>
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
