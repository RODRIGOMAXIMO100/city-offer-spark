-- Create a cron job to update affiliate rankings every hour
-- This ensures the ranking is always up to date

-- First, ensure the pg_cron extension exists (it should already exist in Supabase)
-- Then schedule the ranking update

SELECT cron.schedule(
  'update-affiliate-rankings',
  '0 * * * *', -- Every hour at minute 0
  $$SELECT update_ranking_positions()$$
);