-- =====================================================================
-- CLILIN: painel do admin no modelo de campanhas de alcance
-- 1) admin_reach_summary: números da tela inicial e do financeiro, num período
-- 2) admin_add_credits: coloca créditos na conta de uma empresa (Pix recebido fora do sistema)
-- Só administradores executam. Não cria tabela nova.
-- =====================================================================

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
    'posts_pending',       (SELECT count(*) FROM campaign_posts WHERE status = 'PENDING'),
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


CREATE OR REPLACE FUNCTION public.admin_add_credits(p_profile_id uuid, p_amount_cents integer, p_note text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
  v_is_company boolean;
BEGIN
  IF NOT public.has_role(auth.uid(), 'ADMIN'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores';
  END IF;
  IF p_amount_cents IS NULL OR p_amount_cents = 0 THEN
    RAISE EXCEPTION 'Informe um valor';
  END IF;
  IF abs(p_amount_cents) > 10000000 THEN
    RAISE EXCEPTION 'Valor acima do limite de R$ 100.000 por lançamento';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM profiles p JOIN user_roles r ON r.user_id = p.user_id
     WHERE p.id = p_profile_id AND r.role = 'COMPANY'
  ) INTO v_is_company;
  IF NOT v_is_company THEN
    RAISE EXCEPTION 'Créditos só podem ser lançados para empresas';
  END IF;

  UPDATE profiles SET balance = balance + p_amount_cents
   WHERE id = p_profile_id
   RETURNING balance INTO v_balance;

  IF v_balance < 0 THEN
    RAISE EXCEPTION 'O saldo não pode ficar negativo';
  END IF;

  INSERT INTO transactions (user_id, amount, type, description, status)
  VALUES (
    p_profile_id,
    p_amount_cents,
    CASE WHEN p_amount_cents > 0 THEN 'DEPOSIT'::transaction_type ELSE 'ADMIN_ADJUSTMENT'::transaction_type END,
    CASE WHEN p_amount_cents > 0 THEN 'Créditos lançados pelo admin' ELSE 'Créditos retirados pelo admin' END
      || COALESCE(': ' || NULLIF(trim(p_note), ''), ''),
    'RELEASED'
  );

  PERFORM public.reach_notify(
    p_profile_id,
    'CREDITS_ADDED',
    CASE WHEN p_amount_cents > 0 THEN 'Créditos na conta' ELSE 'Ajuste de créditos' END,
    CASE WHEN p_amount_cents > 0
      THEN 'Entraram ' || public.reach_brl(p_amount_cents) || ' em créditos. Já dá para criar sua campanha.'
      ELSE 'Foram retirados ' || public.reach_brl(abs(p_amount_cents)) || ' do seu saldo de créditos.' END,
    jsonb_build_object('amount_cents', p_amount_cents)
  );

  RETURN v_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_add_credits(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_add_credits(uuid, integer, text) TO authenticated;
