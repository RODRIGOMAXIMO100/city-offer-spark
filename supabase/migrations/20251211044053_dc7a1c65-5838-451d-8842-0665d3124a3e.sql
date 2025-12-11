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