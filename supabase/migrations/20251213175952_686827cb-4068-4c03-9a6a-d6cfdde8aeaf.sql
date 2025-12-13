-- 1. Criar tabela de histórico mensal
CREATE TABLE public.affiliate_monthly_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month_year text NOT NULL,
  leads_count integer DEFAULT 0,
  earnings integer DEFAULT 0,
  level_achieved text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(affiliate_id, month_year)
);

-- Enable RLS
ALTER TABLE public.affiliate_monthly_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own history"
ON public.affiliate_monthly_history
FOR SELECT
USING (affiliate_id = get_current_profile_id());

CREATE POLICY "Service role can manage history"
ON public.affiliate_monthly_history
FOR ALL
USING (true)
WITH CHECK (true);

-- 2. Atualizar metas na tabela affiliate_levels
UPDATE public.affiliate_levels SET min_clicks = 0, commission_multiplier = 1.00 WHERE id = 1; -- Bronze: 0-99 = 30%
UPDATE public.affiliate_levels SET min_clicks = 100, commission_multiplier = 1.33 WHERE id = 2; -- Prata: 100-499 = 40%
UPDATE public.affiliate_levels SET min_clicks = 500, commission_multiplier = 1.67 WHERE id = 3; -- Ouro: 500+ = 50%

-- 3. Criar função para calcular nível baseado em leads MENSAIS
CREATE OR REPLACE FUNCTION public.get_affiliate_level_monthly(monthly_leads integer)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.affiliate_levels 
  WHERE min_clicks <= monthly_leads 
  ORDER BY min_clicks DESC 
  LIMIT 1;
$$;

-- 4. Atualizar função update_affiliate_stats_lead para usar leads do mês
CREATE OR REPLACE FUNCTION public.update_affiliate_stats_lead(affiliate_profile_id uuid, earnings integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_clicks_this_month INTEGER;
  new_level_id INTEGER;
BEGIN
  -- Insert or update affiliate stats
  INSERT INTO affiliate_stats (affiliate_id, total_clicks, total_earnings, clicks_this_month, clicks_this_week)
  VALUES (affiliate_profile_id, 1, earnings, 1, 1)
  ON CONFLICT (affiliate_id) DO UPDATE SET
    total_clicks = affiliate_stats.total_clicks + 1,
    total_earnings = affiliate_stats.total_earnings + earnings,
    clicks_this_month = affiliate_stats.clicks_this_month + 1,
    clicks_this_week = affiliate_stats.clicks_this_week + 1,
    updated_at = now();
  
  -- Get leads do mês atual
  SELECT clicks_this_month INTO v_clicks_this_month 
  FROM affiliate_stats 
  WHERE affiliate_id = affiliate_profile_id;
  
  -- Calcular nível baseado em leads do MÊS (não total)
  new_level_id := get_affiliate_level_monthly(v_clicks_this_month);
  
  UPDATE affiliate_stats 
  SET current_level_id = new_level_id,
      level_progress = (
        SELECT ((v_clicks_this_month - al.min_clicks)::NUMERIC / 
                NULLIF((LEAD(al.min_clicks) OVER (ORDER BY al.min_clicks) - al.min_clicks), 0)) * 100
        FROM affiliate_levels al
        WHERE al.id = new_level_id
      )
  WHERE affiliate_id = affiliate_profile_id;
END;
$$;

-- 5. Criar função de arquivamento e reset mensal
CREATE OR REPLACE FUNCTION public.archive_and_reset_monthly_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_previous_month text;
BEGIN
  v_previous_month := to_char(now() - interval '1 day', 'YYYY-MM');
  
  -- Arquivar estatísticas do mês anterior
  INSERT INTO affiliate_monthly_history (affiliate_id, month_year, leads_count, earnings, level_achieved)
  SELECT 
    ast.affiliate_id,
    v_previous_month,
    ast.clicks_this_month,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions 
     WHERE user_id = ast.affiliate_id 
       AND type = 'LEAD_EARNING' 
       AND created_at >= date_trunc('month', now() - interval '1 month')
       AND created_at < date_trunc('month', now())),
    al.name
  FROM affiliate_stats ast
  LEFT JOIN affiliate_levels al ON ast.current_level_id = al.id
  WHERE ast.clicks_this_month > 0
  ON CONFLICT (affiliate_id, month_year) DO UPDATE SET
    leads_count = EXCLUDED.leads_count,
    earnings = EXCLUDED.earnings,
    level_achieved = EXCLUDED.level_achieved;
  
  -- Resetar clicks do mês e voltar para Bronze
  UPDATE affiliate_stats 
  SET clicks_this_month = 0, 
      current_level_id = 1,
      level_progress = 0,
      updated_at = now();
END;
$$;

-- 6. Recalcular níveis atuais de todos afiliados baseado em leads do mês
CREATE OR REPLACE FUNCTION public.recalculate_all_monthly_levels()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_affiliate RECORD;
BEGIN
  FOR v_affiliate IN 
    SELECT affiliate_id, clicks_this_month FROM affiliate_stats
  LOOP
    UPDATE affiliate_stats 
    SET current_level_id = get_affiliate_level_monthly(v_affiliate.clicks_this_month)
    WHERE affiliate_id = v_affiliate.affiliate_id;
  END LOOP;
END;
$$;

-- Executar recálculo inicial
SELECT recalculate_all_monthly_levels();