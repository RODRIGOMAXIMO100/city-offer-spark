-- Add deleted_at column to offers table
ALTER TABLE public.offers ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Drop existing FK constraint and recreate with SET NULL
ALTER TABLE public.offer_clicks 
DROP CONSTRAINT IF EXISTS offer_clicks_offer_id_fkey;

ALTER TABLE public.offer_clicks 
ADD CONSTRAINT offer_clicks_offer_id_fkey 
    FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE SET NULL;

-- Make offer_id nullable since it can now be SET NULL
ALTER TABLE public.offer_clicks ALTER COLUMN offer_id DROP NOT NULL;