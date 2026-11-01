import { useState } from "react";
import { ArrowRight, Banknote, ClipboardCheck, Coins, Eye, Megaphone, Trophy, UserCheck, Users, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCentsToBRL } from "@/types/database";
import { formatViews } from "@/lib/reach";
import type { AdminSection } from "./AdminSidebar";
import { PERIODS, PeriodKey, useReachSummary } from "./useReachSummary";

function ActionCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
  onClick,
}: {
  icon: typeof Eye;
  label: string;
  value: string | number;
  hint: string;
  tone: "affiliate" | "company" | "highlight" | "muted";
  onClick: () => void;
}) {
  const urgent = Number(value) > 0;
  const toneCls =
    tone === "affiliate"
      ? "bg-affiliate/10 text-affiliate"
      : tone === "company"
        ? "bg-company/10 text-company"
        : tone === "highlight"
          ? "bg-highlight/15 text-foreground"
          : "bg-muted text-muted-foreground";
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl border bg-card p-4 sm:p-5 transition-all hover:shadow-md hover:-translate-y-0.5 ${
        urgent ? "border-affiliate/40" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${toneCls}`}>
          <Icon className="h-4 w-4" />
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-2xl sm:text-3xl font-display font-bold text-foreground">{value}</p>
      <p className="font-semibold text-foreground text-sm">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
    </button>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-display font-bold text-foreground mt-1">{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
      </CardContent>
    </Card>
  );
}

/** Primeira tela do admin: o que precisa de ação e como está o mês */
export function AdminHome({ onNavigate, refreshKey }: { onNavigate: (s: AdminSection) => void; refreshKey?: number }) {
  const [period, setPeriod] = useState<PeriodKey>("month");
  const { data, loading, error } = useReachSummary(period, refreshKey);

  if (error) {
    return <p className="text-sm text-destructive">Não foi possível carregar o resumo: {error}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Início</h2>
        <p className="text-sm text-muted-foreground">O que precisa de você agora e como está a rede.</p>
      </div>

      {/* Ação */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Precisa de você</h3>
        {loading && !data ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <ActionCard
              icon={ClipboardCheck}
              label="Posts para conferir"
              value={data?.posts_pending ?? 0}
              hint="Aprovar ou recusar"
              tone="affiliate"
              onClick={() => onNavigate("review-posts")}
            />
            <ActionCard
              icon={UserCheck}
              label="Perfis para aprovar"
              value={data?.accounts_pending ?? 0}
              hint="Divulgadores esperando liberar"
              tone="affiliate"
              onClick={() => onNavigate("review-accounts")}
            />
            <ActionCard
              icon={Banknote}
              label="Saques pendentes"
              value={data?.withdrawals_pending_count ?? 0}
              hint={data?.withdrawals_pending_cents ? formatCentsToBRL(data.withdrawals_pending_cents) : "Nenhum valor"}
              tone="highlight"
              onClick={() => onNavigate("withdrawals")}
            />
            <ActionCard
              icon={Megaphone}
              label="Campanhas no ar"
              value={data?.campaigns_active ?? 0}
              hint="Acompanhar metas"
              tone="company"
              onClick={() => onNavigate("campaigns")}
            />
          </div>
        )}
      </section>

      {/* Período */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resultados</h3>
          <div className="flex flex-wrap gap-1.5">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === p.key ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Metric label="Visualizações verificadas" value={formatViews(data?.views_verified ?? 0)} hint={`${data?.posts_approved ?? 0} posts aprovados, ${data?.posts_rejected ?? 0} recusados`} />
          <Metric label="Créditos vendidos" value={formatCentsToBRL(data?.credits_sold_cents ?? 0)} hint="Entraram na conta das empresas" />
          <Metric label="Consumido pelas campanhas" value={formatCentsToBRL(data?.consumed_cents ?? 0)} hint="R$ 5 a cada mil visualizações" />
          <Metric label="Campanhas criadas" value={String(data?.campaigns_created ?? 0)} />
        </div>
      </section>

      {/* Prêmios e rede */}
      <section className="grid lg:grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate("prizes")}
          className="text-left rounded-2xl border border-highlight/40 bg-highlight/10 p-5 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-foreground" />
            <p className="font-semibold text-foreground">Fundo de prêmios do mês</p>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">{formatCentsToBRL(data?.cycle_open_pool_cents ?? 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            35% do que as campanhas consomem, mais o que sobrou do mês anterior. Fecha no fim do mês, em Prêmios do mês.
          </p>
        </button>
        <div className="rounded-2xl border border-border bg-card p-5 grid grid-cols-2 gap-4">
          <button onClick={() => onNavigate("users")} className="text-left">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="h-3.5 w-3.5" /> Divulgadores
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{data?.affiliates ?? 0}</p>
            <p className="text-[11px] text-muted-foreground">{data?.affiliates_with_verified_account ?? 0} com perfil aprovado</p>
          </button>
          <button onClick={() => onNavigate("credits")} className="text-left">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Coins className="h-3.5 w-3.5" /> Empresas
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{data?.companies ?? 0}</p>
            <p className="text-[11px] text-muted-foreground">{formatCentsToBRL(data?.company_balance_cents ?? 0)} em créditos parados</p>
          </button>
        </div>
      </section>
    </div>
  );
}
