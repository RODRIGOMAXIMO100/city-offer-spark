import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ImagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { reachDb, networkLabel, reachErrorMessage, uploadProof, type Mission, type SocialAccount } from '@/lib/reach';

interface Props {
  mission: Mission | null;
  accounts: SocialAccount[];
  onClose: () => void;
  onSubmitted: () => void;
}

export default function SubmitPostModal({ mission, accounts, onClose, onSubmitted }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accountId, setAccountId] = useState('');
  const [url, setUrl] = useState('');
  const [views, setViews] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const usedNetworks = new Set((mission?.my_posts ?? []).map((p) => p.network));
  const eligible = accounts.filter((a) => mission?.networks.includes(a.network) && !usedNetworks.has(a.network));

  useEffect(() => {
    if (!mission) return;
    setUrl(''); setViews(''); setFile(null);
    setAccountId(eligible[0]?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission?.id]);

  const submit = async () => {
    if (!mission || !user) return;
    setSaving(true);
    try {
      const proofPath = file ? await uploadProof(user.id, file) : null;
      const { data: postId, error } = await reachDb.rpc('submit_campaign_post', {
        p_campaign_id: mission.id,
        p_social_account_id: accountId,
        p_post_url: url.trim(),
        p_reported_views: views ? parseInt(views, 10) : 0,
        p_proof_path: proofPath,
      });
      if (error) throw error;

      // Leitura automatica dos dados publicos do post (nao bloqueia o envio)
      supabase.functions.invoke('check-post', { body: { post_id: postId } }).catch(() => undefined);

      toast({ title: 'Post enviado! 🙌', description: 'Agora ele passa pela conferência. Os pontos entram assim que for aprovado.' });
      onSubmitted();
    } catch (err) {
      toast({ title: 'Não deu para enviar', description: reachErrorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!mission} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar meu post</DialogTitle>
          <DialogDescription>
            Poste no seu perfil com <strong>{mission?.keyword}</strong> e <strong>#publi</strong>, depois cole o link aqui.
          </DialogDescription>
        </DialogHeader>

        {eligible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Você precisa ter cadastrado um perfil em uma destas redes: {mission?.networks.map(networkLabel).join(', ')}.
            Se já enviou um post em cada uma delas, é só aguardar a conferência.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Perfil onde você postou</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue placeholder="Escolha o perfil" /></SelectTrigger>
                <SelectContent>
                  {eligible.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{networkLabel(a.network)} · @{a.handle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-url">Link do post</Label>
              <Input id="sp-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.instagram.com/reel/..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-views">Visualizações até agora (opcional)</Label>
              <Input id="sp-views" type="number" min={0} value={views} onChange={(e) => setViews(e.target.value)} placeholder="Ex.: 350" />
              <p className="text-xs text-muted-foreground">Você pode atualizar esse número depois de 72 horas, antes da conferência.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-proof">Print das visualizações (opcional)</Label>
              <label htmlFor="sp-proof" className="flex items-center gap-2 rounded-md border border-dashed border-border p-3 text-sm cursor-pointer">
                <ImagePlus className="h-4 w-4" />
                {file ? file.name : 'Escolher imagem'}
              </label>
              <input id="sp-proof" type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <Button className="w-full bg-affiliate text-affiliate-foreground hover:bg-affiliate/90"
              disabled={saving || !accountId || url.trim().length < 10} onClick={submit}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Enviar para conferência
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
