-- Adicionar campos de geolocalização para tracking anti-fraude
ALTER TABLE public.offer_clicks 
ADD COLUMN IF NOT EXISTS timezone_offset integer,
ADD COLUMN IF NOT EXISTS expected_timezone text,
ADD COLUMN IF NOT EXISTS geo_mismatch boolean DEFAULT false;

-- Adicionar campo de geolocalização no device_fingerprints
ALTER TABLE public.device_fingerprints
ADD COLUMN IF NOT EXISTS expected_country text,
ADD COLUMN IF NOT EXISTS browser_timezone text,
ADD COLUMN IF NOT EXISTS geo_mismatch_count integer DEFAULT 0;

-- Criar índice para buscas de geo_mismatch
CREATE INDEX IF NOT EXISTS idx_offer_clicks_geo_mismatch 
ON public.offer_clicks(geo_mismatch) WHERE geo_mismatch = true;

-- Criar índice para busca de fraud_score alto em withdrawals
CREATE INDEX IF NOT EXISTS idx_withdrawals_high_fraud 
ON public.withdrawals(fraud_score) WHERE fraud_score > 50;