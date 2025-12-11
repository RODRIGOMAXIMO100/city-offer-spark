-- =====================================================
-- CORREÇÕES DE SEGURANÇA CRÍTICAS
-- =====================================================

-- 1. PROFILES: Criar view pública com dados não-sensíveis
-- e remover política que expõe dados sensíveis

-- Remover política que expõe todos os dados de empresas
DROP POLICY IF EXISTS "Anyone can view company profiles with active offers" ON public.profiles;

-- Criar view pública apenas com dados não-sensíveis para empresas
CREATE OR REPLACE VIEW public.company_public_info AS
SELECT 
  p.id,
  p.name,
  p.city,
  p.instagram_url
FROM public.profiles p
WHERE p.id IN (
  SELECT DISTINCT company_id 
  FROM public.offers 
  WHERE active = true AND deleted_at IS NULL
);

-- Criar política que permite ver apenas dados públicos via view
-- (a view já filtra os campos)
GRANT SELECT ON public.company_public_info TO anon, authenticated;

-- 2. DEVICE_FINGERPRINTS: Remover acesso público
DROP POLICY IF EXISTS "System can manage device fingerprints" ON public.device_fingerprints;

-- Recriar política apenas para service_role (backend)
CREATE POLICY "Service role can manage device fingerprints" 
ON public.device_fingerprints 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 3. PAGE_SESSIONS: Remover acesso público
DROP POLICY IF EXISTS "System can manage page sessions" ON public.page_sessions;

-- Recriar política apenas para service_role (backend)
CREATE POLICY "Service role can manage page sessions" 
ON public.page_sessions 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 4. AFFILIATE_STATS: Modificar política de ranking para não expor earnings
DROP POLICY IF EXISTS "Anyone can view stats for ranking" ON public.affiliate_stats;

-- Criar view pública para ranking (sem dados sensíveis)
CREATE OR REPLACE VIEW public.affiliate_ranking_public AS
SELECT 
  ast.affiliate_id,
  p.name as affiliate_name,
  ast.rank_position,
  ast.current_level_id,
  al.name as level_name,
  al.badge_color
FROM public.affiliate_stats ast
JOIN public.profiles p ON ast.affiliate_id = p.id
LEFT JOIN public.affiliate_levels al ON ast.current_level_id = al.id
WHERE ast.rank_position IS NOT NULL
ORDER BY ast.rank_position ASC
LIMIT 100;

GRANT SELECT ON public.affiliate_ranking_public TO anon, authenticated;

-- 5. CLICK_RATE_LIMITS: Remover acesso público
DROP POLICY IF EXISTS "System can manage rate limits" ON public.click_rate_limits;

-- Recriar política apenas para service_role (backend)
CREATE POLICY "Service role can manage rate limits" 
ON public.click_rate_limits 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 6. OFFERS: Adicionar verificação de deleted_at na política pública
DROP POLICY IF EXISTS "Anyone can view active offers" ON public.offers;

CREATE POLICY "Anyone can view active non-deleted offers" 
ON public.offers 
FOR SELECT 
USING (active = true AND deleted_at IS NULL);

-- 7. OFFER_SCORES: Remover acesso público
DROP POLICY IF EXISTS "System can manage offer scores" ON public.offer_scores;

CREATE POLICY "Service role can manage offer scores" 
ON public.offer_scores 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 8. NOTIFICATIONS: Remover acesso público de insert
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Service role can insert notifications" 
ON public.notifications 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- 9. TRANSACTIONS: Remover acesso público de insert
DROP POLICY IF EXISTS "System can insert transactions" ON public.transactions;

CREATE POLICY "Service role can insert transactions" 
ON public.transactions 
FOR INSERT 
TO service_role
WITH CHECK (true);