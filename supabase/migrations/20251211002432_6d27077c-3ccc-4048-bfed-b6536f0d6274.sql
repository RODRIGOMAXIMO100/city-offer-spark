-- Adicionar role ADMIN ao usuário rodrigo@maximoacelera.com.br
INSERT INTO public.user_roles (user_id, role)
VALUES ('c675cba4-3bc2-446f-9453-00c21549e67e', 'ADMIN')
ON CONFLICT (user_id, role) DO NOTHING;

-- Admin pode ver todas as ofertas (incluindo inativas)
CREATE POLICY "Admins can view all offers"
ON public.offers
FOR SELECT
USING (has_role(auth.uid(), 'ADMIN'));

-- Admin pode atualizar qualquer oferta
CREATE POLICY "Admins can update all offers"
ON public.offers
FOR UPDATE
USING (has_role(auth.uid(), 'ADMIN'));

-- Admin pode deletar qualquer oferta
CREATE POLICY "Admins can delete all offers"
ON public.offers
FOR DELETE
USING (has_role(auth.uid(), 'ADMIN'));

-- Admin pode ver todas as transações
CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
USING (has_role(auth.uid(), 'ADMIN'));

-- Admin pode ver todos os cliques
CREATE POLICY "Admins can view all clicks"
ON public.offer_clicks
FOR SELECT
USING (has_role(auth.uid(), 'ADMIN'));

-- Admin pode ver todos os rate limits
CREATE POLICY "Admins can view all rate limits"
ON public.click_rate_limits
FOR SELECT
USING (has_role(auth.uid(), 'ADMIN'));

-- Admin pode gerenciar rate limits
CREATE POLICY "Admins can manage rate limits"
ON public.click_rate_limits
FOR ALL
USING (has_role(auth.uid(), 'ADMIN'));