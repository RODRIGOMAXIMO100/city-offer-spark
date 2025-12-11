-- Create withdrawal status enum
CREATE TYPE withdrawal_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED');

-- Create withdrawals table for anti-fraud system
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  amount_brl NUMERIC(10,2) NOT NULL,
  status withdrawal_status DEFAULT 'PENDING',
  pix_key TEXT NOT NULL,
  pix_tipo TEXT NOT NULL,
  cpf TEXT NOT NULL,
  nome_completo TEXT NOT NULL,
  fraud_score INTEGER DEFAULT 0,
  fraud_reasons TEXT[] DEFAULT '{}',
  requested_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create device fingerprints table for advanced anti-fraud
CREATE TABLE public.device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  fingerprint_data JSONB,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  is_suspicious BOOLEAN DEFAULT false,
  blocked BOOLEAN DEFAULT false,
  UNIQUE(device_id, ip_address)
);

-- Create page sessions table for server-side time validation
CREATE TABLE public.page_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  client_ip TEXT NOT NULL,
  device_id TEXT,
  fingerprint_hash TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  validated BOOLEAN DEFAULT false
);

-- Create affiliate levels table for gamification
CREATE TABLE public.affiliate_levels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  min_clicks INTEGER NOT NULL,
  commission_multiplier NUMERIC(3,2) DEFAULT 1.00,
  badge_color TEXT NOT NULL,
  benefits TEXT[]
);

-- Insert default affiliate levels
INSERT INTO public.affiliate_levels (name, min_clicks, commission_multiplier, badge_color, benefits) VALUES
('Bronze', 0, 1.00, '#CD7F32', ARRAY['Comissão padrão R$ 0,30']),
('Prata', 100, 1.10, '#C0C0C0', ARRAY['Comissão +10%', 'Destaque no ranking']),
('Ouro', 500, 1.20, '#FFD700', ARRAY['Comissão +20%', 'Suporte prioritário']),
('Platina', 2000, 1.35, '#E5E4E2', ARRAY['Comissão +35%', 'Ofertas exclusivas']),
('Elite', 10000, 1.50, '#B9F2FF', ARRAY['Comissão +50%', 'Bônus mensais']);

-- Create affiliate stats table for tracking progress
CREATE TABLE public.affiliate_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  total_clicks INTEGER DEFAULT 0,
  total_earnings INTEGER DEFAULT 0,
  current_level_id INTEGER REFERENCES public.affiliate_levels(id) DEFAULT 1,
  level_progress NUMERIC(5,2) DEFAULT 0,
  clicks_this_month INTEGER DEFAULT 0,
  clicks_this_week INTEGER DEFAULT 0,
  rank_position INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for withdrawals
CREATE POLICY "Users can view their own withdrawals"
ON public.withdrawals FOR SELECT
USING (user_id = get_current_profile_id());

CREATE POLICY "Users can insert their own withdrawals"
ON public.withdrawals FOR INSERT
WITH CHECK (user_id = get_current_profile_id());

CREATE POLICY "Admins can view all withdrawals"
ON public.withdrawals FOR SELECT
USING (has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Admins can update all withdrawals"
ON public.withdrawals FOR UPDATE
USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- RLS Policies for device_fingerprints (system managed)
CREATE POLICY "System can manage device fingerprints"
ON public.device_fingerprints FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can view device fingerprints"
ON public.device_fingerprints FOR SELECT
USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- RLS Policies for page_sessions (system managed)
CREATE POLICY "System can manage page sessions"
ON public.page_sessions FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for affiliate_levels (public read)
CREATE POLICY "Anyone can view affiliate levels"
ON public.affiliate_levels FOR SELECT
USING (true);

-- RLS Policies for affiliate_stats
CREATE POLICY "Users can view their own stats"
ON public.affiliate_stats FOR SELECT
USING (affiliate_id = get_current_profile_id());

CREATE POLICY "Anyone can view stats for ranking"
ON public.affiliate_stats FOR SELECT
USING (true);

CREATE POLICY "System can manage affiliate stats"
ON public.affiliate_stats FOR ALL
USING (true)
WITH CHECK (true);

-- Function to calculate affiliate level based on total clicks
CREATE OR REPLACE FUNCTION public.get_affiliate_level(total_clicks INTEGER)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM public.affiliate_levels 
  WHERE min_clicks <= total_clicks 
  ORDER BY min_clicks DESC 
  LIMIT 1;
$$;

-- Function to get commission multiplier for an affiliate
CREATE OR REPLACE FUNCTION public.get_commission_multiplier(affiliate_profile_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT al.commission_multiplier 
     FROM affiliate_stats ast 
     JOIN affiliate_levels al ON ast.current_level_id = al.id 
     WHERE ast.affiliate_id = affiliate_profile_id),
    1.00
  );
$$;

-- Function to update affiliate stats after a click
CREATE OR REPLACE FUNCTION public.update_affiliate_stats(affiliate_profile_id UUID, earnings INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_total_clicks INTEGER;
  new_level_id INTEGER;
BEGIN
  -- Insert or update affiliate stats
  INSERT INTO affiliate_stats (affiliate_id, total_clicks, total_earnings, clicks_this_month, clicks_this_week)
  VALUES (affiliate_profile_id, 1, earnings, 1, 1)
  ON CONFLICT (affiliate_id) DO UPDATE SET
    total_clicks = affiliate_stats.total_clicks + 1,
    total_earnings = affiliate_stats.total_earnings + earnings,
    clicks_this_month = affiliate_stats.clicks_this_month + 1,
    clicks_this_week = affiliate_stats.clicks_this_week + 1,
    updated_at = now();
  
  -- Get new total clicks
  SELECT total_clicks INTO new_total_clicks FROM affiliate_stats WHERE affiliate_id = affiliate_profile_id;
  
  -- Calculate and update level
  new_level_id := get_affiliate_level(new_total_clicks);
  
  UPDATE affiliate_stats 
  SET current_level_id = new_level_id,
      level_progress = (
        SELECT ((new_total_clicks - al.min_clicks)::NUMERIC / 
                NULLIF((LEAD(al.min_clicks) OVER (ORDER BY al.min_clicks) - al.min_clicks), 0)) * 100
        FROM affiliate_levels al
        WHERE al.id = new_level_id
      )
  WHERE affiliate_id = affiliate_profile_id;
END;
$$;

-- Function to cleanup old page sessions (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.page_sessions 
  WHERE started_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX idx_device_fingerprints_device_id ON public.device_fingerprints(device_id);
CREATE INDEX idx_page_sessions_token ON public.page_sessions(session_token);
CREATE INDEX idx_page_sessions_offer ON public.page_sessions(offer_id);
CREATE INDEX idx_affiliate_stats_affiliate ON public.affiliate_stats(affiliate_id);
CREATE INDEX idx_affiliate_stats_rank ON public.affiliate_stats(rank_position);