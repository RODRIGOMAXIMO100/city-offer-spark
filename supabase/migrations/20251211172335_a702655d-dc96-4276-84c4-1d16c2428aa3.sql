-- Tabela de pagamentos para receber créditos
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  asaas_payment_id TEXT,
  amount_brl NUMERIC NOT NULL,
  amount_credits INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('PIX', 'CREDIT_CARD')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED', 'EXPIRED')),
  pix_qr_code TEXT,
  pix_code TEXT,
  installments INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX idx_payments_profile_id ON payments(profile_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_asaas_id ON payments(asaas_payment_id);

-- RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Políticas: usuários veem seus próprios pagamentos
CREATE POLICY "Users can view their own payments"
ON payments FOR SELECT
USING (profile_id = get_current_profile_id());

CREATE POLICY "Users can insert their own payments"
ON payments FOR INSERT
WITH CHECK (profile_id = get_current_profile_id());

-- Admins podem ver todos
CREATE POLICY "Admins can view all payments"
ON payments FOR SELECT
USING (has_role(auth.uid(), 'ADMIN'));

-- Service role pode gerenciar tudo (para webhooks)
CREATE POLICY "Service role can manage payments"
ON payments FOR ALL
USING (true)
WITH CHECK (true);

-- Adicionar colunas auxiliares em profiles e withdrawals
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS asaas_transfer_id TEXT;