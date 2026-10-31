-- =====================================================================
-- CLILIN — CAMPANHAS DE ALCANCE: novos tipos de transacao
-- Separado da migration principal porque ALTER TYPE ... ADD VALUE nao pode
-- ser usado na mesma transacao que cria o valor.
-- =====================================================================
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'CAMPAIGN_RESERVE';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'CAMPAIGN_REFUND';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'PRIZE';
