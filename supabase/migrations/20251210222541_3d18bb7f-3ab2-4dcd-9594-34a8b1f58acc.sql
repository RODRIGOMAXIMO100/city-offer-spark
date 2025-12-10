-- Add instagram_url to profiles
ALTER TABLE profiles ADD COLUMN instagram_url text;

-- Add click_type to offer_clicks to track Instagram vs Main clicks
ALTER TABLE offer_clicks ADD COLUMN click_type text DEFAULT 'MAIN';

-- Add comment for documentation
COMMENT ON COLUMN offer_clicks.click_type IS 'Type of click: MAIN (offer) or INSTAGRAM (profile view)';