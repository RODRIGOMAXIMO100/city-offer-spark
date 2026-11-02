import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowDown, ArrowUp, Bell, Check, Copy, MapPin, Pizza, Scissors, SquarePen, Square, Store, Ticket, Megaphone, Baby } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ComingSoonWaitlist } from '@/components/home/ComingSoonWaitlist';
import { cn } from '@/lib/utils';

// Chat da Clilin no jeito do ChatGPT: tela inicial com sugestões, resposta escrita na hora,
// cartões de oferta dentro da resposta e conversa salva no navegador.

export interface OfertaChat {
  n: number;
  id: string;
  titulo: string;
  loja: string;
  de: number;
  por: number;
  cidade: string;
  imagem: string | null;
}

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ofertas?: OfertaChat[];
  erro?: boolean;
}

const CHAVE = 'clilin_chat_v2';
const CIDADE_PADRAO = 'Belo Horizonte - MG';
const URL_CHAT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clilin-chat`;
const CHAVE_PUBLICA = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const SUGESTOES = [
  { icone: Pizza, titulo: 'Pizza com desconto', texto: 'Quero comer uma pizza hoje com desconto. O que tem?' },
  { icone: Scissors, titulo: 'Cabelo e beleza', texto: 'Tem promoção de salão ou barbearia perto de mim?' },
  { icone: Baby, titulo: 'Programa em família', texto: 'Me indica um programa barato pra fazer com criança no fim de semana' },
  { icone: Store, titulo: 'Tenho um negócio', texto: 'Tenho um negócio em BH. Como o Clilin traz cliente pra mim?' },
  { icone: Megaphone, titulo: 'Renda extra', texto: 'Como eu ganho dinheiro sendo divulgador do Clilin?' },
  { icone: Ticket, titulo: 'Como usar o cupom', texto: 'Como funciona o cupom no WhatsApp?' },
];

const brl = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const novoId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const ler = (): Msg[] => {
  try {
    const s = localStorage.getItem(CHAVE);
    const v = s ? JSON.parse(s) : [];
    return Array.isArray(v) ? v.filter((m) => m && (m.role === 'user' || m.role === 'assistant')).slice(-60) : [];
  } catch {
    return [];
  }
};
const salvar = (m: Msg[]) => {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(m.slice(-60)));
  } catch {
    /* sem armazenamento: a conversa só não fica salva */
  }
};

type Parte = { tipo: 'texto'; texto: string } | { tipo: 'oferta'; n: number } | { tipo: 'avise' };

// Troca [[oferta:N]] e [[avise]] por cartões. Enquanto escreve, esconde um marcador pela metade.
function partes(conteudo: string, escrevendo: boolean): Parte[] {
  let txt = conteudo;
  if (escrevendo) txt = txt.replace(/\[\[[^\]]*\]?$/, '');
  const out: Parte[] = [];
  const re = /\[\[\s*(oferta\s*:\s*(\d+)|avise)\s*\]\]/gi;
  let ult = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(txt))) {
    if (m.index > ult) out.push({ tipo: 'texto', texto: txt.slice(ult, m.index) });
    out.push(m[2] ? { tipo: 'oferta', n: Number(m[2]) } : { tipo: 'avise' });
    ult = m.index + m[0].length;
  }
  if (ult < txt.length) out.push({ tipo: 'texto', texto: txt.slice(ult) });
  return out.filter((p) => p.tipo !== 'texto' || p.texto.trim());
}

const textoLimpo = (c: string) => c.replace(/\[\[[^\]]*\]\]/g, '').replace(/\n{3,}/g, '\n\n').trim();

function Markdown({ texto }: { texto: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) =>
          href && href.startsWith('/') ? (
            <Link to={href} className="font-medium text-primary underline underline-offset-2">
              {children}
            </Link>
          ) : (
            <span>{children}</span>
          ),
      }}
    >
      {texto}
    </ReactMarkdown>
  );
}

function CartaoOferta({ o }: { o: OfertaChat }) {
  const off = o.de > o.por ? Math.round((1 - o.por / o.de) * 100) : 0;
  return (
    <Link
      to={`/oferta/${o.id}`}
      className="not-prose my-2 flex items-center gap-3 rounded-2xl border border-border bg-card p-3 no-underline transition-shadow hover:shadow-md"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
        {o.imagem ? (
          <img src={o.imagem} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <Ticket className="absolute inset-0 m-auto h-6 w-6 text-primary/50" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-semibold leading-snug text-foreground">{o.titulo}</p>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {o.loja} · {o.cidade.replace(/ - [A-Z]{2}$/, '')}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm">
          {off > 0 && <span className="text-xs text-muted-foreground line-through">{brl(o.de)}</span>}
          <span className="font-bold text-primary">{brl(o.por)}</span>
          {off > 0 && (
            <span className="whitespace-nowrap rounded-full bg-highlight px-1.5 py-0.5 text-[11px] font-bold leading-none text-highlight-foreground">-{off}%</span>
          )}
        </p>
        <p className="mt-1 text-xs font-semibold text-primary sm:hidden">Pegar cupom →</p>
      </div>
      <span className="hidden shrink-0 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground sm:inline-block">Pegar cupom</span>
    </Link>
  );
}

function Pensando() {
  return (
    <div className="flex h-7 items-center gap-1" aria-label="Clilin está pensando">
      {[0, 150, 300].map((d) => (
        <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: `${d}ms` }} />
      ))}
    </div>
  );
}

function Avatar() {
  return (
    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card">
      <BrandLogo variant="mark" className="h-[18px]" />
    </div>
  );
}

interface Props {
  /** Nome de quem está logado (a Clilin chama pelo primeiro nome) */
  nome?: string | null;
  /** Cidade de quem está logado */
  cidade?: string | null;
  /** Botões extras no topo (painel do cliente) */
  acoesTopo?: ReactNode;
}

export default function ClilinChat({ nome, cidade, acoesTopo }: Props) {
  const [params, setParams] = useSearchParams();
  const [msgs, setMsgs] = useState<Msg[]>(ler);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [aviso, setAviso] = useState(false);
  const [noFim, setNoFim] = useState(true);
  const rolagem = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const controle = useRef<AbortController | null>(null);
  const msgsRef = useRef(msgs);
  msgsRef.current = msgs;
  const cidadeUso = cidade || CIDADE_PADRAO;
  const vazio = msgs.length === 0;

  useEffect(() => {
    if (!enviando) salvar(msgs);
  }, [msgs, enviando]);

  // caixa de texto cresce com o texto
  useLayoutEffect(() => {
    const el = campo.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [texto]);

  const descer = useCallback((suave = false) => {
    const el = rolagem.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: suave ? 'smooth' : 'auto' });
  }, []);

  // acompanha a resposta enquanto ela é escrita, se a pessoa estiver no fim
  useEffect(() => {
    if (noFim) descer();
  }, [msgs, noFim, descer]);

  const aoRolar = () => {
    const el = rolagem.current;
    if (!el) return;
    setNoFim(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  };

  const enviar = useCallback(
    async (bruto: string) => {
      const conteudo = bruto.trim();
      if (!conteudo || enviando) return;
      const usuario: Msg = { id: novoId(), role: 'user', content: conteudo };
      const resposta: Msg = { id: novoId(), role: 'assistant', content: '' };
      const historico = [...msgsRef.current.filter((m) => !m.erro), usuario];
      setMsgs([...msgsRef.current, usuario, resposta]);
      setTexto('');
      setEnviando(true);
      setNoFim(true);
      const ctrl = new AbortController();
      controle.current = ctrl;

      const atualiza = (f: (m: Msg) => Msg) => setMsgs((l) => l.map((m) => (m.id === resposta.id ? f(m) : m)));

      try {
        const r = await fetch(URL_CHAT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: CHAVE_PUBLICA, Authorization: `Bearer ${CHAVE_PUBLICA}` },
          body: JSON.stringify({
            mensagens: historico.map((m) => ({ role: m.role, content: m.content })),
            cidade: cidadeUso,
            nome: nome || undefined,
          }),
          signal: ctrl.signal,
        });
        if (!r.ok || !r.body) {
          const b = await r.json().catch(() => ({}));
          throw new Error(b?.error || 'Não consegui responder agora. Tente de novo.');
        }
        const leitor = r.body.getReader();
        const dec = new TextDecoder();
        let buf = '';
        for (;;) {
          const { done, value } = await leitor.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let i: number;
          while ((i = buf.indexOf('\n')) >= 0) {
            const l = buf.slice(0, i).trim();
            buf = buf.slice(i + 1);
            if (!l) continue;
            let ev: { type: string; text?: string; ofertas?: OfertaChat[]; mensagem?: string };
            try {
              ev = JSON.parse(l);
            } catch {
              continue;
            }
            if (ev.type === 'ofertas') atualiza((m) => ({ ...m, ofertas: ev.ofertas ?? [] }));
            else if (ev.type === 'delta' && ev.text) atualiza((m) => ({ ...m, content: m.content + ev.text }));
            else if (ev.type === 'erro') throw new Error(ev.mensagem || 'A resposta foi interrompida. Tente de novo.');
          }
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          const msg = (e as Error).message || 'Não consegui responder agora. Tente de novo.';
          atualiza((m) => (m.content ? { ...m, content: `${m.content}\n\n_${msg}_` } : { ...m, content: msg, erro: true }));
        }
      } finally {
        setMsgs((l) => l.filter((m) => m.id !== resposta.id || m.content.trim()));
        setEnviando(false);
        controle.current = null;
        campo.current?.focus();
      }
    },
    [enviando, cidadeUso, nome],
  );

  // clilin.com/chat?q=... (busca da página de ofertas) já manda a pergunta
  const jaPerguntou = useRef(false);
  useEffect(() => {
    const q = params.get('q');
    if (!q || jaPerguntou.current) return;
    jaPerguntou.current = true;
    params.delete('q');
    setParams(params, { replace: true });
    enviar(q);
  }, [params, setParams, enviar]);

  const parar = () => controle.current?.abort();

  const novaConversa = () => {
    parar();
    setMsgs([]);
    setTexto('');
    salvar([]);
    campo.current?.focus();
  };

  const copiar = async (m: Msg) => {
    try {
      await navigator.clipboard.writeText(textoLimpo(m.content));
      setCopiado(m.id);
      setTimeout(() => setCopiado(null), 1500);
    } catch {
      /* sem permissão */
    }
  };

  const aoTeclar = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      enviar(texto);
    }
  };

  const caixa = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        enviar(texto);
      }}
      data-tour="chat-input"
      className="flex items-end gap-2 rounded-[28px] border border-border bg-card p-2 pl-5 shadow-sm transition-shadow focus-within:shadow-md"
    >
      <textarea
        ref={campo}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={aoTeclar}
        rows={1}
        maxLength={2000}
        autoFocus={vazio}
        placeholder="Pergunte qualquer coisa à Clilin"
        aria-label="Mensagem para a Clilin"
        className="max-h-[200px] min-h-[40px] flex-1 resize-none bg-transparent py-2 text-base leading-6 text-foreground outline-none placeholder:text-muted-foreground"
      />
      {enviando ? (
        <button
          type="button"
          onClick={parar}
          aria-label="Parar resposta"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-80"
        >
          <Square className="h-3.5 w-3.5 fill-current" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={!texto.trim()}
          aria-label="Enviar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-80 disabled:opacity-25"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </form>
  );

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link to="/" aria-label="Início do Clilin" className="flex items-center rounded-lg p-1.5 hover:bg-muted">
            <BrandLogo className="h-7" />
          </Link>
          <span data-tour="location" className="hidden items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex">
            <MapPin className="h-3 w-3" /> {cidadeUso.replace(/ - [A-Z]{2}$/, '')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!vazio && (
            <button
              onClick={novaConversa}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-foreground hover:bg-muted"
            >
              <SquarePen className="h-4 w-4" /> <span className="hidden sm:inline">Nova conversa</span>
            </button>
          )}
          {acoesTopo ?? (
            <Link to="/ofertas" className="inline-flex h-9 items-center rounded-full px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              Ver ofertas
            </Link>
          )}
        </div>
      </header>

      {vazio ? (
        <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 pb-6">
          <div className="w-full max-w-2xl">
            <div className="mb-7 text-center">
              <BrandLogo variant="mark" className="mx-auto mb-5 h-12" />
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {nome ? `Oi, ${nome.split(' ')[0]}! O que você procura hoje?` : 'O que você procura hoje?'}
              </h1>
              <p className="mt-2 text-muted-foreground">Ofertas de Belo Horizonte com cupom grátis no WhatsApp.</p>
            </div>
            {caixa}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SUGESTOES.map((s) => (
                <button
                  key={s.titulo}
                  onClick={() => enviar(s.texto)}
                  className="flex items-start gap-2 rounded-2xl border border-border bg-card p-3 text-left text-sm transition-colors hover:bg-muted"
                >
                  <s.icone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span className="block font-medium text-foreground">{s.titulo}</span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">{s.texto}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </main>
      ) : (
        <>
          <div className="relative flex-1 overflow-hidden">
            <div ref={rolagem} onScroll={aoRolar} data-tour="chat-area" className="h-full overflow-y-auto">
              <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
                {msgs.map((m, idx) => {
                  const ultima = idx === msgs.length - 1;
                  if (m.role === 'user') {
                    return (
                      <div key={m.id} className="flex justify-end">
                        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-3xl bg-muted px-4 py-2.5 text-foreground">{m.content}</div>
                      </div>
                    );
                  }
                  const escrevendo = enviando && ultima;
                  const ps = partes(m.content, escrevendo);
                  return (
                    <div key={m.id} className="group flex gap-3">
                      <Avatar />
                      <div className="min-w-0 flex-1">
                        {ps.length === 0 && escrevendo ? (
                          <Pensando />
                        ) : (
                          <div
                            className={cn(
                              'prose prose-sm max-w-none text-foreground sm:prose-base dark:prose-invert prose-p:my-2 prose-ul:my-2 prose-li:my-0.5',
                              m.erro && 'text-destructive',
                            )}
                          >
                            {ps.map((p, i) => {
                              if (p.tipo === 'texto') return <Markdown key={i} texto={p.texto} />;
                              if (p.tipo === 'avise')
                                return (
                                  <button
                                    key={i}
                                    onClick={() => setAviso(true)}
                                    className="not-prose my-2 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                                  >
                                    <Bell className="h-4 w-4" /> Quero ser avisado
                                  </button>
                                );
                              const o = m.ofertas?.find((x) => x.n === p.n);
                              return o ? <CartaoOferta key={i} o={o} /> : null;
                            })}
                            {escrevendo && ps.length > 0 && (
                              <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-foreground/70 align-middle" />
                            )}
                          </div>
                        )}
                        {!escrevendo && m.content && !m.erro && (
                          <div className="mt-1 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                            <button
                              onClick={() => copiar(m)}
                              aria-label="Copiar resposta"
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              {copiado === m.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {!noFim && (
              <button
                onClick={() => descer(true)}
                aria-label="Ir para o fim da conversa"
                className="absolute bottom-3 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md hover:bg-muted"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 sm:px-4">
            <div className="mx-auto w-full max-w-3xl">
              {caixa}
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                A Clilin pode errar. Confira os detalhes na página da oferta.
              </p>
            </div>
          </div>
        </>
      )}

      <ComingSoonWaitlist open={aviso} onOpenChange={setAviso} />
    </div>
  );
}
