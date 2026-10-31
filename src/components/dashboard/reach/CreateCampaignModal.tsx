import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, X, MapPin, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAvailableCities } from '@/hooks/useAvailableCities';
import { useReachConfig } from '@/hooks/useReachConfig';
import { formatCentsToBRL } from '@/types/database';
import {
  REACH_NETWORKS, reachDb, reserveForGoal, formatViews, reachErrorMessage, type ReachNetwork,
} from '@/lib/reach';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  onNeedCredits: () => void;
}

const GOAL_PRESETS = [20000, 50000, 100000, 300000];

const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function CreateCampaignModal({ open, onClose, onCreated, onNeedCredits }: Props) {
  const { profile, refreshProfile } = useAuth();
  const { config } = useReachConfig();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [keyword, setKeyword] = useState('');
  const [briefing, setBriefing] = useState('');
  const [kitUrl, setKitUrl] = useState('');
  const [networks, setNetworks] = useState<ReachNetwork[]>(['INSTAGRAM', 'TIKTOK']);
  const [nationwide, setNationwide] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [stateCode, setStateCode] = useState('');
  const [cityName, setCityName] = useState('');
  const [goal, setGoal] = useState(50000);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [saving, setSaving] = useState(false);

  const { availableStates, citiesForState } = useAvailableCities(stateCode);

  // Valores iniciais a cada abertura: cidade da empresa e janela de 7 dias
  useEffect(() => {
    if (!open) return;
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setStartsAt(toLocalInput(now));
    setEndsAt(toLocalInput(end));
    if (profile?.city && cities.length === 0) setCities([profile.city]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const reserve = reserveForGoal(goal || 0, config.cpm_cents);
  const balance = profile?.balance ?? 0;
  const missing = Math.max(reserve - balance, 0);

  const canSubmit = useMemo(
    () =>
      title.trim().length >= 3 &&
      keyword.trim().length >= 2 &&
      networks.length > 0 &&
      (nationwide || cities.length > 0) &&
      goal >= config.min_goal_views &&
      !!startsAt && !!endsAt,
    [title, keyword, networks, nationwide, cities, goal, config.min_goal_views, startsAt, endsAt],
  );

  const toggleNetwork = (id: ReachNetwork) =>
    setNetworks((prev) => (prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]));

  const addCity = () => {
    if (!stateCode || !cityName) return;
    const value = `${cityName} - ${stateCode}`;
    setCities((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setCityName('');
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (missing > 0) {
      onNeedCredits();
      return;
    }
    setSaving(true);
    const { error } = await reachDb.rpc('create_campaign', {
      p_title: title.trim(),
      p_keyword: keyword.trim(),
      p_briefing: briefing.trim() || null,
      p_kit_url: kitUrl.trim() || null,
      p_networks: networks,
      p_cities: nationwide ? [] : cities,
      p_goal_views: goal,
      p_starts_at: new Date(startsAt).toISOString(),
      p_ends_at: new Date(endsAt).toISOString(),
    });
    setSaving(false);

    if (error) {
      toast({ title: 'Não deu para criar a campanha', description: reachErrorMessage(error), variant: 'destructive' });
      return;
    }
    toast({
      title: 'Campanha no ar! 🚀',
      description: `${formatCentsToBRL(reserve)} ficaram reservados. Você só paga pelo alcance verificado.`,
    });
    await refreshProfile();
    setTitle(''); setKeyword(''); setBriefing(''); setKitUrl('');
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova campanha de alcance</DialogTitle>
          <DialogDescription>
            Divulgadores da sua cidade postam a sua palavra-chave no mesmo período. Você paga só pelas visualizações verificadas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="c-title">Nome da campanha</Label>
            <Input id="c-title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Inauguração da loja do centro" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-keyword">Palavra-chave ou hashtag</Label>
            <Input id="c-keyword" value={keyword} maxLength={60} onChange={(e) => setKeyword(e.target.value)}
              placeholder="Ex.: #PizzariaDoZe" />
            <p className="text-xs text-muted-foreground">Todo post precisa ter essa palavra. É ela que faz a sua marca circular.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-briefing">O que os divulgadores devem falar</Label>
            <Textarea id="c-briefing" value={briefing} maxLength={2000} rows={3} onChange={(e) => setBriefing(e.target.value)}
              placeholder="Ex.: Mostrar a pizza de calabresa e chamar para a promoção de sexta" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-kit">Link do material (opcional)</Label>
            <Input id="c-kit" value={kitUrl} maxLength={500} onChange={(e) => setKitUrl(e.target.value)}
              placeholder="Link do Google Drive com vídeos e artes" />
          </div>

          <div className="space-y-2">
            <Label>Redes aceitas</Label>
            <div className="grid grid-cols-2 gap-2">
              {REACH_NETWORKS.map((n) => (
                <label key={n.id} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm cursor-pointer">
                  <Checkbox checked={networks.includes(n.id)} onCheckedChange={() => toggleNetwork(n.id)} />
                  {n.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Onde</Label>
              <label className="flex items-center gap-2 text-sm">
                Brasil inteiro
                <Switch checked={nationwide} onCheckedChange={setNationwide} />
              </label>
            </div>
            {!nationwide && (
              <>
                <div className="grid grid-cols-[90px_1fr_auto] gap-2">
                  <Select value={stateCode} onValueChange={(v) => { setStateCode(v); setCityName(''); }}>
                    <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      {availableStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={cityName} onValueChange={setCityName} disabled={!stateCode}>
                    <SelectTrigger><SelectValue placeholder="Cidade" /></SelectTrigger>
                    <SelectContent>
                      {citiesForState.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={addCity} disabled={!cityName}>Adicionar</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cities.map((c) => (
                    <Badge key={c} variant="secondary" className="gap-1">
                      {c}
                      <button type="button" aria-label={`Remover ${c}`} onClick={() => setCities((p) => p.filter((x) => x !== c))}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {cities.length === 0 && <p className="text-xs text-muted-foreground">Adicione pelo menos uma cidade.</p>}
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-goal">Meta de visualizações</Label>
            <div className="flex flex-wrap gap-2">
              {GOAL_PRESETS.map((g) => (
                <Button key={g} type="button" size="sm" variant={goal === g ? 'default' : 'outline'} onClick={() => setGoal(g)}>
                  {formatViews(g)}
                </Button>
              ))}
            </div>
            <Input id="c-goal" type="number" min={config.min_goal_views} step={1000} value={goal || ''}
              onChange={(e) => setGoal(parseInt(e.target.value || '0', 10))} />
            <p className="text-xs text-muted-foreground">
              Mínimo de {formatViews(config.min_goal_views)} visualizações. {formatCentsToBRL(config.cpm_cents)} a cada mil visualizações verificadas.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="c-start">Começa</Label>
              <Input id="c-start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-end">Termina</Label>
              <Input id="c-end" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>

          <div className="rounded-lg bg-company-muted p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Fica reservado do seu saldo</span><strong>{formatCentsToBRL(reserve)}</strong></div>
            <div className="flex justify-between text-muted-foreground"><span>Seu saldo</span><span>{formatCentsToBRL(balance)}</span></div>
            <p className="text-xs text-muted-foreground pt-1">
              Você só paga pelas visualizações verificadas. O que não for usado volta para o seu saldo quando a campanha terminar.
            </p>
          </div>

          {missing > 0 ? (
            <Button className="w-full" variant="secondary" onClick={onNeedCredits}>
              <Wallet className="h-4 w-4 mr-2" />
              Adicionar saldo (faltam {formatCentsToBRL(missing)})
            </Button>
          ) : (
            <Button className="w-full bg-company text-company-foreground hover:bg-company/90" disabled={!canSubmit || saving} onClick={handleSubmit}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lançar campanha
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
