-- =====================================================================
-- CLILIN — BLINDAGEM DE SEGURANCA (antes do lancamento das campanhas)
--
-- Problemas corrigidos:
-- 1) Qualquer usuario logado podia se cadastrar com role ADMIN
--    (policy de INSERT em user_roles so checava user_id = auth.uid()).
-- 2) Qualquer usuario logado podia alterar o proprio saldo, desbanir a si
--    mesmo, descongelar saldo e zerar fraud_score (UPDATE livre em profiles).
-- 3) Usuarios podiam inserir saques e pagamentos direto pela API, pulando as
--    checagens das edge functions (que usam service_role e seguem funcionando).
--
-- Feito so com objetos novos (policies RESTRICTIVE + trigger), sem apagar
-- nenhuma policy existente: RESTRICTIVE soma uma trava (AND) as permissivas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) user_roles: so permite criar a PRIMEIRA role, e nunca ADMIN
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_has_any_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

GRANT EXECUTE ON FUNCTION public.user_has_any_role(uuid) TO authenticated;

CREATE POLICY "Guard: signup role is single and never ADMIN"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'ADMIN'::app_role)
    OR (
      role IN ('COMPANY'::app_role, 'AFFILIATE'::app_role, 'CLIENT'::app_role)
      AND NOT public.user_has_any_role(auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- 2) profiles: colunas sensiveis so mudam por admin, service_role ou
--    funcoes SECURITY DEFINER (que rodam como postgres)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Chamadas vindas direto da API publica rodam como anon/authenticated.
  -- service_role e funcoes SECURITY DEFINER (postgres) passam livres.
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

  -- UPDATE: mantem os valores atuais das colunas protegidas
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

CREATE TRIGGER protect_profile_sensitive_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_columns();

-- ---------------------------------------------------------------------
-- 3) Saques e pagamentos: so as edge functions (service_role) criam
-- ---------------------------------------------------------------------
CREATE POLICY "Guard: withdrawals only via edge function"
  ON public.withdrawals
  AS RESTRICTIVE
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Guard: payments only via edge function"
  ON public.payments
  AS RESTRICTIVE
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'::app_role));
