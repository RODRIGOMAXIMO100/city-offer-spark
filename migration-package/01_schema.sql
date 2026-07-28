-- Clilin :: schema completo (concatenacao ordenada das migrations)
-- Gerado em Tue Jul 28 21:45:11 UTC 2026


-- ================= 20251210215051_13685118-c1c7-4651-855f-3112f8b311f6.sql =================
-- Criar enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('COMPANY', 'AFFILIATE', 'CLIENT', 'ADMIN');

-- Criar enum para tipo de link
CREATE TYPE public.link_type AS ENUM ('WHATSAPP', 'MENU', 'SITE');

-- Criar enum para tipo de transação
CREATE TYPE public.transaction_type AS ENUM ('DEPOSIT', 'CLICK_COST', 'CLICK_EARNING', 'WITHDRAW', 'PLATFORM_FEE');

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Viçosa - MG',
  balance INTEGER NOT NULL DEFAULT 0,
  pix_key TEXT,
  preferences TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de roles separada (segurança contra escalação de privilégios)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Tabela de ofertas
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price_old DECIMAL(10,2) NOT NULL,
  price_new DECIMAL(10,2) NOT NULL,
  link_destination TEXT NOT NULL,
  link_type link_type NOT NULL DEFAULT 'WHATSAPP',
  tags TEXT[] DEFAULT '{}',
  city TEXT NOT NULL,
  views_count INTEGER NOT NULL DEFAULT 0,
  clicks_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de transações
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type transaction_type NOT NULL,
  description TEXT,
  offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para rastrear cliques (anti-fraude e atribuição)
CREATE TABLE public.offer_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE NOT NULL,
  affiliate_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_clicks ENABLE ROW LEVEL SECURITY;

-- Função para verificar role (SECURITY DEFINER para evitar recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para obter o profile_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Função para obter a role do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$$;

-- RLS Policies para profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'ADMIN'));

-- RLS Policies para user_roles
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own role on signup"
  ON public.user_roles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies para offers
CREATE POLICY "Anyone can view active offers"
  ON public.offers FOR SELECT
  USING (active = true);

CREATE POLICY "Companies can view their own offers"
  ON public.offers FOR SELECT
  USING (company_id = public.get_current_profile_id());

CREATE POLICY "Companies can insert their own offers"
  ON public.offers FOR INSERT
  WITH CHECK (company_id = public.get_current_profile_id() AND public.has_role(auth.uid(), 'COMPANY'));

CREATE POLICY "Companies can update their own offers"
  ON public.offers FOR UPDATE
  USING (company_id = public.get_current_profile_id() AND public.has_role(auth.uid(), 'COMPANY'));

CREATE POLICY "Companies can delete their own offers"
  ON public.offers FOR DELETE
  USING (company_id = public.get_current_profile_id() AND public.has_role(auth.uid(), 'COMPANY'));

-- RLS Policies para transactions
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (user_id = public.get_current_profile_id());

CREATE POLICY "System can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (true);

