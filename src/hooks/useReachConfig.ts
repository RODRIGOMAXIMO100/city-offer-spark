import { useEffect, useState } from 'react';
import { reachDb, DEFAULT_REACH_CONFIG, type ReachConfig } from '@/lib/reach';

// Regras das campanhas de alcance (preco por mil, fundo, metas e premios)
export function useReachConfig() {
  const [config, setConfig] = useState<ReachConfig>(DEFAULT_REACH_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await reachDb.rpc('reach_config');
      if (cancelled) return;
      const row = Array.isArray(data) ? data[0] : data;
      if (row) {
        setConfig({
          cpm_cents: Number(row.cpm_cents),
          prize_share: Number(row.prize_share),
          min_goal_views: Number(row.min_goal_views),
          min_cycle_points: Number(row.min_cycle_points),
          prizes_cents: (row.prizes_cents ?? []).map(Number),
        });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { config, loading };
}
