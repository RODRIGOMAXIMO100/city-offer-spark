import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, BadgeCheck, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  REACH_NETWORKS, LEAGUES, leagueFor, networkLabel, formatViews, reachDb, reachErrorMessage,
  type ReachNetwork, type SocialAccount,
} from '@/lib/reach';

interface Props {
  accounts: SocialAccount[];
  onChange: () => void;
}

export default function AffiliateSocialAccounts({ accounts, onChange }: Props) {
  const { toast } = useToast();
  const [adding, setAdding] = useState(accounts.length === 0);
  const [network, setNetwork] = useState<ReachNetwork>('INSTAGRAM');
  const [handle, setHandle] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [followers, setFollowers] = useState('');
  const [saving, setSaving] = useState(false);

  const maxFollowers = accounts.reduce((m, a) => Math.max(m, a.followers), 0);
  const league = leagueFor(maxFollowers);

  const save = async () => {
    setSaving(true);
    const { error } = await reachDb.rpc('upsert_social_account', {
      p_network: network,
      p_handle: handle,
      p_profile_url: profileUrl || null,
      p_followers: parseInt(followers || '0', 10),
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Não deu para salvar', description: reachErrorMessage(error), variant: 'destructive' });
      return;
    }
    toast({ title: 'Perfil salvo!', description: 'Ele precisa estar aberto para conferirmos os seus posts.' });
    setHandle(''); setProfileUrl(''); setFollowers(''); setAdding(false);
    onChange();
  };

  const remove = async (id: string) => {
    const { error } = await reachDb.rpc('delete_social_account', { p_account_id: id });
    if (error) {
      toast({ title: 'Não deu para remover', description: reachErrorMessage(error), variant: 'destructive' });
      return;
    }
    onChange();
  };

  return (
    <Card data-tour="social-accounts">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between gap-2">
          <span className="flex items-center gap-2"><Users className="h-4 w-4 text-affiliate" /> Minhas redes</span>
          {accounts.length > 0 && (
            <Badge variant="outline" className="border-affiliate text-affiliate">Liga {LEAGUES[league].label}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {accounts.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground">Cadastre pelo menos uma rede para receber missões.</p>
        )}

        {accounts.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium flex items-center gap-1">
                {networkLabel(a.network)} · @{a.handle}
                {a.verified && <BadgeCheck className="h-4 w-4 text-affiliate" aria-label="Perfil conferido" />}
              </p>
              <p className="text-xs text-muted-foreground">{formatViews(a.followers)} seguidores</p>
            </div>
            <Button size="icon" variant="ghost" aria-label={`Remover ${networkLabel(a.network)}`} onClick={() => remove(a.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {adding ? (
          <div className="space-y-3 rounded-md border border-dashed border-border p-3">
            <div className="space-y-1.5">
              <Label>Rede</Label>
              <Select value={network} onValueChange={(v) => setNetwork(v as ReachNetwork)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REACH_NETWORKS.map((n) => <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="sa-handle">Seu @</Label>
                <Input id="sa-handle" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@seuperfil" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sa-followers">Seguidores</Label>
                <Input id="sa-followers" type="number" min={0} value={followers} onChange={(e) => setFollowers(e.target.value)} placeholder="Ex.: 1200" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sa-url">Link do perfil (opcional)</Label>
              <Input id="sa-url" value={profileUrl} onChange={(e) => setProfileUrl(e.target.value)} placeholder="https://..." />
            </div>
            <p className="text-xs text-muted-foreground">
              O perfil precisa estar aberto. A sua liga é definida pelo seu maior perfil: {LEAGUES.BRONZE.label} ({LEAGUES.BRONZE.range}),
              {' '}{LEAGUES.PRATA.label} ({LEAGUES.PRATA.range}) ou {LEAGUES.OURO.label} ({LEAGUES.OURO.range}).
            </p>
            <div className="flex gap-2">
              {accounts.length > 0 && <Button variant="outline" className="flex-1" onClick={() => setAdding(false)}>Cancelar</Button>}
              <Button className="flex-1 bg-affiliate text-affiliate-foreground hover:bg-affiliate/90" disabled={saving || handle.trim().length < 2 || followers === ''} onClick={save}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Salvar perfil
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-2" /> Adicionar rede
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
