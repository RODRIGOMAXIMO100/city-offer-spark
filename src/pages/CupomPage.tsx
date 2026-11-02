import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Loader2, Ticket, Copy, Check, Store, Clock } from 'lucide-react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import CupomAcoes, { chamarCupom } from '@/components/offer/CupomAcoes';

// Página do cupom (link que vai no WhatsApp do cliente): clilin.com/cupom/:id
// clilin.com/pedir/:id é o botão "Pedir online" da mensagem: avisa a loja e abre o WhatsApp dela.

interface Cupom {
  id: string;
  codigo: string;
  status: 'ISSUED' | 'REDEEMED' | 'EXPIRED' | string;
  valido_ate: string;
  usado_em: string | null;
  oferta: { titulo?: string; de?: number; por?: number; cidade?: string };
  loja: string;
  cliente: string;
  uso_canal: 'loja' | 'online' | null;
  uso_solicitado_em: string | null;
  cliente_atendido: 'sim' | 'nao' | null;
  pedir_link: string | null;
}

const brl = (v?: number) => (v == null ? '' : `R$ ${Number(v).toFixed(Number(v) % 1 ? 2 : 0).replace('.', ',')}`);
const dataBR = (s: string) => new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function CupomPage() {
  const { id = '' } = useParams();
  const pedir = useLocation().pathname.startsWith('/pedir/');
  const [cupom, setCupom] = useState<Cupom | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const feito = useRef(false);

  useEffect(() => {
    if (feito.current) return;
    feito.current = true;
    (async () => {
      // "Pedir online" do WhatsApp: avisa a loja e já abre o WhatsApp dela
      const r = await chamarCupom(id, pedir ? 'online' : 'ver');
      setCarregando(false);
      if (r.cupom) setCupom(r.cupom as Cupom);
      if (r.erro && !r.cupom) { setErro(r.erro); return; }
      if (r.erro) { setAviso(r.erro); return; }
      if (pedir && r.cupom?.pedir_link) window.location.href = r.cupom.pedir_link;
    })();
  }, [id, pedir]);

  const copiar = async () => {
    if (!cupom) return;
    try { await navigator.clipboard.writeText(cupom.codigo); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* sem permissão */ }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Seu cupom | Clilin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navbar />
      <main className="flex-1 pt-28 pb-16 px-4">
        <div className="max-w-md mx-auto">
          {carregando ? (
            <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : erro || !cupom ? (
            <div className="text-center py-16 space-y-4">
              <Ticket className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="text-lg font-semibold">{erro || 'Cupom não encontrado'}</p>
              <Button asChild><Link to="/ofertas">Ver ofertas da cidade</Link></Button>
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-card p-6 space-y-5 shadow-sm">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Store className="h-4 w-4" /> {cupom.loja}</p>
                <h1 className="text-2xl font-display font-bold mt-1">{cupom.oferta.titulo}</h1>
                {cupom.oferta.por != null && (
                  <p className="mt-1">
                    {cupom.oferta.de != null && cupom.oferta.de > cupom.oferta.por && (
                      <span className="text-muted-foreground line-through mr-2">{brl(cupom.oferta.de)}</span>
                    )}
                    <span className="text-xl font-bold text-primary">{brl(cupom.oferta.por)}</span>
                  </p>
                )}
              </div>

              <div className="rounded-2xl border-2 border-dashed border-secondary bg-secondary/10 p-5 text-center">
                <p className="text-xs uppercase text-muted-foreground mb-1">Cupom de {cupom.cliente}</p>
                <p className="text-4xl font-black tracking-widest text-secondary select-all">{cupom.codigo}</p>
                <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Válido até {dataBR(cupom.valido_ate)}
                </p>
                <button onClick={copiar} className="mt-3 inline-flex items-center gap-1.5 text-sm text-foreground underline">
                  {copiado ? <><Check className="h-4 w-4" /> Copiado</> : <><Copy className="h-4 w-4" /> Copiar código</>}
                </button>
              </div>

              {cupom.status === 'REDEEMED' ? (
                <p className="rounded-xl bg-muted p-4 text-center font-semibold">Este cupom já foi usado{cupom.usado_em ? ` em ${dataBR(cupom.usado_em)}` : ''}.</p>
              ) : cupom.status !== 'ISSUED' ? (
                <p className="rounded-xl bg-muted p-4 text-center font-semibold">Este cupom venceu.</p>
              ) : (
                <CupomAcoes
                  id={cupom.id}
                  lojaNome={cupom.loja}
                  canalInicial={pedir && !aviso ? 'online' : (cupom.uso_canal ?? null)}
                  atendidoInicial={cupom.cliente_atendido ?? null}
                  pedirLinkInicial={cupom.pedir_link}
                />
              )}
              {aviso && <p className="text-sm text-destructive text-center">{aviso}</p>}
              <p className="text-xs text-center text-muted-foreground">
                A loja confirma o cupom no Clilin. Cada cupom vale uma vez.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
