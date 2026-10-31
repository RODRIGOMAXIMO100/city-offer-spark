-- =====================================================================
-- CLILIN — CAMPANHAS DE ALCANCE (rede de divulgadores premiados)
--
-- Modelo:
-- * A empresa cria uma campanha (palavra-chave, cidades, redes, meta de
--   visualizacoes, janela). O valor da meta fica RESERVADO do saldo dela.
-- * O divulgador posta no proprio perfil e envia o link. O post passa pela
--   conferencia (leitura automatica + aprovacao no admin).
-- * Post aprovado: a empresa paga pelas visualizacoes verificadas (CPM),
--   ate o limite reservado. 35% do valor cobrado vai para o fundo de premios
--   do mes. O divulgador ganha pontos (1 visualizacao = 1 ponto).
-- * Fim do mes: o admin fecha o ciclo. Os melhores de cada liga (por tamanho
--   de perfil) que bateram a meta minima recebem o premio no saldo e sacam
--   por Pix pelo fluxo de saque que ja existe. Sem sorteio.
-- * Encerrada a campanha, o que nao foi gasto volta para o saldo da empresa.
--
-- Valores monetarios em centavos. Escrita so por funcoes SECURITY DEFINER.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Configuracao (linha unica em pricing_config)
-- ---------------------------------------------------------------------
ALTER TABLE public.pricing_config
  ADD COLUMN IF NOT EXISTS reach_cpm_cents integer NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS reach_prize_share numeric NOT NULL DEFAULT 0.35,
  ADD COLUMN IF NOT EXISTS reach_min_goal_views integer NOT NULL DEFAULT 20000,
  ADD COLUMN IF NOT EXISTS reach_min_cycle_points integer NOT NULL DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS reach_prizes_cents integer[] NOT NULL DEFAULT '{15000,8000,5000}';

-- Le a configuracao com valores padrao se a tabela estiver vazia
CREATE OR REPLACE FUNCTION public.reach_config()
RETURNS TABLE (cpm_cents integer, prize_share numeric, min_goal_views integer,
               min_cycle_points integer, prizes_cents integer[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(c.reach_cpm_cents, 500),
         COALESCE(c.reach_prize_share, 0.35),
         COALESCE(c.reach_min_goal_views, 20000),
         COALESCE(c.reach_min_cycle_points, 2000),
         COALESCE(c.reach_prizes_cents, '{15000,8000,5000}')
  FROM (SELECT 1) one
  LEFT JOIN LATERAL (SELECT * FROM public.pricing_config ORDER BY created_at LIMIT 1) c ON true
$$;
GRANT EXECUTE ON FUNCTION public.reach_config() TO anon, authenticated;

-- Liga pelo tamanho do maior perfil cadastrado
CREATE OR REPLACE FUNCTION public.reach_league_for(p_followers integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN COALESCE(p_followers, 0) < 1000 THEN 'BRONZE'
    WHEN p_followers <= 5000 THEN 'PRATA'
    ELSE 'OURO'
  END
$$;
GRANT EXECUTE ON FUNCTION public.reach_league_for(integer) TO anon, authenticated;

-- Formata centavos como "R$ 1234,56" para mensagens
CREATE OR REPLACE FUNCTION public.reach_brl(p_cents integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT 'R$ ' || replace(to_char(COALESCE(p_cents, 0) / 100.0, 'FM999999990.00'), '.', ',')
$$;
GRANT EXECUTE ON FUNCTION public.reach_brl(integer) TO anon, authenticated;

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------
CREATE TABLE public.affiliate_social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  network text NOT NULL CHECK (network IN ('INSTAGRAM','TIKTOK','KWAI','FACEBOOK','YOUTUBE','X')),
  handle text NOT NULL CHECK (char_length(handle) BETWEEN 2 AND 60),
  profile_url text CHECK (profile_url IS NULL OR char_length(profile_url) <= 300),
  followers integer NOT NULL DEFAULT 0 CHECK (followers >= 0 AND followers < 100000000),
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (affiliate_id, network)
);

CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 80),
  keyword text NOT NULL CHECK (char_length(keyword) BETWEEN 2 AND 60),
  briefing text CHECK (briefing IS NULL OR char_length(briefing) <= 2000),
  kit_url text CHECK (kit_url IS NULL OR char_length(kit_url) <= 500),
  networks text[] NOT NULL,
  cities text[] NOT NULL DEFAULT '{}', -- formato "Cidade - UF"; vazio = Brasil inteiro
  goal_views integer NOT NULL CHECK (goal_views > 0),
  cpm_cents integer NOT NULL CHECK (cpm_cents > 0),
  reserved_cents integer NOT NULL DEFAULT 0 CHECK (reserved_cents >= 0),
  spent_cents integer NOT NULL DEFAULT 0 CHECK (spent_cents >= 0),
  refunded_cents integer NOT NULL DEFAULT 0 CHECK (refunded_cents >= 0),
  verified_views integer NOT NULL DEFAULT 0,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','FINISHED','CANCELLED')),
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  CHECK (spent_cents <= reserved_cents)
);
CREATE INDEX campaigns_company_idx ON public.campaigns (company_id, created_at DESC);
CREATE INDEX campaigns_status_idx ON public.campaigns (status, ends_at);

CREATE TABLE public.prize_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start date NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED')),
  pool_cents integer NOT NULL DEFAULT 0 CHECK (pool_cents >= 0),
  carried_in_cents integer NOT NULL DEFAULT 0 CHECK (carried_in_cents >= 0),
  paid_cents integer NOT NULL DEFAULT 0 CHECK (paid_cents >= 0),
  closed_at timestamptz,
  closed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.campaign_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  affiliate_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  social_account_id uuid REFERENCES public.affiliate_social_accounts(id) ON DELETE SET NULL,
  network text NOT NULL,
  post_url text NOT NULL UNIQUE CHECK (char_length(post_url) BETWEEN 10 AND 500),
  reported_views integer NOT NULL DEFAULT 0 CHECK (reported_views >= 0 AND reported_views < 1000000000),
  proof_path text CHECK (proof_path IS NULL OR char_length(proof_path) <= 300),
  verified_views integer,
  billed_views integer NOT NULL DEFAULT 0,
  billed_cents integer NOT NULL DEFAULT 0,
  pool_cents integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  auto_check jsonb NOT NULL DEFAULT '{}'::jsonb,
  rejection_reason text,
  cycle_id uuid REFERENCES public.prize_cycles(id),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  UNIQUE (campaign_id, affiliate_id, network)
);
CREATE INDEX campaign_posts_campaign_idx ON public.campaign_posts (campaign_id, status);
CREATE INDEX campaign_posts_affiliate_idx ON public.campaign_posts (affiliate_id, submitted_at DESC);
CREATE INDEX campaign_posts_pending_idx ON public.campaign_posts (status, submitted_at) WHERE status = 'PENDING';
CREATE INDEX campaign_posts_cycle_idx ON public.campaign_posts (cycle_id, affiliate_id) WHERE status = 'APPROVED';

