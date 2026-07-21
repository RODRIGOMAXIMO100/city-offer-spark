-- =====================================================================
-- CLILIN — CAMADA WHATSAPP + FINANCEIRO do cupom (v2)
-- Complementa o sistema de cupom JA DEPLOYADO (tabela coupons existente).
-- Idempotente. Nao altera nada do que ja funciona.
-- =====================================================================

-- 1) Tipos de transacao do resgate (padrao CLICK_COST/CLICK_EARNING)
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'REDEMPTION_COST';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'REDEMPTION_EARNING';

-- 2) Preco do resgate (mesma unidade do CPC; ajuste no painel depois)
ALTER TABLE public.pricing_config
  ADD COLUMN IF NOT EXISTS redemption_cost integer NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS redemption_affiliate_share numeric NOT NULL DEFAULT 0.60;

-- 3) Atribuicao do divulgador no cupom (hoje ela se PERDE no resgate)
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS affiliate_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_coupons_affiliate ON public.coupons(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_coupons_lead ON public.coupons(lead_id);

DROP POLICY IF EXISTS "Affiliates can view their coupons" ON public.coupons;
CREATE POLICY "Affiliates can view their coupons"
  ON public.coupons FOR SELECT TO authenticated
  USING (affiliate_id = public.get_current_profile_id());

-- 4) Numeros de WhatsApp autorizados a RESGATAR (por empresa)
--    phone: SO DIGITOS COM DDI (ex: 5531999998888) — e como a Meta manda o "from"
CREATE TABLE IF NOT EXISTS public.merchant_whatsapp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone text NOT NULL UNIQUE,
  label text,
  verified boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_merchant_wa_profile ON public.merchant_whatsapp(profile_id);
ALTER TABLE public.merchant_whatsapp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages merchant whatsapp" ON public.merchant_whatsapp;
CREATE POLICY "Service role manages merchant whatsapp"
  ON public.merchant_whatsapp FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Companies manage own whatsapp numbers" ON public.merchant_whatsapp;
CREATE POLICY "Companies manage own whatsapp numbers"
  ON public.merchant_whatsapp FOR ALL TO authenticated
  USING (profile_id = public.get_current_profile_id())
  WITH CHECK (profile_id = public.get_current_profile_id());
DROP POLICY IF EXISTS "Admins manage merchant whatsapp" ON public.merchant_whatsapp;
CREATE POLICY "Admins manage merchant whatsapp"
  ON public.merchant_whatsapp FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

-- 5) Log de mensagens WhatsApp (auditoria/debug) — so backend
CREATE TABLE IF NOT EXISTS public.wa_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL CHECK (direction IN ('IN','OUT')),
  phone text,
  kind text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wa_messages_phone_time ON public.wa_messages(phone, created_at);
ALTER TABLE public.wa_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role manages wa messages" ON public.wa_messages;
CREATE POLICY "Service role manages wa messages"
  ON public.wa_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6) Expiracao automatica de cupons (de hora em hora)
DO $$ BEGIN
  PERFORM cron.schedule(
    'expire-coupons', '30 * * * *',
    $cron$ UPDATE public.coupons SET status='EXPIRED'
           WHERE status='ISSUED' AND expires_at < now(); $cron$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'cron ja existe ou pg_cron indisponivel: %', SQLERRM;
END $$;
