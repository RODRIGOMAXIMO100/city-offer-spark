-- Criar tabela de configuração de preços
CREATE TABLE public.pricing_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  min_cpc integer NOT NULL DEFAULT 4,
  max_cpc integer NOT NULL DEFAULT 15,
  default_cpc integer NOT NULL DEFAULT 5,
  affiliate_share numeric NOT NULL DEFAULT 0.60,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Inserir configuração padrão
INSERT INTO public.pricing_config (min_cpc, max_cpc, default_cpc, affiliate_share)
VALUES (4, 15, 5, 0.60);

-- Habilitar RLS
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

-- Política: qualquer um pode ler configurações
CREATE POLICY "Anyone can view pricing config"
ON public.pricing_config FOR SELECT
USING (true);

-- Política: apenas admins podem atualizar
CREATE POLICY "Admins can update pricing config"
ON public.pricing_config FOR UPDATE
USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Adicionar colunas na tabela offers
ALTER TABLE public.offers 
ADD COLUMN max_cpc_bid integer NOT NULL DEFAULT 5,
ADD COLUMN current_offer_score numeric NOT NULL DEFAULT 5.0;

-- Criar tabela de histórico de scores
CREATE TABLE public.offer_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  ctr_score numeric NOT NULL DEFAULT 5.0,
  quality_score numeric NOT NULL DEFAULT 5.0,
  reputation_score numeric NOT NULL DEFAULT 5.0,
  relevance_score numeric NOT NULL DEFAULT 5.0,
  total_score numeric NOT NULL DEFAULT 5.0,
  calculated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.offer_scores ENABLE ROW LEVEL SECURITY;

-- Política: empresas podem ver scores das suas ofertas
CREATE POLICY "Companies can view their offer scores"
ON public.offer_scores FOR SELECT
USING (offer_id IN (SELECT id FROM offers WHERE company_id = get_current_profile_id()));

-- Política: sistema pode gerenciar scores
CREATE POLICY "System can manage offer scores"
ON public.offer_scores FOR ALL
USING (true)
WITH CHECK (true);

-- Criar índice para performance
CREATE INDEX idx_offer_scores_offer_id ON public.offer_scores(offer_id);
CREATE INDEX idx_offer_scores_calculated_at ON public.offer_scores(calculated_at DESC);

