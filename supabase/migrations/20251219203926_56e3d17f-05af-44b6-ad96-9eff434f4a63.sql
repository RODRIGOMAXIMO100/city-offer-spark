-- Remover policy antiga que restringe visualização
DROP POLICY IF EXISTS "Anyone can view active cities" ON available_cities;

-- Nova policy: Admins veem tudo, outros veem apenas ativas/agendadas
CREATE POLICY "Anyone can view active cities"
ON available_cities FOR SELECT
USING (
  has_role(auth.uid(), 'ADMIN') 
  OR active = true 
  OR scheduled_activation IS NOT NULL
);