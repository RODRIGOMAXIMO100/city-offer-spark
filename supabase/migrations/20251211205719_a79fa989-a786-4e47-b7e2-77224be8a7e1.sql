-- Tabela para rastrear progresso do onboarding
CREATE TABLE public.user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('COMPANY', 'AFFILIATE', 'CLIENT')),
  tour_completed BOOLEAN DEFAULT FALSE,
  tour_current_step INTEGER DEFAULT 0,
  checklist_items JSONB DEFAULT '[]'::jsonb,
  welcome_bonus_claimed BOOLEAN DEFAULT FALSE,
  bonus_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Users can view their own onboarding
CREATE POLICY "Users can view their own onboarding"
ON public.user_onboarding
FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own onboarding
CREATE POLICY "Users can insert their own onboarding"
ON public.user_onboarding
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own onboarding
CREATE POLICY "Users can update their own onboarding"
ON public.user_onboarding
FOR UPDATE
USING (user_id = auth.uid());

-- Service role can manage all onboarding
CREATE POLICY "Service role can manage onboarding"
ON public.user_onboarding
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_user_onboarding_updated_at
BEFORE UPDATE ON public.user_onboarding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para creditar bônus de onboarding
CREATE OR REPLACE FUNCTION public.credit_onboarding_bonus(
  p_user_id UUID,
  p_bonus_type TEXT,
  p_amount INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
  v_current_items JSONB;
BEGIN
  -- Buscar profile_id
  SELECT id INTO v_profile_id FROM profiles WHERE user_id = p_user_id;
  
  IF v_profile_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se já recebeu este bônus
  SELECT checklist_items INTO v_current_items 
  FROM user_onboarding 
  WHERE user_id = p_user_id;
  
  IF v_current_items IS NOT NULL AND v_current_items ? p_bonus_type THEN
    RETURN FALSE; -- Já recebeu este bônus
  END IF;
  
  -- Creditar bônus no saldo
  UPDATE profiles 
  SET balance = balance + p_amount 
  WHERE id = v_profile_id;
  
  -- Registrar transação
  INSERT INTO transactions (user_id, amount, type, description)
  VALUES (v_profile_id, p_amount, 'DEPOSIT', 'Bônus de onboarding: ' || p_bonus_type);
  
  -- Atualizar checklist_items
  UPDATE user_onboarding
  SET 
    checklist_items = COALESCE(checklist_items, '[]'::jsonb) || jsonb_build_array(p_bonus_type),
    bonus_earned = bonus_earned + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$;