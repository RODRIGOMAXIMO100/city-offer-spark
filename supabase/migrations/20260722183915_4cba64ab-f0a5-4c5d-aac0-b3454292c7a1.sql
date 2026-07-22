CREATE POLICY "Admins can insert any offer"
ON public.offers
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));