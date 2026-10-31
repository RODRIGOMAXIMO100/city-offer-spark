-- =====================================================================
-- CLILIN — campanhas de alcance: visitante sem login nao executa as RPCs
-- (todas ja exigem usuario logado por dentro; isto fecha tambem no GRANT)
-- =====================================================================
REVOKE EXECUTE ON FUNCTION public.close_prize_cycle(uuid, boolean) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_campaign(text, text, text, text, text[], text[], integer, timestamptz, timestamptz) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_social_account(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.finish_campaign(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_reach_missions() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_reach_ranking(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reach_affiliate_league(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.review_campaign_post(uuid, boolean, integer, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_campaign_post(uuid, uuid, text, integer, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_campaign_post_views(uuid, integer, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.upsert_social_account(text, text, text, integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.verify_social_account(uuid, integer, boolean) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_has_any_role(uuid) FROM anon, PUBLIC;
