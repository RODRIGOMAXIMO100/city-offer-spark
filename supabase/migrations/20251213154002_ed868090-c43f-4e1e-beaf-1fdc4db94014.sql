-- 1. Adicionar novos tipos de transação
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'LEAD_COST';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'LEAD_EARNING';

-- 2. Criar tabela de leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  affiliate_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  phone_whatsapp TEXT NOT NULL,
  client_ip TEXT,
  user_agent TEXT,
  device_id TEXT,
  fingerprint_hash TEXT,
  session_token TEXT,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Criar tabela de rate limits para leads
CREATE TABLE public.lead_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_hash TEXT NOT NULL,
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(phone_hash, offer_id)
);

-- 4. Adicionar coluna leads_count na tabela offers
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS leads_count INTEGER DEFAULT 0;

-- 5. Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_rate_limits ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies para leads
CREATE POLICY "Companies can view leads of their offers"
ON public.leads FOR SELECT
USING (offer_id IN (SELECT id FROM offers WHERE company_id = get_current_profile_id()));

CREATE POLICY "Admins can view all leads"
ON public.leads FOR SELECT
USING (has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Service role can manage leads"
ON public.leads FOR ALL
USING (true) WITH CHECK (true);

-- 7. RLS Policies para lead_rate_limits
CREATE POLICY "Service role can manage lead rate limits"
ON public.lead_rate_limits FOR ALL
USING (true) WITH CHECK (true);

-- 8. Índices para performance
CREATE INDEX idx_leads_offer_id ON public.leads(offer_id);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_phone ON public.leads(phone_whatsapp);
CREATE INDEX idx_lead_rate_limits_phone_offer ON public.lead_rate_limits(phone_hash, offer_id);

-- 9. Função para calcular CPL dinâmico (R$ 1,00 a R$ 3,00)
CREATE OR REPLACE FUNCTION public.calculate_real_cpl(p_offer_id uuid, p_city text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_offer_score numeric;
  v_real_cpl integer;
BEGIN
  SELECT current_offer_score INTO v_offer_score
  FROM offers
  WHERE id = p_offer_id AND active = true AND deleted_at IS NULL;
  
  IF NOT FOUND OR v_offer_score IS NULL THEN
    RETURN 150; -- CPL padrão em centavos (R$ 1,50)
  END IF;
  
  -- Fórmula: CPL = (14 - Nota) * 33 centavos (aprox)
  -- Nota 10 → CPL 100 centavos (R$ 1,00)
  -- Nota 7 → CPL 200 centavos (R$ 2,00)
  -- Nota 4 → CPL 300 centavos (R$ 3,00)
  v_real_cpl := ROUND((14 - v_offer_score) * 33.33);
  
  -- Garantir range de 100 a 300 centavos
  v_real_cpl := GREATEST(100, LEAST(300, v_real_cpl));
  
  RETURN v_real_cpl;
END;
$$;

-- 10. Função para incrementar leads_count
CREATE OR REPLACE FUNCTION public.increment_offer_leads(offer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE offers SET leads_count = leads_count + 1 WHERE id = offer_id;
END;
$$;

-- 11. Atualizar função update_affiliate_stats para suportar leads
CREATE OR REPLACE FUNCTION public.update_affiliate_stats_lead(affiliate_profile_id uuid, earnings integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  
  -- Get new total clicks (que agora representa leads)
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
$$;