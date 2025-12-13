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