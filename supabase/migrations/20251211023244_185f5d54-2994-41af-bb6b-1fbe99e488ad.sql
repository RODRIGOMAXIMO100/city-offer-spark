-- Tabela de notificações
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Index para busca rápida
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (user_id = get_current_profile_id());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (user_id = get_current_profile_id());

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Função para reset semanal de clicks
CREATE OR REPLACE FUNCTION public.reset_weekly_clicks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE affiliate_stats 
  SET clicks_this_week = 0, updated_at = now();
END;
$$;

-- Trigger para notificar mudança de nível
CREATE OR REPLACE FUNCTION public.notify_level_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.current_level_id IS DISTINCT FROM NEW.current_level_id 
     AND NEW.current_level_id > COALESCE(OLD.current_level_id, 0) THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
      NEW.affiliate_id,
      'LEVEL_UP',
      'Parabéns! Você subiu de nível! 🎉',
      'Você alcançou o nível ' || al.name,
      jsonb_build_object(
        'level_id', NEW.current_level_id,
        'level_name', al.name,
        'badge_color', al.badge_color
      )
    FROM affiliate_levels al
    WHERE al.id = NEW.current_level_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Criar trigger na tabela affiliate_stats
CREATE TRIGGER on_level_change
  AFTER UPDATE ON public.affiliate_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_level_change();

-- Enable realtime para notificações
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;