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