-- RLS Policies para offer_clicks
CREATE POLICY "Anyone can insert clicks"
  ON public.offer_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Companies can view clicks on their offers"
  ON public.offer_clicks FOR SELECT
  USING (
    offer_id IN (
      SELECT id FROM public.offers WHERE company_id = public.get_current_profile_id()
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para performance
CREATE INDEX idx_offers_city ON public.offers(city);
CREATE INDEX idx_offers_active ON public.offers(active);
CREATE INDEX idx_offers_company_id ON public.offers(company_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- ================= 20251210215629_88c429ad-b29d-49f9-ab27-e70ea18ec362.sql =================
-- Function to increment offer clicks (used by edge function)
CREATE OR REPLACE FUNCTION public.increment_offer_clicks(offer_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE offers SET clicks_count = clicks_count + 1 WHERE id = offer_id;
END;
$$;

-- ================= 20251210222541_3d18bb7f-3ab2-4dcd-9594-34a8b1f58acc.sql =================
-- Add instagram_url to profiles
ALTER TABLE profiles ADD COLUMN instagram_url text;

-- Add click_type to offer_clicks to track Instagram vs Main clicks
ALTER TABLE offer_clicks ADD COLUMN click_type text DEFAULT 'MAIN';

-- Add comment for documentation
COMMENT ON COLUMN offer_clicks.click_type IS 'Type of click: MAIN (offer) or INSTAGRAM (profile view)';

-- ================= 20251210224449_49293ac3-24a9-4c74-9f04-1857a7c8039b.sql =================
-- Create function to increment offer views (bypasses RLS)
CREATE OR REPLACE FUNCTION public.increment_offer_views(offer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE offers SET views_count = views_count + 1 WHERE id = offer_id;
END;
$$;

-- ================= 20251210225734_e46d1048-1660-40a9-aa07-d532156613a6.sql =================
-- Add deleted_at column to offers table
ALTER TABLE public.offers ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Drop existing FK constraint and recreate with SET NULL
ALTER TABLE public.offer_clicks 
DROP CONSTRAINT IF EXISTS offer_clicks_offer_id_fkey;

ALTER TABLE public.offer_clicks 
ADD CONSTRAINT offer_clicks_offer_id_fkey 
    FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE SET NULL;

-- Make offer_id nullable since it can now be SET NULL
ALTER TABLE public.offer_clicks ALTER COLUMN offer_id DROP NOT NULL;

-- ================= 20251210234537_121b08d8-97c0-4c43-a72b-730637b9c559.sql =================
-- Tabela para rastrear rate limits de cliques por IP/oferta
CREATE TABLE public.click_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  fingerprint TEXT,
  click_count INTEGER DEFAULT 1,
  first_click_at TIMESTAMPTZ DEFAULT now(),
  last_click_at TIMESTAMPTZ DEFAULT now(),
  blocked BOOLEAN DEFAULT false,
  UNIQUE(offer_id, ip_address)
);

-- Índices para performance
CREATE INDEX idx_click_rate_limits_ip ON public.click_rate_limits(ip_address);
CREATE INDEX idx_click_rate_limits_offer ON public.click_rate_limits(offer_id);
CREATE INDEX idx_click_rate_limits_last_click ON public.click_rate_limits(last_click_at);

-- RLS
ALTER TABLE public.click_rate_limits ENABLE ROW LEVEL SECURITY;

-- Apenas o sistema pode inserir/atualizar (via service role)
CREATE POLICY "System can manage rate limits"
ON public.click_rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Função para limpar rate limits antigos (mais de 24h)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.click_rate_limits 
  WHERE last_click_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- ================= 20251211001422_c2f2f7b5-eef6-49ee-a957-3593e6814070.sql =================
-- Campos para Empresas (dados fiscais para nota fiscal)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS razao_social TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS endereco_fiscal TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefone TEXT;

-- Campos para Afiliados (dados para pagamento)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nome_completo TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pix_tipo TEXT;

-- ================= 20251211002432_6d27077c-3ccc-4048-bfed-b6536f0d6274.sql =================
-- Adicionar role ADMIN ao usuário rodrigo@maximoacelera.com.br
INSERT INTO public.user_roles (user_id, role)
VALUES ('c675cba4-3bc2-446f-9453-00c21549e67e', 'ADMIN')
ON CONFLICT (user_id, role) DO NOTHING;

-- Admin pode ver todas as ofertas (incluindo inativas)
CREATE POLICY "Admins can view all offers"
ON public.offers
FOR SELECT
USING (has_role(auth.uid(), 'ADMIN'));

-- Admin pode atualizar qualquer oferta
CREATE POLICY "Admins can update all offers"
ON public.offers
FOR UPDATE
USING (has_role(auth.uid(), 'ADMIN'));

-- Admin pode deletar qualquer oferta
CREATE POLICY "Admins can delete all offers"
ON public.offers
FOR DELETE
USING (has_role(auth.uid(), 'ADMIN'));

-- Admin pode ver todas as transações
CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
USING (has_role(auth.uid(), 'ADMIN'));

-- Admin pode ver todos os cliques
CREATE POLICY "Admins can view all clicks"
ON public.offer_clicks
FOR SELECT
USING (has_role(auth.uid(), 'ADMIN'));

-- Admin pode ver todos os rate limits
CREATE POLICY "Admins can view all rate limits"
ON public.click_rate_limits
FOR SELECT
USING (has_role(auth.uid(), 'ADMIN'));

-- Admin pode gerenciar rate limits
CREATE POLICY "Admins can manage rate limits"
ON public.click_rate_limits
FOR ALL
USING (has_role(auth.uid(), 'ADMIN'));

-- ================= 20251211003318_5c88eb98-3619-4a43-8c9c-0cc7ad4d4c6e.sql =================
-- Remove ADMIN role from rodrigo@maximoacelera.com.br (keep only CLIENT)
DELETE FROM public.user_roles 
WHERE user_id = 'c675cba4-3bc2-446f-9453-00c21549e67e' 
  AND role = 'ADMIN';

-- ================= 20251211005445_58a0a770-c1ff-4af4-a311-23a3607f17f3.sql =================
-- Allow admins to view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- ================= 20251211010509_c5c03280-36fe-437c-8f45-20aeb6bff3b5.sql =================
-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN email text;

-- Update existing profiles with emails from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id;

-- Create trigger function to populate email on new signups
CREATE OR REPLACE FUNCTION public.handle_new_user_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET email = NEW.email 
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created_update_email
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user_email();

-- ================= 20251211015808_c685b1b0-50e1-4d82-a2d3-d8e047ca9391.sql =================
-- Create withdrawal status enum
CREATE TYPE withdrawal_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED');

-- Create withdrawals table for anti-fraud system
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  amount_brl NUMERIC(10,2) NOT NULL,
  status withdrawal_status DEFAULT 'PENDING',
  pix_key TEXT NOT NULL,
  pix_tipo TEXT NOT NULL,
  cpf TEXT NOT NULL,
  nome_completo TEXT NOT NULL,
  fraud_score INTEGER DEFAULT 0,
  fraud_reasons TEXT[] DEFAULT '{}',
  requested_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create device fingerprints table for advanced anti-fraud
CREATE TABLE public.device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  fingerprint_data JSONB,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  is_suspicious BOOLEAN DEFAULT false,
  blocked BOOLEAN DEFAULT false,
  UNIQUE(device_id, ip_address)
);

-- Create page sessions table for server-side time validation
CREATE TABLE public.page_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  client_ip TEXT NOT NULL,
  device_id TEXT,
  fingerprint_hash TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  validated BOOLEAN DEFAULT false
);

-- Create affiliate levels table for gamification
CREATE TABLE public.affiliate_levels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  min_clicks INTEGER NOT NULL,
  commission_multiplier NUMERIC(3,2) DEFAULT 1.00,
  badge_color TEXT NOT NULL,
  benefits TEXT[]
);

-- Insert default affiliate levels
INSERT INTO public.affiliate_levels (name, min_clicks, commission_multiplier, badge_color, benefits) VALUES
('Bronze', 0, 1.00, '#CD7F32', ARRAY['Comissão padrão R$ 0,30']),
('Prata', 100, 1.10, '#C0C0C0', ARRAY['Comissão +10%', 'Destaque no ranking']),
('Ouro', 500, 1.20, '#FFD700', ARRAY['Comissão +20%', 'Suporte prioritário']),
('Platina', 2000, 1.35, '#E5E4E2', ARRAY['Comissão +35%', 'Ofertas exclusivas']),
('Elite', 10000, 1.50, '#B9F2FF', ARRAY['Comissão +50%', 'Bônus mensais']);

-- Create affiliate stats table for tracking progress
CREATE TABLE public.affiliate_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  total_clicks INTEGER DEFAULT 0,
  total_earnings INTEGER DEFAULT 0,
  current_level_id INTEGER REFERENCES public.affiliate_levels(id) DEFAULT 1,
  level_progress NUMERIC(5,2) DEFAULT 0,
  clicks_this_month INTEGER DEFAULT 0,
  clicks_this_week INTEGER DEFAULT 0,
  rank_position INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for withdrawals
CREATE POLICY "Users can view their own withdrawals"
ON public.withdrawals FOR SELECT
USING (user_id = get_current_profile_id());

CREATE POLICY "Users can insert their own withdrawals"
ON public.withdrawals FOR INSERT
WITH CHECK (user_id = get_current_profile_id());

CREATE POLICY "Admins can view all withdrawals"
ON public.withdrawals FOR SELECT
USING (has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Admins can update all withdrawals"
ON public.withdrawals FOR UPDATE
USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- RLS Policies for device_fingerprints (system managed)
CREATE POLICY "System can manage device fingerprints"
ON public.device_fingerprints FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can view device fingerprints"
ON public.device_fingerprints FOR SELECT
USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- RLS Policies for page_sessions (system managed)
CREATE POLICY "System can manage page sessions"
ON public.page_sessions FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for affiliate_levels (public read)
CREATE POLICY "Anyone can view affiliate levels"
ON public.affiliate_levels FOR SELECT
USING (true);

-- RLS Policies for affiliate_stats
CREATE POLICY "Users can view their own stats"
ON public.affiliate_stats FOR SELECT
USING (affiliate_id = get_current_profile_id());

CREATE POLICY "Anyone can view stats for ranking"
ON public.affiliate_stats FOR SELECT
USING (true);

CREATE POLICY "System can manage affiliate stats"
ON public.affiliate_stats FOR ALL
USING (true)
WITH CHECK (true);

-- Function to calculate affiliate level based on total clicks
CREATE OR REPLACE FUNCTION public.get_affiliate_level(total_clicks INTEGER)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM public.affiliate_levels 
  WHERE min_clicks <= total_clicks 
  ORDER BY min_clicks DESC 
  LIMIT 1;
$$;

-- Function to get commission multiplier for an affiliate
CREATE OR REPLACE FUNCTION public.get_commission_multiplier(affiliate_profile_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT al.commission_multiplier 
     FROM affiliate_stats ast 
     JOIN affiliate_levels al ON ast.current_level_id = al.id 
     WHERE ast.affiliate_id = affiliate_profile_id),
    1.00
  );
$$;

-- Function to update affiliate stats after a click
CREATE OR REPLACE FUNCTION public.update_affiliate_stats(affiliate_profile_id UUID, earnings INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_total_clicks INTEGER;
  new_level_id INTEGER;
BEGIN
  -- Insert or update affiliate stats
  INSERT INTO affiliate_stats (affiliate_id, total_clicks, total_earnings, clicks_this_month, clicks_this_week)
  VALUES (affiliate_profile_id, 1, earnings, 1, 1)
  ON CONFLICT (affiliate_id) DO UPDATE SET
    total_clicks = affiliate_stats.total_clicks + 1,
    total_earnings = affiliate_stats.total_earnings + earnings,
    clicks_this_month = affiliate_stats.clicks_this_month + 1,
    clicks_this_week = affiliate_stats.clicks_this_week + 1,
    updated_at = now();
  
  -- Get new total clicks
  SELECT total_clicks INTO new_total_clicks FROM affiliate_stats WHERE affiliate_id = affiliate_profile_id;
  
  -- Calculate and update level
  new_level_id := get_affiliate_level(new_total_clicks);
  
  UPDATE affiliate_stats 
  SET current_level_id = new_level_id,
      level_progress = (
        SELECT ((new_total_clicks - al.min_clicks)::NUMERIC / 
                NULLIF((LEAD(al.min_clicks) OVER (ORDER BY al.min_clicks) - al.min_clicks), 0)) * 100
        FROM affiliate_levels al
        WHERE al.id = new_level_id
      )
  WHERE affiliate_id = affiliate_profile_id;
END;
$$;

-- Function to cleanup old page sessions (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.page_sessions 
  WHERE started_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX idx_device_fingerprints_device_id ON public.device_fingerprints(device_id);
CREATE INDEX idx_page_sessions_token ON public.page_sessions(session_token);
CREATE INDEX idx_page_sessions_offer ON public.page_sessions(offer_id);
CREATE INDEX idx_affiliate_stats_affiliate ON public.affiliate_stats(affiliate_id);
CREATE INDEX idx_affiliate_stats_rank ON public.affiliate_stats(rank_position);

-- ================= 20251211015928_9d48a096-550f-473c-8419-b1915cd92e66.sql =================
-- Fix function search path for get_affiliate_level
CREATE OR REPLACE FUNCTION public.get_affiliate_level(total_clicks INTEGER)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.affiliate_levels 
  WHERE min_clicks <= total_clicks 
  ORDER BY min_clicks DESC 
  LIMIT 1;
$$;

-- ================= 20251211023244_185f5d54-2994-41af-bb6b-1fbe99e488ad.sql =================
-- Tabela de notificações
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Index para busca rápida
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (user_id = get_current_profile_id());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (user_id = get_current_profile_id());

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Função para reset semanal de clicks
CREATE OR REPLACE FUNCTION public.reset_weekly_clicks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE affiliate_stats 
  SET clicks_this_week = 0, updated_at = now();
END;
$$;

-- Trigger para notificar mudança de nível
CREATE OR REPLACE FUNCTION public.notify_level_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.current_level_id IS DISTINCT FROM NEW.current_level_id 
     AND NEW.current_level_id > COALESCE(OLD.current_level_id, 0) THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
      NEW.affiliate_id,
      'LEVEL_UP',
      'Parabéns! Você subiu de nível! 🎉',
      'Você alcançou o nível ' || al.name,
      jsonb_build_object(
        'level_id', NEW.current_level_id,
        'level_name', al.name,
        'badge_color', al.badge_color
      )
    FROM affiliate_levels al
    WHERE al.id = NEW.current_level_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Criar trigger na tabela affiliate_stats
CREATE TRIGGER on_level_change
  AFTER UPDATE ON public.affiliate_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_level_change();

-- Enable realtime para notificações
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ================= 20251211023549_5ed4ff43-5ec0-41d2-b914-126d77d02ea2.sql =================
-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- ================= 20251211025707_2e37b1c8-320f-4eb2-930f-deebca985b60.sql =================
-- Create table to log individual views with timestamps
CREATE TABLE public.offer_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  client_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offer_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert views (public action)
CREATE POLICY "Anyone can insert views"
ON public.offer_views
FOR INSERT
WITH CHECK (true);

-- Companies can view their offer's views
CREATE POLICY "Companies can view clicks on their offers"
ON public.offer_views
FOR SELECT
USING (offer_id IN (
  SELECT id FROM offers WHERE company_id = get_current_profile_id()
));

-- Admins can view all
CREATE POLICY "Admins can view all views"
ON public.offer_views
FOR SELECT
USING (has_role(auth.uid(), 'ADMIN'));

-- Create index for performance
CREATE INDEX idx_offer_views_offer_id ON public.offer_views(offer_id);
CREATE INDEX idx_offer_views_created_at ON public.offer_views(created_at);

-- ================= 20251211031553_0e05e4e2-846e-44d3-873d-677cb9b59872.sql =================
-- Criar tabela de configuração de preços
CREATE TABLE public.pricing_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  min_cpc integer NOT NULL DEFAULT 4,
  max_cpc integer NOT NULL DEFAULT 15,
  default_cpc integer NOT NULL DEFAULT 5,
  affiliate_share numeric NOT NULL DEFAULT 0.60,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Inserir configuração padrão
INSERT INTO public.pricing_config (min_cpc, max_cpc, default_cpc, affiliate_share)
VALUES (4, 15, 5, 0.60);

-- Habilitar RLS
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

-- Política: qualquer um pode ler configurações
CREATE POLICY "Anyone can view pricing config"
ON public.pricing_config FOR SELECT
USING (true);

-- Política: apenas admins podem atualizar
CREATE POLICY "Admins can update pricing config"
ON public.pricing_config FOR UPDATE
USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Adicionar colunas na tabela offers
ALTER TABLE public.offers 
ADD COLUMN max_cpc_bid integer NOT NULL DEFAULT 5,
ADD COLUMN current_offer_score numeric NOT NULL DEFAULT 5.0;

-- Criar tabela de histórico de scores
CREATE TABLE public.offer_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  ctr_score numeric NOT NULL DEFAULT 5.0,
  quality_score numeric NOT NULL DEFAULT 5.0,
  reputation_score numeric NOT NULL DEFAULT 5.0,
  relevance_score numeric NOT NULL DEFAULT 5.0,
  total_score numeric NOT NULL DEFAULT 5.0,
  calculated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.offer_scores ENABLE ROW LEVEL SECURITY;

-- Política: empresas podem ver scores das suas ofertas
CREATE POLICY "Companies can view their offer scores"
ON public.offer_scores FOR SELECT
USING (offer_id IN (SELECT id FROM offers WHERE company_id = get_current_profile_id()));

-- Política: sistema pode gerenciar scores
CREATE POLICY "System can manage offer scores"
ON public.offer_scores FOR ALL
USING (true)
WITH CHECK (true);

-- Criar índice para performance
CREATE INDEX idx_offer_scores_offer_id ON public.offer_scores(offer_id);
CREATE INDEX idx_offer_scores_calculated_at ON public.offer_scores(calculated_at DESC);

-- Função para calcular Offer Score
CREATE OR REPLACE FUNCTION public.calculate_offer_score(p_offer_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_offer RECORD;
  v_company RECORD;
  v_ctr_score numeric := 5.0;
  v_quality_score numeric := 5.0;
  v_reputation_score numeric := 5.0;
  v_relevance_score numeric := 5.0;
  v_total_score numeric;
  v_avg_ctr numeric;
  v_offer_ctr numeric;
  v_discount_pct numeric;
BEGIN
  -- Buscar dados da oferta
  SELECT o.*, p.instagram_url, p.created_at as company_created_at
  INTO v_offer
  FROM offers o
  JOIN profiles p ON o.company_id = p.id
  WHERE o.id = p_offer_id;
  
  IF NOT FOUND THEN
    RETURN 5.0;
  END IF;
  
  -- 1. CTR Score (40% do peso) - Compara com média da cidade
  SELECT AVG(CASE WHEN views_count > 0 THEN clicks_count::numeric / views_count ELSE 0 END)
  INTO v_avg_ctr
  FROM offers
  WHERE city = v_offer.city AND active = true AND deleted_at IS NULL;
  
  IF v_offer.views_count > 10 THEN
    v_offer_ctr := v_offer.clicks_count::numeric / v_offer.views_count;
    IF v_avg_ctr > 0 THEN
      v_ctr_score := LEAST(10, GREATEST(1, 5 + (v_offer_ctr - v_avg_ctr) / v_avg_ctr * 5));
    END IF;
  END IF;
  
  -- 2. Quality Score (30% do peso) - Baseado em desconto e completude
  v_discount_pct := (v_offer.price_old - v_offer.price_new) / v_offer.price_old * 100;
  v_quality_score := 3; -- Base
  
  IF v_discount_pct >= 50 THEN
    v_quality_score := v_quality_score + 3;
  ELSIF v_discount_pct >= 30 THEN
    v_quality_score := v_quality_score + 2;
  ELSIF v_discount_pct >= 15 THEN
    v_quality_score := v_quality_score + 1;
  END IF;
  
  IF v_offer.description IS NOT NULL AND LENGTH(v_offer.description) > 20 THEN
    v_quality_score := v_quality_score + 1;
  END IF;
  
  IF array_length(v_offer.tags, 1) >= 3 THEN
    v_quality_score := v_quality_score + 1;
  END IF;
  
  v_quality_score := LEAST(10, v_quality_score);
  
  -- 3. Reputation Score (20% do peso) - Instagram e tempo na plataforma
  v_reputation_score := 4; -- Base
  
  IF v_offer.instagram_url IS NOT NULL THEN
    v_reputation_score := v_reputation_score + 2;
  END IF;
  
  -- Tempo na plataforma (até 4 pontos extras)
  v_reputation_score := v_reputation_score + LEAST(4, 
    EXTRACT(EPOCH FROM (now() - v_offer.company_created_at)) / (30 * 24 * 60 * 60)); -- 1 ponto por mês, max 4
  
  v_reputation_score := LEAST(10, v_reputation_score);
  
  -- 4. Relevance Score (10% do peso) - Performance recente
  v_relevance_score := 5; -- Base, pode ser expandido
  
  -- Calcular score total ponderado
  v_total_score := (v_ctr_score * 0.40) + (v_quality_score * 0.30) + 
                   (v_reputation_score * 0.20) + (v_relevance_score * 0.10);
  
  -- Salvar histórico
  INSERT INTO offer_scores (offer_id, ctr_score, quality_score, reputation_score, relevance_score, total_score)
  VALUES (p_offer_id, v_ctr_score, v_quality_score, v_reputation_score, v_relevance_score, v_total_score);
  
  -- Atualizar score atual na oferta
  UPDATE offers SET current_offer_score = v_total_score WHERE id = p_offer_id;
  
  RETURN v_total_score;
END;
$$;

-- Função para calcular CPC real (estilo Google Ads)
CREATE OR REPLACE FUNCTION public.calculate_real_cpc(p_offer_id uuid, p_city text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_my_offer RECORD;
  v_my_rank numeric;
  v_next_rank numeric;
  v_real_cpc numeric;
  v_config RECORD;
BEGIN
  -- Buscar configuração
  SELECT * INTO v_config FROM pricing_config LIMIT 1;
  
  -- Buscar minha oferta
  SELECT id, max_cpc_bid, current_offer_score,
         (max_cpc_bid * current_offer_score) as offer_rank
  INTO v_my_offer
  FROM offers
  WHERE id = p_offer_id AND active = true AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN v_config.default_cpc;
  END IF;
  
  v_my_rank := v_my_offer.offer_rank;
  
  -- Buscar o próximo competidor (rank imediatamente abaixo)
  SELECT (max_cpc_bid * current_offer_score) as offer_rank
  INTO v_next_rank
  FROM offers
  WHERE city = p_city 
    AND active = true 
    AND deleted_at IS NULL
    AND id != p_offer_id
    AND (max_cpc_bid * current_offer_score) < v_my_rank
  ORDER BY (max_cpc_bid * current_offer_score) DESC
  LIMIT 1;
  
  IF v_next_rank IS NULL THEN
    -- Sou o único ou o último, pago o mínimo
    RETURN v_config.min_cpc;
  END IF;
  
  -- Fórmula Google Ads: (Rank do próximo / Meu Score) + 0.01
  v_real_cpc := (v_next_rank / v_my_offer.current_offer_score) + 0.01;
  
  -- Garantir que está entre min e max, e não excede o lance máximo
  v_real_cpc := GREATEST(v_config.min_cpc, LEAST(v_my_offer.max_cpc_bid, v_real_cpc));
  
  RETURN CEIL(v_real_cpc);
END;
$$;

-- Função para recalcular todos os scores (para job)
CREATE OR REPLACE FUNCTION public.recalculate_all_offer_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_offer_id uuid;
BEGIN
  FOR v_offer_id IN 
    SELECT id FROM offers WHERE active = true AND deleted_at IS NULL
  LOOP
    PERFORM calculate_offer_score(v_offer_id);
  END LOOP;
  
  -- Limpar histórico antigo (manter últimos 7 dias)
  DELETE FROM offer_scores WHERE calculated_at < now() - interval '7 days';
END;
$$;

-- ================= 20251211034137_7375542c-ab84-437e-89bd-5918fe6193e0.sql =================
-- Atualizar função calculate_offer_score: remover Relevância Local, ajustar pesos e critérios de desconto
CREATE OR REPLACE FUNCTION public.calculate_offer_score(p_offer_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_offer RECORD;
  v_company RECORD;
  v_ctr_score numeric := 7.0; -- Nota inicial para ofertas novas
  v_quality_score numeric := 7.0;
  v_reputation_score numeric := 7.0;
  v_total_score numeric;
  v_avg_ctr numeric;
  v_offer_ctr numeric;
  v_discount_pct numeric;
BEGIN
  -- Buscar dados da oferta
  SELECT o.*, p.instagram_url, p.created_at as company_created_at
  INTO v_offer
  FROM offers o
  JOIN profiles p ON o.company_id = p.id
  WHERE o.id = p_offer_id;
  
  IF NOT FOUND THEN
    RETURN 7.0; -- Nota inicial padrão
  END IF;
  
  -- 1. CTR Score (40% do peso) - Compara com média da cidade
  SELECT AVG(CASE WHEN views_count > 0 THEN clicks_count::numeric / views_count ELSE 0 END)
  INTO v_avg_ctr
  FROM offers
  WHERE city = v_offer.city AND active = true AND deleted_at IS NULL;
  
  IF v_offer.views_count > 10 THEN
    v_offer_ctr := v_offer.clicks_count::numeric / v_offer.views_count;
    IF v_avg_ctr > 0 THEN
      v_ctr_score := LEAST(10, GREATEST(4, 7 + (v_offer_ctr - v_avg_ctr) / v_avg_ctr * 3));
    END IF;
  END IF;
  
  -- 2. Quality Score (35% do peso) - Baseado em desconto e completude
  v_discount_pct := (v_offer.price_old - v_offer.price_new) / v_offer.price_old * 100;
  v_quality_score := 5; -- Base
  
  -- Critérios de desconto ajustados: 30%+ máximo, 20%+ bom, 10%+ básico
  IF v_discount_pct >= 30 THEN
    v_quality_score := v_quality_score + 3;
  ELSIF v_discount_pct >= 20 THEN
    v_quality_score := v_quality_score + 2;
  ELSIF v_discount_pct >= 10 THEN
    v_quality_score := v_quality_score + 1;
  END IF;
  
  IF v_offer.description IS NOT NULL AND LENGTH(v_offer.description) > 20 THEN
    v_quality_score := v_quality_score + 1;
  END IF;
  
  IF array_length(v_offer.tags, 1) >= 3 THEN
    v_quality_score := v_quality_score + 1;
  END IF;
  
  v_quality_score := LEAST(10, GREATEST(4, v_quality_score));
  
  -- 3. Reputation Score (25% do peso) - Instagram e tempo na plataforma
  v_reputation_score := 5; -- Base
  
  IF v_offer.instagram_url IS NOT NULL THEN
    v_reputation_score := v_reputation_score + 2;
  END IF;
  
  -- Tempo na plataforma (até 3 pontos extras)
  v_reputation_score := v_reputation_score + LEAST(3, 
    EXTRACT(EPOCH FROM (now() - v_offer.company_created_at)) / (30 * 24 * 60 * 60)); -- 1 ponto por mês, max 3
  
  v_reputation_score := LEAST(10, GREATEST(4, v_reputation_score));
  
  -- Calcular score total ponderado (sem Relevância Local)
  -- CTR: 40%, Qualidade: 35%, Reputação: 25%
  v_total_score := (v_ctr_score * 0.40) + (v_quality_score * 0.35) + (v_reputation_score * 0.25);
  
  -- Garantir nota mínima de 4 e máxima de 10
  v_total_score := LEAST(10, GREATEST(4, v_total_score));
  
  -- Salvar histórico
  INSERT INTO offer_scores (offer_id, ctr_score, quality_score, reputation_score, relevance_score, total_score)
  VALUES (p_offer_id, v_ctr_score, v_quality_score, v_reputation_score, 0, v_total_score);
  
  -- Atualizar score atual na oferta
  UPDATE offers SET current_offer_score = v_total_score WHERE id = p_offer_id;
  
  RETURN v_total_score;
END;
$function$;

-- Atualizar função calculate_real_cpc: CPC = 14 - Nota (automático, sem lance)
CREATE OR REPLACE FUNCTION public.calculate_real_cpc(p_offer_id uuid, p_city text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_offer_score numeric;
  v_real_cpc integer;
BEGIN
  -- Buscar nota da oferta
  SELECT current_offer_score INTO v_offer_score
  FROM offers
  WHERE id = p_offer_id AND active = true AND deleted_at IS NULL;
  
  IF NOT FOUND OR v_offer_score IS NULL THEN
    RETURN 7; -- CPC padrão (14 - 7)
  END IF;
  
  -- Fórmula automática: CPC = 14 - Nota
  -- Nota 10 → CPC 4 (R$ 0,40)
  -- Nota 7 → CPC 7 (R$ 0,70)
  -- Nota 4 → CPC 10 (R$ 1,00)
  v_real_cpc := 14 - v_offer_score;
  
  -- Garantir range de 4 a 10
  v_real_cpc := GREATEST(4, LEAST(10, v_real_cpc));
  
  RETURN v_real_cpc;
END;
$function$;

-- ================= 20251211042241_98d17e0d-a42e-4d1d-9fdb-ee1d9caa45a9.sql =================
-- Allow anyone to view basic profile info (name, instagram) for companies with active offers
CREATE POLICY "Anyone can view company profiles with active offers"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT DISTINCT company_id 
    FROM offers 
    WHERE active = true AND deleted_at IS NULL
  )
);

-- ================= 20251211044053_dc7a1c65-5838-451d-8842-0665d3124a3e.sql =================
-- Add images column to offers table
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Create storage bucket for offer images
INSERT INTO storage.buckets (id, name, public)
VALUES ('offer-images', 'offer-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for offer images
CREATE POLICY "Anyone can view offer images"
ON storage.objects FOR SELECT
USING (bucket_id = 'offer-images');

CREATE POLICY "Companies can upload their own offer images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'offer-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Companies can update their own offer images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'offer-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Companies can delete their own offer images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'offer-images' 
  AND auth.uid() IS NOT NULL
);

-- ================= 20251211051318_02fad067-6602-4799-8f9e-32840c4b7031.sql =================
-- Função para recalcular estatísticas de um afiliado específico
CREATE OR REPLACE FUNCTION public.recalculate_affiliate_stats(affiliate_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_clicks INTEGER;
  v_total_earnings INTEGER;
  v_clicks_this_month INTEGER;
  v_clicks_this_week INTEGER;
  v_new_level_id INTEGER;
BEGIN
  -- Contar cliques válidos totais
  SELECT COUNT(*) INTO v_total_clicks
  FROM offer_clicks 
  WHERE affiliate_id = affiliate_profile_id AND click_type = 'MAIN';
  
  -- Somar ganhos totais das transações
  SELECT COALESCE(SUM(amount), 0) INTO v_total_earnings
  FROM transactions 
  WHERE user_id = affiliate_profile_id AND type = 'CLICK_EARNING';
  
  -- Cliques do mês atual
  SELECT COUNT(*) INTO v_clicks_this_month
  FROM offer_clicks 
  WHERE affiliate_id = affiliate_profile_id 
    AND click_type = 'MAIN'
    AND created_at >= date_trunc('month', now());
  
  -- Cliques da semana atual
  SELECT COUNT(*) INTO v_clicks_this_week
  FROM offer_clicks 
  WHERE affiliate_id = affiliate_profile_id 
    AND click_type = 'MAIN'
    AND created_at >= date_trunc('week', now());
  
  -- Calcular nível baseado nos cliques
  v_new_level_id := get_affiliate_level(v_total_clicks);
  
  -- Atualizar ou inserir estatísticas
  INSERT INTO affiliate_stats (affiliate_id, total_clicks, total_earnings, clicks_this_month, clicks_this_week, current_level_id)
  VALUES (affiliate_profile_id, v_total_clicks, v_total_earnings, v_clicks_this_month, v_clicks_this_week, v_new_level_id)
  ON CONFLICT (affiliate_id) DO UPDATE SET
    total_clicks = v_total_clicks,
    total_earnings = v_total_earnings,
    clicks_this_month = v_clicks_this_month,
    clicks_this_week = v_clicks_this_week,
    current_level_id = v_new_level_id,
    updated_at = now();
END;
$$;

-- Função para recalcular TODOS os afiliados
CREATE OR REPLACE FUNCTION public.recalculate_all_affiliate_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_affiliate_id uuid;
BEGIN
  -- Recalcular para todos os afiliados que têm estatísticas
  FOR v_affiliate_id IN 
    SELECT DISTINCT affiliate_id FROM affiliate_stats
  LOOP
    PERFORM recalculate_affiliate_stats(v_affiliate_id);
  END LOOP;
  
  -- Também recalcular para afiliados com cliques mas sem registro em affiliate_stats
  FOR v_affiliate_id IN 
    SELECT DISTINCT affiliate_id FROM offer_clicks 
    WHERE affiliate_id IS NOT NULL 
      AND affiliate_id NOT IN (SELECT affiliate_id FROM affiliate_stats)
  LOOP
    PERFORM recalculate_affiliate_stats(v_affiliate_id);
  END LOOP;
END;
$$;

-- Executar recálculo para corrigir dados existentes
SELECT recalculate_all_affiliate_stats();

-- ================= 20251211055125_1433344c-1c54-4008-92d5-d23f6a5dd6a2.sql =================
-- =====================================================
-- CORREÇÕES DE SEGURANÇA CRÍTICAS
-- =====================================================

-- 1. PROFILES: Criar view pública com dados não-sensíveis
-- e remover política que expõe dados sensíveis

-- Remover política que expõe todos os dados de empresas
DROP POLICY IF EXISTS "Anyone can view company profiles with active offers" ON public.profiles;

-- Criar view pública apenas com dados não-sensíveis para empresas
CREATE OR REPLACE VIEW public.company_public_info AS
SELECT 
  p.id,
  p.name,
  p.city,
  p.instagram_url
FROM public.profiles p
WHERE p.id IN (
  SELECT DISTINCT company_id 
  FROM public.offers 
  WHERE active = true AND deleted_at IS NULL
);

-- Criar política que permite ver apenas dados públicos via view
-- (a view já filtra os campos)
GRANT SELECT ON public.company_public_info TO anon, authenticated;

-- 2. DEVICE_FINGERPRINTS: Remover acesso público
DROP POLICY IF EXISTS "System can manage device fingerprints" ON public.device_fingerprints;

-- Recriar política apenas para service_role (backend)
CREATE POLICY "Service role can manage device fingerprints" 
ON public.device_fingerprints 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 3. PAGE_SESSIONS: Remover acesso público
DROP POLICY IF EXISTS "System can manage page sessions" ON public.page_sessions;

-- Recriar política apenas para service_role (backend)
CREATE POLICY "Service role can manage page sessions" 
ON public.page_sessions 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 4. AFFILIATE_STATS: Modificar política de ranking para não expor earnings
DROP POLICY IF EXISTS "Anyone can view stats for ranking" ON public.affiliate_stats;

-- Criar view pública para ranking (sem dados sensíveis)
CREATE OR REPLACE VIEW public.affiliate_ranking_public AS
SELECT 
  ast.affiliate_id,
  p.name as affiliate_name,
  ast.rank_position,
  ast.current_level_id,
  al.name as level_name,
  al.badge_color
FROM public.affiliate_stats ast
JOIN public.profiles p ON ast.affiliate_id = p.id
LEFT JOIN public.affiliate_levels al ON ast.current_level_id = al.id
WHERE ast.rank_position IS NOT NULL
ORDER BY ast.rank_position ASC
LIMIT 100;

GRANT SELECT ON public.affiliate_ranking_public TO anon, authenticated;

-- 5. CLICK_RATE_LIMITS: Remover acesso público
DROP POLICY IF EXISTS "System can manage rate limits" ON public.click_rate_limits;

-- Recriar política apenas para service_role (backend)
CREATE POLICY "Service role can manage rate limits" 
ON public.click_rate_limits 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 6. OFFERS: Adicionar verificação de deleted_at na política pública
DROP POLICY IF EXISTS "Anyone can view active offers" ON public.offers;

CREATE POLICY "Anyone can view active non-deleted offers" 
ON public.offers 
FOR SELECT 
USING (active = true AND deleted_at IS NULL);

-- 7. OFFER_SCORES: Remover acesso público
DROP POLICY IF EXISTS "System can manage offer scores" ON public.offer_scores;

CREATE POLICY "Service role can manage offer scores" 
ON public.offer_scores 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 8. NOTIFICATIONS: Remover acesso público de insert
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Service role can insert notifications" 
ON public.notifications 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- 9. TRANSACTIONS: Remover acesso público de insert
DROP POLICY IF EXISTS "System can insert transactions" ON public.transactions;

CREATE POLICY "Service role can insert transactions" 
ON public.transactions 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- ================= 20251211055158_1431f648-2665-420e-b4e1-99afd162b0f8.sql =================
-- Corrigir SECURITY DEFINER nas views
-- Recriar views como SECURITY INVOKER

-- 1. Recriar company_public_info como SECURITY INVOKER
DROP VIEW IF EXISTS public.company_public_info;

CREATE VIEW public.company_public_info 
WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.name,
  p.city,
  p.instagram_url
FROM public.profiles p
WHERE p.id IN (
  SELECT DISTINCT company_id 
  FROM public.offers 
  WHERE active = true AND deleted_at IS NULL
);

GRANT SELECT ON public.company_public_info TO anon, authenticated;

-- 2. Recriar affiliate_ranking_public como SECURITY INVOKER
DROP VIEW IF EXISTS public.affiliate_ranking_public;

CREATE VIEW public.affiliate_ranking_public 
WITH (security_invoker = true) AS
SELECT 
  ast.affiliate_id,
  p.name as affiliate_name,
  ast.rank_position,
  ast.current_level_id,
  al.name as level_name,
  al.badge_color
FROM public.affiliate_stats ast
JOIN public.profiles p ON ast.affiliate_id = p.id
LEFT JOIN public.affiliate_levels al ON ast.current_level_id = al.id
WHERE ast.rank_position IS NOT NULL
ORDER BY ast.rank_position ASC
LIMIT 100;

GRANT SELECT ON public.affiliate_ranking_public TO anon, authenticated;

-- 3. Precisamos adicionar uma política para profiles que permita
-- ver apenas dados públicos para a view funcionar
CREATE POLICY "Anyone can view public profile data for ranking" 
ON public.profiles 
FOR SELECT 
USING (
  id IN (
    SELECT affiliate_id FROM public.affiliate_stats WHERE rank_position IS NOT NULL
  )
);

-- 4. Adicionar política para affiliate_stats para ranking público
CREATE POLICY "Anyone can view ranking position only" 
ON public.affiliate_stats 
FOR SELECT 
USING (rank_position IS NOT NULL);

-- ================= 20251211055321_52ee922d-7257-443e-aaf4-dc0432f84975.sql =================
-- Remover política que expõe todos os dados do perfil para ranking
DROP POLICY IF EXISTS "Anyone can view public profile data for ranking" ON public.profiles;

-- Remover política redundante de ranking em affiliate_stats
DROP POLICY IF EXISTS "Anyone can view ranking position only" ON public.affiliate_stats;

-- Adicionar política para usuários autenticados verem perfis para ranking
-- Apenas usuários logados podem ver dados de ranking (nome apenas)
CREATE POLICY "Authenticated users can view profiles for ranking" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  id IN (SELECT affiliate_id FROM public.affiliate_stats)
);

-- Política para affiliate_stats - apenas usuários autenticados
CREATE POLICY "Authenticated can view affiliate stats for ranking" 
ON public.affiliate_stats 
FOR SELECT 
TO authenticated
USING (true);

-- ================= 20251211062646_2d97e464-1dfa-4c44-a05a-8e8fbb03a113.sql =================
-- Tabela de posts do blog
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  featured_image TEXT,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[] DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'geral',
  status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, published
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  author_name TEXT DEFAULT 'Equipe Clilin',
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Qualquer pessoa pode ver posts publicados (SEO!)
CREATE POLICY "Anyone can view published blog posts" 
ON public.blog_posts 
FOR SELECT 
USING (status = 'published');

-- Admins podem fazer tudo
CREATE POLICY "Admins can manage all blog posts" 
ON public.blog_posts 
FOR ALL 
USING (has_role(auth.uid(), 'ADMIN'))
WITH CHECK (has_role(auth.uid(), 'ADMIN'));

-- Service role pode gerenciar (para edge functions)
CREATE POLICY "Service role can manage blog posts" 
ON public.blog_posts 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela para configuração de temas do blog (geração automática)
CREATE TABLE public.blog_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  category TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  use_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_themes ENABLE ROW LEVEL SECURITY;

-- Políticas para blog_themes
CREATE POLICY "Anyone can view active themes" 
ON public.blog_themes 
FOR SELECT 
USING (active = true);

CREATE POLICY "Admins can manage themes" 
ON public.blog_themes 
FOR ALL 
USING (has_role(auth.uid(), 'ADMIN'))
WITH CHECK (has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Service role can manage themes" 
ON public.blog_themes 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Inserir temas iniciais focados em SEO
INSERT INTO public.blog_themes (theme, keywords, category) VALUES
('Como aumentar as vendas do seu comércio local', ARRAY['marketing local', 'vendas', 'comércio local', 'atrair clientes'], 'empresas'),
('Guia completo para ganhar dinheiro como afiliado', ARRAY['afiliado', 'renda extra', 'ganhar dinheiro online', 'divulgador'], 'afiliados'),
('Melhores estratégias de cupons de desconto para fidelizar clientes', ARRAY['cupom de desconto', 'fidelização', 'promoções', 'ofertas'], 'empresas'),
('Como começar a trabalhar com marketing de afiliados do zero', ARRAY['marketing de afiliados', 'iniciante', 'renda extra', 'trabalho online'], 'afiliados'),
('Ofertas locais: como encontrar os melhores descontos na sua cidade', ARRAY['ofertas locais', 'descontos', 'promoções perto de mim', 'economia'], 'clientes'),
('Dicas para pequenas empresas dominarem o marketing digital local', ARRAY['marketing digital', 'pequenas empresas', 'negócio local', 'presença online'], 'empresas'),
('Por que o marketing boca a boca ainda é o mais eficiente', ARRAY['marketing boca a boca', 'indicação', 'divulgação orgânica', 'confiança'], 'geral'),
('Como criar promoções irresistíveis para seu negócio', ARRAY['promoções', 'ofertas', 'estratégia de vendas', 'conversão'], 'empresas'),
('O guia definitivo para divulgadores iniciantes', ARRAY['divulgador', 'afiliado iniciante', 'primeiros passos', 'dicas'], 'afiliados'),
('Tendências de consumo local para 2025', ARRAY['tendências', 'consumo local', 'comportamento do consumidor', '2025'], 'geral'),
('Como fidelizar clientes com programa de recompensas', ARRAY['fidelização', 'recompensas', 'programa de pontos', 'clientes fiéis'], 'empresas'),
('Renda extra: como divulgar produtos nas redes sociais', ARRAY['renda extra', 'redes sociais', 'divulgação', 'Instagram'], 'afiliados'),
('Os erros mais comuns de pequenos comerciantes no marketing', ARRAY['erros de marketing', 'pequenos comerciantes', 'dicas', 'evitar'], 'empresas'),
('Como escolher as melhores ofertas para divulgar', ARRAY['escolher ofertas', 'divulgador', 'comissão', 'nicho'], 'afiliados'),
('A importância do atendimento ao cliente no comércio local', ARRAY['atendimento', 'cliente', 'experiência', 'satisfação'], 'empresas');


-- ================= 20251211065340_6b894913-bee6-4b77-bd41-86fa20943b9e.sql =================
-- Add FAQ column to blog_posts table for storing FAQ data
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at DESC) WHERE status = 'published';

-- ================= 20251211073728_9f4a7bb9-50d3-48d2-90c5-a20cf8db1c43.sql =================
-- Adicionar campo avatar_url em profiles
ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;

-- Criar bucket para avatars de empresas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-avatars', 'company-avatars', true);

-- RLS policy para upload (empresas podem fazer upload do próprio avatar)
CREATE POLICY "Companies can upload their avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS policy para update (empresas podem atualizar próprio avatar)
CREATE POLICY "Companies can update their avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS policy para delete (empresas podem deletar próprio avatar)
CREATE POLICY "Companies can delete their avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS policy para leitura pública
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-avatars');

-- ================= 20251211074216_e9bf4509-4e12-42dd-b48c-dffe72ecb0b5.sql =================
-- Atualizar função increment_offer_views para também inserir na tabela offer_views
CREATE OR REPLACE FUNCTION public.increment_offer_views(offer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Incrementa o contador na tabela offers
  UPDATE offers SET views_count = views_count + 1 WHERE id = offer_id;
  
  -- Insere registro na tabela offer_views para tracking diário
  INSERT INTO offer_views (offer_id) VALUES (offer_id);
END;
$$;

-- ================= 20251211074848_2dc8074b-72f8-467e-93fa-873788dba99b.sql =================
-- Permitir visualizar perfis de empresas que têm ofertas ativas
CREATE POLICY "Anyone can view company profiles with active offers"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT DISTINCT company_id 
    FROM offers 
    WHERE active = true AND deleted_at IS NULL
  )
);

-- ================= 20251211172335_a702655d-dc96-4276-84c4-1d16c2428aa3.sql =================
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

-- ================= 20251211173142_9460c012-d427-4373-9dd9-e6339232fc47.sql =================
-- Migração de créditos para centavos (R$)
-- 1 crédito antigo = R$ 0,10 = 10 centavos

-- Atualizar balances (créditos * 10 = centavos)
UPDATE profiles SET balance = balance * 10 WHERE balance > 0;

-- Atualizar transactions (créditos * 10 = centavos)
UPDATE transactions SET amount = amount * 10 WHERE amount > 0;

-- Atualizar withdrawals (créditos * 10 = centavos)
UPDATE withdrawals SET amount = amount * 10 WHERE amount > 0;

-- Atualizar affiliate_stats (créditos * 10 = centavos)
UPDATE affiliate_stats SET total_earnings = total_earnings * 10 WHERE total_earnings > 0;

-- Atualizar payments (amount_credits agora são centavos)
UPDATE payments SET amount_credits = amount_credits * 10 WHERE amount_credits > 0;

-- Atualizar função calculate_real_cpc para retornar centavos (40-100)
CREATE OR REPLACE FUNCTION public.calculate_real_cpc(p_offer_id uuid, p_city text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_offer_score numeric;
  v_real_cpc integer;
BEGIN
  -- Buscar nota da oferta
  SELECT current_offer_score INTO v_offer_score
  FROM offers
  WHERE id = p_offer_id AND active = true AND deleted_at IS NULL;
  
  IF NOT FOUND OR v_offer_score IS NULL THEN
    RETURN 70; -- CPC padrão em centavos (R$ 0,70)
  END IF;
  
  -- Fórmula automática: CPC = (14 - Nota) * 10 centavos
  -- Nota 10 → CPC 40 centavos (R$ 0,40)
  -- Nota 7 → CPC 70 centavos (R$ 0,70)
  -- Nota 4 → CPC 100 centavos (R$ 1,00)
  v_real_cpc := (14 - v_offer_score) * 10;
  
  -- Garantir range de 40 a 100 centavos
  v_real_cpc := GREATEST(40, LEAST(100, v_real_cpc));
  
  RETURN v_real_cpc;
END;
$function$;

-- Atualizar função update_affiliate_stats para trabalhar com centavos
CREATE OR REPLACE FUNCTION public.update_affiliate_stats(affiliate_profile_id uuid, earnings integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_total_clicks INTEGER;
  new_level_id INTEGER;
BEGIN
  -- Insert or update affiliate stats (earnings já em centavos)
  INSERT INTO affiliate_stats (affiliate_id, total_clicks, total_earnings, clicks_this_month, clicks_this_week)
  VALUES (affiliate_profile_id, 1, earnings, 1, 1)
  ON CONFLICT (affiliate_id) DO UPDATE SET
    total_clicks = affiliate_stats.total_clicks + 1,
    total_earnings = affiliate_stats.total_earnings + earnings,
    clicks_this_month = affiliate_stats.clicks_this_month + 1,
    clicks_this_week = affiliate_stats.clicks_this_week + 1,
    updated_at = now();
  
  -- Get new total clicks
  SELECT total_clicks INTO new_total_clicks FROM affiliate_stats WHERE affiliate_id = affiliate_profile_id;
  
  -- Calculate and update level
  new_level_id := get_affiliate_level(new_total_clicks);
  
  UPDATE affiliate_stats 
  SET current_level_id = new_level_id,
      level_progress = (
        SELECT ((new_total_clicks - al.min_clicks)::NUMERIC / 
                NULLIF((LEAD(al.min_clicks) OVER (ORDER BY al.min_clicks) - al.min_clicks), 0)) * 100
        FROM affiliate_levels al
        WHERE al.id = new_level_id
      )
  WHERE affiliate_id = affiliate_profile_id;
END;
$function$;

-- ================= 20251211205719_a79fa989-a786-4e47-b7e2-77224be8a7e1.sql =================
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

-- ================= 20251212154402_7ed7a977-aa1c-4062-8752-31a76aad1f15.sql =================
-- Criar função trigger para calcular score automaticamente
CREATE OR REPLACE FUNCTION public.calculate_offer_score_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Calcular score para a oferta inserida/atualizada
  PERFORM calculate_offer_score(NEW.id);
  RETURN NEW;
END;
$function$;

-- Criar trigger para calcular score na criação de ofertas
DROP TRIGGER IF EXISTS trigger_calculate_offer_score_insert ON offers;
CREATE TRIGGER trigger_calculate_offer_score_insert
AFTER INSERT ON offers
FOR EACH ROW
EXECUTE FUNCTION calculate_offer_score_trigger();

-- Criar trigger para recalcular score quando campos relevantes são atualizados
DROP TRIGGER IF EXISTS trigger_calculate_offer_score_update ON offers;
CREATE TRIGGER trigger_calculate_offer_score_update
AFTER UPDATE OF description, tags, price_old, price_new, images ON offers
FOR EACH ROW
EXECUTE FUNCTION calculate_offer_score_trigger();

-- ================= 20251212162639_b74627ae-f97c-4c69-b211-71d754c15d8b.sql =================
-- Create table for short links
CREATE TABLE public.short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) UNIQUE NOT NULL,
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique index for code lookups
CREATE UNIQUE INDEX idx_short_links_code ON short_links(code);

-- Create composite index for offer+affiliate lookups
CREATE UNIQUE INDEX idx_short_links_offer_affiliate ON short_links(offer_id, affiliate_id);

-- Enable RLS
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

-- Anyone can read short links (needed for redirect)
CREATE POLICY "Anyone can view short links for redirect"
ON public.short_links
FOR SELECT
USING (true);

-- Affiliates can create their own short links
CREATE POLICY "Users can create their own short links"
ON public.short_links
FOR INSERT
WITH CHECK (affiliate_id = get_current_profile_id());

-- Service role can manage all
CREATE POLICY "Service role can manage short links"
ON public.short_links
FOR ALL
USING (true)
WITH CHECK (true);

-- ================= 20251212181035_65b18d7f-65b6-4063-9876-958767386830.sql =================
-- Adicionar campos de geolocalização para tracking anti-fraude
ALTER TABLE public.offer_clicks 
ADD COLUMN IF NOT EXISTS timezone_offset integer,
ADD COLUMN IF NOT EXISTS expected_timezone text,
ADD COLUMN IF NOT EXISTS geo_mismatch boolean DEFAULT false;

-- Adicionar campo de geolocalização no device_fingerprints
ALTER TABLE public.device_fingerprints
ADD COLUMN IF NOT EXISTS expected_country text,
ADD COLUMN IF NOT EXISTS browser_timezone text,
ADD COLUMN IF NOT EXISTS geo_mismatch_count integer DEFAULT 0;

-- Criar índice para buscas de geo_mismatch
CREATE INDEX IF NOT EXISTS idx_offer_clicks_geo_mismatch 
ON public.offer_clicks(geo_mismatch) WHERE geo_mismatch = true;

-- Criar índice para busca de fraud_score alto em withdrawals
CREATE INDEX IF NOT EXISTS idx_withdrawals_high_fraud 
ON public.withdrawals(fraud_score) WHERE fraud_score > 50;

-- ================= 20251212182057_65d2d2af-cf07-42d5-9acc-e80a082e57c2.sql =================
-- Adicionar campos para detecção de VPN/Proxy
ALTER TABLE public.offer_clicks 
ADD COLUMN IF NOT EXISTS is_vpn boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_proxy boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ip_country text,
ADD COLUMN IF NOT EXISTS ip_city text,
ADD COLUMN IF NOT EXISTS ip_org text;

-- Adicionar campos no device_fingerprints para tracking de VPN
ALTER TABLE public.device_fingerprints
ADD COLUMN IF NOT EXISTS vpn_detected_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_vpn_check_at timestamp with time zone;

-- Criar índice para buscas de VPN/Proxy
CREATE INDEX IF NOT EXISTS idx_offer_clicks_vpn 
ON public.offer_clicks(is_vpn) WHERE is_vpn = true;

CREATE INDEX IF NOT EXISTS idx_offer_clicks_proxy 
ON public.offer_clicks(is_proxy) WHERE is_proxy = true;

-- ================= 20251212183419_9ab27346-23a7-4e1f-b7ab-c2b93847f413.sql =================
-- Remover o índice com subquery que não é suportado
-- O índice idx_affiliate_stats_rank já foi criado na migração anterior
-- Apenas garantir que não há problema

-- ================= 20251212224912_b9d86740-204c-4c8a-b8a9-f9f3f7efd79b.sql =================
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

-- ================= 20251212225937_506a9216-16a8-4ea4-850f-3cc470186d46.sql =================
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

-- ================= 20251212232315_0aed3554-27cb-4fdd-9db0-943ded78dc98.sql =================
-- Remover a constraint existente e adicionar nova com ADMIN
ALTER TABLE public.user_onboarding DROP CONSTRAINT IF EXISTS user_onboarding_role_check;
ALTER TABLE public.user_onboarding ADD CONSTRAINT user_onboarding_role_check 
  CHECK (role IN ('COMPANY', 'AFFILIATE', 'CLIENT', 'ADMIN'));

-- ================= 20251212234220_04e73616-24fc-4693-9cf1-bc8b34ab7103.sql =================
-- Política de storage: restringir tipos de arquivo permitidos
-- Nota: Supabase não suporta restrição de MIME type diretamente via RLS,
-- mas podemos adicionar políticas mais restritivas

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Restrict file types on offer-images" ON storage.objects;
DROP POLICY IF EXISTS "Restrict file types on company-avatars" ON storage.objects;

-- Criar políticas de INSERT mais restritivas para offer-images
DROP POLICY IF EXISTS "Anyone can upload offer images" ON storage.objects;
CREATE POLICY "Authenticated users can upload offer images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'offer-images' 
  AND (
    storage.extension(name) = 'jpg' 
    OR storage.extension(name) = 'jpeg' 
    OR storage.extension(name) = 'png' 
    OR storage.extension(name) = 'webp'
    OR storage.extension(name) = 'gif'
  )
);

-- Criar políticas de INSERT mais restritivas para company-avatars
DROP POLICY IF EXISTS "Anyone can upload company avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload company avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-avatars' 
  AND (
    storage.extension(name) = 'jpg' 
    OR storage.extension(name) = 'jpeg' 
    OR storage.extension(name) = 'png' 
    OR storage.extension(name) = 'webp'
  )
);

-- Manter políticas de SELECT públicas para visualização
DROP POLICY IF EXISTS "Public can view offer images" ON storage.objects;
CREATE POLICY "Public can view offer images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'offer-images');

DROP POLICY IF EXISTS "Public can view company avatars" ON storage.objects;
CREATE POLICY "Public can view company avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-avatars');

-- ================= 20251213130127_3bf8a11c-aa35-49df-81b0-539169c944af.sql =================
-- =============================================
-- CORREÇÃO DE SEGURANÇA RLS - STORAGE (CONTINUAÇÃO)
-- =============================================

-- Remover políticas antigas que podem existir
DROP POLICY IF EXISTS "Companies can update their own offer images" ON storage.objects;
DROP POLICY IF EXISTS "Companies can delete their own offer images" ON storage.objects;
DROP POLICY IF EXISTS "Companies can update company avatars" ON storage.objects;

-- Recriar políticas de storage seguras
CREATE POLICY "Companies can update offer images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'offer-images' AND
  has_role(auth.uid(), 'COMPANY')
);

CREATE POLICY "Companies can delete offer images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'offer-images' AND
  has_role(auth.uid(), 'COMPANY')
);

CREATE POLICY "Companies can update avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-avatars' AND
  has_role(auth.uid(), 'COMPANY')
);

