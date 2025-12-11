-- Create table to log individual views with timestamps
CREATE TABLE public.offer_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  client_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offer_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert views (public action)
CREATE POLICY "Anyone can insert views"
ON public.offer_views
FOR INSERT
WITH CHECK (true);

-- Companies can view their offer's views
CREATE POLICY "Companies can view clicks on their offers"
ON public.offer_views
FOR SELECT
USING (offer_id IN (
  SELECT id FROM offers WHERE company_id = get_current_profile_id()
));

-- Admins can view all
CREATE POLICY "Admins can view all views"
ON public.offer_views
FOR SELECT
USING (has_role(auth.uid(), 'ADMIN'));

-- Create index for performance
CREATE INDEX idx_offer_views_offer_id ON public.offer_views(offer_id);
CREATE INDEX idx_offer_views_created_at ON public.offer_views(created_at);