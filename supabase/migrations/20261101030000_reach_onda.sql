-- =====================================================================
-- CLILIN: campanha vira "Onda"
-- * Janela curta de postagem: até 7 dias (o padrão no painel é 48h)
-- * Roteiro obrigatório para os divulgadores
-- * Visualizações contam até 7 dias depois do envio do post: a aprovação só
--   acontece depois disso, com o número do dia 7 (leitura automática + print)
-- * Teto por post: no máximo 20% do valor reservado da campanha
-- * Bônus de 20% nos pontos para quem envia nas primeiras 12h da janela
-- * Prazo para enviar o link: até 24h depois do fim da janela
-- =====================================================================

ALTER TABLE public.pricing_config
  ADD COLUMN IF NOT EXISTS reach_count_days integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS reach_post_cap_share numeric NOT NULL DEFAULT 0.20,
  ADD COLUMN IF NOT EXISTS reach_early_hours integer NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS reach_early_bonus numeric NOT NULL DEFAULT 0.20,
  ADD COLUMN IF NOT EXISTS reach_max_window_days integer NOT NULL DEFAULT 7;

-- Regras da onda (separadas de reach_config para não mudar a assinatura dela)
CREATE OR REPLACE FUNCTION public.reach_onda_config()
RETURNS TABLE (count_days integer, post_cap_share numeric, early_hours integer,
               early_bonus numeric, max_window_days integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(c.reach_count_days, 7),
         COALESCE(c.reach_post_cap_share, 0.20),
         COALESCE(c.reach_early_hours, 12),
         COALESCE(c.reach_early_bonus, 0.20),
         COALESCE(c.reach_max_window_days, 7)
  FROM (SELECT 1) one
  LEFT JOIN LATERAL (SELECT * FROM public.pricing_config ORDER BY created_at LIMIT 1) c ON true
$$;
REVOKE ALL ON FUNCTION public.reach_onda_config() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reach_onda_config() TO anon, authenticated, service_role;

ALTER TABLE public.campaign_posts
  ADD COLUMN IF NOT EXISTS count_at timestamptz,
  ADD COLUMN IF NOT EXISTS early_bonus boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS capped boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS final_check_at timestamptz;
UPDATE public.campaign_posts SET count_at = submitted_at + interval '7 days' WHERE count_at IS NULL;
ALTER TABLE public.campaign_posts
  ALTER COLUMN count_at SET DEFAULT (now() + interval '7 days'),
  ALTER COLUMN count_at SET NOT NULL;
CREATE INDEX IF NOT EXISTS campaign_posts_count_due_idx
  ON public.campaign_posts (count_at) WHERE status = 'PENDING' AND final_check_at IS NULL;

-- ---------------------------------------------------------------------
-- Empresa cria a onda
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_campaign(
  p_title text,
  p_keyword text,
  p_briefing text,
  p_kit_url text,
  p_networks text[],
  p_cities text[],
  p_goal_views integer,
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles := public.reach_require_profile('COMPANY'::app_role);
  v_cfg record;
  v_reserve integer;
  v_balance integer;
  v_id uuid;
  v_networks text[];
  v_cities text[];
  v_starts timestamptz := COALESCE(p_starts_at, now());
  v_onda record;
BEGIN
  SELECT * INTO v_cfg FROM public.reach_config();
  SELECT * INTO v_onda FROM public.reach_onda_config();

  SELECT COALESCE(array_agg(DISTINCT n), '{}') INTO v_networks
  FROM unnest(COALESCE(p_networks, '{}')) n
  WHERE n IN ('INSTAGRAM','TIKTOK','KWAI','FACEBOOK','YOUTUBE','X');
  IF array_length(v_networks, 1) IS NULL THEN
    RAISE EXCEPTION 'Escolha pelo menos uma rede social';
  END IF;

  SELECT COALESCE(array_agg(DISTINCT btrim(c)), '{}') INTO v_cities
  FROM unnest(COALESCE(p_cities, '{}')) c
  WHERE btrim(c) <> '';

  IF char_length(btrim(COALESCE(p_title, ''))) < 3 THEN
    RAISE EXCEPTION 'Dê um nome para a campanha';
  END IF;
  IF char_length(btrim(COALESCE(p_keyword, ''))) < 2 THEN
    RAISE EXCEPTION 'Informe a assinatura da campanha: o nome ou a frase que todo mundo vai falar';
  END IF;
  IF char_length(btrim(COALESCE(p_briefing, ''))) < 30 THEN
    RAISE EXCEPTION 'Escreva o roteiro para os divulgadores (pelo menos 30 letras): o que falar, o que mostrar e ideias de vídeo';
  END IF;
  IF p_goal_views IS NULL OR p_goal_views < v_cfg.min_goal_views THEN
    RAISE EXCEPTION 'A meta mínima é de % visualizações', v_cfg.min_goal_views;
  END IF;
  IF p_ends_at IS NULL OR p_ends_at <= v_starts THEN
    RAISE EXCEPTION 'O fim da janela precisa ser depois do início';
  END IF;
  IF p_ends_at > v_starts + make_interval(days => v_onda.max_window_days) THEN
    RAISE EXCEPTION 'A janela de postagem pode durar no máximo % dias. Onda boa é curta: todo mundo posta junto.', v_onda.max_window_days;
  END IF;
  IF p_ends_at < now() THEN
    RAISE EXCEPTION 'A data de fim já passou';
  END IF;

  v_reserve := CEIL(p_goal_views::numeric * v_cfg.cpm_cents / 1000)::integer;

  SELECT balance INTO v_balance FROM public.profiles WHERE id = v_profile.id FOR UPDATE;
  IF COALESCE(v_profile.balance_frozen, false) THEN
    RAISE EXCEPTION 'Saldo bloqueado. Fale com o suporte.';
  END IF;
  IF v_balance < v_reserve THEN
    RAISE EXCEPTION 'Saldo insuficiente: a campanha reserva %, e seu saldo é %',
      public.reach_brl(v_reserve),
      public.reach_brl(v_balance);
  END IF;

  UPDATE public.profiles SET balance = balance - v_reserve WHERE id = v_profile.id;

  INSERT INTO public.campaigns (
    company_id, title, keyword, briefing, kit_url, networks, cities,
    goal_views, cpm_cents, reserved_cents, starts_at, ends_at
  ) VALUES (
    v_profile.id, btrim(p_title), btrim(p_keyword), btrim(p_briefing),
    NULLIF(btrim(p_kit_url), ''), v_networks, v_cities,
    p_goal_views, v_cfg.cpm_cents, v_reserve, v_starts, p_ends_at
  ) RETURNING id INTO v_id;

  INSERT INTO public.transactions (user_id, amount, type, description, status)
  VALUES (v_profile.id, -v_reserve, 'CAMPAIGN_RESERVE',
          'Reserva da campanha "' || btrim(p_title) || '"', 'RELEASED');

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_campaign(text, text, text, text, text[], text[], integer, timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_campaign(text, text, text, text, text[], text[], integer, timestamptz, timestamptz) TO authenticated;

-- ---------------------------------------------------------------------
-- Missões do divulgador (aparecem até 24h depois do fim da janela)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_reach_missions()
RETURNS TABLE (
  id uuid,
  title text,
  keyword text,
  briefing text,
  kit_url text,
  networks text[],
  cities text[],
  starts_at timestamptz,
  ends_at timestamptz,
  goal_views integer,
  verified_views integer,
  company_name text,
  company_avatar text,
  my_posts jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles := public.reach_require_profile('AFFILIATE'::app_role);
BEGIN
  RETURN QUERY
  SELECT c.id, c.title, c.keyword, c.briefing, c.kit_url, c.networks, c.cities,
         c.starts_at, c.ends_at, c.goal_views, c.verified_views,
         p.name, p.avatar_url,
         COALESCE((
           SELECT jsonb_agg(jsonb_build_object(
             'id', cp.id, 'network', cp.network, 'status', cp.status,
             'post_url', cp.post_url, 'points', cp.points,
             'count_at', cp.count_at, 'early_bonus', cp.early_bonus))
           FROM public.campaign_posts cp
           WHERE cp.campaign_id = c.id AND cp.affiliate_id = v_profile.id
         ), '[]'::jsonb)
  FROM public.campaigns c
  JOIN public.profiles p ON p.id = c.company_id
  WHERE c.status = 'ACTIVE'
    AND c.ends_at + interval '1 day' > now()
    AND (cardinality(c.cities) = 0 OR v_profile.city = ANY (c.cities))
  ORDER BY c.starts_at ASC;
END;
$$;
REVOKE ALL ON FUNCTION public.get_reach_missions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_reach_missions() TO authenticated;

-- ---------------------------------------------------------------------
-- Envio do post
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_campaign_post(
  p_campaign_id uuid,
  p_social_account_id uuid,
  p_post_url text,
  p_reported_views integer,
  p_proof_path text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles := public.reach_require_profile('AFFILIATE'::app_role);
  v_cfg record;
  v_campaign public.campaigns;
  v_account public.affiliate_social_accounts;
  v_url text := btrim(COALESCE(p_post_url, ''));
  v_proof text := NULLIF(btrim(COALESCE(p_proof_path, '')), '');
  v_id uuid;
BEGIN
  SELECT * INTO v_cfg FROM public.reach_onda_config();
  SELECT * INTO v_campaign FROM public.campaigns WHERE id = p_campaign_id;
  IF v_campaign.id IS NULL OR v_campaign.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Esta missão não está mais ativa';
  END IF;
  IF now() < v_campaign.starts_at THEN
    RAISE EXCEPTION 'A onda ainda não começou. Poste a partir do horário marcado.';
  END IF;
  IF now() > v_campaign.ends_at + interval '1 day' THEN
    RAISE EXCEPTION 'O prazo para enviar posts desta missão terminou';
  END IF;
  IF cardinality(v_campaign.cities) > 0 AND NOT (v_profile.city = ANY (v_campaign.cities)) THEN
    RAISE EXCEPTION 'Esta missão é para outra cidade';
  END IF;

  SELECT * INTO v_account FROM public.affiliate_social_accounts
  WHERE id = p_social_account_id AND affiliate_id = v_profile.id;
  IF v_account.id IS NULL THEN
    RAISE EXCEPTION 'Cadastre o seu perfil nessa rede antes de enviar o post';
  END IF;
  IF NOT (v_account.network = ANY (v_campaign.networks)) THEN
    RAISE EXCEPTION 'Esta missão não aceita posts nessa rede';
  END IF;
  IF NOT public.reach_url_matches_network(v_url, v_account.network) THEN
    RAISE EXCEPTION 'O link não parece ser de um post dessa rede. Copie o link direto do post.';
  END IF;
  IF v_proof IS NOT NULL AND v_proof NOT LIKE auth.uid()::text || '/%' THEN
    RAISE EXCEPTION 'Arquivo do print inválido';
  END IF;

  BEGIN
    INSERT INTO public.campaign_posts (
      campaign_id, affiliate_id, social_account_id, network, post_url, reported_views, proof_path,
      count_at, early_bonus
    ) VALUES (
      v_campaign.id, v_profile.id, v_account.id, v_account.network, v_url,
      GREATEST(COALESCE(p_reported_views, 0), 0), v_proof,
      now() + make_interval(days => v_cfg.count_days),
      now() <= v_campaign.starts_at + make_interval(hours => v_cfg.early_hours)
    ) RETURNING id INTO v_id;
  EXCEPTION WHEN unique_violation THEN
    IF EXISTS (SELECT 1 FROM public.campaign_posts WHERE post_url = v_url) THEN
      RAISE EXCEPTION 'Este link de post já foi enviado';
    END IF;
    RAISE EXCEPTION 'Você já enviou um post nessa rede para esta missão';
  END;

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_campaign_post(uuid, uuid, text, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_campaign_post(uuid, uuid, text, integer, text) TO authenticated;

-- ---------------------------------------------------------------------
-- Conferência: só depois do dia 7, com teto por post e bônus de quem chegou cedo
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.review_campaign_post(
  p_post_id uuid, p_approve boolean, p_verified_views integer, p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post public.campaign_posts;
  v_campaign public.campaigns;
  v_cfg record;
  v_onda record;
  v_views integer;
  v_cap_cents integer;
  v_cap_views integer;
  v_counted integer;
  v_cost integer;
  v_remaining integer;
  v_billed integer;
  v_billed_views integer;
  v_pool integer;
  v_points integer;
  v_cycle uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'ADMIN'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores conferem posts';
  END IF;

  SELECT * INTO v_post FROM public.campaign_posts WHERE id = p_post_id FOR UPDATE;
  IF v_post.id IS NULL THEN
    RAISE EXCEPTION 'Post não encontrado';
  END IF;
  IF v_post.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Este post já foi conferido';
  END IF;

  IF NOT COALESCE(p_approve, false) THEN
    UPDATE public.campaign_posts
       SET status = 'REJECTED',
           rejection_reason = COALESCE(NULLIF(btrim(p_reason), ''), 'Post não atendeu às regras da missão'),
           reviewed_at = now(), reviewed_by = auth.uid(), updated_at = now()
     WHERE id = p_post_id;

    PERFORM public.reach_notify(v_post.affiliate_id, 'POST_REJECTED', 'Post não aprovado',
      COALESCE(NULLIF(btrim(p_reason), ''), 'Seu post não atendeu às regras da missão.'),
      jsonb_build_object('post_id', p_post_id, 'campaign_id', v_post.campaign_id));
    RETURN jsonb_build_object('status', 'REJECTED');
  END IF;

  IF now() < v_post.count_at THEN
    RAISE EXCEPTION 'As visualizações deste post contam até %. A aprovação fica liberada a partir daí.',
      to_char(v_post.count_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM "às" HH24:MI');
  END IF;

  IF p_verified_views IS NULL OR p_verified_views < 0 THEN
    RAISE EXCEPTION 'Informe as visualizações verificadas';
  END IF;
  v_views := p_verified_views;

  SELECT * INTO v_cfg FROM public.reach_config();
  SELECT * INTO v_onda FROM public.reach_onda_config();
  SELECT * INTO v_campaign FROM public.campaigns WHERE id = v_post.campaign_id FOR UPDATE;

  -- teto por post: mantém muitas vozes, nenhum post come a campanha sozinho
  v_cap_cents := GREATEST(FLOOR(v_campaign.reserved_cents * v_onda.post_cap_share)::integer, 1);
  v_cap_views := FLOOR(v_cap_cents::numeric * 1000 / v_campaign.cpm_cents)::integer;
  v_counted := LEAST(v_views, v_cap_views);

  v_cost := FLOOR(v_counted::numeric * v_campaign.cpm_cents / 1000)::integer;
  v_remaining := v_campaign.reserved_cents - v_campaign.spent_cents;
  v_billed := LEAST(v_cost, GREATEST(v_remaining, 0));
  v_billed_views := CASE WHEN v_cost = 0 THEN 0
                         ELSE LEAST(v_counted, FLOOR(v_billed::numeric * 1000 / v_campaign.cpm_cents)::integer) END;
  v_pool := FLOOR(v_billed * v_cfg.prize_share)::integer;
  v_points := FLOOR(v_counted * (1 + CASE WHEN v_post.early_bonus THEN v_onda.early_bonus ELSE 0 END))::integer;
  v_cycle := public.reach_cycle_for(now());

  UPDATE public.campaign_posts
     SET status = 'APPROVED',
         verified_views = v_views,
         billed_views = v_billed_views,
         billed_cents = v_billed,
         pool_cents = v_pool,
         points = v_points,
         capped = v_views > v_cap_views,
         cycle_id = v_cycle,
         rejection_reason = NULL,
         reviewed_at = now(), reviewed_by = auth.uid(), updated_at = now()
   WHERE id = p_post_id;

  UPDATE public.campaigns
     SET spent_cents = spent_cents + v_billed,
         verified_views = verified_views + v_views
   WHERE id = v_campaign.id;

  UPDATE public.prize_cycles SET pool_cents = pool_cents + v_pool WHERE id = v_cycle;

  PERFORM public.reach_notify(v_post.affiliate_id, 'POST_APPROVED', 'Post aprovado! 🎉',
    'Seu post rendeu ' || v_points::text || ' pontos no ranking do mês' ||
      CASE WHEN v_post.early_bonus THEN ' (com bônus de quem postou cedo).' ELSE '.' END,
    jsonb_build_object('post_id', p_post_id, 'points', v_points));

  RETURN jsonb_build_object('status', 'APPROVED', 'points', v_points, 'counted_views', v_counted,
                            'capped', v_views > v_cap_views,
                            'billed_cents', v_billed, 'pool_cents', v_pool);
END;
$$;
REVOKE ALL ON FUNCTION public.review_campaign_post(uuid, boolean, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_campaign_post(uuid, boolean, integer, text) TO authenticated;

-- Mensagem do encerramento fala em contagem
CREATE OR REPLACE FUNCTION public.finish_campaign(p_campaign_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean := public.has_role(auth.uid(), 'ADMIN'::app_role);
  v_campaign public.campaigns;
  v_refund integer;
  v_pending integer;
BEGIN
  SELECT * INTO v_campaign FROM public.campaigns WHERE id = p_campaign_id FOR UPDATE;
  IF v_campaign.id IS NULL THEN
    RAISE EXCEPTION 'Campanha não encontrada';
  END IF;
  IF NOT v_is_admin AND v_campaign.company_id IS DISTINCT FROM public.get_current_profile_id() THEN
    RAISE EXCEPTION 'Campanha não encontrada';
  END IF;
  IF v_campaign.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Esta campanha já foi encerrada';
  END IF;

  SELECT count(*) INTO v_pending FROM public.campaign_posts
  WHERE campaign_id = p_campaign_id AND status = 'PENDING';

  IF v_pending > 0 THEN
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'Ainda há % post(s) contando visualizações ou em conferência. A campanha encerra assim que todos forem conferidos.', v_pending;
    END IF;
    UPDATE public.campaign_posts
       SET status = 'REJECTED', rejection_reason = 'Campanha encerrada antes da conferência',
           reviewed_at = now(), reviewed_by = auth.uid(), updated_at = now()
     WHERE campaign_id = p_campaign_id AND status = 'PENDING';
  END IF;

  v_refund := v_campaign.reserved_cents - v_campaign.spent_cents;

  UPDATE public.campaigns
     SET status = 'FINISHED', finished_at = now(), refunded_cents = v_refund
   WHERE id = p_campaign_id;

  IF v_refund > 0 THEN
    UPDATE public.profiles SET balance = balance + v_refund WHERE id = v_campaign.company_id;
    INSERT INTO public.transactions (user_id, amount, type, description, status)
    VALUES (v_campaign.company_id, v_refund, 'CAMPAIGN_REFUND',
            'Saldo devolvido da campanha "' || v_campaign.title || '"', 'RELEASED');
  END IF;

  PERFORM public.reach_notify(v_campaign.company_id, 'CAMPAIGN_FINISHED',
    'Campanha encerrada',
    'A campanha "' || v_campaign.title || '" foi encerrada com ' ||
      v_campaign.verified_views::text || ' visualizações verificadas.',
    jsonb_build_object('campaign_id', p_campaign_id, 'refund_cents', v_refund));

  RETURN v_refund;
END;
$$;
REVOKE ALL ON FUNCTION public.finish_campaign(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finish_campaign(uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- Leitura do dia 7 (chamada pela edge function check-post com service_role)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_post_final_check(p_post_id uuid, p_result jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post public.campaign_posts;
BEGIN
  UPDATE public.campaign_posts
     SET auto_check = COALESCE(p_result, '{}'::jsonb), final_check_at = now(), updated_at = now()
   WHERE id = p_post_id AND status = 'PENDING'
   RETURNING * INTO v_post;
  IF v_post.id IS NULL THEN RETURN; END IF;

  PERFORM public.reach_notify(v_post.affiliate_id, 'POST_COUNTED', 'Contagem do seu post terminou',
    'Seu post completou 7 dias e foi para a conferência. Se o número que aparece no seu perfil for maior, atualize o print na missão.',
    jsonb_build_object('post_id', v_post.id, 'campaign_id', v_post.campaign_id));
END;
$$;
REVOKE ALL ON FUNCTION public.set_post_final_check(uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_post_final_check(uuid, jsonb) TO service_role;

-- Segredo do agendador (fica fora do schema public, sem acesso pela API)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS private.app_secrets (
  name text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON private.app_secrets FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT SELECT ON private.app_secrets TO service_role;

-- A edge function confere o segredo por aqui (só service_role executa)
CREATE OR REPLACE FUNCTION public.check_cron_secret(p_name text, p_value text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM private.app_secrets s WHERE s.name = p_name AND s.value = p_value AND length(p_value) >= 32)
$$;
REVOKE ALL ON FUNCTION public.check_cron_secret(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_cron_secret(text, text) TO service_role;

-- Admin: posts prontos para conferir x posts ainda contando
CREATE OR REPLACE FUNCTION public.admin_reach_summary(p_from timestamptz, p_to timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'ADMIN'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores';
  END IF;

  SELECT jsonb_build_object(
    -- o que precisa de ação agora (não depende do período)
    'posts_pending',       (SELECT count(*) FROM campaign_posts WHERE status = 'PENDING' AND count_at <= now()),
    'posts_counting',      (SELECT count(*) FROM campaign_posts WHERE status = 'PENDING' AND count_at > now()),
    'accounts_pending',    (SELECT count(*) FROM affiliate_social_accounts WHERE NOT verified),
    'campaigns_active',    (SELECT count(*) FROM campaigns WHERE status = 'ACTIVE'),
    'withdrawals_pending_count', (SELECT count(*) FROM withdrawals WHERE status IN ('PENDING','APPROVED','PROCESSING')),
    'withdrawals_pending_cents', (SELECT COALESCE(sum(amount),0) FROM withdrawals WHERE status IN ('PENDING','APPROVED','PROCESSING')),

    -- ciclo de prêmios aberto
    'cycle_open_start',    (SELECT period_start FROM prize_cycles WHERE status = 'OPEN' ORDER BY period_start DESC LIMIT 1),
    'cycle_open_pool_cents', (SELECT COALESCE(pool_cents,0) + COALESCE(carried_in_cents,0) FROM prize_cycles WHERE status = 'OPEN' ORDER BY period_start DESC LIMIT 1),

    -- período escolhido
    'views_verified',      (SELECT COALESCE(sum(verified_views),0) FROM campaign_posts WHERE status = 'APPROVED' AND reviewed_at >= p_from AND reviewed_at < p_to),
    'posts_approved',      (SELECT count(*) FROM campaign_posts WHERE status = 'APPROVED' AND reviewed_at >= p_from AND reviewed_at < p_to),
    'posts_rejected',      (SELECT count(*) FROM campaign_posts WHERE status = 'REJECTED' AND reviewed_at >= p_from AND reviewed_at < p_to),
    'consumed_cents',      (SELECT COALESCE(sum(billed_cents),0) FROM campaign_posts WHERE status = 'APPROVED' AND reviewed_at >= p_from AND reviewed_at < p_to),
    'pool_cents',          (SELECT COALESCE(sum(pool_cents),0) FROM campaign_posts WHERE status = 'APPROVED' AND reviewed_at >= p_from AND reviewed_at < p_to),
    'credits_sold_cents',  (SELECT COALESCE(sum(t.amount),0) FROM transactions t
                              JOIN profiles p ON p.id = t.user_id
                              JOIN user_roles r ON r.user_id = p.user_id AND r.role = 'COMPANY'
                             WHERE t.type = 'DEPOSIT' AND t.amount > 0 AND t.created_at >= p_from AND t.created_at < p_to),
    'prizes_paid_cents',   (SELECT COALESCE(sum(amount),0) FROM transactions WHERE type = 'PRIZE' AND created_at >= p_from AND created_at < p_to),
    'withdrawals_paid_cents', (SELECT COALESCE(sum(amount),0) FROM withdrawals WHERE status = 'COMPLETED' AND COALESCE(reviewed_at, created_at) >= p_from AND COALESCE(reviewed_at, created_at) < p_to),
    'campaigns_created',   (SELECT count(*) FROM campaigns WHERE created_at >= p_from AND created_at < p_to),

    -- base
    'companies',           (SELECT count(DISTINCT user_id) FROM user_roles WHERE role = 'COMPANY'),
    'affiliates',          (SELECT count(DISTINCT user_id) FROM user_roles WHERE role = 'AFFILIATE'),
    'affiliates_with_verified_account', (SELECT count(DISTINCT affiliate_id) FROM affiliate_social_accounts WHERE verified),
    'company_balance_cents',   (SELECT COALESCE(sum(p.balance),0) FROM profiles p WHERE EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id AND r.role = 'COMPANY') AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id AND r.role = 'ADMIN')),
    'affiliate_balance_cents', (SELECT COALESCE(sum(p.balance),0) FROM profiles p WHERE EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id AND r.role = 'AFFILIATE') AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id AND r.role = 'ADMIN'))
  ) INTO v;

  RETURN v;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_reach_summary(timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reach_summary(timestamptz, timestamptz) TO authenticated;
