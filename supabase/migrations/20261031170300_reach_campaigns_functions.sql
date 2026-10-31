-- CLILIN — CAMPANHAS DE ALCANCE: funcoes (ver 20261031170200_reach_campaigns_tables.sql)

-- ---------------------------------------------------------------------
-- Helpers internos
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reach_require_profile(p_role app_role)
RETURNS public.profiles
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Faça login para continuar';
  END IF;
  IF NOT public.has_role(auth.uid(), p_role) THEN
    RAISE EXCEPTION 'Esta ação não está disponível para o seu tipo de conta';
  END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE user_id = auth.uid();
  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'Perfil não encontrado';
  END IF;
  IF COALESCE(v_profile.banned, false) THEN
    RAISE EXCEPTION 'Conta suspensa';
  END IF;
  RETURN v_profile;
END;
$$;
REVOKE ALL ON FUNCTION public.reach_require_profile(app_role) FROM PUBLIC, anon, authenticated;

-- Ciclo de premios aberto do mes de referencia (cria se nao existir)
CREATE OR REPLACE FUNCTION public.reach_cycle_for(p_at timestamptz)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period date := date_trunc('month', p_at AT TIME ZONE 'America/Sao_Paulo')::date;
  v_id uuid;
  v_status text;
BEGIN
  INSERT INTO public.prize_cycles (period_start) VALUES (v_period)
  ON CONFLICT (period_start) DO NOTHING;

  SELECT id, status INTO v_id, v_status FROM public.prize_cycles WHERE period_start = v_period;

  -- Mes ja fechado: o ponto vai para o proximo ciclo aberto
  WHILE v_status = 'CLOSED' LOOP
    v_period := (v_period + interval '1 month')::date;
    INSERT INTO public.prize_cycles (period_start) VALUES (v_period)
    ON CONFLICT (period_start) DO NOTHING;
    SELECT id, status INTO v_id, v_status FROM public.prize_cycles WHERE period_start = v_period;
  END LOOP;

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.reach_cycle_for(timestamptz) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.reach_url_matches_network(p_url text, p_network text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_network
    WHEN 'INSTAGRAM' THEN p_url ~* '^https://(www\.)?instagram\.com/(p|reel|reels|tv)/[A-Za-z0-9_-]+'
    WHEN 'TIKTOK'    THEN p_url ~* '^https://((www|vm|vt|m)\.)?tiktok\.com/'
    WHEN 'KWAI'      THEN p_url ~* '^https://([a-z0-9-]+\.)?kwai\.com/'
    WHEN 'FACEBOOK'  THEN p_url ~* '^https://((www|m|web)\.)?(facebook\.com|fb\.watch)/'
    WHEN 'YOUTUBE'   THEN p_url ~* '^https://((www|m)\.)?(youtube\.com/(shorts/|watch\?v=)|youtu\.be/)'
    WHEN 'X'         THEN p_url ~* '^https://((www|mobile)\.)?(x|twitter)\.com/[A-Za-z0-9_]+/status/[0-9]+'
    ELSE false
  END
$$;
GRANT EXECUTE ON FUNCTION public.reach_url_matches_network(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.reach_notify(p_profile_id uuid, p_type text, p_title text, p_message text, p_data jsonb)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (p_profile_id, p_type, p_title, p_message, COALESCE(p_data, '{}'::jsonb))
$$;
REVOKE ALL ON FUNCTION public.reach_notify(uuid, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------
-- DIVULGADOR: redes sociais
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_social_account(
  p_network text, p_handle text, p_profile_url text, p_followers integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles := public.reach_require_profile('AFFILIATE'::app_role);
  v_handle text := regexp_replace(btrim(COALESCE(p_handle, '')), '^@', '');
  v_id uuid;
BEGIN
  IF p_network NOT IN ('INSTAGRAM','TIKTOK','KWAI','FACEBOOK','YOUTUBE','X') THEN
    RAISE EXCEPTION 'Rede inválida';
  END IF;
  IF char_length(v_handle) < 2 THEN
    RAISE EXCEPTION 'Informe o seu @ nessa rede';
  END IF;
  IF p_followers IS NULL OR p_followers < 0 THEN
    RAISE EXCEPTION 'Informe quantos seguidores você tem';
  END IF;

  INSERT INTO public.affiliate_social_accounts (affiliate_id, network, handle, profile_url, followers, verified)
  VALUES (v_profile.id, p_network, v_handle, NULLIF(btrim(p_profile_url), ''), p_followers, false)
  ON CONFLICT (affiliate_id, network) DO UPDATE
    SET handle = EXCLUDED.handle,
        profile_url = EXCLUDED.profile_url,
        followers = EXCLUDED.followers,
        -- mudou o perfil ou os seguidores: precisa conferir de novo
        verified = CASE
          WHEN affiliate_social_accounts.handle = EXCLUDED.handle
           AND affiliate_social_accounts.followers = EXCLUDED.followers
          THEN affiliate_social_accounts.verified ELSE false END,
        updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.upsert_social_account(text, text, text, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_social_account(p_account_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles := public.reach_require_profile('AFFILIATE'::app_role);
BEGIN
  DELETE FROM public.affiliate_social_accounts
  WHERE id = p_account_id AND affiliate_id = v_profile.id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_social_account(uuid) TO authenticated;

-- Liga do divulgador (pelo maior perfil cadastrado)
CREATE OR REPLACE FUNCTION public.reach_affiliate_league(p_affiliate_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.reach_league_for(COALESCE(MAX(followers), 0))
  FROM public.affiliate_social_accounts
  WHERE affiliate_id = p_affiliate_id
$$;
GRANT EXECUTE ON FUNCTION public.reach_affiliate_league(uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- EMPRESA: criar e encerrar campanha
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
BEGIN
  SELECT * INTO v_cfg FROM public.reach_config();

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
    RAISE EXCEPTION 'Informe a palavra-chave ou hashtag da campanha';
  END IF;
  IF p_goal_views IS NULL OR p_goal_views < v_cfg.min_goal_views THEN
    RAISE EXCEPTION 'A meta mínima é de % visualizações', v_cfg.min_goal_views;
  END IF;
  IF p_ends_at IS NULL OR p_ends_at <= v_starts THEN
    RAISE EXCEPTION 'O fim da campanha precisa ser depois do início';
  END IF;
  IF p_ends_at > v_starts + interval '31 days' THEN
    RAISE EXCEPTION 'A campanha pode durar no máximo 31 dias';
  END IF;
  IF p_ends_at < now() THEN
    RAISE EXCEPTION 'A data de fim já passou';
  END IF;

  v_reserve := CEIL(p_goal_views::numeric * v_cfg.cpm_cents / 1000)::integer;

  -- trava o saldo para evitar corrida entre duas criacoes simultaneas
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
    v_profile.id, btrim(p_title), btrim(p_keyword), NULLIF(btrim(p_briefing), ''),
    NULLIF(btrim(p_kit_url), ''), v_networks, v_cities,
    p_goal_views, v_cfg.cpm_cents, v_reserve, v_starts, p_ends_at
  ) RETURNING id INTO v_id;

  INSERT INTO public.transactions (user_id, amount, type, description, status)
  VALUES (v_profile.id, -v_reserve, 'CAMPAIGN_RESERVE',
          'Reserva da campanha "' || btrim(p_title) || '"', 'RELEASED');

  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_campaign(text, text, text, text, text[], text[], integer, timestamptz, timestamptz) TO authenticated;

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
      RAISE EXCEPTION 'Ainda há % post(s) em conferência. A campanha pode ser encerrada assim que eles forem conferidos.', v_pending;
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
GRANT EXECUTE ON FUNCTION public.finish_campaign(uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- DIVULGADOR: missoes e envio de posts
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
             'post_url', cp.post_url, 'points', cp.points))
           FROM public.campaign_posts cp
           WHERE cp.campaign_id = c.id AND cp.affiliate_id = v_profile.id
         ), '[]'::jsonb)
  FROM public.campaigns c
  JOIN public.profiles p ON p.id = c.company_id
  WHERE c.status = 'ACTIVE'
    AND c.ends_at + interval '3 days' > now()
    AND (cardinality(c.cities) = 0 OR v_profile.city = ANY (c.cities))
  ORDER BY c.ends_at ASC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_reach_missions() TO authenticated;

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
  v_campaign public.campaigns;
  v_account public.affiliate_social_accounts;
  v_url text := btrim(COALESCE(p_post_url, ''));
  v_proof text := NULLIF(btrim(COALESCE(p_proof_path, '')), '');
  v_id uuid;
BEGIN
  SELECT * INTO v_campaign FROM public.campaigns WHERE id = p_campaign_id;
  IF v_campaign.id IS NULL OR v_campaign.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Esta missão não está mais ativa';
  END IF;
  IF now() < v_campaign.starts_at THEN
    RAISE EXCEPTION 'A missão ainda não começou';
  END IF;
  IF now() > v_campaign.ends_at + interval '3 days' THEN
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
      campaign_id, affiliate_id, social_account_id, network, post_url, reported_views, proof_path
    ) VALUES (
      v_campaign.id, v_profile.id, v_account.id, v_account.network, v_url,
      GREATEST(COALESCE(p_reported_views, 0), 0), v_proof
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
GRANT EXECUTE ON FUNCTION public.submit_campaign_post(uuid, uuid, text, integer, text) TO authenticated;

-- Atualiza as visualizacoes informadas (ex.: o numero das 72h) enquanto em conferencia
CREATE OR REPLACE FUNCTION public.update_campaign_post_views(
  p_post_id uuid, p_reported_views integer, p_proof_path text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles := public.reach_require_profile('AFFILIATE'::app_role);
  v_proof text := NULLIF(btrim(COALESCE(p_proof_path, '')), '');
BEGIN
  IF v_proof IS NOT NULL AND v_proof NOT LIKE auth.uid()::text || '/%' THEN
    RAISE EXCEPTION 'Arquivo do print inválido';
  END IF;

  UPDATE public.campaign_posts
     SET reported_views = GREATEST(COALESCE(p_reported_views, reported_views), 0),
         proof_path = COALESCE(v_proof, proof_path),
         updated_at = now()
   WHERE id = p_post_id AND affiliate_id = v_profile.id AND status = 'PENDING';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Este post não pode mais ser alterado';
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.update_campaign_post_views(uuid, integer, text) TO authenticated;

-- ---------------------------------------------------------------------
-- ADMIN: conferencia dos posts e dos perfis
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
  v_views integer;
  v_cost integer;
  v_remaining integer;
  v_billed integer;
  v_billed_views integer;
  v_pool integer;
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

  IF p_verified_views IS NULL OR p_verified_views < 0 THEN
    RAISE EXCEPTION 'Informe as visualizações verificadas';
  END IF;
  v_views := p_verified_views;

  SELECT * INTO v_cfg FROM public.reach_config();
  SELECT * INTO v_campaign FROM public.campaigns WHERE id = v_post.campaign_id FOR UPDATE;

  v_cost := FLOOR(v_views::numeric * v_campaign.cpm_cents / 1000)::integer;
  v_remaining := v_campaign.reserved_cents - v_campaign.spent_cents;
  v_billed := LEAST(v_cost, GREATEST(v_remaining, 0));
  v_billed_views := CASE WHEN v_cost = 0 THEN 0
                         ELSE LEAST(v_views, FLOOR(v_billed::numeric * 1000 / v_campaign.cpm_cents)::integer) END;
  v_pool := FLOOR(v_billed * v_cfg.prize_share)::integer;
  v_cycle := public.reach_cycle_for(now());

  UPDATE public.campaign_posts
     SET status = 'APPROVED',
         verified_views = v_views,
         billed_views = v_billed_views,
         billed_cents = v_billed,
         pool_cents = v_pool,
         points = v_views,
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
    'Seu post rendeu ' || v_views::text || ' pontos no ranking do mês.',
    jsonb_build_object('post_id', p_post_id, 'points', v_views));

  RETURN jsonb_build_object('status', 'APPROVED', 'points', v_views,
                            'billed_cents', v_billed, 'pool_cents', v_pool);
END;
$$;
GRANT EXECUTE ON FUNCTION public.review_campaign_post(uuid, boolean, integer, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.verify_social_account(p_account_id uuid, p_followers integer, p_verified boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'ADMIN'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores conferem perfis';
  END IF;
  UPDATE public.affiliate_social_accounts
     SET followers = COALESCE(p_followers, followers),
         verified = COALESCE(p_verified, verified),
         updated_at = now()
   WHERE id = p_account_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.verify_social_account(uuid, integer, boolean) TO authenticated;

-- Grava o resultado da leitura automatica (chamada pela edge function com service_role)
CREATE OR REPLACE FUNCTION public.set_post_auto_check(p_post_id uuid, p_result jsonb)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.campaign_posts
     SET auto_check = COALESCE(p_result, '{}'::jsonb), updated_at = now()
   WHERE id = p_post_id
$$;
REVOKE ALL ON FUNCTION public.set_post_auto_check(uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_post_auto_check(uuid, jsonb) TO service_role;

-- ---------------------------------------------------------------------
-- RANKING E PREMIOS
-- ---------------------------------------------------------------------
-- Ranking do ciclo (sem expor dados pessoais: so primeiro nome e inicial)
CREATE OR REPLACE FUNCTION public.get_reach_ranking(p_cycle_id uuid DEFAULT NULL)
RETURNS TABLE (
  league text,
  rank_position integer,
  display_name text,
  points integer,
  is_me boolean,
  reached_goal boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle uuid := p_cycle_id;
  v_me uuid := public.get_current_profile_id();
  v_min integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Faça login para ver o ranking';
  END IF;
  IF v_cycle IS NULL THEN
    SELECT id INTO v_cycle FROM public.prize_cycles
    WHERE period_start = date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')::date;
  END IF;
  SELECT min_cycle_points INTO v_min FROM public.reach_config();

  RETURN QUERY
  WITH totals AS (
    SELECT cp.affiliate_id, SUM(cp.points)::integer AS pts
    FROM public.campaign_posts cp
    WHERE cp.cycle_id = v_cycle AND cp.status = 'APPROVED'
    GROUP BY cp.affiliate_id
  ), ranked AS (
    SELECT t.affiliate_id, t.pts,
           public.reach_affiliate_league(t.affiliate_id) AS lg
    FROM totals t
  )
  SELECT r.lg,
         (ROW_NUMBER() OVER (PARTITION BY r.lg ORDER BY r.pts DESC, r.affiliate_id))::integer,
         split_part(btrim(COALESCE(NULLIF(p.nome_completo, ''), p.name, 'Divulgador')), ' ', 1)
           || COALESCE(' ' || left(NULLIF(split_part(btrim(COALESCE(NULLIF(p.nome_completo, ''), p.name, '')), ' ', 2), ''), 1) || '.', ''),
         r.pts,
         r.affiliate_id = v_me,
         r.pts >= v_min
  FROM ranked r
  JOIN public.profiles p ON p.id = r.affiliate_id
  ORDER BY r.lg, r.pts DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_reach_ranking(uuid) TO authenticated;

-- Vencedores nominais do ciclo: top N de cada liga que bateu a meta minima
CREATE OR REPLACE FUNCTION public.reach_cycle_winners(p_cycle_id uuid)
RETURNS TABLE (affiliate_id uuid, pts integer, lg text, pos integer, nominal integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH cfg AS (SELECT * FROM public.reach_config()),
  totals AS (
    SELECT cp.affiliate_id, SUM(cp.points)::integer AS pts
    FROM public.campaign_posts cp
    WHERE cp.cycle_id = p_cycle_id AND cp.status = 'APPROVED'
    GROUP BY cp.affiliate_id
  ),
  ranked AS (
    SELECT t.affiliate_id, t.pts,
           public.reach_affiliate_league(t.affiliate_id) AS lg
    FROM totals t, cfg
    WHERE t.pts >= cfg.min_cycle_points
  ),
  numbered AS (
    SELECT r.*, (ROW_NUMBER() OVER (PARTITION BY r.lg ORDER BY r.pts DESC, r.affiliate_id))::integer AS pos
    FROM ranked r
  )
  SELECT n.affiliate_id, n.pts, n.lg, n.pos, cfg.prizes_cents[n.pos]::integer
  FROM numbered n, cfg
  WHERE n.pos <= COALESCE(array_length(cfg.prizes_cents, 1), 0)
$$;
REVOKE ALL ON FUNCTION public.reach_cycle_winners(uuid) FROM PUBLIC, anon, authenticated;

-- Fecha o ciclo: premia os melhores de cada liga que bateram a meta minima.
-- Se o fundo nao cobrir os premios anunciados, todos os premios sao reduzidos
-- na mesma proporcao. O que sobrar passa para o ciclo seguinte.
CREATE OR REPLACE FUNCTION public.close_prize_cycle(p_cycle_id uuid, p_force boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle public.prize_cycles;
  v_cfg record;
  v_budget integer;
  v_nominal integer := 0;
  v_factor numeric := 1;
  v_paid integer := 0;
  v_amount integer;
  v_next date;
  v_leftover integer;
  r record;
  v_winners integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'ADMIN'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores fecham o ciclo';
  END IF;

  SELECT * INTO v_cycle FROM public.prize_cycles WHERE id = p_cycle_id FOR UPDATE;
  IF v_cycle.id IS NULL THEN
    RAISE EXCEPTION 'Ciclo não encontrado';
  END IF;
  IF v_cycle.status <> 'OPEN' THEN
    RAISE EXCEPTION 'Este ciclo já foi fechado';
  END IF;
  IF NOT COALESCE(p_force, false)
     AND (v_cycle.period_start + interval '1 month') > (now() AT TIME ZONE 'America/Sao_Paulo') THEN
    RAISE EXCEPTION 'O mês deste ciclo ainda não terminou';
  END IF;

  SELECT * INTO v_cfg FROM public.reach_config();
  v_budget := v_cycle.pool_cents + v_cycle.carried_in_cents;

  SELECT COALESCE(SUM(w.nominal), 0) INTO v_nominal FROM public.reach_cycle_winners(v_cycle.id) w;
  IF v_nominal > v_budget AND v_nominal > 0 THEN
    v_factor := v_budget::numeric / v_nominal;
  END IF;

  FOR r IN SELECT * FROM public.reach_cycle_winners(v_cycle.id) w ORDER BY w.lg, w.pos LOOP
    v_amount := FLOOR(r.nominal * v_factor)::integer;
    IF v_amount <= 0 THEN CONTINUE; END IF;

    INSERT INTO public.prize_awards (cycle_id, affiliate_id, league, position, points, amount_cents)
    VALUES (v_cycle.id, r.affiliate_id, r.lg, r.pos, r.pts, v_amount);

    UPDATE public.profiles SET balance = balance + v_amount WHERE id = r.affiliate_id;

    INSERT INTO public.transactions (user_id, amount, type, description, status)
    VALUES (r.affiliate_id, v_amount, 'PRIZE',
            'Prêmio do ranking de ' || to_char(v_cycle.period_start, 'MM/YYYY') ||
              ' (' || r.pos || 'º lugar, liga ' || initcap(r.lg) || ')', 'RELEASED');

    PERFORM public.reach_notify(r.affiliate_id, 'PRIZE_WON', 'Você foi premiado! 🏆',
      'Você ficou em ' || r.pos || 'º lugar na liga ' || initcap(r.lg) ||
        ' e ganhou ' || public.reach_brl(v_amount) || '. O valor já está no seu saldo.',
      jsonb_build_object('cycle_id', v_cycle.id, 'amount_cents', v_amount));

    v_paid := v_paid + v_amount;
    v_winners := v_winners + 1;
  END LOOP;

  v_leftover := v_budget - v_paid;
  v_next := (v_cycle.period_start + interval '1 month')::date;

  UPDATE public.prize_cycles
     SET status = 'CLOSED', paid_cents = v_paid, closed_at = now(), closed_by = auth.uid()
   WHERE id = v_cycle.id;

  INSERT INTO public.prize_cycles (period_start, carried_in_cents)
  VALUES (v_next, v_leftover)
  ON CONFLICT (period_start) DO UPDATE
    SET carried_in_cents = public.prize_cycles.carried_in_cents + EXCLUDED.carried_in_cents;

  -- pontos aprovados depois do fechamento caem no ciclo seguinte (reach_cycle_for)
  RETURN jsonb_build_object('winners', v_winners, 'paid_cents', v_paid,
                            'carried_cents', v_leftover, 'scale', v_factor);
END;
$$;
GRANT EXECUTE ON FUNCTION public.close_prize_cycle(uuid, boolean) TO authenticated;

