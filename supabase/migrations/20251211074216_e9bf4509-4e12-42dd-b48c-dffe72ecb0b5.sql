-- Atualizar função increment_offer_views para também inserir na tabela offer_views
CREATE OR REPLACE FUNCTION public.increment_offer_views(offer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Incrementa o contador na tabela offers
  UPDATE offers SET views_count = views_count + 1 WHERE id = offer_id;
  
  -- Insere registro na tabela offer_views para tracking diário
  INSERT INTO offer_views (offer_id) VALUES (offer_id);
END;
$$;