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
          profiles!offers_company_id_fkey(name, instagram_url)
        `)
        .eq('active', true)
        .is('deleted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('leads_count', { ascending: false });

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
        .select(`
          *,
          offer_scores(ctr_score, quality_score, reputation_score, relevance_score, total_score)
        `)
        .eq('company_id', profile.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      // Map scores to offer object for easier access
      const offersWithScores = (data || []).map((offer: any) => ({
        ...offer,
        ctr_score: offer.offer_scores?.[0]?.ctr_score || 5,
        quality_score: offer.offer_scores?.[0]?.quality_score || 5,
        reputation_score: offer.offer_scores?.[0]?.reputation_score || 5,
        relevance_score: offer.offer_scores?.[0]?.relevance_score || 5,
      }));
      
      setOffers(offersWithScores as Offer[]);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching my offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const uploadImages = async (files: File[], offerId: string): Promise<string[]> => {
    const urls: string[] = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${offerId}/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('offer-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('offer-images')
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        urls.push(urlData.publicUrl);
      }
    }

    return urls;
  };

  const createOffer = async (offerData: {
    title: string;
    description?: string;
    price_old: number;
    price_new: number;
    link_destination: string;
    link_type: LinkType;
    city: string;
    expires_at: string;
    max_cpc_bid?: number;
    images?: File[];
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

      // Create offer first to get ID
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
          expires_at: offerData.expires_at,
          tags: [...autoTags, 'oferta', 'promoção'],
          max_cpc_bid: offerData.max_cpc_bid || 5,
          images: [],
        })
        .select()
        .single();

      if (error) throw error;

      // Upload images if any
      if (offerData.images && offerData.images.length > 0) {
        const imageUrls = await uploadImages(offerData.images, data.id);
        
        if (imageUrls.length > 0) {
          await supabase
            .from('offers')
            .update({ images: imageUrls })
            .eq('id', data.id);
        }
      }

      toast({
        title: "Oferta criada!",
        description: "Sua oferta está ativa e visível para os divulgadores.",
      });

      // Classify company niche in background (non-blocking)
      supabase.functions.invoke('classify-company-niche', {
        body: { company_id: profile.id }
      }).then(({ error }) => {
        if (error) {
          console.log('Niche classification skipped:', error.message);
        } else {
          console.log('Company niche classified successfully');
        }
      }).catch(err => {
        console.log('Niche classification error:', err);
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

  const updateOffer = async (offerId: string, offerData: {
    title?: string;
    description?: string;
    price_old?: number;
    price_new?: number;
    link_destination?: string;
    link_type?: LinkType;
    expires_at?: string;
    newImages?: File[];
    existingImages?: string[];
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
      // Upload new images if any
      let allImageUrls = offerData.existingImages || [];
      
      if (offerData.newImages && offerData.newImages.length > 0) {
        const newImageUrls = await uploadImages(offerData.newImages, offerId);
        allImageUrls = [...allImageUrls, ...newImageUrls];
      }

      // Update offer
      const updateData: Record<string, any> = {};
      if (offerData.title) updateData.title = offerData.title;
      if (offerData.description !== undefined) updateData.description = offerData.description;
      if (offerData.price_old) updateData.price_old = offerData.price_old;
      if (offerData.price_new) updateData.price_new = offerData.price_new;
      if (offerData.link_destination) updateData.link_destination = offerData.link_destination;
      if (offerData.link_type) updateData.link_type = offerData.link_type;
      if (offerData.expires_at) updateData.expires_at = offerData.expires_at;
      updateData.images = allImageUrls;

      // Regenerate tags if title changed
      if (offerData.title) {
        const autoTags = offerData.title
          .toLowerCase()
          .split(' ')
          .filter(word => word.length > 3);
        updateData.tags = [...autoTags, 'oferta', 'promoção'];
      }

      const { data, error } = await supabase
        .from('offers')
        .update(updateData)
        .eq('id', offerId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Oferta atualizada!",
        description: "As alterações foram salvas com sucesso.",
      });


      return data;
    } catch (err) {
      console.error('Error updating offer:', err);
      toast({
        title: "Erro ao atualizar oferta",
        description: (err as Error).message,
        variant: "destructive",
      });
      return null;
    }
  };

  const incrementView = async (offerId: string) => {
    try {
      // Increment the counter
      await supabase.rpc('increment_offer_views', { offer_id: offerId });
      // Log the view for daily tracking
      await supabase.from('offer_views').insert({ offer_id: offerId });
    } catch (err) {
      console.error('Error incrementing view:', err);
    }
  };

  const deleteOffer = async (offerId: string) => {
    try {
      // Soft delete: apenas marca como deletado, preserva histórico de cliques
      const { error } = await supabase
        .from('offers')
        .update({ 
          deleted_at: new Date().toISOString(),
          active: false 
        })
        .eq('id', offerId);

      if (error) throw error;

      toast({
        title: "Oferta deletada",
        description: "A oferta foi removida com sucesso.",
      });


      await fetchMyOffers();
      return true;
    } catch (err) {
      console.error('Error deleting offer:', err);
      toast({
        title: "Erro ao deletar",
        description: (err as Error).message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Only fetch all offers when city is explicitly provided (for client/affiliate views)
  useEffect(() => {
    if (city) {
      fetchOffers();
    }
  }, [city]);

  return {
    offers,
    loading,
    error,
    fetchOffers,
    fetchMyOffers,
    createOffer,
    updateOffer,
    incrementView,
    deleteOffer,
  };
}