import { useCallback, useEffect, useState } from "react";
import { reachDb } from "@/lib/reach";

export interface ReachSummary {
  posts_pending: number;
  posts_counting?: number;
  accounts_pending: number;
  campaigns_active: number;
  withdrawals_pending_count: number;
  withdrawals_pending_cents: number;
  cycle_open_start: string | null;
  cycle_open_pool_cents: number | null;
  views_verified: number;
  posts_approved: number;
  posts_rejected: number;
  consumed_cents: number;
  pool_cents: number;
  credits_sold_cents: number;
  prizes_paid_cents: number;
  withdrawals_paid_cents: number;
  campaigns_created: number;
  companies: number;
  affiliates: number;
  affiliates_with_verified_account: number;
  company_balance_cents: number;
  affiliate_balance_cents: number;
}

export type PeriodKey = "today" | "7d" | "month" | "30d" | "all";

export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "month", label: "Este mês" },
  { key: "30d", label: "30 dias" },
  { key: "all", label: "Tudo" },
];

export function periodRange(key: PeriodKey): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now.getTime() + 60_000);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (key) {
    case "today":
      return { from: startOfDay, to };
    case "7d":
      return { from: new Date(startOfDay.getTime() - 6 * 86_400_000), to };
    case "30d":
      return { from: new Date(startOfDay.getTime() - 29 * 86_400_000), to };
    case "all":
      return { from: new Date(2020, 0, 1), to };
    case "month":
    default:
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to };
  }
}

/** Números do modelo de campanhas para o admin, num período */
export function useReachSummary(period: PeriodKey, refreshKey = 0) {
  const [data, setData] = useState<ReachSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { from, to } = periodRange(period);
    const { data: res, error: err } = await reachDb.rpc("admin_reach_summary", {
      p_from: from.toISOString(),
      p_to: to.toISOString(),
    });
    if (err) setError(err.message);
    else {
      setError(null);
      setData(res as ReachSummary);
    }
    setLoading(false);
  }, [period]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return { data, loading, error, reload: load };
}
