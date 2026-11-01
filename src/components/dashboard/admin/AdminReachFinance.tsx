import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCentsToBRL } from "@/types/database";
import { formatViews } from "@/lib/reach";
import { PERIODS, PeriodKey, useReachSummary } from "./useReachSummary";

function Row({ label, value, hint, strong }: { label: string; value: string; hint?: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className={`text-sm ${strong ? "font-semibold text-foreground" : "text-foreground"}`}>{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <p className={`shrink-0 font-display ${strong ? "text-xl font-bold" : "text-base font-semibold"} text-foreground`}>{value}</p>
    </div>
  );
}

/** Financeiro do modelo de campanhas: entrada de créditos, consumo e divisão 35% / 65% */
export function AdminReachFinance() {
  const [period, setPeriod] = useState<PeriodKey>("month");
  const { data, loading, error } = useReachSummary(period);

  const consumed = data?.consumed_cents ?? 0;
  const pool = data?.pool_cents ?? 0;
  const clilin = consumed - pool;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Financeiro</h2>
          <p className="text-sm text-muted-foreground">Créditos que entraram, o que as campanhas consumiram e para onde foi cada real.</p>
        </div>
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

      {error && <p className="text-sm text-destructive">Não foi possível carregar: {error}</p>}
      {loading && !data ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="rounded-2xl">
              <CardContent className="p-5 divide-y divide-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-2">Entrada</p>
                <Row label="Créditos vendidos" value={formatCentsToBRL(data?.credits_sold_cents ?? 0)} hint="Pix e pagamentos online lançados para as empresas" strong />
                <Row label="Créditos parados nas empresas" value={formatCentsToBRL(data?.company_balance_cents ?? 0)} hint="Saldo de hoje, ainda não usado em campanha" />
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardContent className="p-5 divide-y divide-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-2">Consumo das campanhas</p>
                <Row label="Consumido" value={formatCentsToBRL(consumed)} hint={`${formatViews(data?.views_verified ?? 0)} visualizações verificadas a R$ 5 por mil`} strong />
                <Row label="Fundo de prêmios (35%)" value={formatCentsToBRL(pool)} hint="Vai para os divulgadores no fechamento do mês" />
                <Row label="Fica com o Clilin (65%)" value={formatCentsToBRL(clilin)} hint="Receita da operação, antes de impostos" />
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="rounded-2xl">
              <CardContent className="p-5 divide-y divide-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-2">Divulgadores</p>
                <Row label="Prêmios creditados" value={formatCentsToBRL(data?.prizes_paid_cents ?? 0)} hint="Caíram no saldo no fechamento do ciclo" />
                <Row label="Saques pagos" value={formatCentsToBRL(data?.withdrawals_paid_cents ?? 0)} />
                <Row label="Saques esperando" value={formatCentsToBRL(data?.withdrawals_pending_cents ?? 0)} hint={`${data?.withdrawals_pending_count ?? 0} pedidos`} />
                <Row label="Saldo dos divulgadores hoje" value={formatCentsToBRL(data?.affiliate_balance_cents ?? 0)} />
              </CardContent>
            </Card>

            <Card className="rounded-2xl bg-muted/40">
              <CardContent className="p-5 text-sm text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">Como ler</p>
                <p>As empresas compram créditos. Cada post aprovado consome R$ 5 a cada mil visualizações verificadas.</p>
                <p>De cada valor consumido, 35% entra no fundo de prêmios do mês e 65% fica com o Clilin.</p>
                <p>No fim do mês, em Prêmios do mês, o ciclo é fechado e os 3 primeiros de cada liga recebem no saldo. Eles sacam por Pix a partir de R$ 100.</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
