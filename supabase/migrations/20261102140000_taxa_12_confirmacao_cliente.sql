-- Taxa de 12% do preço da oferta (mínimo R$ 3) e confirmação pelo cliente.
--
-- Regra (nov/2026):
--  * A loja paga 12% do preço da oferta por cupom usado, com mínimo de R$ 3.
--  * O uso vale quando a loja toca em "Confirmar uso" OU quando o cliente diz "Fui atendido".
--    Se foi o cliente, a loja tem 48 horas para contestar com prova. Sem contestação, o uso
--    é confirmado sozinho e cobrado.
--  * Contestação vai para o admin, que aceita (não cobra) ou nega (cobra a loja).
--  * Cliente que diz "Não fui atendido" não gera cobrança e vira sinal para o admin.

-- 1. Taxa
update public.pricing_config set fee_percent = 0.12, fee_min_cents = 300, updated_at = now();

create or replace function public.calc_redemption_fee(p_offer_id uuid)
returns integer
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare
  v_price    numeric;
  v_percent  numeric;
  v_min      integer;
begin
  select price_new into v_price from public.offers where id = p_offer_id;
  if v_price is null then return null; end if;

  select fee_percent, fee_min_cents into v_percent, v_min
  from public.pricing_config limit 1;

  v_percent := coalesce(v_percent, 0.12);
  v_min     := coalesce(v_min, 300);

  return greatest(v_min, round(v_price * 100 * v_percent));
end;
$function$;

-- 2. Colunas do cupom
alter table public.coupons
  add column if not exists cliente_atendido text,
  add column if not exists cliente_respondeu_em timestamptz,
  add column if not exists cliente_perguntado_em timestamptz,
  add column if not exists confirmado_por text,
  add column if not exists contestado_em timestamptz,
  add column if not exists contestacao_motivo text,
  add column if not exists contestacao_status text,
  add column if not exists contestacao_resolvida_em timestamptz,
  add column if not exists contestacao_resolvida_por uuid;

