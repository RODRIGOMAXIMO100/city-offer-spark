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
import { Loader2, X, MapPin, Wallet, Waves } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAvailableCities } from '@/hooks/useAvailableCities';
import { useReachConfig } from '@/hooks/useReachConfig';
import { formatCentsToBRL } from '@/types/database';
import {
  REACH_NETWORKS, reachDb, reserveForGoal, formatViews, formatDateTime, reachErrorMessage,
  WINDOW_PRESETS, DEFAULT_WINDOW_HOURS, type ReachNetwork,
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
  const [networks, setNetworks] = useState<ReachNetwork[]>(['TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'KWAI']);
  const [nationwide, setNationwide] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [stateCode, setStateCode] = useState('');
  const [cityName, setCityName] = useState('');
  const [goal, setGoal] = useState(50000);
  const [startsAt, setStartsAt] = useState('');
  const [windowHours, setWindowHours] = useState(DEFAULT_WINDOW_HOURS);
  const [saving, setSaving] = useState(false);

  const { availableStates, citiesForState } = useAvailableCities(stateCode);

  // Valores iniciais a cada abertura: cidade da empresa e onda de 48h começando agora
  useEffect(() => {
    if (!open) return;
    setStartsAt(toLocalInput(new Date()));
    setWindowHours(DEFAULT_WINDOW_HOURS);
    if (profile?.city && cities.length === 0) setCities([profile.city]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const reserve = reserveForGoal(goal || 0, config.cpm_cents);
  const capCents = Math.floor(reserve * config.post_cap_share);
  const startDate = startsAt ? new Date(startsAt) : null;
  const endDate = startDate ? new Date(startDate.getTime() + windowHours * 3600_000) : null;
  const presets = WINDOW_PRESETS.filter((w) => w.hours <= config.max_window_days * 24);
  const balance = profile?.balance ?? 0;
  const missing = Math.max(reserve - balance, 0);

  const canSubmit = useMemo(
    () =>
      title.trim().length >= 3 &&
      keyword.trim().length >= 2 &&
      briefing.trim().length >= 30 &&
      networks.length > 0 &&
      (nationwide || cities.length > 0) &&
      goal >= config.min_goal_views &&
      !!startDate && !!endDate,
    [title, keyword, briefing, networks, nationwide, cities, goal, config.min_goal_views, startDate, endDate],
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
      p_briefing: briefing.trim(),
      p_kit_url: kitUrl.trim() || null,
      p_networks: networks,
      p_cities: nationwide ? [] : cities,
      p_goal_views: goal,
      p_starts_at: startDate!.toISOString(),
      p_ends_at: endDate!.toISOString(),
    });
    setSaving(false);

    if (error) {
      toast({ title: 'Não deu para criar a campanha', description: reachErrorMessage(error), variant: 'destructive' });
      return;
    }
    toast({
      title: 'Onda marcada! 🌊',
      description: `${formatCentsToBRL(reserve)} ficaram reservados. Os divulgadores já veem a missão. Você só paga pelo que foi visto.`,
    });
    await refreshProfile();
    setTitle(''); setKeyword(''); setBriefing(''); setKitUrl('');
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova campanha</DialogTitle>
          <DialogDescription>
            Muita gente real postando sobre a sua marca na mesma janela, cada um no próprio perfil. Você paga só pelas visualizações verificadas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="c-title">Nome da campanha</Label>
            <Input id="c-title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Inauguração da loja do centro" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-keyword">Assinatura da campanha</Label>
            <Input id="c-keyword" value={keyword} maxLength={60} onChange={(e) => setKeyword(e.target.value)}
              placeholder="Ex.: Pizzaria do Zé" />
            <p className="text-xs text-muted-foreground">
              O nome ou a frase que todo mundo vai falar no vídeo e escrever na legenda. É assim que a gente confere cada post e que quem viu acha a sua marca na busca. Hashtag é opcional.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-briefing">Roteiro para os divulgadores</Label>
            <Textarea id="c-briefing" value={briefing} maxLength={2000} rows={4} onChange={(e) => setBriefing(e.target.value)}
              placeholder={'O que falar e mostrar, e 2 ou 3 ideias de vídeo diferentes. Ex.:\n1. Provar a pizza nova e dar a nota\n2. Mostrar a fila de sexta\n3. Contar a promoção da semana'} />
            <p className={`text-xs ${briefing.trim().length > 0 && briefing.trim().length < 30 ? 'text-destructive' : 'text-muted-foreground'}`}>
              Ideias variadas fazem cada post parecer de gente de verdade, e não tudo igual. Mínimo de 30 letras.
            </p>
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
                <label key={n.id} className="flex items-start gap-2 rounded-md border border-border p-2 text-sm cursor-pointer">
                  <Checkbox className="mt-0.5" checked={networks.includes(n.id)} onCheckedChange={() => toggleNetwork(n.id)} />
                  <span>
                    {n.label}
                    {n.secondary && <span className="block text-[11px] text-muted-foreground">conferido pelo print</span>}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Vídeo curto (TikTok, Reels, Shorts e Kwai) é onde a onda rende mais.</p>
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

          <div className="space-y-2">
            <Label htmlFor="c-start" className="flex items-center gap-1.5"><Waves className="h-4 w-4" /> Janela da onda</Label>
            <p className="text-xs text-muted-foreground">
              O período em que todo mundo posta. Onda boa é curta: muita gente falando ao mesmo tempo. Dá para casar com uma inauguração, um lançamento ou um evento.
            </p>
            <Input id="c-start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              {presets.map((w) => (
                <Button key={w.hours} type="button" size="sm" variant={windowHours === w.hours ? 'default' : 'outline'} onClick={() => setWindowHours(w.hours)}>
                  {w.label}
                </Button>
              ))}
            </div>
            {startDate && endDate && (
              <p className="text-xs text-muted-foreground">
                Divulgadores postam de {formatDateTime(startDate.toISOString())} até {formatDateTime(endDate.toISOString())}.
                Quem posta nas primeiras {config.early_hours} horas ganha bônus no ranking.
              </p>
            )}
          </div>

          <div className="rounded-lg bg-company-muted p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Fica reservado do seu saldo</span><strong>{formatCentsToBRL(reserve)}</strong></div>
            <div className="flex justify-between text-muted-foreground"><span>Seu saldo</span><span>{formatCentsToBRL(balance)}</span></div>
            <ul className="text-xs text-muted-foreground pt-1 space-y-1 list-disc pl-4">
              <li>Você só paga pelas visualizações verificadas.</li>
              <li>Cada post conta as visualizações dos {config.count_days} primeiros dias.</li>
              <li>Nenhum post passa de {formatCentsToBRL(capCents)} ({Math.round(config.post_cap_share * 100)}% da campanha): são muitas vozes, não uma só.</li>
              <li>O que não for usado volta para o seu saldo quando a campanha terminar.</li>
            </ul>
          </div>

          {missing > 0 ? (
            <Button className="w-full" variant="secondary" onClick={onNeedCredits}>
              <Wallet className="h-4 w-4 mr-2" />
              Adicionar saldo (faltam {formatCentsToBRL(missing)})
            </Button>
          ) : (
            <Button className="w-full bg-company text-company-foreground hover:bg-company/90" disabled={!canSubmit || saving} onClick={handleSubmit}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Marcar a onda
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
