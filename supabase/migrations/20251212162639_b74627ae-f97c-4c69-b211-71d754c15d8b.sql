-- Create table for short links
CREATE TABLE public.short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) UNIQUE NOT NULL,
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique index for code lookups
CREATE UNIQUE INDEX idx_short_links_code ON short_links(code);

-- Create composite index for offer+affiliate lookups
CREATE UNIQUE INDEX idx_short_links_offer_affiliate ON short_links(offer_id, affiliate_id);

-- Enable RLS
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

-- Anyone can read short links (needed for redirect)
CREATE POLICY "Anyone can view short links for redirect"
ON public.short_links
FOR SELECT
USING (true);

-- Affiliates can create their own short links
CREATE POLICY "Users can create their own short links"
ON public.short_links
FOR INSERT
WITH CHECK (affiliate_id = get_current_profile_id());

-- Service role can manage all
CREATE POLICY "Service role can manage short links"
ON public.short_links
FOR ALL
USING (true)
WITH CHECK (true);