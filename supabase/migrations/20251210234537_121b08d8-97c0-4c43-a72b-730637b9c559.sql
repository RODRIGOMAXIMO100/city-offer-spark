-- Tabela para rastrear rate limits de cliques por IP/oferta
CREATE TABLE public.click_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  fingerprint TEXT,
  click_count INTEGER DEFAULT 1,
  first_click_at TIMESTAMPTZ DEFAULT now(),
  last_click_at TIMESTAMPTZ DEFAULT now(),
  blocked BOOLEAN DEFAULT false,
  UNIQUE(offer_id, ip_address)
);

-- Índices para performance
CREATE INDEX idx_click_rate_limits_ip ON public.click_rate_limits(ip_address);
CREATE INDEX idx_click_rate_limits_offer ON public.click_rate_limits(offer_id);
CREATE INDEX idx_click_rate_limits_last_click ON public.click_rate_limits(last_click_at);

-- RLS
ALTER TABLE public.click_rate_limits ENABLE ROW LEVEL SECURITY;

-- Apenas o sistema pode inserir/atualizar (via service role)
CREATE POLICY "System can manage rate limits"
ON public.click_rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Função para limpar rate limits antigos (mais de 24h)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.click_rate_limits 
  WHERE last_click_at < NOW() - INTERVAL '24 hours';
END;
$$;