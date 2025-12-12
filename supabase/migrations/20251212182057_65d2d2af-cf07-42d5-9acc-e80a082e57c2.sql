-- Adicionar campos para detecção de VPN/Proxy
ALTER TABLE public.offer_clicks 
ADD COLUMN IF NOT EXISTS is_vpn boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_proxy boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ip_country text,
ADD COLUMN IF NOT EXISTS ip_city text,
ADD COLUMN IF NOT EXISTS ip_org text;

-- Adicionar campos no device_fingerprints para tracking de VPN
ALTER TABLE public.device_fingerprints
ADD COLUMN IF NOT EXISTS vpn_detected_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_vpn_check_at timestamp with time zone;

-- Criar índice para buscas de VPN/Proxy
CREATE INDEX IF NOT EXISTS idx_offer_clicks_vpn 
ON public.offer_clicks(is_vpn) WHERE is_vpn = true;

CREATE INDEX IF NOT EXISTS idx_offer_clicks_proxy 
ON public.offer_clicks(is_proxy) WHERE is_proxy = true;