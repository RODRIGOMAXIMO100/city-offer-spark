-- Allow anyone to view basic profile info (name, instagram) for companies with active offers
CREATE POLICY "Anyone can view company profiles with active offers"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT DISTINCT company_id 
    FROM offers 
    WHERE active = true AND deleted_at IS NULL
  )
);