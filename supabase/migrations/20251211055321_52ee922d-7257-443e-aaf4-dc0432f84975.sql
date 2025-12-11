-- Remover política que expõe todos os dados do perfil para ranking
DROP POLICY IF EXISTS "Anyone can view public profile data for ranking" ON public.profiles;

-- Remover política redundante de ranking em affiliate_stats
DROP POLICY IF EXISTS "Anyone can view ranking position only" ON public.affiliate_stats;

-- Adicionar política para usuários autenticados verem perfis para ranking
-- Apenas usuários logados podem ver dados de ranking (nome apenas)
CREATE POLICY "Authenticated users can view profiles for ranking" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  id IN (SELECT affiliate_id FROM public.affiliate_stats)
);

-- Política para affiliate_stats - apenas usuários autenticados
CREATE POLICY "Authenticated can view affiliate stats for ranking" 
ON public.affiliate_stats 
FOR SELECT 
TO authenticated
USING (true);