do $$ begin
  alter table public.coupons add constraint coupons_cliente_atendido_chk check (cliente_atendido is null or cliente_atendido in ('sim', 'nao'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.coupons add constraint coupons_confirmado_por_chk check (confirmado_por is null or confirmado_por in ('loja', 'cliente', 'admin'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.coupons add constraint coupons_contestacao_status_chk check (contestacao_status is null or contestacao_status in ('aberta', 'aceita', 'negada'));
exception when duplicate_object then null; end $$;

create index if not exists coupons_cliente_sim_idx
  on public.coupons (cliente_respondeu_em)
  where status = 'ISSUED' and cliente_atendido = 'sim' and contestacao_status is null;

create index if not exists coupons_contestacao_aberta_idx
  on public.coupons (contestado_em)
  where contestacao_status = 'aberta';

-- 3. Confirmação pelo sistema (cliente sem contestação, ou admin negando a contestação)
create or replace function public.confirmar_cupom_sistema(p_coupon_id uuid, p_por text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_id uuid;
  v_settle jsonb;
begin
  if p_por not in ('cliente', 'admin') then
    raise exception 'origem inválida';
  end if;

  update public.coupons
     set status = 'REDEEMED', redeemed_at = now(), confirmado_por = p_por, updated_at = now()
   where id = p_coupon_id
     and status in ('ISSUED', 'EXPIRED')
     and uso_solicitado_em is not null
     and uso_solicitado_em <= expires_at
  returning id into v_id;

  if v_id is null then
    return jsonb_build_object('ok', false, 'motivo', 'cupom não pode ser confirmado');
  end if;

  v_settle := public.settle_redemption(v_id);
  return jsonb_build_object('ok', true, 'settle', v_settle);
end;
$function$;

revoke all on function public.confirmar_cupom_sistema(uuid, text) from public, anon, authenticated;
grant execute on function public.confirmar_cupom_sistema(uuid, text) to service_role;

-- 4. Confirmação automática depois de 48 horas sem contestação
create or replace function public.auto_confirmar_cupons()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  r record;
  n integer := 0;
begin
  for r in
    select id from public.coupons
     where status in ('ISSUED', 'EXPIRED')
       and cliente_atendido = 'sim'
       and contestacao_status is null
       and cliente_respondeu_em < now() - interval '48 hours'
     limit 500
  loop
    if (public.confirmar_cupom_sistema(r.id, 'cliente') ->> 'ok')::boolean then
      n := n + 1;
    end if;
  end loop;
  return n;
end;
$function$;

revoke all on function public.auto_confirmar_cupons() from public, anon, authenticated;
grant execute on function public.auto_confirmar_cupons() to service_role;

select cron.unschedule('cupons-auto-confirmar') where exists (select 1 from cron.job where jobname = 'cupons-auto-confirmar');
select cron.schedule('cupons-auto-confirmar', '*/30 * * * *', $cron$ select public.auto_confirmar_cupons(); $cron$);

-- 5. Loja contesta (até 48h depois de o cliente dizer que foi atendido)
create or replace function public.contestar_cupom(p_coupon_id uuid, p_motivo text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_profile uuid;
  c record;
begin
  v_profile := public.get_current_profile_id();
  if v_profile is null or not public.has_role(auth.uid(), 'COMPANY') then
    raise exception 'não autorizado';
  end if;
  if length(coalesce(trim(p_motivo), '')) < 10 then
    return jsonb_build_object('ok', false, 'motivo', 'Explique o que aconteceu (pelo menos 10 letras).');
  end if;

  select id, company_id, status, cliente_atendido, cliente_respondeu_em, contestacao_status
    into c from public.coupons where id = p_coupon_id;
  if not found or c.company_id <> v_profile then
    return jsonb_build_object('ok', false, 'motivo', 'Cupom não encontrado.');
  end if;
  if c.status = 'REDEEMED' then
    return jsonb_build_object('ok', false, 'motivo', 'Este cupom já foi confirmado.');
  end if;
  if c.cliente_atendido is distinct from 'sim' then
    return jsonb_build_object('ok', false, 'motivo', 'O cliente ainda não confirmou o atendimento.');
  end if;
  if c.contestacao_status is not null then
    return jsonb_build_object('ok', false, 'motivo', 'Este cupom já foi contestado.');
  end if;
  if c.cliente_respondeu_em < now() - interval '48 hours' then
    return jsonb_build_object('ok', false, 'motivo', 'O prazo de 48 horas para contestar acabou.');
  end if;

  update public.coupons
     set contestado_em = now(), contestacao_motivo = left(trim(p_motivo), 1000),
         contestacao_status = 'aberta', updated_at = now()
   where id = p_coupon_id;
  return jsonb_build_object('ok', true);
end;
$function$;

revoke all on function public.contestar_cupom(uuid, text) from public, anon;
grant execute on function public.contestar_cupom(uuid, text) to authenticated;

-- 6. Admin resolve a contestação: aceita (não cobra) ou nega (cobra a loja)
create or replace function public.resolver_contestacao(p_coupon_id uuid, p_aceita boolean)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_res jsonb := '{}'::jsonb;
begin
  if not public.has_role(auth.uid(), 'ADMIN') then
    raise exception 'não autorizado';
  end if;

  update public.coupons
     set contestacao_status = case when p_aceita then 'aceita' else 'negada' end,
         contestacao_resolvida_em = now(), contestacao_resolvida_por = auth.uid(), updated_at = now()
   where id = p_coupon_id and contestacao_status = 'aberta';
  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'Contestação não encontrada ou já resolvida.');
  end if;

  if not p_aceita then
    v_res := public.confirmar_cupom_sistema(p_coupon_id, 'admin');
  end if;
  return jsonb_build_object('ok', true, 'confirmacao', v_res);
end;
$function$;

revoke all on function public.resolver_contestacao(uuid, boolean) from public, anon;
grant execute on function public.resolver_contestacao(uuid, boolean) to authenticated;

-- 7. Sinais de fraude (últimos N dias) para o admin
create or replace function public.admin_sinais_fraude(p_dias integer default 30)
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare
  v_desde timestamptz := now() - make_interval(days => greatest(1, least(p_dias, 365)));
  v_lojas jsonb;
  v_div jsonb;
  v_abertas jsonb;
begin
  if not public.has_role(auth.uid(), 'ADMIN') then
    raise exception 'não autorizado';
  end if;

  select coalesce(jsonb_agg(x order by x.risco desc, x.pedidos desc), '[]'::jsonb) into v_lojas from (
    select c.company_id as id, p.name as nome,
           count(*) filter (where c.uso_solicitado_em is not null) as pedidos,
           count(*) filter (where c.confirmado_por = 'loja' or (c.status = 'REDEEMED' and c.confirmado_por is null)) as pela_loja,
           count(*) filter (where c.confirmado_por = 'cliente') as pelo_cliente,
           count(*) filter (where c.contestacao_status is not null) as contestados,
           count(*) filter (where c.contestacao_status = 'negada') as contestacao_negada,
           count(*) filter (where c.cliente_atendido = 'nao') as cliente_nao_atendido,
           (count(*) filter (where c.confirmado_por = 'cliente') * 2
             + count(*) filter (where c.contestacao_status = 'negada') * 3
             + count(*) filter (where c.cliente_atendido = 'nao')) as risco
      from public.coupons c
      join public.profiles p on p.id = c.company_id
     where c.created_at >= v_desde
     group by c.company_id, p.name
    having count(*) filter (where c.uso_solicitado_em is not null) > 0
  ) x;

  select coalesce(jsonb_agg(y order by y.risco desc, y.cupons desc), '[]'::jsonb) into v_div from (
    select a.affiliate_id as id, p.name as nome,
           count(*) as cupons,
           count(*) filter (where a.status = 'REDEEMED') as usados,
           count(distinct a.company_id) as lojas,
           count(distinct a.customer_phone) as telefones,
           count(*) - count(distinct a.customer_phone) as telefones_repetidos,
           count(*) filter (where a.confirmado_por = 'cliente') as so_cliente_confirmou,
           count(*) filter (where a.contestacao_status = 'aceita') as contestacoes_aceitas,
           max(a.por_loja) as max_mesma_loja,
           ((count(*) - count(distinct a.customer_phone)) * 2
             + count(*) filter (where a.confirmado_por = 'cliente')
             + count(*) filter (where a.contestacao_status = 'aceita') * 3
             + greatest(0, max(a.por_loja) - 10)) as risco
      from (
        select c.*, count(*) over (partition by c.affiliate_id, c.company_id) as por_loja
          from public.coupons c
         where c.created_at >= v_desde and c.affiliate_id is not null
      ) a
      join public.profiles p on p.id = a.affiliate_id
     group by a.affiliate_id, p.name
  ) y;

  select coalesce(jsonb_agg(z order by z.contestado_em), '[]'::jsonb) into v_abertas from (
    select c.id, c.code, c.contestado_em, c.contestacao_motivo, c.cliente_respondeu_em,
           c.customer_name, c.customer_phone, c.uso_canal, c.uso_origem, c.fee_cents,
           o.title as oferta, pl.name as loja, pa.name as divulgador
      from public.coupons c
      left join public.offers o on o.id = c.offer_id
      left join public.profiles pl on pl.id = c.company_id
      left join public.profiles pa on pa.id = c.affiliate_id
     where c.contestacao_status = 'aberta'
  ) z;

  return jsonb_build_object('lojas', v_lojas, 'divulgadores', v_div, 'contestacoes', v_abertas, 'desde', v_desde);
end;
$function$;

revoke all on function public.admin_sinais_fraude(integer) from public, anon;
grant execute on function public.admin_sinais_fraude(integer) to authenticated;
