-- Fix function search path for get_affiliate_level
CREATE OR REPLACE FUNCTION public.get_affiliate_level(total_clicks INTEGER)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.affiliate_levels 
  WHERE min_clicks <= total_clicks 
  ORDER BY min_clicks DESC 
  LIMIT 1;
$$;