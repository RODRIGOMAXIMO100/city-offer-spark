import { useCallback, useEffect, useMemo, useState } from "react";
import { Coins, Loader2, Search, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { reachDb } from "@/lib/reach";
import { formatCentsToBRL } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Company {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  city: string | null;
  cnpj: string | null;
  balance: number;
}

interface CreditTx {
  id: string;
  user_id: string;
  amount: number;
  description: string | null;
  created_at: string;
}

// "150", "150,00", "1.500,50" -> centavos
function parseBRL(input: string): number | null {
  const clean = input.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  if (!clean) return null;
  const v = Number(clean);
  if (!Number.isFinite(v) || v <= 0) return null;
  return Math.round(v * 100);
}

const QUICK = [100, 250, 500, 1500];

/** Lançar créditos para empresas que pagaram por Pix fora do sistema */
export function AdminCredits() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [history, setHistory] = useState<CreditTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState("");
  const [target, setTarget] = useState<Company | null>(null);
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "COMPANY");
    const ids = (roles ?? []).map((r) => r.user_id);
    if (ids.length === 0) {
      setCompanies([]);
      setHistory([]);
      setLoading(false);
      return;
    }
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, user_id, name, email, city, cnpj, balance")
      .in("user_id", ids)
      .order("name");
    const list = (profs ?? []) as Company[];
    setCompanies(list);
    if (list.length) {
      const { data: tx } = await reachDb
        .from("transactions")
        .select("id, user_id, amount, description, created_at")
        .in("user_id", list.map((c) => c.id))
        .in("type", ["DEPOSIT", "ADMIN_ADJUSTMENT"])
        .order("created_at", { ascending: false })
        .limit(20);
      setHistory((tx ?? []) as CreditTx[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return companies;
    return companies.filter((c) => [c.name, c.email, c.city, c.cnpj].some((v) => v?.toLowerCase().includes(t)));
  }, [companies, term]);

  const nameOf = (profileId: string) => companies.find((c) => c.id === profileId)?.name ?? "Empresa";

  const open = (c: Company, m: "add" | "remove") => {
    setTarget(c);
    setMode(m);
    setAmount("");
    setNote(m === "add" ? "Pix recebido" : "");
  };

  const save = async () => {
    if (!target) return;
    const cents = parseBRL(amount);
    if (!cents) {
      toast({ title: "Valor inválido", description: "Digite o valor em reais, por exemplo 250 ou 250,00.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data, error } = await reachDb.rpc("admin_add_credits", {
      p_profile_id: target.id,
      p_amount_cents: mode === "add" ? cents : -cents,
      p_note: note,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Não foi possível lançar", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: mode === "add" ? "Créditos lançados" : "Créditos retirados",
      description: `${target.name}: saldo agora é ${formatCentsToBRL(Number(data ?? 0))}. A empresa foi avisada no painel.`,
    });
    setTarget(null);
    load();
  };

  const preview = parseBRL(amount);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Créditos das empresas</h2>
        <p className="text-sm text-muted-foreground">
          Quando a empresa pagar por Pix, lance aqui o valor. O saldo paga os cupons usados na loja: 15% do preço da oferta, mínimo de R$ 3, com 10% de desconto no pré-pago.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Buscar empresa por nome, email, cidade ou CNPJ" className="pl-9" />
      </div>

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma empresa encontrada.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((c) => (
            <Card key={c.id} className="rounded-2xl">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{[c.email, c.city].filter(Boolean).join(" · ")}</p>
                  <p className="text-sm mt-1">
                    Saldo: <strong className="text-company">{formatCentsToBRL(c.balance ?? 0)}</strong>
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button size="sm" onClick={() => open(c, "add")} className="bg-company text-company-foreground hover:bg-company/90">
                    <Plus className="h-4 w-4 mr-1" /> Lançar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => open(c, "remove")} disabled={(c.balance ?? 0) <= 0}>
                    <Minus className="h-4 w-4 mr-1" /> Retirar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Últimos lançamentos</h3>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum lançamento ainda.</p>
        ) : (
          <div className="rounded-2xl border border-border divide-y divide-border bg-card">
            {history.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{nameOf(t.user_id)}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-semibold ${t.amount >= 0 ? "text-company" : "text-destructive"}`}>
                    {t.amount >= 0 ? "+" : "-"}
                    {formatCentsToBRL(Math.abs(t.amount))}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-company" />
              {mode === "add" ? "Lançar créditos" : "Retirar créditos"}
            </DialogTitle>
            <DialogDescription>
              {target?.name} · saldo atual {formatCentsToBRL(target?.balance ?? 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="credit-amount">Valor em reais</Label>
              <Input id="credit-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="250,00" autoFocus />
              {mode === "add" && (
                <div className="flex flex-wrap gap-2">
                  {QUICK.map((q) => (
                    <button key={q} type="button" onClick={() => setAmount(String(q))} className="rounded-full bg-muted px-3 py-1 text-xs hover:bg-muted/70">
                      R$ {q.toLocaleString("pt-BR")}
                    </button>
                  ))}
                </div>
              )}
              {preview && (
                <p className="text-xs text-muted-foreground">
                  {mode === "add" ? "Dá para até " : "Equivale a até "}
                  {Math.floor(preview / 270).toLocaleString("pt-BR")} cupons usados na loja (na taxa mínima).
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit-note">Observação</Label>
              <Input id="credit-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Pix recebido em 01/11" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTarget(null)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving || !preview}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "add" ? "Confirmar lançamento" : "Confirmar retirada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
