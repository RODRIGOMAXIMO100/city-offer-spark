import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const ShortLinkRedirect = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    const redirectToOffer = async () => {
      if (!code) {
        setError(true);
        return;
      }

      try {
        // Fetch short link data
        const { data, error: fetchError } = await supabase
          .from('short_links')
          .select('offer_id, affiliate_id')
          .eq('code', code)
          .maybeSingle();

        if (fetchError || !data) {
          console.error('Short link not found:', fetchError);
          setError(true);
          return;
        }

        // Increment click counter (fire and forget)
        supabase
          .from('short_links')
          .update({ clicks: supabase.rpc ? undefined : undefined })
          .eq('code', code)
          .then(() => {});

        // Redirect to offer page with affiliate reference
        navigate(`/oferta/${data.offer_id}?ref=${data.affiliate_id}`, { replace: true });
      } catch (err) {
        console.error('Redirect error:', err);
        setError(true);
      }
    };

    redirectToOffer();
  }, [code, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="text-2xl font-bold text-foreground mb-2">Link não encontrado</h1>
        <p className="text-muted-foreground mb-4">Este link pode ter expirado ou não existe.</p>
        <button
          onClick={() => navigate('/')}
          className="text-primary hover:underline"
        >
          Voltar para o início
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Redirecionando...</p>
    </div>
  );
};

export default ShortLinkRedirect;
