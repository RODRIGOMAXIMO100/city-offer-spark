import { supabase } from '@/integrations/supabase/client';

export interface CityRow {
  id: string;
  state_code: string;
  city_name: string;
  active: boolean;
}

// O Supabase devolve no maximo 1.000 linhas por consulta, e a tabela tem as
// 5.571 cidades do Brasil. Busca em paginas para nao cortar a lista.
export async function fetchAllCities(activeOnly = false): Promise<CityRow[]> {
  const pageSize = 1000;
  let from = 0;
  let all: CityRow[] = [];

  while (true) {
    let query = supabase
      .from('available_cities')
      .select('id, state_code, city_name, active')
      .order('state_code')
      .order('city_name')
      .range(from, from + pageSize - 1);
    if (activeOnly) query = query.eq('active', true);

    const { data, error } = await query;
    if (error) throw error;

    const chunk = (data || []) as CityRow[];
    all = all.concat(chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
  }

  return all;
}
