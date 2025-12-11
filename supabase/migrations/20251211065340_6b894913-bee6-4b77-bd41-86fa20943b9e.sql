-- Add FAQ column to blog_posts table for storing FAQ data
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at DESC) WHERE status = 'published';