-- Migração de créditos para centavos (R$)
-- 1 crédito antigo = R$ 0,10 = 10 centavos

-- Atualizar balances (créditos * 10 = centavos)
UPDATE profiles SET balance = balance * 10 WHERE balance > 0;

-- Atualizar transactions (créditos * 10 = centavos)
UPDATE transactions SET amount = amount * 10 WHERE amount > 0;

-- Atualizar withdrawals (créditos * 10 = centavos)
UPDATE withdrawals SET amount = amount * 10 WHERE amount > 0;

-- Atualizar affiliate_stats (créditos * 10 = centavos)
UPDATE affiliate_stats SET total_earnings = total_earnings * 10 WHERE total_earnings > 0;

-- Atualizar payments (amount_credits agora são centavos)
UPDATE payments SET amount_credits = amount_credits * 10 WHERE amount_credits > 0;

-- Atualizar função calculate_real_cpc para retornar centavos (40-100)
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
    RETURN 70; -- CPC padrão em centavos (R$ 0,70)
  END IF;
  
  -- Fórmula automática: CPC = (14 - Nota) * 10 centavos
  -- Nota 10 → CPC 40 centavos (R$ 0,40)
  -- Nota 7 → CPC 70 centavos (R$ 0,70)
  -- Nota 4 → CPC 100 centavos (R$ 1,00)
  v_real_cpc := (14 - v_offer_score) * 10;
  
  -- Garantir range de 40 a 100 centavos
  v_real_cpc := GREATEST(40, LEAST(100, v_real_cpc));
  
  RETURN v_real_cpc;
END;
$function$;

-- Atualizar função update_affiliate_stats para trabalhar com centavos
CREATE OR REPLACE FUNCTION public.update_affiliate_stats(affiliate_profile_id uuid, earnings integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_total_clicks INTEGER;
  new_level_id INTEGER;
BEGIN
  -- Insert or update affiliate stats (earnings já em centavos)
  INSERT INTO affiliate_stats (affiliate_id, total_clicks, total_earnings, clicks_this_month, clicks_this_week)
  VALUES (affiliate_profile_id, 1, earnings, 1, 1)
  ON CONFLICT (affiliate_id) DO UPDATE SET
    total_clicks = affiliate_stats.total_clicks + 1,
    total_earnings = affiliate_stats.total_earnings + earnings,
    clicks_this_month = affiliate_stats.clicks_this_month + 1,
    clicks_this_week = affiliate_stats.clicks_this_week + 1,
    updated_at = now();
  
  -- Get new total clicks
  SELECT total_clicks INTO new_total_clicks FROM affiliate_stats WHERE affiliate_id = affiliate_profile_id;
  
  -- Calculate and update level
  new_level_id := get_affiliate_level(new_total_clicks);
  
  UPDATE affiliate_stats 
  SET current_level_id = new_level_id,
      level_progress = (
        SELECT ((new_total_clicks - al.min_clicks)::NUMERIC / 
                NULLIF((LEAD(al.min_clicks) OVER (ORDER BY al.min_clicks) - al.min_clicks), 0)) * 100
        FROM affiliate_levels al
        WHERE al.id = new_level_id
      )
  WHERE affiliate_id = affiliate_profile_id;
END;
$function$;