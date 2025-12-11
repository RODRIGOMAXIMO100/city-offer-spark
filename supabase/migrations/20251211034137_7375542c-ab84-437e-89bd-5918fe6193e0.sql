-- Atualizar função calculate_offer_score: remover Relevância Local, ajustar pesos e critérios de desconto
CREATE OR REPLACE FUNCTION public.calculate_offer_score(p_offer_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_offer RECORD;
  v_company RECORD;
  v_ctr_score numeric := 7.0; -- Nota inicial para ofertas novas
  v_quality_score numeric := 7.0;
  v_reputation_score numeric := 7.0;
  v_total_score numeric;
  v_avg_ctr numeric;
  v_offer_ctr numeric;
  v_discount_pct numeric;
BEGIN
  -- Buscar dados da oferta
  SELECT o.*, p.instagram_url, p.created_at as company_created_at
  INTO v_offer
  FROM offers o
  JOIN profiles p ON o.company_id = p.id
  WHERE o.id = p_offer_id;
  
  IF NOT FOUND THEN
    RETURN 7.0; -- Nota inicial padrão
  END IF;
  
  -- 1. CTR Score (40% do peso) - Compara com média da cidade
  SELECT AVG(CASE WHEN views_count > 0 THEN clicks_count::numeric / views_count ELSE 0 END)
  INTO v_avg_ctr
  FROM offers
  WHERE city = v_offer.city AND active = true AND deleted_at IS NULL;
  
  IF v_offer.views_count > 10 THEN
    v_offer_ctr := v_offer.clicks_count::numeric / v_offer.views_count;
    IF v_avg_ctr > 0 THEN
      v_ctr_score := LEAST(10, GREATEST(4, 7 + (v_offer_ctr - v_avg_ctr) / v_avg_ctr * 3));
    END IF;
  END IF;
  
  -- 2. Quality Score (35% do peso) - Baseado em desconto e completude
  v_discount_pct := (v_offer.price_old - v_offer.price_new) / v_offer.price_old * 100;
  v_quality_score := 5; -- Base
  
  -- Critérios de desconto ajustados: 30%+ máximo, 20%+ bom, 10%+ básico
  IF v_discount_pct >= 30 THEN
    v_quality_score := v_quality_score + 3;
  ELSIF v_discount_pct >= 20 THEN
    v_quality_score := v_quality_score + 2;
  ELSIF v_discount_pct >= 10 THEN
    v_quality_score := v_quality_score + 1;
  END IF;
  
  IF v_offer.description IS NOT NULL AND LENGTH(v_offer.description) > 20 THEN
    v_quality_score := v_quality_score + 1;
  END IF;
  
  IF array_length(v_offer.tags, 1) >= 3 THEN
    v_quality_score := v_quality_score + 1;
  END IF;
  
  v_quality_score := LEAST(10, GREATEST(4, v_quality_score));
  
  -- 3. Reputation Score (25% do peso) - Instagram e tempo na plataforma
  v_reputation_score := 5; -- Base
  
  IF v_offer.instagram_url IS NOT NULL THEN
    v_reputation_score := v_reputation_score + 2;
  END IF;
  
  -- Tempo na plataforma (até 3 pontos extras)
  v_reputation_score := v_reputation_score + LEAST(3, 
    EXTRACT(EPOCH FROM (now() - v_offer.company_created_at)) / (30 * 24 * 60 * 60)); -- 1 ponto por mês, max 3
  
  v_reputation_score := LEAST(10, GREATEST(4, v_reputation_score));
  
  -- Calcular score total ponderado (sem Relevância Local)
  -- CTR: 40%, Qualidade: 35%, Reputação: 25%
  v_total_score := (v_ctr_score * 0.40) + (v_quality_score * 0.35) + (v_reputation_score * 0.25);
  
  -- Garantir nota mínima de 4 e máxima de 10
  v_total_score := LEAST(10, GREATEST(4, v_total_score));
  
  -- Salvar histórico
  INSERT INTO offer_scores (offer_id, ctr_score, quality_score, reputation_score, relevance_score, total_score)
  VALUES (p_offer_id, v_ctr_score, v_quality_score, v_reputation_score, 0, v_total_score);
  
  -- Atualizar score atual na oferta
  UPDATE offers SET current_offer_score = v_total_score WHERE id = p_offer_id;
  
  RETURN v_total_score;
END;
$function$;

-- Atualizar função calculate_real_cpc: CPC = 14 - Nota (automático, sem lance)
CREATE OR REPLACE FUNCTION public.calculate_real_cpc(p_offer_id uuid, p_city text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_offer_score numeric;
  v_real_cpc integer;
BEGIN
  -- Buscar nota da oferta
  SELECT current_offer_score INTO v_offer_score
  FROM offers
  WHERE id = p_offer_id AND active = true AND deleted_at IS NULL;
  
  IF NOT FOUND OR v_offer_score IS NULL THEN
    RETURN 7; -- CPC padrão (14 - 7)
  END IF;
  
  -- Fórmula automática: CPC = 14 - Nota
  -- Nota 10 → CPC 4 (R$ 0,40)
  -- Nota 7 → CPC 7 (R$ 0,70)
  -- Nota 4 → CPC 10 (R$ 1,00)
  v_real_cpc := 14 - v_offer_score;
  
  -- Garantir range de 4 a 10
  v_real_cpc := GREATEST(4, LEAST(10, v_real_cpc));
  
  RETURN v_real_cpc;
END;
$function$;