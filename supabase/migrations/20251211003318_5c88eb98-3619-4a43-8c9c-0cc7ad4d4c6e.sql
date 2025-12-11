-- Remove ADMIN role from rodrigo@maximoacelera.com.br (keep only CLIENT)
DELETE FROM public.user_roles 
WHERE user_id = 'c675cba4-3bc2-446f-9453-00c21549e67e' 
  AND role = 'ADMIN';