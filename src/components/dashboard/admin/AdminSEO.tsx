import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Send, Search, ExternalLink } from 'lucide-react';

interface SiteEntry {
  siteUrl: string;
  permissionLevel: string;
}

interface SitemapEntry {
  path: string;
  lastSubmitted?: string;
  lastDownloaded?: string;
  isPending?: boolean;
  warnings?: string;
  errors?: string;
  contents?: Array<{ type: string; submitted?: string; indexed?: string }>;
}

const DEFAULT_SITEMAP = 'https://clilin.com/sitemap.xml';

export default function AdminSEO() {
  const [sites, setSites] = useState<SiteEntry[]>([]);
  const [siteUrl, setSiteUrl] = useState<string>('');
  const [sitemaps, setSitemaps] = useState<SitemapEntry[]>([]);
  const [sitemapInput, setSitemapInput] = useState(DEFAULT_SITEMAP);
  const [inspectUrl, setInspectUrl] = useState('https://clilin.com/');
  const [inspectResult, setInspectResult] = useState<any>(null);

  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingSitemaps, setLoadingSitemaps] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inspecting, setInspecting] = useState(false);

  const invoke = async (fn: string, opts: { body?: any } = {}) => {
    const { data, error } = await supabase.functions.invoke(fn, opts);
    if (error) throw new Error(error.message);
    return data;
  };

  const loadSites = async () => {
    setLoadingSites(true);
    try {
      const data = await invoke('gsc-sitemap?action=sites');
      const entries: SiteEntry[] = data?.siteEntry ?? [];
      setSites(entries);
      if (entries.length && !siteUrl) {
        const preferred = entries.find(s => s.siteUrl.includes('clilin')) ?? entries[0];
        setSiteUrl(preferred.siteUrl);
      }
    } catch (e: any) {
      toast.error(`Erro ao listar propriedades: ${e.message}`);
    } finally {
      setLoadingSites(false);
    }
  };

  const loadSitemaps = async (site = siteUrl) => {
    if (!site) return;
    setLoadingSitemaps(true);
    try {
      const data = await invoke(`gsc-sitemap?action=list&siteUrl=${encodeURIComponent(site)}`);
      setSitemaps(data?.sitemap ?? []);
    } catch (e: any) {
      toast.error(`Erro ao listar sitemaps: ${e.message}`);
    } finally {
      setLoadingSitemaps(false);
    }
  };

  const submitSitemap = async () => {
    if (!siteUrl || !sitemapInput) return;
    setSubmitting(true);
    try {
      await invoke('gsc-sitemap?action=submit', { body: { siteUrl, sitemapUrl: sitemapInput } });
      toast.success('Sitemap enviado ao Google');
      await loadSitemaps();
    } catch (e: any) {
      toast.error(`Falha ao enviar: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSitemap = async (sm: string) => {
    if (!confirm(`Remover sitemap ${sm}?`)) return;
    try {
      await invoke('gsc-sitemap?action=delete', { body: { siteUrl, sitemapUrl: sm } });
      toast.success('Sitemap removido');
      await loadSitemaps();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const inspect = async () => {
    if (!siteUrl || !inspectUrl) return;
    setInspecting(true);
    setInspectResult(null);
    try {
      const data = await invoke('gsc-inspect', { body: { siteUrl, inspectionUrl: inspectUrl } });
      setInspectResult(data);
    } catch (e: any) {
      toast.error(`Erro na inspeção: ${e.message}`);
    } finally {
      setInspecting(false);
    }
  };

  useEffect(() => { loadSites(); }, []);
  useEffect(() => { if (siteUrl) loadSitemaps(siteUrl); }, [siteUrl]);

  const indexStatus = inspectResult?.inspectionResult?.indexStatusResult;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SEO — Google Search Console</h1>
        <p className="text-sm text-muted-foreground">Submeta o sitemap e verifique a indexação de URLs.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Propriedade</CardTitle>
          <Button variant="outline" size="sm" onClick={loadSites} disabled={loadingSites}>
            {loadingSites ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <CardContent>
          {sites.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma propriedade verificada encontrada. Verifique se você conectou a conta certa do Google e se `clilin.com` está adicionado no Search Console.
            </p>
          ) : (
            <Select value={siteUrl} onValueChange={setSiteUrl}>
              <SelectTrigger><SelectValue placeholder="Selecione uma propriedade" /></SelectTrigger>
              <SelectContent>
                {sites.map(s => (
                  <SelectItem key={s.siteUrl} value={s.siteUrl}>
                    {s.siteUrl} <span className="text-muted-foreground ml-2">({s.permissionLevel})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Sitemaps</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={sitemapInput} onChange={e => setSitemapInput(e.target.value)} placeholder="https://clilin.com/sitemap.xml" />
            <Button onClick={submitSitemap} disabled={submitting || !siteUrl}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar
            </Button>
            <Button variant="outline" onClick={() => loadSitemaps()} disabled={loadingSitemaps || !siteUrl}>
              <RefreshCw className={`h-4 w-4 ${loadingSitemaps ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {sitemaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum sitemap registrado nesta propriedade.</p>
          ) : (
            <div className="space-y-2">
              {sitemaps.map(sm => (
                <div key={sm.path} className="border rounded-md p-3 text-sm space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <a href={sm.path} target="_blank" rel="noreferrer" className="font-medium hover:underline break-all flex items-center gap-1">
                      {sm.path} <ExternalLink className="h-3 w-3" />
                    </a>
                    <div className="flex items-center gap-2">
                      {sm.isPending && <Badge variant="secondary">Pendente</Badge>}
                      {Number(sm.errors) > 0 && <Badge variant="destructive">{sm.errors} erros</Badge>}
                      {Number(sm.warnings) > 0 && <Badge variant="outline">{sm.warnings} avisos</Badge>}
                      <Button variant="ghost" size="sm" onClick={() => deleteSitemap(sm.path)}>Remover</Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Enviado: {sm.lastSubmitted ? new Date(sm.lastSubmitted).toLocaleString('pt-BR') : '—'} · Lido: {sm.lastDownloaded ? new Date(sm.lastDownloaded).toLocaleString('pt-BR') : '—'}
                  </div>
                  {sm.contents?.map((c, i) => (
                    <div key={i} className="text-xs">
                      {c.type}: {c.submitted ?? 0} enviadas · {c.indexed ?? 0} indexadas
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Inspeção de URL</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={inspectUrl} onChange={e => setInspectUrl(e.target.value)} placeholder="https://clilin.com/blog/..." />
            <Button onClick={inspect} disabled={inspecting || !siteUrl}>
              {inspecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Inspecionar
            </Button>
          </div>

          {indexStatus && (
            <div className="border rounded-md p-3 text-sm space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={indexStatus.verdict === 'PASS' ? 'default' : 'destructive'}>{indexStatus.verdict}</Badge>
                <span className="font-medium">{indexStatus.coverageState}</span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div><dt className="inline text-muted-foreground">Rastreamento: </dt><dd className="inline">{indexStatus.crawledAs ?? '—'}</dd></div>
                <div><dt className="inline text-muted-foreground">Último rastreio: </dt><dd className="inline">{indexStatus.lastCrawlTime ? new Date(indexStatus.lastCrawlTime).toLocaleString('pt-BR') : '—'}</dd></div>
                <div><dt className="inline text-muted-foreground">Robots: </dt><dd className="inline">{indexStatus.robotsTxtState ?? '—'}</dd></div>
                <div><dt className="inline text-muted-foreground">Indexação: </dt><dd className="inline">{indexStatus.indexingState ?? '—'}</dd></div>
                <div className="sm:col-span-2 break-all"><dt className="inline text-muted-foreground">Canônica Google: </dt><dd className="inline">{indexStatus.googleCanonical ?? '—'}</dd></div>
                <div className="sm:col-span-2 break-all"><dt className="inline text-muted-foreground">Canônica declarada: </dt><dd className="inline">{indexStatus.userCanonical ?? '—'}</dd></div>
              </dl>
              {inspectResult?.inspectionResult?.inspectionResultLink && (
                <a className="text-xs underline" href={inspectResult.inspectionResult.inspectionResultLink} target="_blank" rel="noreferrer">
                  Abrir no Search Console
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
