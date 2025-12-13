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