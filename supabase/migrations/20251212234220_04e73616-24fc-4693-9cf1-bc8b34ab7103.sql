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