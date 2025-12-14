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