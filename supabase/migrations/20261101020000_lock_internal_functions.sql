-- =====================================================================
-- CLILIN: fecha funções internas que estavam abertas para qualquer um pela API
-- Elas são chamadas só por funções do servidor (chave de serviço), por gatilhos ou pelo agendador.
-- Gatilhos e o agendador continuam funcionando: não dependem desse acesso.
-- =====================================================================

-- Sem nenhum acesso pela API (só servidor)
DO $$
DECLARE
  f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.credit_onboarding_bonus(uuid, text, integer)',
    'public.update_affiliate_fraud_score(uuid, integer)',
    'public.update_affiliate_stats(uuid, integer)',
    'public.update_affiliate_stats_lead(uuid, integer)',
    'public.create_fraud_alert(uuid, text, text, text, text, jsonb)',
    'public.archive_and_reset_monthly_stats()',
    'public.reset_weekly_clicks()',
    'public.recalculate_affiliate_stats(uuid)',
    'public.recalculate_all_affiliate_stats()',
    'public.recalculate_all_monthly_levels()',
    'public.recalculate_all_offer_scores()',
    'public.update_ranking_positions()',
    'public.cleanup_ai_chat_rate_limits()',
    'public.cleanup_old_rate_limits()',
    'public.cleanup_old_sessions()',
    'public.cleanup_old_signup_rate_limits()',
    'public.increment_offer_clicks(uuid)',
    'public.increment_offer_leads(uuid)',
    'public.calculate_offer_score(uuid)',
    'public.calculate_real_cpc(uuid, text)',
    'public.calculate_real_cpl(uuid, text)',
    'public.effective_fee_for_company(integer, uuid)',
    -- funções de gatilho
    'public.calculate_offer_score_trigger()',
    'public.handle_new_user_email()',
    'public.increment_waitlist_count()',
    'public.notify_level_change()',
    'public.update_offer_leads_count()'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f);
  END LOOP;
END $$;

-- Só para quem está logado (têm checagem própria ou são usadas pelo painel)
DO $$
DECLARE
  f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.admin_exec_sql(text)',
    'public.close_invoice(uuid)',
    'public.mark_invoice_paid(uuid)',
    'public.calc_redemption_fee(uuid)',
    'public.get_commission_multiplier(uuid)',
    'public.get_affiliate_level(integer)',
    'public.get_affiliate_level_monthly(integer)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', f);
  END LOOP;
END $$;
