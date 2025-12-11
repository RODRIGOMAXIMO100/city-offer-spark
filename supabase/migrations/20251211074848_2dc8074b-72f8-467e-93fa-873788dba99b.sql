-- Permitir visualizar perfis de empresas que têm ofertas ativas
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