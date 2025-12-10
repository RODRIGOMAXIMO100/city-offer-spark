-- Function to increment offer clicks (used by edge function)
CREATE OR REPLACE FUNCTION public.increment_offer_clicks(offer_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE offers SET clicks_count = clicks_count + 1 WHERE id = offer_id;
END;
$$;