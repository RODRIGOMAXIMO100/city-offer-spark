-- Lançamento por Belo Horizonte: só BH aceita cadastro; as outras cidades vão para o pré-cadastro (city_waitlist).
-- Para abrir outra cidade depois: admin > Cidades (ou update available_cities set active = true where ...).
update public.available_cities
   set active = (state_code = 'MG' and city_name = 'Belo Horizonte'),
       activated_at = case when state_code = 'MG' and city_name = 'Belo Horizonte' then coalesce(activated_at, now()) else activated_at end
 where active is distinct from (state_code = 'MG' and city_name = 'Belo Horizonte');
