-- Allow admins to update any profile (for balance adjustments, etc.)
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (has_role(auth.uid(), 'ADMIN'::app_role));