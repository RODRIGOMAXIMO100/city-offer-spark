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