import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RedeemedCoupon {
  id: string;
  code: string;
  customer_name: string;
  customer_phone: string;
  redeemed_at: string;
  offer_id: string;
  offers?: { title: string } | null;
}

export default function RedeemCouponPanel() {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [recent, setRecent] = useState<RedeemedCoupon[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const loadRecent = async () => {
    setLoadingList(true);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('coupons')
      .select('id, code, customer_name, customer_phone, redeemed_at, offer_id, offers(title)')
      .eq('status', 'REDEEMED')
      .gte('redeemed_at', since)
      .order('redeemed_at', { ascending: false })
      .limit(20);
    setRecent((data as any) || []);
    setLoadingList(false);
  };

  useEffect(() => { loadRecent(); }, []);

  const handleRedeem = async () => {
    const clean = code.trim().toUpperCase();
    if (clean.length !== 8) {
      setResult({ success: false, message: 'Código deve ter 8 caracteres' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('redeem-coupon', {
        body: { code: clean },
      });
      if (error) throw error;
      if (data?.error) {
        setResult({ success: false, message: data.error });
        return;
      }
      setResult({ success: true, message: 'Cupom resgatado!', data: data.coupon });
      setCode('');
      loadRecent();
      toast({ title: 'Cupom resgatado com sucesso!' });
    } catch (e: any) {
      setResult({ success: false, message: e?.message || 'Erro ao resgatar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-secondary" />
            Resgatar cupom
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="ABC12XYZ"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="font-mono text-lg tracking-widest uppercase"
              onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
            />
            <Button onClick={handleRedeem} disabled={loading || code.length !== 8}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validando…</> : 'Resgatar'}
            </Button>
          </div>

          {result && (
            <div className={`rounded-lg p-4 ${result.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-destructive/10 border border-destructive/30'}`}>
              <div className="flex items-start gap-2">
                {result.success
                  ? <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  : <XCircle className="h-5 w-5 text-destructive mt-0.5" />}
                <div className="flex-1">
                  <p className={`font-medium ${result.success ? 'text-green-700' : 'text-destructive'}`}>
                    {result.message}
                  </p>
                  {result.success && result.data && (
                    <div className="mt-2 text-sm text-foreground space-y-0.5">
                      <p><strong>Cliente:</strong> {result.data.customer_name}</p>
                      <p><strong>WhatsApp:</strong> {result.data.customer_phone}</p>
                      {result.data.offer_title && <p><strong>Oferta:</strong> {result.data.offer_title}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resgatados nas últimas 24h</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum cupom resgatado nas últimas 24h.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((c) => (
                <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border">
                  <Badge variant="outline" className="font-mono">{c.code}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.customer_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.customer_phone} {c.offers?.title ? `· ${c.offers.title}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.redeemed_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
