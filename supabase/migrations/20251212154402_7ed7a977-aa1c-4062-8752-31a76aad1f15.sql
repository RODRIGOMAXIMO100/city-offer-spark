-- Criar função trigger para calcular score automaticamente
CREATE OR REPLACE FUNCTION public.calculate_offer_score_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Calcular score para a oferta inserida/atualizada
  PERFORM calculate_offer_score(NEW.id);
  RETURN NEW;
END;
$function$;

-- Criar trigger para calcular score na criação de ofertas
DROP TRIGGER IF EXISTS trigger_calculate_offer_score_insert ON offers;
CREATE TRIGGER trigger_calculate_offer_score_insert
AFTER INSERT ON offers
FOR EACH ROW
EXECUTE FUNCTION calculate_offer_score_trigger();

-- Criar trigger para recalcular score quando campos relevantes são atualizados
DROP TRIGGER IF EXISTS trigger_calculate_offer_score_update ON offers;
CREATE TRIGGER trigger_calculate_offer_score_update
AFTER UPDATE OF description, tags, price_old, price_new, images ON offers
FOR EACH ROW
EXECUTE FUNCTION calculate_offer_score_trigger();