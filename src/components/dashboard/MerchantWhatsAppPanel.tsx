import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Phone, Plus, Info } from 'lucide-react';

interface MerchantWhatsApp {
  id: string;
  phone: string;
  label: string | null;
  verified: boolean;
  created_at: string;
}

export default function MerchantWhatsAppPanel() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<MerchantWhatsApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('merchant_whatsapp' as any)
      .select('id, phone, label, verified, created_at')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Erro ao carregar números', description: error.message, variant: 'destructive' });
    } else {
      setRows((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 12 || digits.length > 13) {
      toast({
        title: 'Número inválido',
        description: 'Use apenas dígitos com DDI + DDD + número. Ex: 5531999998888',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('merchant_whatsapp' as any).insert({
      profile_id: profile.id,
      phone: digits,
      label: label.trim() || null,
    });
    setSaving(false);
    if (error) {
      const msg = error.code === '23505'
        ? 'Este número já está cadastrado (por você ou outra empresa).'
        : error.message;
      toast({ title: 'Não foi possível adicionar', description: msg, variant: 'destructive' });
      return;
    }
    setPhone('');
    setLabel('');
    toast({ title: 'Número autorizado', description: 'Já pode resgatar cupons pelo WhatsApp.' });
    load();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from('merchant_whatsapp' as any).delete().eq('id', id);
    setDeletingId(null);
    if (error) {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
      return;
    }
    setRows((r) => r.filter((x) => x.id !== id));
    toast({ title: 'Número removido' });
  };

  const formatPhone = (digits: string) => {
    // 55 31 99999 8888
    if (digits.length === 13) {
      return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
    }
    if (digits.length === 12) {
      return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
    }
    return digits;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Phone className="h-5 w-5 text-primary" />
          WhatsApp autorizados a resgatar cupons
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
          <p>
            Cadastre aqui os números que sua equipe usa no balcão. Só esses números conseguem confirmar
            um resgate de cupom pelo WhatsApp. Use apenas dígitos com DDI + DDD, ex:{' '}
            <span className="font-mono font-semibold">5531999998888</span>.
          </p>
        </div>

        <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="wa-phone">Número (só dígitos com DDI)</Label>
            <Input
              id="wa-phone"
              inputMode="numeric"
              placeholder="5531999998888"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              maxLength={13}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wa-label">Apelido (opcional)</Label>
            <Input
              id="wa-label"
              placeholder="Ex: Balcão, Gerente João"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={50}
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span className="ml-1">Adicionar</span>
          </Button>
        </form>

        <div className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum número cadastrado ainda.
            </p>
          ) : (
            rows.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-medium">{formatPhone(r.phone)}</span>
                    {r.verified && (
                      <Badge variant="secondary" className="text-xs">
                        Verificado
                      </Badge>
                    )}
                  </div>
                  {r.label && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.label}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(r.id)}
                  disabled={deletingId === r.id}
                  aria-label="Remover número"
                >
                  {deletingId === r.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
