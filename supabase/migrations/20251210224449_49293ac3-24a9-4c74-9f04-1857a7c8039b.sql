-- Create function to increment offer views (bypasses RLS)
CREATE OR REPLACE FUNCTION public.increment_offer_views(offer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE offers SET views_count = views_count + 1 WHERE id = offer_id;
END;
$$;