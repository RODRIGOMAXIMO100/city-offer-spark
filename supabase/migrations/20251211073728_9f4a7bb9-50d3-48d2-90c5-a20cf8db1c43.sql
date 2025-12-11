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