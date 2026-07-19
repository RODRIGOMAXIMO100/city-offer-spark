
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