-- ================= 20251213154002_ed868090-c43f-4e1e-beaf-1fdc4db94014.sql =================
-- 1. Adicionar novos tipos de transação
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'LEAD_COST';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'LEAD_EARNING';

-- 2. Criar tabela de leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  affiliate_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  phone_whatsapp TEXT NOT NULL,
  client_ip TEXT,
  user_agent TEXT,
  device_id TEXT,
  fingerprint_hash TEXT,
  session_token TEXT,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Criar tabela de rate limits para leads
CREATE TABLE public.lead_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_hash TEXT NOT NULL,
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(phone_hash, offer_id)
);

-- 4. Adicionar coluna leads_count na tabela offers
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS leads_count INTEGER DEFAULT 0;

-- 5. Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_rate_limits ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies para leads
CREATE POLICY "Companies can view leads of their offers"
ON public.leads FOR SELECT
USING (offer_id IN (SELECT id FROM offers WHERE company_id = get_current_profile_id()));

CREATE POLICY "Admins can view all leads"
ON public.leads FOR SELECT
USING (has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Service role can manage leads"
ON public.leads FOR ALL
USING (true) WITH CHECK (true);

-- 7. RLS Policies para lead_rate_limits
CREATE POLICY "Service role can manage lead rate limits"
ON public.lead_rate_limits FOR ALL
USING (true) WITH CHECK (true);

-- 8. Índices para performance
CREATE INDEX idx_leads_offer_id ON public.leads(offer_id);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_phone ON public.leads(phone_whatsapp);
CREATE INDEX idx_lead_rate_limits_phone_offer ON public.lead_rate_limits(phone_hash, offer_id);

-- 9. Função para calcular CPL dinâmico (R$ 1,00 a R$ 3,00)
CREATE OR REPLACE FUNCTION public.calculate_real_cpl(p_offer_id uuid, p_city text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_offer_score numeric;
  v_real_cpl integer;
BEGIN
  SELECT current_offer_score INTO v_offer_score
  FROM offers
  WHERE id = p_offer_id AND active = true AND deleted_at IS NULL;
  
  IF NOT FOUND OR v_offer_score IS NULL THEN
    RETURN 150; -- CPL padrão em centavos (R$ 1,50)
  END IF;
  
  -- Fórmula: CPL = (14 - Nota) * 33 centavos (aprox)
  -- Nota 10 → CPL 100 centavos (R$ 1,00)
  -- Nota 7 → CPL 200 centavos (R$ 2,00)
  -- Nota 4 → CPL 300 centavos (R$ 3,00)
  v_real_cpl := ROUND((14 - v_offer_score) * 33.33);
  
  -- Garantir range de 100 a 300 centavos
  v_real_cpl := GREATEST(100, LEAST(300, v_real_cpl));
  
  RETURN v_real_cpl;
END;
$$;

-- 10. Função para incrementar leads_count
CREATE OR REPLACE FUNCTION public.increment_offer_leads(offer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE offers SET leads_count = leads_count + 1 WHERE id = offer_id;
END;
$$;

-- 11. Atualizar função update_affiliate_stats para suportar leads
CREATE OR REPLACE FUNCTION public.update_affiliate_stats_lead(affiliate_profile_id uuid, earnings integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_total_clicks INTEGER;
  new_level_id INTEGER;
BEGIN
  -- Insert or update affiliate stats (earnings já em centavos)
  INSERT INTO affiliate_stats (affiliate_id, total_clicks, total_earnings, clicks_this_month, clicks_this_week)
  VALUES (affiliate_profile_id, 1, earnings, 1, 1)
  ON CONFLICT (affiliate_id) DO UPDATE SET
    total_clicks = affiliate_stats.total_clicks + 1,
    total_earnings = affiliate_stats.total_earnings + earnings,
    clicks_this_month = affiliate_stats.clicks_this_month + 1,
    clicks_this_week = affiliate_stats.clicks_this_week + 1,
    updated_at = now();
  
  -- Get new total clicks (que agora representa leads)
  SELECT total_clicks INTO new_total_clicks FROM affiliate_stats WHERE affiliate_id = affiliate_profile_id;
  
  -- Calculate and update level
  new_level_id := get_affiliate_level(new_total_clicks);
  
  UPDATE affiliate_stats 
  SET current_level_id = new_level_id,
      level_progress = (
        SELECT ((new_total_clicks - al.min_clicks)::NUMERIC / 
                NULLIF((LEAD(al.min_clicks) OVER (ORDER BY al.min_clicks) - al.min_clicks), 0)) * 100
        FROM affiliate_levels al
        WHERE al.id = new_level_id
      )
  WHERE affiliate_id = affiliate_profile_id;
END;
$$;

-- ================= 20251213174527_1e5a6d68-91a8-48f0-b91c-c58b2efbc62a.sql =================
-- 1. Corrigir contadores existentes baseado em leads válidos
UPDATE offers o
SET leads_count = (
  SELECT COUNT(*) 
  FROM leads l 
  WHERE l.offer_id = o.id AND l.is_valid = true
);

-- 2. Criar função para manter leads_count sincronizado
CREATE OR REPLACE FUNCTION update_offer_leads_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Para INSERT ou UPDATE, recalcula para a nova oferta
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE offers 
    SET leads_count = (
      SELECT COUNT(*) FROM leads 
      WHERE offer_id = NEW.offer_id AND is_valid = true
    )
    WHERE id = NEW.offer_id;
  END IF;
  
  -- Para DELETE ou UPDATE (mudança de oferta), recalcula para a oferta antiga
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.offer_id != NEW.offer_id) THEN
    UPDATE offers 
    SET leads_count = (
      SELECT COUNT(*) FROM leads 
      WHERE offer_id = OLD.offer_id AND is_valid = true
    )
    WHERE id = OLD.offer_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Criar trigger que dispara após mudanças em leads
DROP TRIGGER IF EXISTS trigger_update_offer_leads_count ON leads;
CREATE TRIGGER trigger_update_offer_leads_count
AFTER INSERT OR UPDATE OR DELETE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_offer_leads_count();

-- ================= 20251213175952_686827cb-4068-4c03-9a6a-d6cfdde8aeaf.sql =================
-- 1. Criar tabela de histórico mensal
CREATE TABLE public.affiliate_monthly_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month_year text NOT NULL,
  leads_count integer DEFAULT 0,
  earnings integer DEFAULT 0,
  level_achieved text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(affiliate_id, month_year)
);

-- Enable RLS
ALTER TABLE public.affiliate_monthly_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own history"
ON public.affiliate_monthly_history
FOR SELECT
USING (affiliate_id = get_current_profile_id());

CREATE POLICY "Service role can manage history"
ON public.affiliate_monthly_history
FOR ALL
USING (true)
WITH CHECK (true);

-- 2. Atualizar metas na tabela affiliate_levels
UPDATE public.affiliate_levels SET min_clicks = 0, commission_multiplier = 1.00 WHERE id = 1; -- Bronze: 0-99 = 30%
UPDATE public.affiliate_levels SET min_clicks = 100, commission_multiplier = 1.33 WHERE id = 2; -- Prata: 100-499 = 40%
UPDATE public.affiliate_levels SET min_clicks = 500, commission_multiplier = 1.67 WHERE id = 3; -- Ouro: 500+ = 50%

-- 3. Criar função para calcular nível baseado em leads MENSAIS
CREATE OR REPLACE FUNCTION public.get_affiliate_level_monthly(monthly_leads integer)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.affiliate_levels 
  WHERE min_clicks <= monthly_leads 
  ORDER BY min_clicks DESC 
  LIMIT 1;
$$;

-- 4. Atualizar função update_affiliate_stats_lead para usar leads do mês
CREATE OR REPLACE FUNCTION public.update_affiliate_stats_lead(affiliate_profile_id uuid, earnings integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_clicks_this_month INTEGER;
  new_level_id INTEGER;
BEGIN
  -- Insert or update affiliate stats
  INSERT INTO affiliate_stats (affiliate_id, total_clicks, total_earnings, clicks_this_month, clicks_this_week)
  VALUES (affiliate_profile_id, 1, earnings, 1, 1)
  ON CONFLICT (affiliate_id) DO UPDATE SET
    total_clicks = affiliate_stats.total_clicks + 1,
    total_earnings = affiliate_stats.total_earnings + earnings,
    clicks_this_month = affiliate_stats.clicks_this_month + 1,
    clicks_this_week = affiliate_stats.clicks_this_week + 1,
    updated_at = now();
  
  -- Get leads do mês atual
  SELECT clicks_this_month INTO v_clicks_this_month 
  FROM affiliate_stats 
  WHERE affiliate_id = affiliate_profile_id;
  
  -- Calcular nível baseado em leads do MÊS (não total)
  new_level_id := get_affiliate_level_monthly(v_clicks_this_month);
  
  UPDATE affiliate_stats 
  SET current_level_id = new_level_id,
      level_progress = (
        SELECT ((v_clicks_this_month - al.min_clicks)::NUMERIC / 
                NULLIF((LEAD(al.min_clicks) OVER (ORDER BY al.min_clicks) - al.min_clicks), 0)) * 100
        FROM affiliate_levels al
        WHERE al.id = new_level_id
      )
  WHERE affiliate_id = affiliate_profile_id;
END;
$$;

-- 5. Criar função de arquivamento e reset mensal
CREATE OR REPLACE FUNCTION public.archive_and_reset_monthly_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_previous_month text;
BEGIN
  v_previous_month := to_char(now() - interval '1 day', 'YYYY-MM');
  
  -- Arquivar estatísticas do mês anterior
  INSERT INTO affiliate_monthly_history (affiliate_id, month_year, leads_count, earnings, level_achieved)
  SELECT 
    ast.affiliate_id,
    v_previous_month,
    ast.clicks_this_month,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions 
     WHERE user_id = ast.affiliate_id 
       AND type = 'LEAD_EARNING' 
       AND created_at >= date_trunc('month', now() - interval '1 month')
       AND created_at < date_trunc('month', now())),
    al.name
  FROM affiliate_stats ast
  LEFT JOIN affiliate_levels al ON ast.current_level_id = al.id
  WHERE ast.clicks_this_month > 0
  ON CONFLICT (affiliate_id, month_year) DO UPDATE SET
    leads_count = EXCLUDED.leads_count,
    earnings = EXCLUDED.earnings,
    level_achieved = EXCLUDED.level_achieved;
  
  -- Resetar clicks do mês e voltar para Bronze
  UPDATE affiliate_stats 
  SET clicks_this_month = 0, 
      current_level_id = 1,
      level_progress = 0,
      updated_at = now();
END;
$$;

-- 6. Recalcular níveis atuais de todos afiliados baseado em leads do mês
CREATE OR REPLACE FUNCTION public.recalculate_all_monthly_levels()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_affiliate RECORD;
BEGIN
  FOR v_affiliate IN 
    SELECT affiliate_id, clicks_this_month FROM affiliate_stats
  LOOP
    UPDATE affiliate_stats 
    SET current_level_id = get_affiliate_level_monthly(v_affiliate.clicks_this_month)
    WHERE affiliate_id = v_affiliate.affiliate_id;
  END LOOP;
END;
$$;

-- Executar recálculo inicial
SELECT recalculate_all_monthly_levels();

-- ================= 20251213181036_f3acf4ee-e041-47ad-8f73-e6fffb12e63b.sql =================
-- 1. Criar função para atualizar posições do ranking
CREATE OR REPLACE FUNCTION public.update_ranking_positions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Atualizar posições baseado em clicks_this_month (leads do mês)
  WITH ranked AS (
    SELECT 
      affiliate_id,
      ROW_NUMBER() OVER (ORDER BY clicks_this_month DESC NULLS LAST, total_clicks DESC NULLS LAST) as new_position
    FROM affiliate_stats
    WHERE clicks_this_month > 0
  )
  UPDATE affiliate_stats ast
  SET rank_position = r.new_position
  FROM ranked r
  WHERE ast.affiliate_id = r.affiliate_id;
  
  -- Limpar posição para quem não tem leads no mês
  UPDATE affiliate_stats
  SET rank_position = NULL
  WHERE clicks_this_month = 0 OR clicks_this_month IS NULL;
END;
$$;

-- 2. Adicionar coluna dismissed na tabela user_onboarding
ALTER TABLE public.user_onboarding 
ADD COLUMN IF NOT EXISTS dismissed boolean DEFAULT false;

-- 3. Executar a função imediatamente para popular o ranking
SELECT update_ranking_positions();

-- ================= 20251213183353_b402b6cd-954f-43c8-aa23-7e734e430a16.sql =================
-- Criar tabela de nichos padronizados
CREATE TABLE public.niches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  icon TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;

-- Policies para nichos
CREATE POLICY "Anyone can view active niches" ON public.niches
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage niches" ON public.niches
  FOR ALL USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Adicionar campos de nicho na tabela profiles
ALTER TABLE public.profiles 
  ADD COLUMN niche_id UUID REFERENCES public.niches(id),
  ADD COLUMN niche_confidence NUMERIC DEFAULT 0,
  ADD COLUMN niche_last_updated TIMESTAMPTZ;

-- Popular nichos iniciais
INSERT INTO public.niches (name, category, icon) VALUES
-- Alimentação
('Restaurante', 'Alimentação', '🍽️'),
('Pizzaria', 'Alimentação', '🍕'),
('Hamburgueria', 'Alimentação', '🍔'),
('Lanchonete', 'Alimentação', '🥪'),
('Açaí', 'Alimentação', '🍇'),
('Sorveteria', 'Alimentação', '🍦'),
('Padaria', 'Alimentação', '🥖'),
('Cafeteria', 'Alimentação', '☕'),
('Bar', 'Alimentação', '🍻'),
('Doceria', 'Alimentação', '🍰'),
('Marmitaria', 'Alimentação', '🍱'),
('Sushi', 'Alimentação', '🍣'),
-- Beleza
('Salão de Beleza', 'Beleza', '💇'),
('Barbearia', 'Beleza', '💈'),
('Estética', 'Beleza', '✨'),
('Manicure/Pedicure', 'Beleza', '💅'),
('Spa', 'Beleza', '🧖'),
-- Saúde
('Clínica Médica', 'Saúde', '🏥'),
('Clínica Odontológica', 'Saúde', '🦷'),
('Farmácia', 'Saúde', '💊'),
('Academia', 'Saúde', '🏋️'),
('Fisioterapia', 'Saúde', '🦴'),
('Nutricionista', 'Saúde', '🥗'),
-- Serviços
('Oficina Mecânica', 'Serviços', '🔧'),
('Pet Shop', 'Serviços', '🐕'),
('Lavanderia', 'Serviços', '👔'),
('Escola/Curso', 'Serviços', '📚'),
('Gráfica', 'Serviços', '🖨️'),
-- Varejo
('Loja de Roupas', 'Varejo', '👕'),
('Loja de Calçados', 'Varejo', '👟'),
('Ótica', 'Varejo', '👓'),
('Joalheria', 'Varejo', '💎'),
('Floricultura', 'Varejo', '🌸'),
-- Outros
('Outros', 'Outros', '📦');

-- ================= 20251213194440_6fa5b9c9-0561-49cb-ad7d-38a568ac428a.sql =================
-- Create a cron job to update affiliate rankings every hour
-- This ensures the ranking is always up to date

-- First, ensure the pg_cron extension exists (it should already exist in Supabase)
-- Then schedule the ranking update

SELECT cron.schedule(
  'update-affiliate-rankings',
  '0 * * * *', -- Every hour at minute 0
  $$SELECT update_ranking_positions()$$
);

-- ================= 20251213230517_18f7ba11-7e08-4c5b-8876-c36815513987.sql =================
-- Adicionar novo valor ao enum transaction_type
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'ADMIN_ADJUSTMENT';

-- Adicionar política RLS para admins inserirem transações
CREATE POLICY "Admins can insert transactions"
ON public.transactions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'ADMIN'::app_role));