-- Função para calcular Offer Score
CREATE OR REPLACE FUNCTION public.calculate_offer_score(p_offer_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_offer RECORD;
  v_company RECORD;
  v_ctr_score numeric := 5.0;
  v_quality_score numeric := 5.0;
  v_reputation_score numeric := 5.0;
  v_relevance_score numeric := 5.0;
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
    RETURN 5.0;
  END IF;
  
  -- 1. CTR Score (40% do peso) - Compara com média da cidade
  SELECT AVG(CASE WHEN views_count > 0 THEN clicks_count::numeric / views_count ELSE 0 END)
  INTO v_avg_ctr
  FROM offers
  WHERE city = v_offer.city AND active = true AND deleted_at IS NULL;
  
  IF v_offer.views_count > 10 THEN
    v_offer_ctr := v_offer.clicks_count::numeric / v_offer.views_count;
    IF v_avg_ctr > 0 THEN
      v_ctr_score := LEAST(10, GREATEST(1, 5 + (v_offer_ctr - v_avg_ctr) / v_avg_ctr * 5));
    END IF;
  END IF;
  
  -- 2. Quality Score (30% do peso) - Baseado em desconto e completude
  v_discount_pct := (v_offer.price_old - v_offer.price_new) / v_offer.price_old * 100;
  v_quality_score := 3; -- Base
  
  IF v_discount_pct >= 50 THEN
    v_quality_score := v_quality_score + 3;
  ELSIF v_discount_pct >= 30 THEN
    v_quality_score := v_quality_score + 2;
  ELSIF v_discount_pct >= 15 THEN
    v_quality_score := v_quality_score + 1;
  END IF;
  
  IF v_offer.description IS NOT NULL AND LENGTH(v_offer.description) > 20 THEN
    v_quality_score := v_quality_score + 1;
  END IF;
  
  IF array_length(v_offer.tags, 1) >= 3 THEN
    v_quality_score := v_quality_score + 1;
  END IF;
  
  v_quality_score := LEAST(10, v_quality_score);
  
  -- 3. Reputation Score (20% do peso) - Instagram e tempo na plataforma
  v_reputation_score := 4; -- Base
  
  IF v_offer.instagram_url IS NOT NULL THEN
    v_reputation_score := v_reputation_score + 2;
  END IF;
  
  -- Tempo na plataforma (até 4 pontos extras)
  v_reputation_score := v_reputation_score + LEAST(4, 
    EXTRACT(EPOCH FROM (now() - v_offer.company_created_at)) / (30 * 24 * 60 * 60)); -- 1 ponto por mês, max 4
  
  v_reputation_score := LEAST(10, v_reputation_score);
  
  -- 4. Relevance Score (10% do peso) - Performance recente
  v_relevance_score := 5; -- Base, pode ser expandido
  
  -- Calcular score total ponderado
  v_total_score := (v_ctr_score * 0.40) + (v_quality_score * 0.30) + 
                   (v_reputation_score * 0.20) + (v_relevance_score * 0.10);
  
  -- Salvar histórico
  INSERT INTO offer_scores (offer_id, ctr_score, quality_score, reputation_score, relevance_score, total_score)
  VALUES (p_offer_id, v_ctr_score, v_quality_score, v_reputation_score, v_relevance_score, v_total_score);
  
  -- Atualizar score atual na oferta
  UPDATE offers SET current_offer_score = v_total_score WHERE id = p_offer_id;
  
  RETURN v_total_score;
END;
$$;

-- Função para calcular CPC real (estilo Google Ads)
CREATE OR REPLACE FUNCTION public.calculate_real_cpc(p_offer_id uuid, p_city text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_my_offer RECORD;
  v_my_rank numeric;
  v_next_rank numeric;
  v_real_cpc numeric;
  v_config RECORD;
BEGIN
  -- Buscar configuração
  SELECT * INTO v_config FROM pricing_config LIMIT 1;
  
  -- Buscar minha oferta
  SELECT id, max_cpc_bid, current_offer_score,
         (max_cpc_bid * current_offer_score) as offer_rank
  INTO v_my_offer
  FROM offers
  WHERE id = p_offer_id AND active = true AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN v_config.default_cpc;
  END IF;
  
  v_my_rank := v_my_offer.offer_rank;
  
  -- Buscar o próximo competidor (rank imediatamente abaixo)
  SELECT (max_cpc_bid * current_offer_score) as offer_rank
  INTO v_next_rank
  FROM offers
  WHERE city = p_city 
    AND active = true 
    AND deleted_at IS NULL
    AND id != p_offer_id
    AND (max_cpc_bid * current_offer_score) < v_my_rank
  ORDER BY (max_cpc_bid * current_offer_score) DESC
  LIMIT 1;
  
  IF v_next_rank IS NULL THEN
    -- Sou o único ou o último, pago o mínimo
    RETURN v_config.min_cpc;
  END IF;
  
  -- Fórmula Google Ads: (Rank do próximo / Meu Score) + 0.01
  v_real_cpc := (v_next_rank / v_my_offer.current_offer_score) + 0.01;
  
  -- Garantir que está entre min e max, e não excede o lance máximo
  v_real_cpc := GREATEST(v_config.min_cpc, LEAST(v_my_offer.max_cpc_bid, v_real_cpc));
  
  RETURN CEIL(v_real_cpc);
END;
$$;

-- Função para recalcular todos os scores (para job)
CREATE OR REPLACE FUNCTION public.recalculate_all_offer_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_offer_id uuid;
BEGIN
  FOR v_offer_id IN 
    SELECT id FROM offers WHERE active = true AND deleted_at IS NULL
  LOOP
    PERFORM calculate_offer_score(v_offer_id);
  END LOOP;
  
  -- Limpar histórico antigo (manter últimos 7 dias)
  DELETE FROM offer_scores WHERE calculated_at < now() - interval '7 days';
END;
$$;