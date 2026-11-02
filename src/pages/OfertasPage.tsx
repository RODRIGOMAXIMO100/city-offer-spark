import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Search, Ticket, Bell, Store, ArrowRight, Loader2, MessageCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/seo/SEOHead";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ComingSoonWaitlist } from "@/components/home/ComingSoonWaitlist";

interface PublicOffer {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  price_old: number;
  price_new: number;
  city: string;
  images: string[] | null;
  expires_at: string;
  company?: { name: string; avatar_url: string | null } | null;
}

const CITY_KEY = "clilin_cidade";

const readCity = () => {
  try {
    return localStorage.getItem(CITY_KEY) || "";
  } catch {
    return "";
  }
};
const saveCity = (c: string) => {
  try {
    localStorage.setItem(CITY_KEY, c);
  } catch {
    /* sem armazenamento: só não lembra a cidade */
  }
};

const brl = (v: number) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Ofertas ativas, separadas por cidade. O cliente pega o cupom e recebe no WhatsApp. */
const OfertasPage = () => {
  const [offers, setOffers] = useState<PublicOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(readCity);
  const [term, setTerm] = useState("");
  const [waitlist, setWaitlist] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("offers")
        .select("id, company_id, title, description, price_old, price_new, city, images, expires_at")
        .eq("active", true)
        .is("deleted_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(300);
      const list = (data ?? []) as PublicOffer[];
      const ids = Array.from(new Set(list.map((o) => o.company_id)));
      if (ids.length) {
        const { data: companies } = await supabase
          .from("company_public_profiles")
          .select("id, name, avatar_url")
          .in("id", ids);
        const byId = new Map((companies ?? []).map((c) => [c.id, c]));
        list.forEach((o) => (o.company = (byId.get(o.company_id) as PublicOffer["company"]) ?? null));
      }
      setOffers(list);
      setLoading(false);
    })();
  }, []);

  const cities = useMemo(() => {
    const count = new Map<string, number>();
    offers.forEach((o) => count.set(o.city, (count.get(o.city) ?? 0) + 1));
    return Array.from(count.entries()).sort((a, b) => b[1] - a[1]);
  }, [offers]);

  // Cidade lembrada que não tem mais oferta: mostra todas
  const activeCity = cities.some(([c]) => c === city) ? city : "";

  const visible = useMemo(() => {
    const t = norm(term.trim());
    return offers.filter(
      (o) =>
        (!activeCity || o.city === activeCity) &&
        (!t || norm(`${o.title} ${o.description ?? ""} ${o.company?.name ?? ""}`).includes(t)),
    );
  }, [offers, activeCity, term]);

  // Pergunta para a Clilin: abre o chat já com a pergunta
  const askAi = () => {
    const q = term.trim();
    if (q.length < 2) return;
    navigate(`/chat?q=${encodeURIComponent(q)}`);
  };

  const pickCity = (c: string) => {
    setCity(c);
    saveCity(c);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Ofertas e cupons da sua cidade"
        description="Descontos de negócios da sua cidade com cupom direto no seu WhatsApp. É grátis: escolha a oferta, pegue o cupom e use na loja."
        canonicalUrl="/ofertas"
        keywords={["cupom de desconto", "ofertas da cidade", "promoções perto de mim", "cupom no WhatsApp"]}
      />
      <Navbar />

      <main className="flex-1 pt-28 pb-16 sm:pt-36">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-2 text-sm font-semibold mb-5">
              <Ticket className="h-4 w-4" /> Grátis para quem usa
            </span>
            <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight mb-4">Ofertas da sua cidade</h1>
            <p className="text-lg text-muted-foreground">
              Escolha a oferta, pegue o cupom e receba no seu WhatsApp. Depois é só mostrar o código na loja.
            </p>
          </div>

          <form
            className="max-w-xl mx-auto mb-5 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              askAi();
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="O que você procura? Pizza, academia, salão..."
                className="pl-9 h-12 rounded-2xl"
                aria-label="Buscar ofertas"
              />
            </div>
            <Button type="submit" className="h-12 rounded-2xl px-4" disabled={term.trim().length < 2}>
              <Sparkles className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Perguntar à Clilin</span>
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground -mt-2 mb-6">
            Prefere conversar?{" "}
            <Link to="/chat" className="font-medium text-primary underline underline-offset-2">
              Pergunte à Clilin
            </Link>{" "}
            e ela acha a oferta certa para você.
          </p>

          {cities.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <button
                onClick={() => pickCity("")}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  !activeCity ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"
                }`}
              >
                Todas as cidades
              </button>
              {cities.map(([c, n]) => (
                <button
                  key={c}
                  onClick={() => pickCity(c)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
                    activeCity === c ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5" /> {c} <span className="opacity-70">({n})</span>
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : visible.length === 0 ? (
            <div className="max-w-lg mx-auto text-center rounded-3xl border border-border bg-card p-8 space-y-4">
              <Store className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="font-display font-semibold text-xl">
                {offers.length === 0 ? "As primeiras ofertas estão chegando" : "Nada encontrado por aqui"}
              </p>
              <p className="text-muted-foreground">
                {offers.length === 0
                  ? "Estamos trazendo os negócios da sua cidade. Deixe seu contato e avisamos quando tiver oferta perto de você."
                  : "Tente outra palavra ou veja todas as cidades."}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={() => setWaitlist(true)}>
                  <Bell className="h-4 w-4 mr-2" /> Avise minha cidade
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/empresas">Tenho um negócio</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((o) => {
                const off = o.price_old > o.price_new ? Math.round((1 - o.price_new / o.price_old) * 100) : 0;
                return (
                  <Link
                    key={o.id}
                    to={`/oferta/${o.id}`}
                    className="group rounded-3xl border border-border bg-card overflow-hidden hover:shadow-xl transition-shadow flex flex-col"
                  >
                    <div className="relative aspect-[16/10] bg-muted">
                      {o.images?.[0] ? (
                        <img src={o.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Ticket className="h-10 w-10 text-primary/40" />
                        </div>
                      )}
                      {off > 0 && (
                        <span className="absolute top-3 left-3 rounded-full bg-highlight text-highlight-foreground px-3 py-1 text-sm font-bold">
                          -{off}%
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col gap-2">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Store className="h-3.5 w-3.5" /> {o.company?.name ?? "Negócio local"} · {o.city}
                      </p>
                      <p className="font-display font-semibold text-lg leading-snug line-clamp-2">{o.title}</p>
                      <div className="mt-auto flex items-end justify-between gap-2">
                        <div>
                          {o.price_old > o.price_new && (
                            <p className="text-xs text-muted-foreground line-through">{brl(o.price_old)}</p>
                          )}
                          <p className="text-2xl font-display font-bold text-primary">{brl(o.price_new)}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                          Pegar cupom <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-14 grid sm:grid-cols-3 gap-4">
            {[
              { icon: Ticket, t: "Escolha a oferta", d: "Descontos de negócios da sua cidade." },
              { icon: MessageCircle, t: "Cupom no WhatsApp", d: "Informe nome e WhatsApp e o código chega na hora." },
              { icon: Store, t: "Use na loja", d: "Mostre o código no balcão ou mande para a loja no WhatsApp." },
            ].map((s) => (
              <div key={s.t} className="rounded-2xl border border-border bg-card p-5">
                <s.icon className="h-5 w-5 text-primary mb-2" />
                <p className="font-semibold">{s.t}</p>
                <p className="text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
      <ComingSoonWaitlist open={waitlist} onOpenChange={setWaitlist} />
    </div>
  );
};

export default OfertasPage;