-- ================= 20251213231217_e544aa51-5ceb-4be1-bbae-07240e18d22c.sql =================
-- Allow admins to update any profile (for balance adjustments, etc.)
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- ================= 20251214135909_a1d875d7-06c7-4c5f-aaa2-851d9e14dee1.sql =================
-- Create storage bucket for static files (sitemap)
INSERT INTO storage.buckets (id, name, public)
VALUES ('static-files', 'static-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to static files
CREATE POLICY "Public can read static files"
ON storage.objects FOR SELECT
USING (bucket_id = 'static-files');

-- Allow service role to manage static files
CREATE POLICY "Service role can manage static files"
ON storage.objects FOR ALL
USING (bucket_id = 'static-files')
WITH CHECK (bucket_id = 'static-files');

-- ================= 20251214141859_e8e90173-6f58-4382-a109-d80bff353a8e.sql =================
-- Criar tabela para gerenciar páginas do sitemap
CREATE TABLE public.site_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  changefreq TEXT DEFAULT 'monthly',
  priority NUMERIC(2,1) DEFAULT 0.5,
  include_in_sitemap BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view site pages" ON public.site_pages FOR SELECT USING (true);
CREATE POLICY "Admins can manage site pages" ON public.site_pages FOR ALL USING (has_role(auth.uid(), 'ADMIN'::app_role));
CREATE POLICY "Service role can manage site pages" ON public.site_pages FOR ALL USING (true) WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_site_pages_updated_at
  BEFORE UPDATE ON public.site_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Popular com páginas atuais
INSERT INTO public.site_pages (path, name, changefreq, priority) VALUES
  ('/', 'Página Inicial', 'daily', 1.0),
  ('/sobre', 'Sobre', 'monthly', 0.8),
  ('/blog', 'Blog', 'daily', 0.9),
  ('/auth', 'Login/Cadastro', 'monthly', 0.5),
  ('/ajuda', 'Central de Ajuda', 'monthly', 0.6),
  ('/transparencia', 'Transparência', 'monthly', 0.6),
  ('/termos', 'Termos de Uso', 'monthly', 0.4),
  ('/privacidade', 'Política de Privacidade', 'monthly', 0.4),
  ('/chat', 'Chat IA', 'monthly', 0.7);

-- ================= 20251219193034_2e41d21d-ddd1-487b-bf6a-51e127a9bfd2.sql =================
-- Tabela de cidades disponíveis
CREATE TABLE public.available_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code TEXT NOT NULL,
  city_name TEXT NOT NULL,
  active BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  scheduled_activation TIMESTAMP WITH TIME ZONE,
  waitlist_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  activated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(state_code, city_name)
);

