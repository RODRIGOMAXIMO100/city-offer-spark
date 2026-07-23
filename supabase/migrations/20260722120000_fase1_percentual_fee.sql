-- ============================================================
-- FASE 1 — Cobranca percentual + validade configuravel do cupom
-- ============================================================
-- Modelo: taxa = max(fee_min_cents ; price_new * fee_percent)
--         cobrada a CADA resgate de cupom.
-- Divisao: divulgador 50% (Bronze) ate 70% (Diamante); plataforma fica com o resto.
-- A taxa e CONGELADA no cupom no momento da emissao (issue-coupon):
-- se a empresa mudar o preco depois, o cupom na mao do cliente mantem o valor combinado.

-- ---------- 1. pricing_config: parametros globais da taxa ----------
ALTER TABLE public.pricing_config
  ADD COLUMN IF NOT EXISTS fee_percent    numeric NOT NULL DEFAULT 0.15,
  ADD COLUMN IF NOT EXISTS fee_min_cents  integer NOT NULL DEFAULT 300;

-- share base do divulgador passa de 0.70 para 0.50 (curva nova 50% -> 70%)
UPDATE public.pricing_config SET redemption_affiliate_share = 0.50;

-- ---------- 2. offers: validade do cupom definida pela empresa ----------
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS coupon_valid_hours integer NOT NULL DEFAULT 168; -- 168h = 7 dias

COMMENT ON COLUMN public.offers.coupon_valid_hours IS
  'Por quantas horas o cupom emitido continua valido. Ex: 24 = ate amanha, 72 = 3 dias, 168 = 7 dias.';

-- ---------- 3. coupons: taxa congelada na emissao ----------
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS fee_cents integer;

COMMENT ON COLUMN public.coupons.fee_cents IS
  'Taxa (em centavos) travada no momento da emissao do cupom. O resgate cobra ESTE valor.';

-- backfill: cupons emitidos antes desta migration recebem a taxa calculada pelo preco atual da oferta
UPDATE public.coupons c
SET fee_cents = GREATEST(300, ROUND(o.price_new * 100 * 0.15))
FROM public.offers o
WHERE c.offer_id = o.id AND c.fee_cents IS NULL;

-- ---------- 4. curva de niveis: 50% -> 70% ----------
-- fatia do divulgador = redemption_affiliate_share (0.50) * commission_multiplier
UPDATE public.affiliate_levels SET commission_multiplier=1.00, benefits=ARRAY['Comissao de 50%','Comece a indicar']    WHERE id=1; -- Bronze   50%
UPDATE public.affiliate_levels SET commission_multiplier=1.10, benefits=ARRAY['Comissao de 55%','Destaque no ranking'] WHERE id=2; -- Prata    55%
UPDATE public.affiliate_levels SET commission_multiplier=1.20, benefits=ARRAY['Comissao de 60%','Suporte prioritario'] WHERE id=3; -- Ouro     60%
UPDATE public.affiliate_levels SET commission_multiplier=1.30, benefits=ARRAY['Comissao de 65%','Ofertas exclusivas']  WHERE id=4; -- Platina  65%
UPDATE public.affiliate_levels SET commission_multiplier=1.40, benefits=ARRAY['Comissao de 70%','Bonus mensais']       WHERE id=5; -- Diamante 70%

-- ---------- 5. funcao de calculo da taxa (fonte unica da verdade) ----------
CREATE OR REPLACE FUNCTION public.calc_redemption_fee(p_offer_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price    numeric;
  v_percent  numeric;
  v_min      integer;
BEGIN
  SELECT price_new INTO v_price FROM public.offers WHERE id = p_offer_id;
  IF v_price IS NULL THEN RETURN NULL; END IF;

  SELECT fee_percent, fee_min_cents INTO v_percent, v_min
  FROM public.pricing_config LIMIT 1;

  v_percent := COALESCE(v_percent, 0.15);
  v_min     := COALESCE(v_min, 300);

  RETURN GREATEST(v_min, ROUND(v_price * 100 * v_percent));
END;
$$;

COMMENT ON FUNCTION public.calc_redemption_fee IS
  'Taxa em centavos de um resgate da oferta: max(fee_min_cents, price_new * fee_percent).';
