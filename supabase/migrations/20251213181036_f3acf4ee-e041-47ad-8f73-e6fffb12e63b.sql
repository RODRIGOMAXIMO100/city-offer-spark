-- 1. Criar função para atualizar posições do ranking
CREATE OR REPLACE FUNCTION public.update_ranking_positions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Atualizar posições baseado em clicks_this_month (leads do mês)
  WITH ranked AS (
    SELECT 
      affiliate_id,
      ROW_NUMBER() OVER (ORDER BY clicks_this_month DESC NULLS LAST, total_clicks DESC NULLS LAST) as new_position
    FROM affiliate_stats
    WHERE clicks_this_month > 0
  )
  UPDATE affiliate_stats ast
  SET rank_position = r.new_position
  FROM ranked r
  WHERE ast.affiliate_id = r.affiliate_id;
  
  -- Limpar posição para quem não tem leads no mês
  UPDATE affiliate_stats
  SET rank_position = NULL
  WHERE clicks_this_month = 0 OR clicks_this_month IS NULL;
END;
$$;

-- 2. Adicionar coluna dismissed na tabela user_onboarding
ALTER TABLE public.user_onboarding 
ADD COLUMN IF NOT EXISTS dismissed boolean DEFAULT false;

-- 3. Executar a função imediatamente para popular o ranking
SELECT update_ranking_positions();