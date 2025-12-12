-- Tabela para rate limit de cadastros por IP
CREATE TABLE IF NOT EXISTS public.signup_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  blocked BOOLEAN DEFAULT false
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_signup_rate_limits_ip ON signup_rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_signup_rate_limits_created_at ON signup_rate_limits(created_at);

-- Habilitar RLS
ALTER TABLE signup_rate_limits ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Service role can manage signup rate limits"
  ON signup_rate_limits FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view signup rate limits"
  ON signup_rate_limits FOR SELECT
  USING (has_role(auth.uid(), 'ADMIN'));

-- Adicionar fraud_score na tabela profiles (se não existir)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fraud_score INTEGER DEFAULT 0;

-- Função para limpar rate limits antigos
CREATE OR REPLACE FUNCTION cleanup_old_signup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM signup_rate_limits WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Função para criar alerta de fraude automaticamente
CREATE OR REPLACE FUNCTION create_fraud_alert(
  p_user_id UUID,
  p_alert_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_description TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO fraud_alerts (user_id, alert_type, severity, title, description, data)
  VALUES (p_user_id, p_alert_type, p_severity, p_title, p_description, p_data)
  RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$;

-- Função para atualizar fraud_score do afiliado
CREATE OR REPLACE FUNCTION update_affiliate_fraud_score(
  p_affiliate_id UUID,
  p_score_delta INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_score INTEGER;
BEGIN
  UPDATE profiles 
  SET fraud_score = GREATEST(0, LEAST(100, COALESCE(fraud_score, 0) + p_score_delta))
  WHERE id = p_affiliate_id
  RETURNING fraud_score INTO v_new_score;
  
  -- Auto-congelar se score > 70
  IF v_new_score > 70 THEN
    UPDATE profiles SET balance_frozen = true WHERE id = p_affiliate_id;
    
    -- Criar alerta
    PERFORM create_fraud_alert(
      p_affiliate_id,
      'HIGH_FRAUD_SCORE',
      'high',
      'Score de fraude alto - Saldo congelado',
      'Afiliado atingiu score de fraude ' || v_new_score || '. Saldo foi congelado automaticamente.',
      jsonb_build_object('fraud_score', v_new_score)
    );
  ELSIF v_new_score > 50 THEN
    -- Criar alerta de atenção
    PERFORM create_fraud_alert(
      p_affiliate_id,
      'MEDIUM_FRAUD_SCORE',
      'medium',
      'Score de fraude elevado',
      'Afiliado atingiu score de fraude ' || v_new_score || '. Requer atenção.',
      jsonb_build_object('fraud_score', v_new_score)
    );
  END IF;
  
  RETURN v_new_score;
END;
$$;