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