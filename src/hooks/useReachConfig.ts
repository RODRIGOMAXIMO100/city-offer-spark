import { useEffect, useState } from 'react';
import { reachDb, DEFAULT_REACH_CONFIG, type ReachConfig } from '@/lib/reach';

// Regras das campanhas (preco por mil, fundo, metas, premios e regras da onda)
export function useReachConfig() {
  const [config, setConfig] = useState<ReachConfig>(DEFAULT_REACH_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data }, { data: ondaData }] = await Promise.all([
        reachDb.rpc('reach_config'),
        reachDb.rpc('reach_onda_config'),
      ]);
      if (cancelled) return;
      const row = Array.isArray(data) ? data[0] : data;
      const onda = Array.isArray(ondaData) ? ondaData[0] : ondaData;
      setConfig((prev) => ({
        ...prev,
        ...(row && {
          cpm_cents: Number(row.cpm_cents),
          prize_share: Number(row.prize_share),
          min_goal_views: Number(row.min_goal_views),
          min_cycle_points: Number(row.min_cycle_points),
          prizes_cents: (row.prizes_cents ?? []).map(Number),
        }),
        ...(onda && {
          count_days: Number(onda.count_days),
          post_cap_share: Number(onda.post_cap_share),
          early_hours: Number(onda.early_hours),
          early_bonus: Number(onda.early_bonus),
          max_window_days: Number(onda.max_window_days),
        }),
      }));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { config, loading };
}
