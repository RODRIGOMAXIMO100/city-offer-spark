import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Offer, LinkType } from '@/types/database';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export function useOffers(city?: string) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchOffers = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('offers')
        .select(`
          *,
          profiles!offers_company_id_fkey(name)
        `)
        .eq('active', true)
        .order('clicks_count', { ascending: false });

      if (city) {
        query = query.eq('city', city);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      
      setOffers(data as Offer[] || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyOffers = async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('offers')
        .select('*')
        .eq('company_id', profile.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setOffers(data as Offer[] || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching my offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const createOffer = async (offerData: {
    title: string;
    description?: string;
    price_old: number;
    price_new: number;
    link_destination: string;
    link_type: LinkType;
    city: string;
  }) => {
    if (!profile) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Auto-generate tags from title
      const autoTags = offerData.title
        .toLowerCase()
        .split(' ')
        .filter(word => word.length > 3);

      const { data, error } = await supabase
        .from('offers')
        .insert({
          company_id: profile.id,
          title: offerData.title,
          description: offerData.description,
          price_old: offerData.price_old,
          price_new: offerData.price_new,
          link_destination: offerData.link_destination,
          link_type: offerData.link_type,
          city: offerData.city,
          tags: [...autoTags, 'oferta', 'promoção'],
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Oferta criada!",
        description: "Sua oferta está ativa e visível para os divulgadores.",
      });

      return data;
    } catch (err) {
      console.error('Error creating offer:', err);
      toast({
        title: "Erro ao criar oferta",
        description: (err as Error).message,
        variant: "destructive",
      });
      return null;
    }
  };

  const incrementView = async (offerId: string) => {
    try {
      const { data: offer } = await supabase
        .from('offers')
        .select('views_count')
        .eq('id', offerId)
        .single();

      if (offer) {
        await supabase
          .from('offers')
          .update({ views_count: offer.views_count + 1 })
          .eq('id', offerId);
      }
    } catch (err) {
      console.error('Error incrementing view:', err);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [city]);

  return {
    offers,
    loading,
    error,
    fetchOffers,
    fetchMyOffers,
    createOffer,
    incrementView,
  };
}