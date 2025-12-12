-- Remover a constraint existente e adicionar nova com ADMIN
ALTER TABLE public.user_onboarding DROP CONSTRAINT IF EXISTS user_onboarding_role_check;
ALTER TABLE public.user_onboarding ADD CONSTRAINT user_onboarding_role_check 
  CHECK (role IN ('COMPANY', 'AFFILIATE', 'CLIENT', 'ADMIN'));