CREATE TABLE public.prize_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.prize_cycles(id) ON DELETE CASCADE,
  affiliate_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  league text NOT NULL,
  position integer NOT NULL,
  points integer NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cycle_id, affiliate_id)
);

-- ---------------------------------------------------------------------
-- GRANTs + RLS (leitura direta; toda escrita passa pelas funcoes abaixo)
-- ---------------------------------------------------------------------
GRANT SELECT ON public.affiliate_social_accounts, public.campaigns, public.campaign_posts,
              public.prize_cycles, public.prize_awards TO authenticated;
GRANT ALL ON public.affiliate_social_accounts, public.campaigns, public.campaign_posts,
             public.prize_cycles, public.prize_awards TO service_role;

ALTER TABLE public.affiliate_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates view own social accounts" ON public.affiliate_social_accounts
  FOR SELECT TO authenticated
  USING (affiliate_id = public.get_current_profile_id() OR public.has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Companies view own campaigns" ON public.campaigns
  FOR SELECT TO authenticated
  USING (company_id = public.get_current_profile_id() OR public.has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Posts visible to author, campaign owner and admin" ON public.campaign_posts
  FOR SELECT TO authenticated
  USING (
    affiliate_id = public.get_current_profile_id()
    OR public.has_role(auth.uid(), 'ADMIN'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_posts.campaign_id
        AND c.company_id = public.get_current_profile_id()
    )
  );

CREATE POLICY "Logged users view prize cycles" ON public.prize_cycles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Affiliates view own prizes" ON public.prize_awards
  FOR SELECT TO authenticated
  USING (affiliate_id = public.get_current_profile_id() OR public.has_role(auth.uid(), 'ADMIN'::app_role));

-- ---------------------------------------------------------------------
-- Armazenamento dos prints de visualizacoes (bucket privado)
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('post-proofs', 'post-proofs', false, 5242880,
        ARRAY['image/png','image/jpeg','image/webp','image/heic'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Affiliates upload own post proofs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Affiliates read own post proofs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'post-proofs'
         AND ((storage.foldername(name))[1] = auth.uid()::text
              OR public.has_role(auth.uid(), 'ADMIN'::app_role)));
