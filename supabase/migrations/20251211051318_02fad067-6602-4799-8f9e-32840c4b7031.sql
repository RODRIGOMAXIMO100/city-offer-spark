-- Função para recalcular estatísticas de um afiliado específico
CREATE OR REPLACE FUNCTION public.recalculate_affiliate_stats(affiliate_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_clicks INTEGER;
  v_total_earnings INTEGER;
  v_clicks_this_month INTEGER;
  v_clicks_this_week INTEGER;
  v_new_level_id INTEGER;
BEGIN
  -- Contar cliques válidos totais
  SELECT COUNT(*) INTO v_total_clicks
  FROM offer_clicks 
  WHERE affiliate_id = affiliate_profile_id AND click_type = 'MAIN';
  
  -- Somar ganhos totais das transações
  SELECT COALESCE(SUM(amount), 0) INTO v_total_earnings
  FROM transactions 
  WHERE user_id = affiliate_profile_id AND type = 'CLICK_EARNING';
  
  -- Cliques do mês atual
  SELECT COUNT(*) INTO v_clicks_this_month
  FROM offer_clicks 
  WHERE affiliate_id = affiliate_profile_id 
    AND click_type = 'MAIN'
    AND created_at >= date_trunc('month', now());
  
  -- Cliques da semana atual
  SELECT COUNT(*) INTO v_clicks_this_week
  FROM offer_clicks 
  WHERE affiliate_id = affiliate_profile_id 
    AND click_type = 'MAIN'
    AND created_at >= date_trunc('week', now());
  
  -- Calcular nível baseado nos cliques
  v_new_level_id := get_affiliate_level(v_total_clicks);
  
  -- Atualizar ou inserir estatísticas
  INSERT INTO affiliate_stats (affiliate_id, total_clicks, total_earnings, clicks_this_month, clicks_this_week, current_level_id)
  VALUES (affiliate_profile_id, v_total_clicks, v_total_earnings, v_clicks_this_month, v_clicks_this_week, v_new_level_id)
  ON CONFLICT (affiliate_id) DO UPDATE SET
    total_clicks = v_total_clicks,
    total_earnings = v_total_earnings,
    clicks_this_month = v_clicks_this_month,
    clicks_this_week = v_clicks_this_week,
    current_level_id = v_new_level_id,
    updated_at = now();
END;
$$;

-- Função para recalcular TODOS os afiliados
CREATE OR REPLACE FUNCTION public.recalculate_all_affiliate_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_affiliate_id uuid;
BEGIN
  -- Recalcular para todos os afiliados que têm estatísticas
  FOR v_affiliate_id IN 
    SELECT DISTINCT affiliate_id FROM affiliate_stats
  LOOP
    PERFORM recalculate_affiliate_stats(v_affiliate_id);
  END LOOP;
  
  -- Também recalcular para afiliados com cliques mas sem registro em affiliate_stats
  FOR v_affiliate_id IN 
    SELECT DISTINCT affiliate_id FROM offer_clicks 
    WHERE affiliate_id IS NOT NULL 
      AND affiliate_id NOT IN (SELECT affiliate_id FROM affiliate_stats)
  LOOP
    PERFORM recalculate_affiliate_stats(v_affiliate_id);
  END LOOP;
END;
$$;

-- Executar recálculo para corrigir dados existentes
SELECT recalculate_all_affiliate_stats();