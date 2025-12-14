-- Create storage bucket for static files (sitemap)
INSERT INTO storage.buckets (id, name, public)
VALUES ('static-files', 'static-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to static files
CREATE POLICY "Public can read static files"
ON storage.objects FOR SELECT
USING (bucket_id = 'static-files');

-- Allow service role to manage static files
CREATE POLICY "Service role can manage static files"
ON storage.objects FOR ALL
USING (bucket_id = 'static-files')
WITH CHECK (bucket_id = 'static-files');