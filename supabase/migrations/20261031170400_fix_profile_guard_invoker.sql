-- =====================================================================
-- CLILIN — correcao da trava de colunas sensiveis em profiles
--
-- A versao anterior era SECURITY DEFINER: dentro dela current_user vira o
-- dono da funcao (postgres), entao a checagem "quem chamou foi anon ou
-- authenticated" nunca batia e a trava nao protegia nada. Como SECURITY
-- INVOKER, current_user e o papel real de quem fez o UPDATE/INSERT:
-- authenticated pela API publica, postgres dentro das funcoes SECURITY
-- DEFINER do sistema e service_role nas edge functions.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'ADMIN'::app_role) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Bonus de boas-vindas da empresa e de no maximo R$ 1,00 (100 centavos)
    NEW.balance := LEAST(GREATEST(COALESCE(NEW.balance, 0), 0), 100);
    NEW.balance_frozen := false;
    NEW.banned := false;
    NEW.banned_at := NULL;
    NEW.banned_by := NULL;
    NEW.banned_reason := NULL;
    NEW.fraud_score := 0;
    NEW.asaas_customer_id := NULL;
    RETURN NEW;
  END IF;

  NEW.balance := OLD.balance;
  NEW.balance_frozen := OLD.balance_frozen;
  NEW.banned := OLD.banned;
  NEW.banned_at := OLD.banned_at;
  NEW.banned_by := OLD.banned_by;
  NEW.banned_reason := OLD.banned_reason;
  NEW.fraud_score := OLD.fraud_score;
  NEW.asaas_customer_id := OLD.asaas_customer_id;
  NEW.user_id := OLD.user_id;
  NEW.id := OLD.id;
  RETURN NEW;
END;
$$;