-- Tabela de lista de espera
CREATE TABLE public.city_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES public.available_cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('COMPANY', 'AFFILIATE', 'CLIENT')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notified_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(city_id, email)
);

-- Índices
CREATE INDEX idx_available_cities_state ON public.available_cities(state_code);
CREATE INDEX idx_available_cities_active ON public.available_cities(active);
CREATE INDEX idx_city_waitlist_city ON public.city_waitlist(city_id);

-- RLS para available_cities
ALTER TABLE public.available_cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active cities"
ON public.available_cities FOR SELECT
USING (active = true OR scheduled_activation IS NOT NULL);

CREATE POLICY "Admins can manage all cities"
ON public.available_cities FOR ALL
USING (has_role(auth.uid(), 'ADMIN'));

-- RLS para city_waitlist
ALTER TABLE public.city_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
ON public.city_waitlist FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage waitlist"
ON public.city_waitlist FOR ALL
USING (has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Service role can manage waitlist"
ON public.city_waitlist FOR ALL
USING (true)
WITH CHECK (true);

-- Função para incrementar contador de waitlist
CREATE OR REPLACE FUNCTION public.increment_waitlist_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE available_cities 
  SET waitlist_count = waitlist_count + 1 
  WHERE id = NEW.city_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_waitlist_insert
AFTER INSERT ON public.city_waitlist
FOR EACH ROW EXECUTE FUNCTION public.increment_waitlist_count();

-- ================= 20251219203926_56e3d17f-05af-44b6-ad96-9eff434f4a63.sql =================
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

-- ================= 20260719114857_81db85a7-a1da-46e5-866a-a38a3cc19237.sql =================
SELECT cron.unschedule('generate-morning-post');
SELECT cron.unschedule('generate-noon-post');
SELECT cron.unschedule('generate-afternoon-post');
SELECT cron.unschedule('generate-evening-post');

-- ================= 20260719161640_bb80cb50-2c5b-41d8-94a3-b15ae4a9ed43.sql =================

CREATE OR REPLACE VIEW public.company_public_profiles
WITH (security_invoker = false) AS
SELECT DISTINCT
  p.id,
  p.name,
  p.avatar_url,
  p.instagram_url,
  p.city,
  p.niche_id
FROM public.profiles p
WHERE p.id IN (
  SELECT DISTINCT o.company_id FROM public.offers o
  WHERE o.active = true AND o.deleted_at IS NULL
);

GRANT SELECT ON public.company_public_profiles TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view company profiles with active offers" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles for ranking" ON public.profiles;

DROP POLICY IF EXISTS "Companies can update offer images" ON storage.objects;
DROP POLICY IF EXISTS "Companies can delete offer images" ON storage.objects;
DROP POLICY IF EXISTS "Companies can upload their own offer images" ON storage.objects;

CREATE POLICY "Companies can upload their own offer images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'offer-images'
  AND (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM public.offers o
    JOIN public.profiles p ON p.id = o.company_id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Companies can update their offer images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'offer-images'
  AND (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM public.offers o
    JOIN public.profiles p ON p.id = o.company_id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Companies can delete their offer images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'offer-images'
  AND (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM public.offers o
    JOIN public.profiles p ON p.id = o.company_id
    WHERE p.user_id = auth.uid()
  )
);


-- ================= 20260720104322_3b4b6b7f-b588-404d-ad88-dc4c8df323da.sql =================
-- PARTE A: Trancar políticas "manage" abertas
DO $$
DECLARE
  pol record;
  targets text[][] := ARRAY[
    ['affiliate_monthly_history','Service role can manage history'],
    ['affiliate_stats','System can manage affiliate stats'],
    ['blog_posts','Service role can manage blog posts'],
    ['blog_themes','Service role can manage themes'],
    ['city_waitlist','Service role can manage waitlist'],
    ['click_rate_limits','System can manage rate limits'],
    ['device_fingerprints','System can manage device fingerprints'],
    ['fraud_alerts','Service role can manage fraud alerts'],
    ['fraud_blacklist','Service role can manage blacklist'],
    ['lead_rate_limits','Service role can manage lead rate limits'],
    ['leads','Service role can manage leads'],
    ['offer_scores','System can manage offer scores'],
    ['page_sessions','System can manage page sessions'],
    ['payments','Service role can manage payments'],
    ['short_links','Service role can manage short links'],
    ['signup_rate_limits','Service role can manage signup rate limits'],
    ['site_pages','Service role can manage site pages'],
    ['user_bans','Service role can manage user bans'],
    ['user_onboarding','Service role can manage onboarding']
  ];
  t text; n text; i int;
BEGIN
  FOR i IN 1 .. array_length(targets,1) LOOP
    t := targets[i][1]; n := targets[i][2];
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', n, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);',
      n, t);
  END LOOP;
END $$;

-- PARTE B: Revogar EXECUTE de funções internas de anon/authenticated
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'archive_and_reset_monthly_stats','calculate_offer_score',
        'calculate_offer_score_trigger','cleanup_old_rate_limits',
        'cleanup_old_sessions','cleanup_old_signup_rate_limits',
        'create_fraud_alert','credit_onboarding_bonus','handle_new_user_email',
        'increment_waitlist_count','notify_level_change',
        'recalculate_affiliate_stats','recalculate_all_affiliate_stats',
        'recalculate_all_monthly_levels','recalculate_all_offer_scores',
        'reset_weekly_clicks','update_affiliate_fraud_score',
        'update_affiliate_stats','update_affiliate_stats_lead',
        'update_offer_leads_count','update_ranking_positions'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated;', r.sig);
  END LOOP;
END $$;

-- PARTE C: Índices de FK + remove índice duplicado
CREATE INDEX IF NOT EXISTS idx_affiliate_stats_current_level ON public.affiliate_stats(current_level_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_resolved_by ON public.fraud_alerts(resolved_by);
CREATE INDEX IF NOT EXISTS idx_fraud_blacklist_added_by ON public.fraud_blacklist(added_by);
CREATE INDEX IF NOT EXISTS idx_lead_rate_limits_offer ON public.lead_rate_limits(offer_id);
CREATE INDEX IF NOT EXISTS idx_leads_affiliate ON public.leads(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_offer_clicks_affiliate ON public.offer_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_offer_clicks_offer ON public.offer_clicks(offer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_banned_by ON public.profiles(banned_by);
CREATE INDEX IF NOT EXISTS idx_profiles_niche ON public.profiles(niche_id);
CREATE INDEX IF NOT EXISTS idx_short_links_affiliate ON public.short_links(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_transactions_offer ON public.transactions(offer_id);
CREATE INDEX IF NOT EXISTS idx_user_bans_banned_by ON public.user_bans(banned_by);
CREATE INDEX IF NOT EXISTS idx_withdrawals_reviewed_by ON public.withdrawals(reviewed_by);
DROP INDEX IF EXISTS public.idx_short_links_code;

-- PARTE D: Tabela de rate limit do ai-chat
CREATE TABLE IF NOT EXISTS public.ai_chat_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ai_chat_rate_limits TO service_role;
CREATE INDEX IF NOT EXISTS idx_ai_chat_rl_ip_time ON public.ai_chat_rate_limits(ip_address, created_at);
ALTER TABLE public.ai_chat_rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role manages ai chat rate limits" ON public.ai_chat_rate_limits;
CREATE POLICY "Service role manages ai chat rate limits"
  ON public.ai_chat_rate_limits FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.cleanup_ai_chat_rate_limits()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN DELETE FROM public.ai_chat_rate_limits WHERE created_at < now() - interval '24 hours'; END; $fn$;
REVOKE EXECUTE ON FUNCTION public.cleanup_ai_chat_rate_limits() FROM anon, authenticated;

-- ================= 20260720165644_a5a67c00-fecd-431f-bd6d-68da4a7da231.sql =================

CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_ip TEXT,
  status TEXT NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED','REDEEMED','EXPIRED')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  redeemed_by_whatsapp TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view their coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (company_id = public.get_current_profile_id());

CREATE POLICY "Admins can view all coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Service role manages coupons"
  ON public.coupons FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_offer_status ON public.coupons(offer_id, status);
CREATE INDEX idx_coupons_company_created ON public.coupons(company_id, created_at DESC);
CREATE INDEX idx_coupons_phone_created ON public.coupons(customer_phone, created_at DESC);

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ================= 20260721032504_94b22d19-1036-4faa-8135-5d354be296db.sql =================
-- CLILIN WhatsApp + financial layer for coupons (idempotent)

ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'REDEMPTION_COST';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'REDEMPTION_EARNING';

ALTER TABLE public.pricing_config
  ADD COLUMN IF NOT EXISTS redemption_cost integer NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS redemption_affiliate_share numeric NOT NULL DEFAULT 0.60;

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS affiliate_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_coupons_affiliate ON public.coupons(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_coupons_lead ON public.coupons(lead_id);

DROP POLICY IF EXISTS "Affiliates can view their coupons" ON public.coupons;
CREATE POLICY "Affiliates can view their coupons"
  ON public.coupons FOR SELECT TO authenticated
  USING (affiliate_id = public.get_current_profile_id());

CREATE TABLE IF NOT EXISTS public.merchant_whatsapp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone text NOT NULL UNIQUE,
  label text,
  verified boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_merchant_wa_profile ON public.merchant_whatsapp(profile_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchant_whatsapp TO authenticated;
GRANT ALL ON public.merchant_whatsapp TO service_role;
ALTER TABLE public.merchant_whatsapp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages merchant whatsapp" ON public.merchant_whatsapp;
CREATE POLICY "Service role manages merchant whatsapp"
  ON public.merchant_whatsapp FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Companies manage own whatsapp numbers" ON public.merchant_whatsapp;
CREATE POLICY "Companies manage own whatsapp numbers"
  ON public.merchant_whatsapp FOR ALL TO authenticated
  USING (profile_id = public.get_current_profile_id())
  WITH CHECK (profile_id = public.get_current_profile_id());
DROP POLICY IF EXISTS "Admins manage merchant whatsapp" ON public.merchant_whatsapp;
CREATE POLICY "Admins manage merchant whatsapp"
  ON public.merchant_whatsapp FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

CREATE TABLE IF NOT EXISTS public.wa_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL CHECK (direction IN ('IN','OUT')),
  phone text,
  kind text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wa_messages_phone_time ON public.wa_messages(phone, created_at);
GRANT ALL ON public.wa_messages TO service_role;
ALTER TABLE public.wa_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role manages wa messages" ON public.wa_messages;
CREATE POLICY "Service role manages wa messages"
  ON public.wa_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

DO $$ BEGIN
  PERFORM cron.schedule(
    'expire-coupons', '30 * * * *',
    $cron$ UPDATE public.coupons SET status='EXPIRED'
           WHERE status='ISSUED' AND expires_at < now(); $cron$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'cron ja existe ou pg_cron indisponivel: %', SQLERRM;
END $$;

-- ================= 20260721143000_whatsapp_coupon_layer.sql =================
-- =====================================================================
-- CLILIN — CAMADA WHATSAPP + FINANCEIRO do cupom (v2)
-- Complementa o sistema de cupom JA DEPLOYADO (tabela coupons existente).
-- Idempotente. Nao altera nada do que ja funciona.
-- =====================================================================

-- 1) Tipos de transacao do resgate (padrao CLICK_COST/CLICK_EARNING)
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'REDEMPTION_COST';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'REDEMPTION_EARNING';

-- 2) Preco do resgate (mesma unidade do CPC; ajuste no painel depois)
ALTER TABLE public.pricing_config
  ADD COLUMN IF NOT EXISTS redemption_cost integer NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS redemption_affiliate_share numeric NOT NULL DEFAULT 0.60;

-- 3) Atribuicao do divulgador no cupom (hoje ela se PERDE no resgate)
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS affiliate_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_coupons_affiliate ON public.coupons(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_coupons_lead ON public.coupons(lead_id);

DROP POLICY IF EXISTS "Affiliates can view their coupons" ON public.coupons;
CREATE POLICY "Affiliates can view their coupons"
  ON public.coupons FOR SELECT TO authenticated
  USING (affiliate_id = public.get_current_profile_id());

-- 4) Numeros de WhatsApp autorizados a RESGATAR (por empresa)
--    phone: SO DIGITOS COM DDI (ex: 5531999998888) — e como a Meta manda o "from"
CREATE TABLE IF NOT EXISTS public.merchant_whatsapp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone text NOT NULL UNIQUE,
  label text,
  verified boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_merchant_wa_profile ON public.merchant_whatsapp(profile_id);
ALTER TABLE public.merchant_whatsapp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages merchant whatsapp" ON public.merchant_whatsapp;
CREATE POLICY "Service role manages merchant whatsapp"
  ON public.merchant_whatsapp FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Companies manage own whatsapp numbers" ON public.merchant_whatsapp;
CREATE POLICY "Companies manage own whatsapp numbers"
  ON public.merchant_whatsapp FOR ALL TO authenticated
  USING (profile_id = public.get_current_profile_id())
  WITH CHECK (profile_id = public.get_current_profile_id());
DROP POLICY IF EXISTS "Admins manage merchant whatsapp" ON public.merchant_whatsapp;
CREATE POLICY "Admins manage merchant whatsapp"
  ON public.merchant_whatsapp FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

-- 5) Log de mensagens WhatsApp (auditoria/debug) — so backend
CREATE TABLE IF NOT EXISTS public.wa_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL CHECK (direction IN ('IN','OUT')),
  phone text,
  kind text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wa_messages_phone_time ON public.wa_messages(phone, created_at);
ALTER TABLE public.wa_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role manages wa messages" ON public.wa_messages;
CREATE POLICY "Service role manages wa messages"
  ON public.wa_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6) Expiracao automatica de cupons (de hora em hora)
DO $$ BEGIN
  PERFORM cron.schedule(
    'expire-coupons', '30 * * * *',
    $cron$ UPDATE public.coupons SET status='EXPIRED'
           WHERE status='ISSUED' AND expires_at < now(); $cron$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'cron ja existe ou pg_cron indisponivel: %', SQLERRM;
END $$;


-- ================= 20260721150000_pivot_redemption_billing.sql =================
-- =====================================================================
-- CLILIN — PIVO PARA PAGAMENTO POR RESGATE (pay-per-redeem)
-- Bounty por oferta + billing_mode + curva de niveis monotonica (por resgates).
-- Idempotente. Assume schema pos-v2 (whatsapp_coupon_layer) mas nao depende dele.
-- Aplicar DEPOIS de 20260721143000_whatsapp_coupon_layer.sql.
-- Validada no projeto spare antes do deploy.
-- =====================================================================

-- 1) BOUNTY POR OFERTA: quanto a empresa paga por cliente convertido (centavos).
--    Piso de R$5,00 e default de R$8,00 sao aplicados na criacao/edicao da oferta.
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS redemption_cost integer NOT NULL DEFAULT 800;
UPDATE public.offers SET redemption_cost = 800 WHERE redemption_cost IS NULL;

-- 2) MODELO DE COBRANCA: REDEMPTION_ONLY (novo) desliga a cobranca de clique/lead.
--    Clique e lead seguem sendo REGISTRADOS (metrica + atribuicao do divulgador),
--    mas nao debitam a empresa nem pagam comissao — isso acontece so no RESGATE.
--    Fallback global de bounty = R$8; split do divulgador = 70% no lancamento.
ALTER TABLE public.pricing_config
  ADD COLUMN IF NOT EXISTS billing_mode text NOT NULL DEFAULT 'REDEMPTION_ONLY',
  ADD COLUMN IF NOT EXISTS redemption_cost integer NOT NULL DEFAULT 800,
  ADD COLUMN IF NOT EXISTS redemption_affiliate_share numeric NOT NULL DEFAULT 0.70;

UPDATE public.pricing_config
  SET billing_mode = 'REDEMPTION_ONLY',
      redemption_affiliate_share = 0.70,
      redemption_cost = GREATEST(COALESCE(redemption_cost, 800), 500);

-- 3) CURVA DE NIVEIS: monotonica, regua local, contada por RESGATES.
--    min_clicks passa a significar "resgates acumulados" (update_affiliate_stats
--    e chamado no resgate, nao mais no clique). Textos batem com os multiplicadores.
UPDATE public.affiliate_levels SET name='Bronze',   min_clicks=0,   commission_multiplier=1.00, badge_color='#CD7F32', benefits=ARRAY['Comissao de 70%','Comece a indicar'] WHERE id=1;
UPDATE public.affiliate_levels SET name='Prata',     min_clicks=10,  commission_multiplier=1.07, badge_color='#C0C0C0', benefits=ARRAY['Comissao de 75%','Destaque no ranking'] WHERE id=2;
UPDATE public.affiliate_levels SET name='Ouro',      min_clicks=30,  commission_multiplier=1.14, badge_color='#FFD700', benefits=ARRAY['Comissao de 80%','Suporte prioritario'] WHERE id=3;
UPDATE public.affiliate_levels SET name='Platina',   min_clicks=75,  commission_multiplier=1.21, badge_color='#E5E4E2', benefits=ARRAY['Comissao de 85%','Ofertas exclusivas'] WHERE id=4;
UPDATE public.affiliate_levels SET name='Diamante',  min_clicks=150, commission_multiplier=1.28, badge_color='#B9F2FF', benefits=ARRAY['Comissao de 90%','Bonus mensais'] WHERE id=5;


-- ================= 20260721221837_98c11930-ab87-4db7-b605-b675d424fee8.sql =================

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS redemption_cost integer NOT NULL DEFAULT 800;
UPDATE public.offers SET redemption_cost = 800 WHERE redemption_cost IS NULL;

ALTER TABLE public.pricing_config
  ADD COLUMN IF NOT EXISTS billing_mode text NOT NULL DEFAULT 'REDEMPTION_ONLY',
  ADD COLUMN IF NOT EXISTS redemption_cost integer NOT NULL DEFAULT 800,
  ADD COLUMN IF NOT EXISTS redemption_affiliate_share numeric NOT NULL DEFAULT 0.70;

UPDATE public.pricing_config
  SET billing_mode = 'REDEMPTION_ONLY',
      redemption_affiliate_share = 0.70,
      redemption_cost = GREATEST(COALESCE(redemption_cost, 800), 500);

UPDATE public.affiliate_levels SET name='Bronze',   min_clicks=0,   commission_multiplier=1.00, badge_color='#CD7F32', benefits=ARRAY['Comissao padrao','Comece a indicar'] WHERE id=1;
UPDATE public.affiliate_levels SET name='Prata',    min_clicks=10,  commission_multiplier=1.10, badge_color='#C0C0C0', benefits=ARRAY['Comissao +10%','Destaque no ranking'] WHERE id=2;
UPDATE public.affiliate_levels SET name='Ouro',     min_clicks=30,  commission_multiplier=1.25, badge_color='#FFD700', benefits=ARRAY['Comissao +25%','Suporte prioritario'] WHERE id=3;
UPDATE public.affiliate_levels SET name='Platina',  min_clicks=75,  commission_multiplier=1.40, badge_color='#E5E4E2', benefits=ARRAY['Comissao +40%','Ofertas exclusivas'] WHERE id=4;
UPDATE public.affiliate_levels SET name='Diamante', min_clicks=150, commission_multiplier=1.60, badge_color='#B9F2FF', benefits=ARRAY['Comissao +60%','Bonus mensais'] WHERE id=5;


-- ================= 20260722010000_recalibrate_level_curve.sql =================
-- Recalibracao da curva de niveis: teto 90% (plataforma sempre fica com >=10%).
-- Antes: multiplicadores ate 1.60 faziam a fatia do divulgador estourar 100%
--        (Diamante = 0.70 x 1.60 = 112%), ou seja a plataforma pagava do proprio bolso.
-- Agora: fatia do divulgador vai de 70% (Bronze) a ~90% (Diamante); plataforma sempre lucra.
-- share base = 0.70 | fatia = 0.70 x commission_multiplier
UPDATE public.affiliate_levels SET commission_multiplier=1.00, benefits=ARRAY['Comissao de 70%','Comece a indicar']       WHERE id=1; -- Bronze  70%
UPDATE public.affiliate_levels SET commission_multiplier=1.07, benefits=ARRAY['Comissao de 75%','Destaque no ranking']    WHERE id=2; -- Prata   ~75%
UPDATE public.affiliate_levels SET commission_multiplier=1.14, benefits=ARRAY['Comissao de 80%','Suporte prioritario']    WHERE id=3; -- Ouro    ~80%
UPDATE public.affiliate_levels SET commission_multiplier=1.21, benefits=ARRAY['Comissao de 85%','Ofertas exclusivas']     WHERE id=4; -- Platina ~85%
UPDATE public.affiliate_levels SET commission_multiplier=1.28, benefits=ARRAY['Comissao de 90%','Bonus mensais']          WHERE id=5; -- Diamante ~90%


-- ================= 20260722120000_fase1_percentual_fee.sql =================
-- ============================================================
-- FASE 1 — Cobranca percentual + validade configuravel do cupom
-- ============================================================
-- Modelo: taxa = max(fee_min_cents ; price_new * fee_percent)
--         cobrada a CADA resgate de cupom.
-- Divisao: divulgador 50% (Bronze) ate 70% (Diamante); plataforma fica com o resto.
-- A taxa e CONGELADA no cupom no momento da emissao (issue-coupon):
-- se a empresa mudar o preco depois, o cupom na mao do cliente mantem o valor combinado.

-- ---------- 1. pricing_config: parametros globais da taxa ----------
ALTER TABLE public.pricing_config
  ADD COLUMN IF NOT EXISTS fee_percent    numeric NOT NULL DEFAULT 0.15,
  ADD COLUMN IF NOT EXISTS fee_min_cents  integer NOT NULL DEFAULT 300;

-- share base do divulgador passa de 0.70 para 0.50 (curva nova 50% -> 70%)
UPDATE public.pricing_config SET redemption_affiliate_share = 0.50;

-- ---------- 2. offers: validade do cupom definida pela empresa ----------
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS coupon_valid_hours integer NOT NULL DEFAULT 168; -- 168h = 7 dias

COMMENT ON COLUMN public.offers.coupon_valid_hours IS
  'Por quantas horas o cupom emitido continua valido. Ex: 24 = ate amanha, 72 = 3 dias, 168 = 7 dias.';

-- ---------- 3. coupons: taxa congelada na emissao ----------
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS fee_cents integer;

COMMENT ON COLUMN public.coupons.fee_cents IS
  'Taxa (em centavos) travada no momento da emissao do cupom. O resgate cobra ESTE valor.';

-- backfill: cupons emitidos antes desta migration recebem a taxa calculada pelo preco atual da oferta
UPDATE public.coupons c
SET fee_cents = GREATEST(300, ROUND(o.price_new * 100 * 0.15))
FROM public.offers o
WHERE c.offer_id = o.id AND c.fee_cents IS NULL;

-- ---------- 4. curva de niveis: 50% -> 70% ----------
-- fatia do divulgador = redemption_affiliate_share (0.50) * commission_multiplier
UPDATE public.affiliate_levels SET commission_multiplier=1.00, benefits=ARRAY['Comissao de 50%','Comece a indicar']    WHERE id=1; -- Bronze   50%
UPDATE public.affiliate_levels SET commission_multiplier=1.10, benefits=ARRAY['Comissao de 55%','Destaque no ranking'] WHERE id=2; -- Prata    55%
UPDATE public.affiliate_levels SET commission_multiplier=1.20, benefits=ARRAY['Comissao de 60%','Suporte prioritario'] WHERE id=3; -- Ouro     60%
UPDATE public.affiliate_levels SET commission_multiplier=1.30, benefits=ARRAY['Comissao de 65%','Ofertas exclusivas']  WHERE id=4; -- Platina  65%
UPDATE public.affiliate_levels SET commission_multiplier=1.40, benefits=ARRAY['Comissao de 70%','Bonus mensais']       WHERE id=5; -- Diamante 70%

-- ---------- 5. funcao de calculo da taxa (fonte unica da verdade) ----------
CREATE OR REPLACE FUNCTION public.calc_redemption_fee(p_offer_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price    numeric;
  v_percent  numeric;
  v_min      integer;
BEGIN
  SELECT price_new INTO v_price FROM public.offers WHERE id = p_offer_id;
  IF v_price IS NULL THEN RETURN NULL; END IF;

  SELECT fee_percent, fee_min_cents INTO v_percent, v_min
  FROM public.pricing_config LIMIT 1;

  v_percent := COALESCE(v_percent, 0.15);
  v_min     := COALESCE(v_min, 300);

  RETURN GREATEST(v_min, ROUND(v_price * 100 * v_percent));
END;
$$;

COMMENT ON FUNCTION public.calc_redemption_fee IS
  'Taxa em centavos de um resgate da oferta: max(fee_min_cents, price_new * fee_percent).';


-- ================= 20260722183915_4cba64ab-f0a5-4c5d-aac0-b3454292c7a1.sql =================
CREATE POLICY "Admins can insert any offer"
ON public.offers
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

-- ================= 20260723005327_6d8d02f5-95c6-445d-ad33-0ed8a8505bdc.sql =================

CREATE OR REPLACE FUNCTION public.admin_exec_sql(p_sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_trimmed text;
  v_first_word text;
  v_is_select boolean;
  v_rows_affected bigint;
BEGIN
  IF NOT public.has_role(auth.uid(), 'ADMIN') THEN
    RAISE EXCEPTION 'Apenas ADMIN pode executar SQL';
  END IF;

  v_trimmed := btrim(p_sql);
  v_trimmed := regexp_replace(v_trimmed, ';\s*$', '');
  v_first_word := lower(split_part(regexp_replace(v_trimmed, '^\s+', ''), ' ', 1));
  v_is_select := v_first_word IN ('select', 'with', 'show', 'explain', 'table', 'values');

  BEGIN
    IF v_is_select THEN
      EXECUTE format('SELECT COALESCE(jsonb_agg(t), ''[]''::jsonb) FROM (%s) t', v_trimmed)
        INTO v_result;
      RETURN jsonb_build_object('status', 'ok', 'kind', 'select', 'rows', v_result);
    ELSE
      EXECUTE v_trimmed;
      GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
      RETURN jsonb_build_object('status', 'ok', 'kind', 'exec', 'rows_affected', v_rows_affected);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_exec_sql(text) TO authenticated;

