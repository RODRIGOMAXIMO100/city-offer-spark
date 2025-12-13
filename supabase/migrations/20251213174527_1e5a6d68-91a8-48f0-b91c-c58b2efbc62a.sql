-- 1. Corrigir contadores existentes baseado em leads válidos
UPDATE offers o
SET leads_count = (
  SELECT COUNT(*) 
  FROM leads l 
  WHERE l.offer_id = o.id AND l.is_valid = true
);

-- 2. Criar função para manter leads_count sincronizado
CREATE OR REPLACE FUNCTION update_offer_leads_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Para INSERT ou UPDATE, recalcula para a nova oferta
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE offers 
    SET leads_count = (
      SELECT COUNT(*) FROM leads 
      WHERE offer_id = NEW.offer_id AND is_valid = true
    )
    WHERE id = NEW.offer_id;
  END IF;
  
  -- Para DELETE ou UPDATE (mudança de oferta), recalcula para a oferta antiga
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.offer_id != NEW.offer_id) THEN
    UPDATE offers 
    SET leads_count = (
      SELECT COUNT(*) FROM leads 
      WHERE offer_id = OLD.offer_id AND is_valid = true
    )
    WHERE id = OLD.offer_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Criar trigger que dispara após mudanças em leads
DROP TRIGGER IF EXISTS trigger_update_offer_leads_count ON leads;
CREATE TRIGGER trigger_update_offer_leads_count
AFTER INSERT OR UPDATE OR DELETE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_offer_leads_count();