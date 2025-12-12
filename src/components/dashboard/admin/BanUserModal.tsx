import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCentsToBRL } from '@/types/database';
import { Ban, Snowflake, DollarSign } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email?: string;
  balance: number;
  banned?: boolean;
  balance_frozen?: boolean;
}

interface BanUserModalProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserBanned: () => void;
}

export default function BanUserModal({ user, open, onOpenChange, onUserBanned }: BanUserModalProps) {
  const [banReason, setBanReason] = useState('');
  const [freezeBalance, setFreezeBalance] = useState(true);
  const [confiscateBalance, setConfiscateBalance] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBanUser = async () => {
    if (!user || !banReason.trim()) {
      toast.error('Informe o motivo do banimento');
      return;
    }

    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authUser?.id)
        .single();

      // Update profile
      const updateData: Record<string, unknown> = {
        banned: true,
        banned_at: new Date().toISOString(),
        banned_reason: banReason,
        banned_by: adminProfile?.id,
        balance_frozen: freezeBalance,
      };

      if (confiscateBalance) {
        updateData.balance = 0;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Create ban history record
      await supabase.from('user_bans').insert({
        user_id: user.id,
        banned_by: adminProfile?.id,
        reason: banReason,
        balance_at_ban: user.balance,
        action_type: 'BAN',
        evidence: { confiscated: confiscateBalance, frozen: freezeBalance }
      });

      // Create notification for user
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'ACCOUNT_BANNED',
        title: '⚠️ Conta Suspensa',
        message: `Sua conta foi suspensa por violação dos termos de uso. Motivo: ${banReason}`,
        data: { reason: banReason }
      });

      toast.success('Usuário banido com sucesso');
      onOpenChange(false);
      setBanReason('');
      setFreezeBalance(true);
      setConfiscateBalance(false);
      onUserBanned();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Erro ao banir usuário');
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Ban className="h-5 w-5" />
            Banir Usuário
          </DialogTitle>
          <DialogDescription>
            Banir <strong>{user.name}</strong> ({user.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Motivo do Banimento *</Label>
            <Textarea
              placeholder="Descreva o motivo do banimento (ex: cliques fraudulentos, uso de VPN, etc)..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Snowflake className="h-4 w-4 text-blue-500" />
                Congelar Saldo
              </Label>
              <p className="text-xs text-muted-foreground">
                Impede saques mas mantém o saldo para análise
              </p>
            </div>
            <Switch
              checked={freezeBalance}
              onCheckedChange={setFreezeBalance}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2 text-red-600">
                <DollarSign className="h-4 w-4" />
                Confiscar Saldo
              </Label>
              <p className="text-xs text-muted-foreground">
                Zera o saldo do usuário (ação irreversível)
              </p>
            </div>
            <Switch
              checked={confiscateBalance}
              onCheckedChange={setConfiscateBalance}
            />
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Saldo atual do usuário:</strong> {formatCentsToBRL(user.balance)}
            </p>
            {confiscateBalance && (
              <p className="text-sm text-red-600 mt-1">
                ⚠️ O saldo será zerado após o banimento
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleBanUser} 
            disabled={loading || !banReason.trim()}
          >
            <Ban className="h-4 w-4 mr-2" />
            {loading ? 'Processando...' : 'Confirmar Banimento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
