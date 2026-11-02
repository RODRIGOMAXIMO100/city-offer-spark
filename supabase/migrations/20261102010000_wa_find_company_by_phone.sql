-- Acha a empresa pelo WhatsApp do cadastro (profiles.telefone), tolerando o 9º dígito e o +55.
-- Usado só pela edge function wa-webhook (service_role): quem manda mensagem é o dono do número,
-- então o próprio WhatsApp prova a posse do número.
create or replace function public.find_company_by_phone(p_phone text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  with alvo as (
    select case when length(d) >= 12 and left(d, 2) = '55' then substr(d, 3) else d end as n
    from (select regexp_replace(coalesce(p_phone, ''), '\D', '', 'g') as d) x
  ),
  cand as (
    select p.id, p.created_at,
           case when length(d) >= 12 and left(d, 2) = '55' then substr(d, 3) else d end as n
    from public.profiles p
    cross join lateral (select regexp_replace(coalesce(p.telefone, ''), '\D', '', 'g') as d) x
    where p.telefone is not null and coalesce(p.banned, false) = false
      and public.has_role(p.user_id, 'COMPANY')
  )
  select c.id from cand c, alvo a
  where length(a.n) >= 10 and length(c.n) >= 10
    and left(c.n, 2) = left(a.n, 2)
    and right(c.n, 8) = right(a.n, 8)
  order by c.created_at
  limit 1
$$;

revoke all on function public.find_company_by_phone(text) from public, anon, authenticated;
grant execute on function public.find_company_by_phone(text) to service_role;
