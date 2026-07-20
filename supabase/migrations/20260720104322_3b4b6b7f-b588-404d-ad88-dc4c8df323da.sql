-- PARTE A: Trancar políticas "manage" abertas
DO $$
DECLARE
  pol record;
  targets text[][] := ARRAY[
    ['affiliate_monthly_history','Service role can manage history'],
    ['affiliate_stats','System can manage affiliate stats'],
    ['blog_posts','Service role can manage blog posts'],
    ['blog_themes','Service role can manage themes'],
    ['city_waitlist','Service role can manage waitlist'],
    ['click_rate_limits','System can manage rate limits'],
    ['device_fingerprints','System can manage device fingerprints'],
    ['fraud_alerts','Service role can manage fraud alerts'],
    ['fraud_blacklist','Service role can manage blacklist'],
    ['lead_rate_limits','Service role can manage lead rate limits'],
    ['leads','Service role can manage leads'],
    ['offer_scores','System can manage offer scores'],
    ['page_sessions','System can manage page sessions'],
    ['payments','Service role can manage payments'],
    ['short_links','Service role can manage short links'],
    ['signup_rate_limits','Service role can manage signup rate limits'],
    ['site_pages','Service role can manage site pages'],
    ['user_bans','Service role can manage user bans'],
    ['user_onboarding','Service role can manage onboarding']
  ];
  t text; n text; i int;
BEGIN
  FOR i IN 1 .. array_length(targets,1) LOOP
    t := targets[i][1]; n := targets[i][2];
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', n, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);',
      n, t);
  END LOOP;
END $$;

-- PARTE B: Revogar EXECUTE de funções internas de anon/authenticated
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'archive_and_reset_monthly_stats','calculate_offer_score',
        'calculate_offer_score_trigger','cleanup_old_rate_limits',
        'cleanup_old_sessions','cleanup_old_signup_rate_limits',
        'create_fraud_alert','credit_onboarding_bonus','handle_new_user_email',
        'increment_waitlist_count','notify_level_change',
        'recalculate_affiliate_stats','recalculate_all_affiliate_stats',
        'recalculate_all_monthly_levels','recalculate_all_offer_scores',
        'reset_weekly_clicks','update_affiliate_fraud_score',
        'update_affiliate_stats','update_affiliate_stats_lead',
        'update_offer_leads_count','update_ranking_positions'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated;', r.sig);
  END LOOP;
END $$;

-- PARTE C: Índices de FK + remove índice duplicado
CREATE INDEX IF NOT EXISTS idx_affiliate_stats_current_level ON public.affiliate_stats(current_level_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_resolved_by ON public.fraud_alerts(resolved_by);
CREATE INDEX IF NOT EXISTS idx_fraud_blacklist_added_by ON public.fraud_blacklist(added_by);
CREATE INDEX IF NOT EXISTS idx_lead_rate_limits_offer ON public.lead_rate_limits(offer_id);
CREATE INDEX IF NOT EXISTS idx_leads_affiliate ON public.leads(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_offer_clicks_affiliate ON public.offer_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_offer_clicks_offer ON public.offer_clicks(offer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_banned_by ON public.profiles(banned_by);
CREATE INDEX IF NOT EXISTS idx_profiles_niche ON public.profiles(niche_id);
CREATE INDEX IF NOT EXISTS idx_short_links_affiliate ON public.short_links(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_transactions_offer ON public.transactions(offer_id);
CREATE INDEX IF NOT EXISTS idx_user_bans_banned_by ON public.user_bans(banned_by);
CREATE INDEX IF NOT EXISTS idx_withdrawals_reviewed_by ON public.withdrawals(reviewed_by);
DROP INDEX IF EXISTS public.idx_short_links_code;

-- PARTE D: Tabela de rate limit do ai-chat
CREATE TABLE IF NOT EXISTS public.ai_chat_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ai_chat_rate_limits TO service_role;
CREATE INDEX IF NOT EXISTS idx_ai_chat_rl_ip_time ON public.ai_chat_rate_limits(ip_address, created_at);
ALTER TABLE public.ai_chat_rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role manages ai chat rate limits" ON public.ai_chat_rate_limits;
CREATE POLICY "Service role manages ai chat rate limits"
  ON public.ai_chat_rate_limits FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.cleanup_ai_chat_rate_limits()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN DELETE FROM public.ai_chat_rate_limits WHERE created_at < now() - interval '24 hours'; END; $fn$;
REVOKE EXECUTE ON FUNCTION public.cleanup_ai_chat_rate_limits() FROM anon, authenticated;