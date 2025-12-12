-- Adicionar campos de banimento na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS balance_frozen BOOLEAN DEFAULT FALSE;

-- Criar tabela de histórico de bans
CREATE TABLE IF NOT EXISTS public.user_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES public.profiles(id),
  reason TEXT NOT NULL,
  evidence JSONB DEFAULT '{}'::jsonb,
  balance_at_ban INTEGER NOT NULL DEFAULT 0,
  action_type TEXT NOT NULL DEFAULT 'BAN', -- BAN, UNBAN, FREEZE, UNFREEZE
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de blacklist de fraude
CREATE TABLE IF NOT EXISTS public.fraud_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('cpf', 'email', 'phone', 'pix_key')),
  value TEXT NOT NULL,
  reason TEXT,
  added_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(type, value)
);

-- Criar tabela de alertas de fraude
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  title TEXT NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

-- Policies para user_bans
CREATE POLICY "Admins can manage user bans" ON public.user_bans
FOR ALL USING (has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Service role can manage user bans" ON public.user_bans
FOR ALL USING (true) WITH CHECK (true);

-- Policies para fraud_blacklist
CREATE POLICY "Admins can manage blacklist" ON public.fraud_blacklist
FOR ALL USING (has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Service role can manage blacklist" ON public.fraud_blacklist
FOR ALL USING (true) WITH CHECK (true);

-- Policies para fraud_alerts
CREATE POLICY "Admins can manage fraud alerts" ON public.fraud_alerts
FOR ALL USING (has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Service role can manage fraud alerts" ON public.fraud_alerts
FOR ALL USING (true) WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_bans_user_id ON public.user_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_blacklist_type_value ON public.fraud_blacklist(type, value);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_user_id ON public.fraud_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_resolved ON public.fraud_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_profiles_banned ON public.profiles(banned) WHERE banned = true;