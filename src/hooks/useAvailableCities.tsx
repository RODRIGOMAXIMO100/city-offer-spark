import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BRAZIL_STATES, BRAZIL_CITIES } from '@/data/brazilLocations';

interface AvailableCity {
  id: string;
  state_code: string;
  city_name: string;
  active: boolean;
  priority: number;
  scheduled_activation: string | null;
  waitlist_count: number;
}

export function useAvailableCities(selectedState?: string) {
  const [cities, setCities] = useState<AvailableCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('available_cities')
        .select('*')
        .eq('active', true)
        .order('city_name');

      if (error) throw error;
      setCities(data || []);
    } catch (err) {
      console.error('Error fetching cities:', err);
      setError('Erro ao carregar cidades');
    } finally {
      setLoading(false);
    }
  };

  const availableStates = useMemo(() => {
    const statesWithActiveCities = new Set(cities.map(c => c.state_code));
    return BRAZIL_STATES
      .filter(state => statesWithActiveCities.has(state.code))
      .map(state => state.code)
      .sort();
  }, [cities]);

  const citiesForState = useMemo(() => {
    if (!selectedState) return [];
    return cities
      .filter(c => c.state_code === selectedState)
      .map(c => c.city_name)
      .sort();
  }, [cities, selectedState]);

  const isCityAvailable = (state: string, city: string): boolean => {
    return cities.some(c => c.state_code === state && c.city_name === city && c.active);
  };

  return {
    cities,
    availableStates,
    citiesForState,
    loading,
    error,
    isCityAvailable,
    refetch: fetchCities
  };
}

export function useAllCitiesAdmin() {
  const [cities, setCities] = useState<AvailableCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCities: 0,
    activeCities: 0,
    scheduledCities: 0,
    totalWaitlist: 0
  });

  useEffect(() => {
    fetchAllCities();
  }, []);

  const fetchAllCities = async () => {
    try {
      setLoading(true);

      // PostgREST tem limite padrão de 1000 linhas por request.
      // Para garantir que o admin veja TODAS as cidades, buscamos em páginas.
      const pageSize = 1000;
      let from = 0;
      let all: AvailableCity[] = [];

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data, error } = await supabase
          .from('available_cities')
          .select('*')
          .order('state_code')
          .order('city_name')
          .range(from, from + pageSize - 1);

        if (error) throw error;

        const chunk = (data || []) as AvailableCity[];
        all = all.concat(chunk);

        if (chunk.length < pageSize) break;
        from += pageSize;
      }

      setCities(all);

      setStats({
        totalCities: all.length,
        activeCities: all.filter(c => c.active).length,
        scheduledCities: all.filter(c => c.scheduled_activation).length,
        totalWaitlist: all.reduce((sum, c) => sum + (c.waitlist_count || 0), 0)
      });
    } catch (err) {
      console.error('Error fetching all cities:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCity = async (cityId: string, active: boolean) => {
    const { error } = await supabase
      .from('available_cities')
      .update({ 
        active,
        activated_at: active ? new Date().toISOString() : null
      })
      .eq('id', cityId);

    if (error) throw error;
    await fetchAllCities();
  };

  const updateSchedule = async (cityId: string, date: string | null) => {
    const { error } = await supabase
      .from('available_cities')
      .update({ scheduled_activation: date })
      .eq('id', cityId);

    if (error) throw error;
    await fetchAllCities();
  };

  const bulkToggleState = async (stateCode: string, active: boolean) => {
    const { error } = await supabase
      .from('available_cities')
      .update({ 
        active,
        activated_at: active ? new Date().toISOString() : null
      })
      .eq('state_code', stateCode);

    if (error) throw error;
    await fetchAllCities();
  };

  const seedCities = async () => {
    // Inserir todas as cidades do BRAZIL_CITIES
    const citiesToInsert = Object.entries(BRAZIL_CITIES).flatMap(([stateCode, cities]) => 
      cities.map(city => ({
        state_code: stateCode,
        city_name: city,
        active: false,
        priority: 0
      }))
    );

    // Inserir em batches de 500
    for (let i = 0; i < citiesToInsert.length; i += 500) {
      const batch = citiesToInsert.slice(i, i + 500);
      const { error } = await supabase
        .from('available_cities')
        .upsert(batch, { 
          onConflict: 'state_code,city_name',
          ignoreDuplicates: true 
        });
      
      if (error) throw error;
    }

    await fetchAllCities();
  };

  return {
    cities,
    stats,
    loading,
    toggleCity,
    updateSchedule,
    bulkToggleState,
    seedCities,
    refetch: fetchAllCities
  };
}
