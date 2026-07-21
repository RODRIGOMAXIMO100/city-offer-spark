-- =====================================================================
-- CLILIN — PIVO PARA PAGAMENTO POR RESGATE (pay-per-redeem)
-- Bounty por oferta + billing_mode + curva de niveis monotonica (por resgates).
-- Idempotente. Assume schema pos-v2 (whatsapp_coupon_layer) mas nao depende dele.
-- Aplicar DEPOIS de 20260721143000_whatsapp_coupon_layer.sql.
-- Validada no projeto spare antes do deploy.
-- =====================================================================

-- 1) BOUNTY POR OFERTA: quanto a empresa paga por cliente convertido (centavos).
--    Piso de R$5,00 e default de R$8,00 sao aplicados na criacao/edicao da oferta.
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS redemption_cost integer NOT NULL DEFAULT 800;
UPDATE public.offers SET redemption_cost = 800 WHERE redemption_cost IS NULL;

-- 2) MODELO DE COBRANCA: REDEMPTION_ONLY (novo) desliga a cobranca de clique/lead.
--    Clique e lead seguem sendo REGISTRADOS (metrica + atribuicao do divulgador),
--    mas nao debitam a empresa nem pagam comissao — isso acontece so no RESGATE.
--    Fallback global de bounty = R$8; split do divulgador = 70% no lancamento.
ALTER TABLE public.pricing_config
  ADD COLUMN IF NOT EXISTS billing_mode text NOT NULL DEFAULT 'REDEMPTION_ONLY',
  ADD COLUMN IF NOT EXISTS redemption_cost integer NOT NULL DEFAULT 800,
  ADD COLUMN IF NOT EXISTS redemption_affiliate_share numeric NOT NULL DEFAULT 0.70;

UPDATE public.pricing_config
  SET billing_mode = 'REDEMPTION_ONLY',
      redemption_affiliate_share = 0.70,
      redemption_cost = GREATEST(COALESCE(redemption_cost, 800), 500);

-- 3) CURVA DE NIVEIS: monotonica, regua local, contada por RESGATES.
--    min_clicks passa a significar "resgates acumulados" (update_affiliate_stats
--    e chamado no resgate, nao mais no clique). Textos batem com os multiplicadores.
UPDATE public.affiliate_levels SET name='Bronze',   min_clicks=0,   commission_multiplier=1.00, badge_color='#CD7F32', benefits=ARRAY['Comissao padrao','Comece a indicar'] WHERE id=1;
UPDATE public.affiliate_levels SET name='Prata',     min_clicks=10,  commission_multiplier=1.10, badge_color='#C0C0C0', benefits=ARRAY['Comissao +10%','Destaque no ranking'] WHERE id=2;
UPDATE public.affiliate_levels SET name='Ouro',      min_clicks=30,  commission_multiplier=1.25, badge_color='#FFD700', benefits=ARRAY['Comissao +25%','Suporte prioritario'] WHERE id=3;
UPDATE public.affiliate_levels SET name='Platina',   min_clicks=75,  commission_multiplier=1.40, badge_color='#E5E4E2', benefits=ARRAY['Comissao +40%','Ofertas exclusivas'] WHERE id=4;
UPDATE public.affiliate_levels SET name='Diamante',  min_clicks=150, commission_multiplier=1.60, badge_color='#B9F2FF', benefits=ARRAY['Comissao +60%','Bonus mensais'] WHERE id=5;
