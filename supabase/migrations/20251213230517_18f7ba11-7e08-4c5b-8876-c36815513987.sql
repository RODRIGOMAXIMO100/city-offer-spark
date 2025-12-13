-- Adicionar novo valor ao enum transaction_type
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'ADMIN_ADJUSTMENT';

-- Adicionar política RLS para admins inserirem transações
CREATE POLICY "Admins can insert transactions"
ON public.transactions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'ADMIN'::app_role));