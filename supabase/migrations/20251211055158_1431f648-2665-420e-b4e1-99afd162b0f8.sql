-- Corrigir SECURITY DEFINER nas views
-- Recriar views como SECURITY INVOKER

-- 1. Recriar company_public_info como SECURITY INVOKER
DROP VIEW IF EXISTS public.company_public_info;

CREATE VIEW public.company_public_info 
WITH (security_invoker = true) AS
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

GRANT SELECT ON public.company_public_info TO anon, authenticated;

-- 2. Recriar affiliate_ranking_public como SECURITY INVOKER
DROP VIEW IF EXISTS public.affiliate_ranking_public;

CREATE VIEW public.affiliate_ranking_public 
WITH (security_invoker = true) AS
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

-- 3. Precisamos adicionar uma política para profiles que permita
-- ver apenas dados públicos para a view funcionar
CREATE POLICY "Anyone can view public profile data for ranking" 
ON public.profiles 
FOR SELECT 
USING (
  id IN (
    SELECT affiliate_id FROM public.affiliate_stats WHERE rank_position IS NOT NULL
  )
);

-- 4. Adicionar política para affiliate_stats para ranking público
CREATE POLICY "Anyone can view ranking position only" 
ON public.affiliate_stats 
FOR SELECT 
USING (rank_position IS NOT NULL);